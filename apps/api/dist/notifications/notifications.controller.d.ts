import { NotificationsService } from './notifications.service';
import { RemindersService } from './reminders.service';
import { AppointmentCreatedDto } from './dto/appointment-created.dto';
import { AppointmentStatusChangedDto } from './dto/appointment-status-changed.dto';
import { PaymentConfirmedDto } from './dto/payment-confirmed.dto';
import { PrescriptionCreatedDto } from './dto/prescription-created.dto';
import { VideoCallReadyDto } from './dto/video-call-ready.dto';
import { AppointmentReminderDto } from './dto/appointment-reminder.dto';
export declare class NotificationsController {
    private readonly notificationsService;
    private readonly remindersService;
    constructor(notificationsService: NotificationsService, remindersService: RemindersService);
    appointmentCreated(dto: AppointmentCreatedDto): Promise<{
        success: boolean;
    }>;
    appointmentStatusChanged(dto: AppointmentStatusChangedDto): Promise<{
        success: boolean;
    }>;
    paymentConfirmed(dto: PaymentConfirmedDto): Promise<{
        success: boolean;
    }>;
    prescriptionCreated(dto: PrescriptionCreatedDto): Promise<{
        success: boolean;
    }>;
    videoCallReady(dto: VideoCallReadyDto): Promise<{
        success: boolean;
    }>;
    appointmentReminder(dto: AppointmentReminderDto): Promise<{
        success: boolean;
    }>;
    scheduleReminders(body: {
        appointmentId: number;
    }): Promise<{
        success: boolean;
    }>;
    cancelReminders(appointmentId: number): Promise<{
        success: boolean;
    }>;
    testNotification(body: {
        email: string;
        type?: string;
    }): Promise<{
        success: boolean;
        message: string;
        error?: string;
    }>;
}
