"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const razorpay_1 = __importDefault(require("razorpay"));
const supabase_js_1 = require("@supabase/supabase-js");
const notifications_service_1 = require("../notifications/notifications.service");
const crypto = __importStar(require("crypto"));
let PaymentsService = PaymentsService_1 = class PaymentsService {
    notificationsService;
    logger = new common_1.Logger(PaymentsService_1.name);
    razorpay;
    supabase;
    webhookSecret;
    keySecret;
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
        if (keyId && keySecret) {
            this.keySecret = keySecret;
            this.razorpay = new razorpay_1.default({
                key_id: keyId,
                key_secret: keySecret,
            });
        }
        else {
            this.logger.warn('Razorpay credentials not configured. Payment features will be disabled.');
            this.keySecret = '';
        }
        if (supabaseUrl && supabaseServiceKey) {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
        }
        else {
            this.logger.warn('Supabase credentials not configured. Payment features will be disabled.');
        }
    }
    async createOrder(dto) {
        if (!this.razorpay || !this.supabase) {
            this.logger.error('Payment service not configured. Razorpay:', !!this.razorpay, 'Supabase:', !!this.supabase);
            throw new common_1.BadRequestException('Payment service not configured. Please configure Razorpay and Supabase credentials.');
        }
        try {
            this.logger.log(`Creating order for appointment ${dto.appointmentId} with amount ${dto.amount}`);
            const { data: appointment, error: apptError } = await this.supabase
                .from('appointments')
                .select('id, patient_id, payment_status, payment_amount')
                .eq('id', dto.appointmentId)
                .single();
            if (apptError) {
                this.logger.error('Appointment fetch error:', apptError);
                throw new common_1.BadRequestException(`Appointment not found: ${apptError.message}`);
            }
            if (!appointment) {
                this.logger.error(`Appointment ${dto.appointmentId} not found`);
                throw new common_1.BadRequestException('Appointment not found');
            }
            if (appointment.payment_status === 'paid') {
                throw new common_1.BadRequestException('Appointment already paid');
            }
            const amount = dto.amount || appointment.payment_amount || 0;
            const MINIMUM_AMOUNT = 100;
            if (amount <= 0) {
                this.logger.error(`Invalid amount: ${amount} for appointment ${dto.appointmentId}`);
                throw new common_1.BadRequestException(`Invalid payment amount: ${amount}`);
            }
            if (amount < MINIMUM_AMOUNT && (dto.currency || 'INR') === 'INR') {
                this.logger.error(`Amount ${amount} below Razorpay minimum ${MINIMUM_AMOUNT} for appointment ${dto.appointmentId}`);
                throw new common_1.BadRequestException(`Payment amount must be at least ₹1.00 (100 paisa). Current amount: ₹${(amount / 100).toFixed(2)}`);
            }
            const currency = dto.currency || 'INR';
            this.logger.log(`Creating Razorpay order: amount=${amount}, currency=${currency}`);
            const order = await this.razorpay.orders.create({
                amount: amount,
                currency: currency,
                receipt: `appt_${dto.appointmentId}_${Date.now()}`,
                notes: {
                    appointment_id: dto.appointmentId.toString(),
                },
            });
            this.logger.log(`Razorpay order created: ${order.id}`);
            return {
                orderId: order.id,
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            this.logger.error('Failed to create Razorpay order:', error);
            const errorMessage = error?.message || error?.error?.message || error?.toString() || 'Unknown error';
            const razorpayError = error?.error?.description || error?.error?.reason || '';
            if (razorpayError) {
                throw new common_1.InternalServerErrorException(`Failed to create order: ${razorpayError}`);
            }
            throw new common_1.InternalServerErrorException(`Failed to create order: ${errorMessage}`);
        }
    }
    async verifyPayment(dto) {
        if (!this.razorpay || !this.supabase || !this.keySecret) {
            throw new common_1.BadRequestException('Payment service not configured. Please configure Razorpay and Supabase credentials.');
        }
        try {
            const text = `${dto.razorpay_order_id}|${dto.razorpay_payment_id}`;
            const signature = crypto
                .createHmac('sha256', this.keySecret)
                .update(text)
                .digest('hex');
            if (signature !== dto.razorpay_signature) {
                throw new common_1.BadRequestException('Invalid payment signature');
            }
            const payment = await this.razorpay.payments.fetch(dto.razorpay_payment_id);
            if (payment.status !== 'captured' && payment.status !== 'authorized') {
                throw new common_1.BadRequestException(`Payment not successful. Status: ${payment.status}`);
            }
            const { error: updateError } = await this.supabase
                .from('appointments')
                .update({
                payment_status: 'paid',
                payment_id: dto.razorpay_payment_id,
                payment_amount: payment.amount,
                payment_currency: payment.currency,
                payment_date: new Date().toISOString(),
            })
                .eq('id', dto.appointmentId);
            if (updateError) {
                throw new common_1.InternalServerErrorException(`Failed to update appointment: ${updateError.message}`);
            }
            const { error: paymentError } = await this.supabase.from('payments').insert({
                appointment_id: dto.appointmentId,
                razorpay_payment_id: dto.razorpay_payment_id,
                razorpay_order_id: dto.razorpay_order_id,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status === 'captured' ? 'captured' : 'authorized',
                method: payment.method,
                metadata: payment,
            });
            if (paymentError) {
                console.error('Failed to create payment record:', paymentError);
            }
            const { data: appointmentDetails } = await this.supabase
                .from('appointments')
                .select(`
          id,
          appt_date,
          appt_time,
          appt_type,
          patient_id,
          doctor_id,
          payment_amount,
          payment_currency
        `)
                .eq('id', dto.appointmentId)
                .single();
            if (appointmentDetails) {
                const [patientResult, doctorResult] = await Promise.all([
                    this.supabase.auth.admin.getUserById(appointmentDetails.patient_id),
                    this.supabase.auth.admin.getUserById(appointmentDetails.doctor_id),
                ]);
                const patientEmail = patientResult.data?.user?.email;
                const doctorEmail = doctorResult.data?.user?.email;
                const [patientProfile, doctorProfile] = await Promise.all([
                    this.supabase.from('profiles').select('full_name').eq('id', appointmentDetails.patient_id).single(),
                    this.supabase.from('profiles').select('full_name').eq('id', appointmentDetails.doctor_id).single(),
                ]);
                const patientName = patientProfile.data?.full_name || 'Patient';
                const doctorName = doctorProfile.data?.full_name || 'Doctor';
                if (patientEmail && doctorEmail) {
                    this.notificationsService.sendPaymentConfirmed({
                        appointmentId: dto.appointmentId,
                        patientId: appointmentDetails.patient_id,
                        patientEmail,
                        patientName,
                        doctorId: appointmentDetails.doctor_id,
                        doctorEmail,
                        doctorName,
                        appointmentDate: appointmentDetails.appt_date,
                        appointmentTime: appointmentDetails.appt_time,
                        appointmentType: appointmentDetails.appt_type,
                        amount: appointmentDetails.payment_amount || payment.amount,
                        currency: appointmentDetails.payment_currency || payment.currency,
                        paymentId: dto.razorpay_payment_id,
                    }).catch((error) => {
                        console.error('Failed to send payment confirmation email:', error);
                    });
                }
            }
            return {
                success: true,
                payment_id: dto.razorpay_payment_id,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Failed to verify payment: ${error.message}`);
        }
    }
    calculateRefundAmount(paymentAmount, appointmentDate, appointmentTime) {
        const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
        const now = new Date();
        const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilAppointment > 24) {
            return paymentAmount;
        }
        else if (hoursUntilAppointment > 12) {
            return Math.floor(paymentAmount * 0.5);
        }
        else if (hoursUntilAppointment > 6) {
            return Math.floor(paymentAmount * 0.25);
        }
        else {
            return 0;
        }
    }
    async createRefund(dto) {
        if (!this.razorpay || !this.supabase) {
            throw new common_1.BadRequestException('Payment service not configured. Please configure Razorpay and Supabase credentials.');
        }
        try {
            const { data: appointment, error: apptError } = await this.supabase
                .from('appointments')
                .select('id, payment_id, payment_amount, payment_status, appt_date, appt_time')
                .eq('id', dto.appointmentId)
                .single();
            if (apptError || !appointment) {
                throw new common_1.BadRequestException('Appointment not found');
            }
            if (!appointment.payment_id) {
                throw new common_1.BadRequestException('No payment found for this appointment');
            }
            if (appointment.payment_status === 'refunded' || appointment.payment_status === 'partial_refund') {
                throw new common_1.BadRequestException('Refund already processed');
            }
            const refundAmount = dto.amount || this.calculateRefundAmount(appointment.payment_amount || 0, appointment.appt_date, appointment.appt_time);
            if (refundAmount <= 0) {
                throw new common_1.BadRequestException('No refund available based on cancellation timing');
            }
            const refund = await this.razorpay.payments.refund(appointment.payment_id, {
                amount: refundAmount,
                notes: {
                    reason: dto.reason || 'Appointment cancelled',
                    appointment_id: dto.appointmentId.toString(),
                },
            });
            const isFullRefund = refundAmount >= (appointment.payment_amount || 0);
            const { error: updateError } = await this.supabase
                .from('appointments')
                .update({
                payment_status: isFullRefund ? 'refunded' : 'partial_refund',
                refund_amount: refundAmount,
                refund_id: refund.id,
                refund_date: new Date().toISOString(),
            })
                .eq('id', dto.appointmentId);
            if (updateError) {
                throw new common_1.InternalServerErrorException(`Failed to update appointment: ${updateError.message}`);
            }
            await this.supabase
                .from('payments')
                .update({
                status: isFullRefund ? 'refunded' : 'refunded',
            })
                .eq('razorpay_payment_id', appointment.payment_id);
            return {
                success: true,
                refund_id: refund.id,
                refund_amount: refundAmount,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(`Failed to process refund: ${error.message}`);
        }
    }
    verifyWebhookSignature(webhookBody, signature) {
        if (!this.webhookSecret) {
            this.logger.warn('Webhook secret not configured. Webhook verification disabled.');
            return false;
        }
        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(webhookBody)
            .digest('hex');
        return expectedSignature === signature;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map