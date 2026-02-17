import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
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
    createRefund(dto: CreateRefundDto): Promise<{
        success: boolean;
        refund_id: string;
        refund_amount: number;
    }>;
    handleWebhook(body: any, signature: string): Promise<{
        received: boolean;
    }>;
    getPricing(body: {
        appointmentType: string;
        doctorId?: string;
    }): Promise<{
        amount: number;
        currency: string;
    }>;
}
