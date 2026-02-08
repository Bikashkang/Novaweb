import { NotificationsService } from './notifications.service';
export declare class RemindersService {
    private readonly notificationsService;
    private readonly logger;
    private supabase;
    private readonly reminderConfigs;
    constructor(notificationsService: NotificationsService);
    scheduleRemindersForAppointment(appointmentId: number): Promise<void>;
    processPendingReminders(): Promise<void>;
    sendAppointmentReminders(): Promise<void>;
    private sendReminder;
    private markReminderAsSent;
    private markReminderAsFailed;
    private markReminderAsSkipped;
    private parseAppointmentDateTime;
    cancelRemindersForAppointment(appointmentId: number): Promise<void>;
}
