import { AppointmentCreatedDto } from './dto/appointment-created.dto';
import { AppointmentStatusChangedDto } from './dto/appointment-status-changed.dto';
import { PaymentConfirmedDto } from './dto/payment-confirmed.dto';
import { PrescriptionCreatedDto } from './dto/prescription-created.dto';
import { VideoCallReadyDto } from './dto/video-call-ready.dto';
import { AppointmentReminderDto } from './dto/appointment-reminder.dto';
export declare class NotificationsService {
    private readonly logger;
    private resend;
    private supabase;
    private fromEmail;
    private frontendUrl;
    constructor();
    private logNotification;
    private fetchUserEmail;
    sendAppointmentCreated(dto: AppointmentCreatedDto): Promise<void>;
    sendAppointmentStatusChanged(dto: AppointmentStatusChangedDto): Promise<void>;
    sendPaymentConfirmed(dto: PaymentConfirmedDto): Promise<void>;
    sendPrescriptionCreated(dto: PrescriptionCreatedDto): Promise<void>;
    sendVideoCallReady(dto: VideoCallReadyDto): Promise<void>;
    sendAppointmentReminder(dto: AppointmentReminderDto): Promise<void>;
}
