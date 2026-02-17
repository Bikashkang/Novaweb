import { Controller, Post, Get, Body, Headers, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.paymentsService.createOrder(dto);
  }

  @Post('verify')
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Post('refund')
  async createRefund(@Body() dto: CreateRefundDto) {
    return this.paymentsService.createRefund(dto);
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Headers('x-razorpay-signature') signature: string) {
    const webhookBody = JSON.stringify(body);
    
    if (!this.paymentsService.verifyWebhookSignature(webhookBody, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Handle payment.captured event
    if (body.event === 'payment.captured') {
      const payment = body.payload.payment.entity;
      const appointmentId = payment.notes?.appointment_id;

      if (appointmentId) {
        await this.paymentsService.verifyPayment({
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          razorpay_signature: '', // Not needed for webhook
          appointmentId: parseInt(appointmentId),
        });
      }
    }

    return { received: true };
  }

  @Get('pricing')
  async getPricing(@Body() body: { appointmentType: string; doctorId?: string }) {
    // This will be implemented to fetch from appointment_pricing table
    // For now, return a placeholder
    return { amount: 50000, currency: 'INR' }; // 500 INR in paise
  }
}
