import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NotificationsService } from './notifications.service';
import { AppointmentReminderDto } from './dto/appointment-reminder.dto';

type ReminderType = '24h_before' | '2h_before' | '1h_before';

interface ReminderConfig {
  type: ReminderType;
  hoursBefore: number;
  enabled: boolean;
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);
  private supabase: SupabaseClient;
  
  // Configuration for reminder intervals
  private readonly reminderConfigs: ReminderConfig[] = [
    { type: '24h_before', hoursBefore: 24, enabled: true },
    { type: '2h_before', hoursBefore: 2, enabled: true },
    { type: '1h_before', hoursBefore: 1, enabled: true },
  ];

  constructor(private readonly notificationsService: NotificationsService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      this.logger.error('Supabase credentials not configured. Reminders will not work.');
    } else {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
  }

  /**
   * Schedule reminders for an appointment when it's created or accepted
   * This creates reminder records in the database that will be processed by cron jobs
   */
  async scheduleRemindersForAppointment(appointmentId: number): Promise<void> {
    if (!this.supabase) {
      this.logger.warn('Supabase not configured. Cannot schedule reminders.');
      return;
    }

    try {
      // Fetch appointment details
      const { data: appointment, error: appointmentError } = await this.supabase
        .from('appointments')
        .select('id, appt_date, appt_time, status')
        .eq('id', appointmentId)
        .single();

      if (appointmentError || !appointment) {
        this.logger.error(`Failed to fetch appointment ${appointmentId}: ${appointmentError?.message}`);
        return;
      }

      // Only schedule reminders for accepted appointments
      if (appointment.status !== 'accepted') {
        this.logger.log(`Skipping reminder scheduling for appointment ${appointmentId}: status is ${appointment.status}`);
        return;
      }

      // Parse appointment date and time
      const appointmentDateTime = this.parseAppointmentDateTime(appointment.appt_date, appointment.appt_time);
      if (!appointmentDateTime) {
        this.logger.error(`Failed to parse appointment datetime for appointment ${appointmentId}`);
        return;
      }

      // Schedule each reminder type
      for (const config of this.reminderConfigs) {
        if (!config.enabled) continue;

        const scheduledFor = new Date(appointmentDateTime);
        scheduledFor.setHours(scheduledFor.getHours() - config.hoursBefore);

        // Only schedule if the reminder time hasn't passed
        if (scheduledFor <= new Date()) {
          this.logger.log(
            `Skipping ${config.type} reminder for appointment ${appointmentId}: scheduled time has passed`
          );
          continue;
        }

        // Check if reminder already exists
        const { data: existingReminder } = await this.supabase
          .from('appointment_reminders')
          .select('id')
          .eq('appointment_id', appointmentId)
          .eq('reminder_type', config.type)
          .single();

        if (existingReminder) {
          this.logger.log(`Reminder ${config.type} already exists for appointment ${appointmentId}`);
          continue;
        }

        // Create reminder record
        const { error: insertError } = await this.supabase
          .from('appointment_reminders')
          .insert({
            appointment_id: appointmentId,
            reminder_type: config.type,
            scheduled_for: scheduledFor.toISOString(),
            status: 'pending',
          });

        if (insertError) {
          this.logger.error(
            `Failed to schedule ${config.type} reminder for appointment ${appointmentId}: ${insertError.message}`
          );
        } else {
          this.logger.log(
            `Scheduled ${config.type} reminder for appointment ${appointmentId} at ${scheduledFor.toISOString()}`
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to schedule reminders for appointment ${appointmentId}: ${error}`);
    }
  }

  /**
   * Process pending reminders - runs every 15 minutes
   * Checks for reminders that are due to be sent
   */
  @Cron('*/15 * * * *') // Every 15 minutes
  async processPendingReminders() {
    if (!this.supabase) {
      this.logger.warn('Supabase not configured. Skipping reminder processing.');
      return;
    }

    this.logger.log('Processing pending appointment reminders...');

    try {
      const now = new Date();
      const lookAhead = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes ahead

      // Get all pending reminders that are due (scheduled_for <= now + 15 minutes)
      const { data: reminders, error } = await this.supabase
        .from('appointment_reminders')
        .select(`
          id,
          appointment_id,
          reminder_type,
          scheduled_for,
          appointments (
            id,
            patient_id,
            doctor_id,
            appt_date,
            appt_time,
            appt_type,
            status,
            payment_status
          )
        `)
        .eq('status', 'pending')
        .lte('scheduled_for', lookAhead.toISOString())
        .gte('scheduled_for', new Date(now.getTime() - 60 * 60 * 1000).toISOString()); // Include reminders up to 1 hour overdue

      if (error) {
        this.logger.error(`Failed to fetch pending reminders: ${error.message}`);
        return;
      }

      if (!reminders || reminders.length === 0) {
        this.logger.log('No pending reminders found.');
        return;
      }

      this.logger.log(`Found ${reminders.length} pending reminders to process.`);

      // Process each reminder
      for (const reminder of reminders) {
        const appointment = reminder.appointments as any;
        
        if (!appointment) {
          this.logger.warn(`Appointment not found for reminder ${reminder.id}`);
          await this.markReminderAsSkipped(reminder.id, 'Appointment not found');
          continue;
        }

        // Skip if appointment is cancelled or declined
        if (appointment.status !== 'accepted') {
          this.logger.log(
            `Skipping reminder ${reminder.id}: appointment ${appointment.id} status is ${appointment.status}`
          );
          await this.markReminderAsSkipped(reminder.id, `Appointment status: ${appointment.status}`);
          continue;
        }

        // Skip if payment is required but not paid
        if (appointment.payment_status === 'pending' && appointment.payment_status !== 'paid') {
          // Check if payment is actually required (this could be enhanced with pricing check)
          // For now, we'll still send reminders for pending payments
        }

        try {
          await this.sendReminder(reminder.id, appointment, reminder.reminder_type as ReminderType);
        } catch (error) {
          this.logger.error(`Failed to send reminder ${reminder.id}: ${error}`);
          await this.markReminderAsFailed(reminder.id, String(error));
        }
      }

      this.logger.log('Reminder processing completed.');
    } catch (error) {
      this.logger.error(`Reminder processing job failed: ${error}`);
    }
  }

  /**
   * Legacy cron job - kept for backward compatibility
   * Runs daily at 9 AM to ensure no reminders are missed
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendAppointmentReminders() {
    // This now delegates to processPendingReminders
    await this.processPendingReminders();
  }

  /**
   * Send a reminder for a specific appointment
   */
  private async sendReminder(
    reminderId: string,
    appointment: any,
    reminderType: ReminderType
  ): Promise<void> {
    // Fetch patient and doctor emails
    const [patientAuth, doctorAuth] = await Promise.all([
      this.supabase.auth.admin.getUserById(appointment.patient_id),
      this.supabase.auth.admin.getUserById(appointment.doctor_id),
    ]);

    const patientEmail = patientAuth.data?.user?.email;
    const doctorEmail = doctorAuth.data?.user?.email;

    if (!patientEmail) {
      throw new Error(`Patient email not found for appointment ${appointment.id}`);
    }

    // Fetch profile names
    const [patientProfile, doctorProfile] = await Promise.all([
      this.supabase.from('profiles').select('full_name').eq('id', appointment.patient_id).single(),
      this.supabase.from('profiles').select('full_name').eq('id', appointment.doctor_id).single(),
    ]);

    const patientName = patientProfile.data?.full_name || 'Patient';
    const doctorName = doctorProfile.data?.full_name || 'Doctor';

    const reminderDto: AppointmentReminderDto = {
      appointmentId: appointment.id,
      patientId: appointment.patient_id,
      patientEmail,
      patientName,
      doctorId: appointment.doctor_id,
      doctorEmail: doctorEmail || '',
      doctorName,
      appointmentDate: appointment.appt_date,
      appointmentTime: appointment.appt_time,
      appointmentType: appointment.appt_type as 'video' | 'in_clinic',
    };

    // Send the reminder
    await this.notificationsService.sendAppointmentReminder(reminderDto);

    // Mark reminder as sent
    await this.markReminderAsSent(reminderId);
    
    this.logger.log(
      `Reminder (${reminderType}) sent for appointment ${appointment.id} to ${patientEmail}`
    );
  }

  /**
   * Mark reminder as sent
   */
  private async markReminderAsSent(reminderId: string): Promise<void> {
    const { error } = await this.supabase
      .from('appointment_reminders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', reminderId);

    if (error) {
      this.logger.error(`Failed to mark reminder ${reminderId} as sent: ${error.message}`);
    }
  }

  /**
   * Mark reminder as failed
   */
  private async markReminderAsFailed(reminderId: string, errorMessage: string): Promise<void> {
    const { error } = await this.supabase
      .from('appointment_reminders')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', reminderId);

    if (error) {
      this.logger.error(`Failed to mark reminder ${reminderId} as failed: ${error.message}`);
    }
  }

  /**
   * Mark reminder as skipped
   */
  private async markReminderAsSkipped(reminderId: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('appointment_reminders')
      .update({
        status: 'skipped',
        error_message: reason,
      })
      .eq('id', reminderId);

    if (error) {
      this.logger.error(`Failed to mark reminder ${reminderId} as skipped: ${error.message}`);
    }
  }

  /**
   * Parse appointment date and time into a Date object
   */
  private parseAppointmentDateTime(apptDate: string, apptTime: string): Date | null {
    try {
      // Parse date (YYYY-MM-DD)
      const dateParts = apptDate.split('-');
      if (dateParts.length !== 3) {
        return null;
      }

      // Parse time (HH:MM format, e.g., "14:30")
      const timeParts = apptTime.split(':');
      if (timeParts.length < 2) {
        return null;
      }

      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2], 10);
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);

      return new Date(year, month, day, hours, minutes, 0, 0);
    } catch (error) {
      this.logger.error(`Failed to parse appointment datetime: ${error}`);
      return null;
    }
  }

  /**
   * Cancel/cleanup reminders for an appointment (e.g., when appointment is cancelled)
   */
  async cancelRemindersForAppointment(appointmentId: number): Promise<void> {
    if (!this.supabase) {
      return;
    }

    try {
      const { error } = await this.supabase
        .from('appointment_reminders')
        .update({
          status: 'skipped',
          error_message: 'Appointment cancelled',
        })
        .eq('appointment_id', appointmentId)
        .eq('status', 'pending');

      if (error) {
        this.logger.error(`Failed to cancel reminders for appointment ${appointmentId}: ${error.message}`);
      } else {
        this.logger.log(`Cancelled pending reminders for appointment ${appointmentId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to cancel reminders for appointment ${appointmentId}: ${error}`);
    }
  }
}
