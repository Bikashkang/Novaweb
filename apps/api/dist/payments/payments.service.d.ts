import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PaymentsService {
    private readonly notificationsService;
    private readonly logger;
    private razorpay;
    private supabase;
    private webhookSecret;
    private keySecret;
    constructor(notificationsService: NotificationsService);
    createOrder(dto: CreateOrderDto): Promise<{
        orderId: string;
        id: string;
        amount: string | number;
        currency: string;
        receipt: string | undefined;
    }>;
    verifyPayment(dto: VerifyPaymentDto): Promise<{
        success: boolean;
        payment_id: string;
    }>;
    private calculateRefundAmount;
    createRefund(dto: CreateRefundDto): Promise<{
        success: boolean;
        refund_id: string;
        refund_amount: number;
    }>;
    verifyWebhookSignature(webhookBody: string, signature: string): boolean;
}
