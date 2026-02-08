"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RemindersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const supabase_js_1 = require("@supabase/supabase-js");
const notifications_service_1 = require("./notifications.service");
let RemindersService = RemindersService_1 = class RemindersService {
    notificationsService;
    logger = new common_1.Logger(RemindersService_1.name);
    supabase;
    reminderConfigs = [
        { type: '24h_before', hoursBefore: 24, enabled: true },
        { type: '2h_before', hoursBefore: 2, enabled: true },
        { type: '1h_before', hoursBefore: 1, enabled: true },
    ];
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            this.logger.error('Supabase credentials not configured. Reminders will not work.');
        }
        else {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
        }
    }
    async scheduleRemindersForAppointment(appointmentId) {
        if (!this.supabase) {
            this.logger.warn('Supabase not configured. Cannot schedule reminders.');
            return;
        }
        try {
            const { data: appointment, error: appointmentError } = await this.supabase
                .from('appointments')
                .select('id, appt_date, appt_time, status')
                .eq('id', appointmentId)
                .single();
            if (appointmentError || !appointment) {
                this.logger.error(`Failed to fetch appointment ${appointmentId}: ${appointmentError?.message}`);
                return;
            }
            if (appointment.status !== 'accepted') {
                this.logger.log(`Skipping reminder scheduling for appointment ${appointmentId}: status is ${appointment.status}`);
                return;
            }
            const appointmentDateTime = this.parseAppointmentDateTime(appointment.appt_date, appointment.appt_time);
            if (!appointmentDateTime) {
                this.logger.error(`Failed to parse appointment datetime for appointment ${appointmentId}`);
                return;
            }
            for (const config of this.reminderConfigs) {
                if (!config.enabled)
                    continue;
                const scheduledFor = new Date(appointmentDateTime);
                scheduledFor.setHours(scheduledFor.getHours() - config.hoursBefore);
                if (scheduledFor <= new Date()) {
                    this.logger.log(`Skipping ${config.type} reminder for appointment ${appointmentId}: scheduled time has passed`);
                    continue;
                }
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
                const { error: insertError } = await this.supabase
                    .from('appointment_reminders')
                    .insert({
                    appointment_id: appointmentId,
                    reminder_type: config.type,
                    scheduled_for: scheduledFor.toISOString(),
                    status: 'pending',
                });
                if (insertError) {
                    this.logger.error(`Failed to schedule ${config.type} reminder for appointment ${appointmentId}: ${insertError.message}`);
                }
                else {
                    this.logger.log(`Scheduled ${config.type} reminder for appointment ${appointmentId} at ${scheduledFor.toISOString()}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to schedule reminders for appointment ${appointmentId}: ${error}`);
        }
    }
    async processPendingReminders() {
        if (!this.supabase) {
            this.logger.warn('Supabase not configured. Skipping reminder processing.');
            return;
        }
        this.logger.log('Processing pending appointment reminders...');
        try {
            const now = new Date();
            const lookAhead = new Date(now.getTime() + 15 * 60 * 1000);
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
                .gte('scheduled_for', new Date(now.getTime() - 60 * 60 * 1000).toISOString());
            if (error) {
                this.logger.error(`Failed to fetch pending reminders: ${error.message}`);
                return;
            }
            if (!reminders || reminders.length === 0) {
                this.logger.log('No pending reminders found.');
                return;
            }
            this.logger.log(`Found ${reminders.length} pending reminders to process.`);
            for (const reminder of reminders) {
                const appointment = reminder.appointments;
                if (!appointment) {
                    this.logger.warn(`Appointment not found for reminder ${reminder.id}`);
                    await this.markReminderAsSkipped(reminder.id, 'Appointment not found');
                    continue;
                }
                if (appointment.status !== 'accepted') {
                    this.logger.log(`Skipping reminder ${reminder.id}: appointment ${appointment.id} status is ${appointment.status}`);
                    await this.markReminderAsSkipped(reminder.id, `Appointment status: ${appointment.status}`);
                    continue;
                }
                if (appointment.payment_status === 'pending' && appointment.payment_status !== 'paid') {
                }
                try {
                    await this.sendReminder(reminder.id, appointment, reminder.reminder_type);
                }
                catch (error) {
                    this.logger.error(`Failed to send reminder ${reminder.id}: ${error}`);
                    await this.markReminderAsFailed(reminder.id, String(error));
                }
            }
            this.logger.log('Reminder processing completed.');
        }
        catch (error) {
            this.logger.error(`Reminder processing job failed: ${error}`);
        }
    }
    async sendAppointmentReminders() {
        await this.processPendingReminders();
    }
    async sendReminder(reminderId, appointment, reminderType) {
        const [patientAuth, doctorAuth] = await Promise.all([
            this.supabase.auth.admin.getUserById(appointment.patient_id),
            this.supabase.auth.admin.getUserById(appointment.doctor_id),
        ]);
        const patientEmail = patientAuth.data?.user?.email;
        const doctorEmail = doctorAuth.data?.user?.email;
        if (!patientEmail) {
            throw new Error(`Patient email not found for appointment ${appointment.id}`);
        }
        const [patientProfile, doctorProfile] = await Promise.all([
            this.supabase.from('profiles').select('full_name').eq('id', appointment.patient_id).single(),
            this.supabase.from('profiles').select('full_name').eq('id', appointment.doctor_id).single(),
        ]);
        const patientName = patientProfile.data?.full_name || 'Patient';
        const doctorName = doctorProfile.data?.full_name || 'Doctor';
        const reminderDto = {
            appointmentId: appointment.id,
            patientId: appointment.patient_id,
            patientEmail,
            patientName,
            doctorId: appointment.doctor_id,
            doctorEmail: doctorEmail || '',
            doctorName,
            appointmentDate: appointment.appt_date,
            appointmentTime: appointment.appt_time,
            appointmentType: appointment.appt_type,
        };
        await this.notificationsService.sendAppointmentReminder(reminderDto);
        await this.markReminderAsSent(reminderId);
        this.logger.log(`Reminder (${reminderType}) sent for appointment ${appointment.id} to ${patientEmail}`);
    }
    async markReminderAsSent(reminderId) {
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
    async markReminderAsFailed(reminderId, errorMessage) {
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
    async markReminderAsSkipped(reminderId, reason) {
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
    parseAppointmentDateTime(apptDate, apptTime) {
        try {
            const dateParts = apptDate.split('-');
            if (dateParts.length !== 3) {
                return null;
            }
            const timeParts = apptTime.split(':');
            if (timeParts.length < 2) {
                return null;
            }
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const day = parseInt(dateParts[2], 10);
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            return new Date(year, month, day, hours, minutes, 0, 0);
        }
        catch (error) {
            this.logger.error(`Failed to parse appointment datetime: ${error}`);
            return null;
        }
    }
    async cancelRemindersForAppointment(appointmentId) {
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
            }
            else {
                this.logger.log(`Cancelled pending reminders for appointment ${appointmentId}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to cancel reminders for appointment ${appointmentId}: ${error}`);
        }
    }
};
exports.RemindersService = RemindersService;
__decorate([
    (0, schedule_1.Cron)('*/15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RemindersService.prototype, "processPendingReminders", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RemindersService.prototype, "sendAppointmentReminders", null);
exports.RemindersService = RemindersService = RemindersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], RemindersService);
//# sourceMappingURL=reminders.service.js.map