import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RemindersService } from './reminders.service';
import { AppointmentCreatedDto } from './dto/appointment-created.dto';
import { AppointmentStatusChangedDto } from './dto/appointment-status-changed.dto';
import { PaymentConfirmedDto } from './dto/payment-confirmed.dto';
import { PrescriptionCreatedDto } from './dto/prescription-created.dto';
import { VideoCallReadyDto } from './dto/video-call-ready.dto';
import { AppointmentReminderDto } from './dto/appointment-reminder.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly remindersService: RemindersService,
  ) {}

  @Post('appointment-created')
  async appointmentCreated(@Body() dto: AppointmentCreatedDto): Promise<{ success: boolean }> {
    await this.notificationsService.sendAppointmentCreated(dto);
    return { success: true };
  }

  @Post('appointment-status-changed')
  async appointmentStatusChanged(@Body() dto: AppointmentStatusChangedDto): Promise<{ success: boolean }> {
    await this.notificationsService.sendAppointmentStatusChanged(dto);
    return { success: true };
  }

  @Post('payment-confirmed')
  async paymentConfirmed(@Body() dto: PaymentConfirmedDto): Promise<{ success: boolean }> {
    await this.notificationsService.sendPaymentConfirmed(dto);
    return { success: true };
  }

  @Post('prescription-created')
  async prescriptionCreated(@Body() dto: PrescriptionCreatedDto): Promise<{ success: boolean }> {
    await this.notificationsService.sendPrescriptionCreated(dto);
    return { success: true };
  }

  @Post('video-call-ready')
  async videoCallReady(@Body() dto: VideoCallReadyDto): Promise<{ success: boolean }> {
    await this.notificationsService.sendVideoCallReady(dto);
    return { success: true };
  }

  @Post('appointment-reminder')
  async appointmentReminder(@Body() dto: AppointmentReminderDto): Promise<{ success: boolean }> {
    await this.notificationsService.sendAppointmentReminder(dto);
    return { success: true };
  }

  @Post('schedule-reminders')
  async scheduleReminders(@Body() body: { appointmentId: number }): Promise<{ success: boolean }> {
    await this.remindersService.scheduleRemindersForAppointment(body.appointmentId);
    return { success: true };
  }

  @Post('cancel-reminders/:appointmentId')
  async cancelReminders(@Param('appointmentId', ParseIntPipe) appointmentId: number): Promise<{ success: boolean }> {
    await this.remindersService.cancelRemindersForAppointment(appointmentId);
    return { success: true };
  }

  @Post('test')
  async testNotification(@Body() body: { email: string; type?: string }): Promise<{ success: boolean; message: string; error?: string }> {
    const testEmail = body.email;
    const testType = body.type || 'reminder';

    if (!testEmail) {
      return { success: false, message: 'Email address is required' };
    }

    try {
      // Send a test appointment reminder
      const testReminderDto: AppointmentReminderDto = {
        appointmentId: 999999,
        patientId: '00000000-0000-0000-0000-000000000000',
        patientEmail: testEmail,
        patientName: 'Test Patient',
        doctorId: '00000000-0000-0000-0000-000000000000',
        doctorEmail: 'doctor@test.com',
        doctorName: 'Dr. Test Doctor',
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        appointmentTime: '10:00 AM',
        appointmentType: 'video',
      };

      await this.notificationsService.sendAppointmentReminder(testReminderDto);
      return { 
        success: true, 
        message: `Test email sent successfully to ${testEmail}. Check your inbox and spam folder!` 
      };
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      console.error('Test email error:', error);
      return { 
        success: false, 
        message: `Failed to send test email: ${errorMessage}`,
        error: errorMessage
      };
    }
  }
}
