import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppointmentCreatedDto } from './dto/appointment-created.dto';
import { AppointmentStatusChangedDto } from './dto/appointment-status-changed.dto';
import { PaymentConfirmedDto } from './dto/payment-confirmed.dto';
import { PrescriptionCreatedDto } from './dto/prescription-created.dto';
import { VideoCallReadyDto } from './dto/video-call-ready.dto';
import { AppointmentReminderDto } from './dto/appointment-reminder.dto';
import { getAppointmentCreatedTemplate } from './templates/appointment-created.template';
import { getAppointmentStatusChangedTemplate } from './templates/appointment-status-changed.template';
import { getPaymentConfirmedTemplate } from './templates/payment-confirmed.template';
import { getPrescriptionCreatedTemplate } from './templates/prescription-created.template';
import { getVideoCallReadyTemplate } from './templates/video-call-ready.template';
import { getAppointmentReminderTemplate } from './templates/appointment-reminder.template';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private resend: Resend;
  private supabase: SupabaseClient;
  private fromEmail: string;
  private frontendUrl: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@novahdl.com';
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    this.logger.log(`Initializing NotificationsService...`);
    this.logger.log(`RESEND_API_KEY: ${apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET'}`);
    this.logger.log(`RESEND_FROM_EMAIL: ${fromEmail}`);
    this.logger.log(`SUPABASE_URL: ${supabaseUrl ? supabaseUrl : 'NOT SET'}`);
    this.logger.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'SET' : 'NOT SET'}`);

    if (!apiKey) {
      this.logger.error('RESEND_API_KEY not configured. Email notifications will be disabled.');
    } else {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend client initialized successfully');
    }

    this.fromEmail = fromEmail;

    if (supabaseUrl && supabaseServiceKey) {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
      this.logger.log('Supabase client initialized successfully');
    } else {
      this.logger.warn('Supabase credentials not configured. Email logging will be disabled.');
    }
  }

  private async logNotification(
    recipientEmail: string,
    notificationType: string,
    status: 'sent' | 'failed',
    errorMessage?: string,
  ): Promise<void> {
    if (!this.supabase) return;

    try {
      await this.supabase.from('email_notifications').insert({
        recipient_email: recipientEmail,
        notification_type: notificationType,
        status,
        error_message: errorMessage || null,
      });
    } catch (error) {
      this.logger.error(`Failed to log notification: ${error}`);
    }
  }

  private async fetchUserEmail(userId: string): Promise<string | null> {
    if (!this.supabase) return null;
    try {
      const { data } = await this.supabase.auth.admin.getUserById(userId);
      return data?.user?.email || null;
    } catch (error) {
      this.logger.error(`Failed to fetch email for user ${userId}: ${error}`);
      return null;
    }
  }

  async sendAppointmentCreated(dto: AppointmentCreatedDto): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email notification.');
      return;
    }

    try {
      // Fetch doctor email if not provided
      let doctorEmail = dto.doctorEmail;
      if (!doctorEmail && dto.doctorId) {
        doctorEmail = await this.fetchUserEmail(dto.doctorId) || '';
      }

      const html = getAppointmentCreatedTemplate({
        patientName: dto.patientName,
        doctorName: dto.doctorName,
        appointmentDate: dto.appointmentDate,
        appointmentTime: dto.appointmentTime,
        appointmentType: dto.appointmentType,
        frontendUrl: this.frontendUrl,
      });

      // Send to patient
      await this.resend.emails.send({
        from: this.fromEmail,
        to: dto.patientEmail,
        subject: `Appointment Booked with ${dto.doctorName}`,
        html,
      });

      await this.logNotification(dto.patientEmail, 'appointment_created', 'sent');

      // Send notification to doctor if email available
      if (doctorEmail) {
        const doctorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Appointment Request</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello ${dto.doctorName},
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                You have received a new appointment request from ${dto.patientName}.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #666666;">Patient:</strong>
                    <span style="color: #333333; margin-left: 10px;">${dto.patientName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #666666;">Date:</strong>
                    <span style="color: #333333; margin-left: 10px;">${new Date(dto.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #666666;">Time:</strong>
                    <span style="color: #333333; margin-left: 10px;">${dto.appointmentTime}</span>
                  </td>
                </tr>
              </table>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.frontendUrl}/doctor/bookings" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
                  View Appointment
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

        await this.resend.emails.send({
          from: this.fromEmail,
          to: doctorEmail,
          subject: `New Appointment Request from ${dto.patientName}`,
          html: doctorHtml,
        });

        await this.logNotification(doctorEmail, 'appointment_created_doctor', 'sent');
      }

      this.logger.log(`Appointment created notification sent to ${dto.patientEmail} and ${dto.doctorEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send appointment created notification: ${error}`);
      await this.logNotification(dto.patientEmail, 'appointment_created', 'failed', String(error));
    }
  }

  async sendAppointmentStatusChanged(dto: AppointmentStatusChangedDto): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email notification.');
      return;
    }

    try {
      // Fetch doctor email if not provided
      let doctorEmail = dto.doctorEmail;
      if (!doctorEmail && dto.doctorId) {
        doctorEmail = await this.fetchUserEmail(dto.doctorId) || '';
      }

      const html = getAppointmentStatusChangedTemplate({
        patientName: dto.patientName,
        doctorName: dto.doctorName,
        appointmentDate: dto.appointmentDate,
        appointmentTime: dto.appointmentTime,
        appointmentType: dto.appointmentType,
        status: dto.status,
        frontendUrl: this.frontendUrl,
      });

      await this.resend.emails.send({
        from: this.fromEmail,
        to: dto.patientEmail,
        subject: `Appointment ${dto.status === 'accepted' ? 'Confirmed' : dto.status === 'declined' ? 'Declined' : 'Cancelled'}`,
        html,
      });

      await this.logNotification(dto.patientEmail, 'appointment_status_changed', 'sent');
      this.logger.log(`Appointment status changed notification sent to ${dto.patientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send appointment status changed notification: ${error}`);
      await this.logNotification(dto.patientEmail, 'appointment_status_changed', 'failed', String(error));
    }
  }

  async sendPaymentConfirmed(dto: PaymentConfirmedDto): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email notification.');
      return;
    }

    try {
      const html = getPaymentConfirmedTemplate({
        patientName: dto.patientName,
        doctorName: dto.doctorName,
        appointmentDate: dto.appointmentDate,
        appointmentTime: dto.appointmentTime,
        appointmentType: dto.appointmentType,
        amount: dto.amount,
        currency: dto.currency,
        frontendUrl: this.frontendUrl,
      });

      // Send to patient
      await this.resend.emails.send({
        from: this.fromEmail,
        to: dto.patientEmail,
        subject: `Payment Confirmed - Appointment with ${dto.doctorName}`,
        html,
      });

      await this.logNotification(dto.patientEmail, 'payment_confirmed', 'sent');

      // Send notification to doctor
      const doctorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #10b981; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Payment Received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello ${dto.doctorName},
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Payment has been confirmed for your appointment with ${dto.patientName}.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #666666;">Amount:</strong>
                    <span style="color: #10b981; margin-left: 10px; font-size: 18px; font-weight: bold;">${new Intl.NumberFormat('en-IN', { style: 'currency', currency: dto.currency || 'INR' }).format(dto.amount / 100)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #666666;">Patient:</strong>
                    <span style="color: #333333; margin-left: 10px;">${dto.patientName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #666666;">Date:</strong>
                    <span style="color: #333333; margin-left: 10px;">${new Date(dto.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #666666;">Time:</strong>
                    <span style="color: #333333; margin-left: 10px;">${dto.appointmentTime}</span>
                  </td>
                </tr>
              </table>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.frontendUrl}/doctor/bookings" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
                  View Appointment
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      await this.resend.emails.send({
        from: this.fromEmail,
        to: dto.doctorEmail,
        subject: `Payment Received - Appointment with ${dto.patientName}`,
        html: doctorHtml,
      });

      await this.logNotification(dto.doctorEmail, 'payment_confirmed_doctor', 'sent');
      this.logger.log(`Payment confirmed notification sent to ${dto.patientEmail} and ${dto.doctorEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send payment confirmed notification: ${error}`);
      await this.logNotification(dto.patientEmail, 'payment_confirmed', 'failed', String(error));
    }
  }

  async sendPrescriptionCreated(dto: PrescriptionCreatedDto): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email notification.');
      return;
    }

    try {
      // Fetch emails if not provided
      let patientEmail = dto.patientEmail;
      let doctorEmail = dto.doctorEmail;
      if (!patientEmail && dto.patientId) {
        patientEmail = await this.fetchUserEmail(dto.patientId) || '';
      }
      if (!doctorEmail && dto.doctorId) {
        doctorEmail = await this.fetchUserEmail(dto.doctorId) || '';
      }

      if (!patientEmail) {
        this.logger.warn(`Cannot send prescription notification: patient email not found for prescription ${dto.prescriptionId}`);
        return;
      }

      const html = getPrescriptionCreatedTemplate({
        patientName: dto.patientName,
        doctorName: dto.doctorName,
        prescriptionId: dto.prescriptionId,
        frontendUrl: this.frontendUrl,
      });

      await this.resend.emails.send({
        from: this.fromEmail,
        to: patientEmail,
        subject: `Prescription Ready from ${dto.doctorName}`,
        html,
      });

      await this.logNotification(patientEmail, 'prescription_created', 'sent');
      this.logger.log(`Prescription created notification sent to ${dto.patientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send prescription created notification: ${error}`);
      await this.logNotification(dto.patientEmail, 'prescription_created', 'failed', String(error));
    }
  }

  async sendVideoCallReady(dto: VideoCallReadyDto): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email notification.');
      return;
    }

    try {
      // Fetch emails if not provided
      let patientEmail = dto.patientEmail;
      let doctorEmail = dto.doctorEmail;
      if (!patientEmail && dto.patientId) {
        patientEmail = await this.fetchUserEmail(dto.patientId) || '';
      }
      if (!doctorEmail && dto.doctorId) {
        doctorEmail = await this.fetchUserEmail(dto.doctorId) || '';
      }

      const html = getVideoCallReadyTemplate({
        patientName: dto.patientName,
        doctorName: dto.doctorName,
        appointmentDate: dto.appointmentDate,
        appointmentTime: dto.appointmentTime,
        roomUrl: dto.roomUrl,
        frontendUrl: this.frontendUrl,
      });

      // Send to patient if email available
      if (patientEmail) {
        await this.resend.emails.send({
          from: this.fromEmail,
          to: patientEmail,
          subject: `Video Call Ready - Appointment with ${dto.doctorName}`,
          html,
        });

        await this.logNotification(patientEmail, 'video_call_ready', 'sent');
      }

      // Send to doctor if email available
      if (doctorEmail) {
        await this.resend.emails.send({
          from: this.fromEmail,
          to: doctorEmail,
          subject: `Video Call Ready - Appointment with ${dto.patientName}`,
          html: html.replace(dto.patientName, dto.doctorName),
        });

        await this.logNotification(doctorEmail, 'video_call_ready_doctor', 'sent');
      }
      this.logger.log(`Video call ready notification sent to ${dto.patientEmail} and ${dto.doctorEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send video call ready notification: ${error}`);
      await this.logNotification(dto.patientEmail, 'video_call_ready', 'failed', String(error));
    }
  }

  async sendAppointmentReminder(dto: AppointmentReminderDto): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Skipping email notification.');
      return;
    }

    try {
      const html = getAppointmentReminderTemplate({
        patientName: dto.patientName,
        doctorName: dto.doctorName,
        appointmentDate: dto.appointmentDate,
        appointmentTime: dto.appointmentTime,
        appointmentType: dto.appointmentType,
        frontendUrl: this.frontendUrl,
      });

      // Use Resend test domain if custom domain not verified (for testing)
      const fromEmail = this.fromEmail.includes('@resend.dev') 
        ? this.fromEmail 
        : 'onboarding@resend.dev';

      this.logger.log(`Sending email from ${fromEmail} to ${dto.patientEmail}`);

      const result = await this.resend.emails.send({
        from: fromEmail,
        to: dto.patientEmail,
        subject: `Appointment Reminder - ${dto.doctorName} Tomorrow`,
        html,
      });

      if (result.error) {
        const errorMsg = `Resend API error: ${JSON.stringify(result.error)}`;
        this.logger.error(errorMsg);
        await this.logNotification(dto.patientEmail, 'appointment_reminder', 'failed', errorMsg);
        throw new Error(errorMsg);
      }

      await this.logNotification(dto.patientEmail, 'appointment_reminder', 'sent');
      this.logger.log(`Appointment reminder sent to ${dto.patientEmail}, Resend ID: ${result.data?.id || 'unknown'}`);
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      const errorDetails = error?.response?.body || error?.response || error;
      this.logger.error(`Failed to send appointment reminder to ${dto.patientEmail}: ${errorMessage}`, errorDetails);
      await this.logNotification(dto.patientEmail, 'appointment_reminder', 'failed', JSON.stringify(errorDetails));
      throw error; // Re-throw to let caller handle it
    }
  }
}
