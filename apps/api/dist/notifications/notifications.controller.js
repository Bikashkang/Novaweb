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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("./notifications.service");
const reminders_service_1 = require("./reminders.service");
const appointment_created_dto_1 = require("./dto/appointment-created.dto");
const appointment_status_changed_dto_1 = require("./dto/appointment-status-changed.dto");
const payment_confirmed_dto_1 = require("./dto/payment-confirmed.dto");
const prescription_created_dto_1 = require("./dto/prescription-created.dto");
const video_call_ready_dto_1 = require("./dto/video-call-ready.dto");
const appointment_reminder_dto_1 = require("./dto/appointment-reminder.dto");
let NotificationsController = class NotificationsController {
    notificationsService;
    remindersService;
    constructor(notificationsService, remindersService) {
        this.notificationsService = notificationsService;
        this.remindersService = remindersService;
    }
    async appointmentCreated(dto) {
        await this.notificationsService.sendAppointmentCreated(dto);
        return { success: true };
    }
    async appointmentStatusChanged(dto) {
        await this.notificationsService.sendAppointmentStatusChanged(dto);
        return { success: true };
    }
    async paymentConfirmed(dto) {
        await this.notificationsService.sendPaymentConfirmed(dto);
        return { success: true };
    }
    async prescriptionCreated(dto) {
        await this.notificationsService.sendPrescriptionCreated(dto);
        return { success: true };
    }
    async videoCallReady(dto) {
        await this.notificationsService.sendVideoCallReady(dto);
        return { success: true };
    }
    async appointmentReminder(dto) {
        await this.notificationsService.sendAppointmentReminder(dto);
        return { success: true };
    }
    async scheduleReminders(body) {
        await this.remindersService.scheduleRemindersForAppointment(body.appointmentId);
        return { success: true };
    }
    async cancelReminders(appointmentId) {
        await this.remindersService.cancelRemindersForAppointment(appointmentId);
        return { success: true };
    }
    async testNotification(body) {
        const testEmail = body.email;
        const testType = body.type || 'reminder';
        if (!testEmail) {
            return { success: false, message: 'Email address is required' };
        }
        try {
            const testReminderDto = {
                appointmentId: 999999,
                patientId: '00000000-0000-0000-0000-000000000000',
                patientEmail: testEmail,
                patientName: 'Test Patient',
                doctorId: '00000000-0000-0000-0000-000000000000',
                doctorEmail: 'doctor@test.com',
                doctorName: 'Dr. Test Doctor',
                appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                appointmentTime: '10:00 AM',
                appointmentType: 'video',
            };
            await this.notificationsService.sendAppointmentReminder(testReminderDto);
            return {
                success: true,
                message: `Test email sent successfully to ${testEmail}. Check your inbox and spam folder!`
            };
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            console.error('Test email error:', error);
            return {
                success: false,
                message: `Failed to send test email: ${errorMessage}`,
                error: errorMessage
            };
        }
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Post)('appointment-created'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [appointment_created_dto_1.AppointmentCreatedDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "appointmentCreated", null);
__decorate([
    (0, common_1.Post)('appointment-status-changed'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [appointment_status_changed_dto_1.AppointmentStatusChangedDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "appointmentStatusChanged", null);
__decorate([
    (0, common_1.Post)('payment-confirmed'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_confirmed_dto_1.PaymentConfirmedDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "paymentConfirmed", null);
__decorate([
    (0, common_1.Post)('prescription-created'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [prescription_created_dto_1.PrescriptionCreatedDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "prescriptionCreated", null);
__decorate([
    (0, common_1.Post)('video-call-ready'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [video_call_ready_dto_1.VideoCallReadyDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "videoCallReady", null);
__decorate([
    (0, common_1.Post)('appointment-reminder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [appointment_reminder_dto_1.AppointmentReminderDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "appointmentReminder", null);
__decorate([
    (0, common_1.Post)('schedule-reminders'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "scheduleReminders", null);
__decorate([
    (0, common_1.Post)('cancel-reminders/:appointmentId'),
    __param(0, (0, common_1.Param)('appointmentId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "cancelReminders", null);
__decorate([
    (0, common_1.Post)('test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "testNotification", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService,
        reminders_service_1.RemindersService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map