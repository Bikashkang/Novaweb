import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import Razorpay from 'razorpay';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: Razorpay;
  private supabase: SupabaseClient;
  private webhookSecret: string;
  private keySecret: string;

  constructor(private readonly notificationsService: NotificationsService) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    // Make Razorpay optional - only initialize if credentials are provided
    if (keyId && keySecret) {
      // Store key secret for signature verification
      this.keySecret = keySecret;
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } else {
      this.logger.warn('Razorpay credentials not configured. Payment features will be disabled.');
      this.keySecret = '';
    }

    // Supabase is required for payments to work, but don't crash the app
    if (supabaseUrl && supabaseServiceKey) {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      this.logger.warn('Supabase credentials not configured. Payment features will be disabled.');
    }
  }

  /**
   * Create a Razorpay order for an appointment
   */
  async createOrder(dto: CreateOrderDto) {
    if (!this.razorpay || !this.supabase) {
      this.logger.error('Payment service not configured. Razorpay:', !!this.razorpay, 'Supabase:', !!this.supabase);
      throw new BadRequestException('Payment service not configured. Please configure Razorpay and Supabase credentials.');
    }

    try {
      this.logger.log(`Creating order for appointment ${dto.appointmentId} with amount ${dto.amount}`);

      // Verify appointment exists and belongs to user
      const { data: appointment, error: apptError } = await this.supabase
        .from('appointments')
        .select('id, patient_id, payment_status, payment_amount')
        .eq('id', dto.appointmentId)
        .single();

      if (apptError) {
        this.logger.error('Appointment fetch error:', apptError);
        throw new BadRequestException(`Appointment not found: ${apptError.message}`);
      }

      if (!appointment) {
        this.logger.error(`Appointment ${dto.appointmentId} not found`);
        throw new BadRequestException('Appointment not found');
      }

      // Check if already paid
      if (appointment.payment_status === 'paid') {
        throw new BadRequestException('Appointment already paid');
      }

      // Use provided amount or existing payment_amount
      const amount = dto.amount || appointment.payment_amount || 0;

      // Razorpay minimum: ₹1.00 (100 paisa) for INR
      const MINIMUM_AMOUNT = 100; // 100 paisa = ₹1.00

      if (amount <= 0) {
        this.logger.error(`Invalid amount: ${amount} for appointment ${dto.appointmentId}`);
        throw new BadRequestException(`Invalid payment amount: ${amount}`);
      }

      if (amount < MINIMUM_AMOUNT && (dto.currency || 'INR') === 'INR') {
        this.logger.error(`Amount ${amount} below Razorpay minimum ${MINIMUM_AMOUNT} for appointment ${dto.appointmentId}`);
        throw new BadRequestException(
          `Payment amount must be at least ₹1.00 (100 paisa). Current amount: ₹${(amount / 100).toFixed(2)}`
        );
      }

      const currency = dto.currency || 'INR';

      this.logger.log(`Creating Razorpay order: amount=${amount}, currency=${currency}`);

      // Create Razorpay order
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
        id: order.id, // Keep both for compatibility
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Log the full error for debugging
      this.logger.error('Failed to create Razorpay order:', error);

      // Extract meaningful error message
      const errorMessage = error?.message || error?.error?.message || error?.toString() || 'Unknown error';
      const razorpayError = error?.error?.description || error?.error?.reason || '';

      if (razorpayError) {
        throw new InternalServerErrorException(`Failed to create order: ${razorpayError}`);
      }

      throw new InternalServerErrorException(`Failed to create order: ${errorMessage}`);
    }
  }

  /**
   * Verify payment signature and update appointment
   */
  async verifyPayment(dto: VerifyPaymentDto) {
    if (!this.razorpay || !this.supabase || !this.keySecret) {
      throw new BadRequestException('Payment service not configured. Please configure Razorpay and Supabase credentials.');
    }

    try {
      // Verify signature
      const text = `${dto.razorpay_order_id}|${dto.razorpay_payment_id}`;
      const signature = crypto
        .createHmac('sha256', this.keySecret)
        .update(text)
        .digest('hex');

      if (signature !== dto.razorpay_signature) {
        throw new BadRequestException('Invalid payment signature');
      }

      // Fetch payment details from Razorpay
      const payment = await this.razorpay.payments.fetch(dto.razorpay_payment_id);

      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        throw new BadRequestException(`Payment not successful. Status: ${payment.status}`);
      }

      // Update appointment
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
        throw new InternalServerErrorException(`Failed to update appointment: ${updateError.message}`);
      }

      // Create payment record
      const { error: paymentError } = await this.supabase.from('payments').insert({
        appointment_id: dto.appointmentId,
        razorpay_payment_id: dto.razorpay_payment_id,
        razorpay_order_id: dto.razorpay_order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status === 'captured' ? 'captured' : 'authorized',
        method: payment.method,
        metadata: payment as any,
      });

      if (paymentError) {
        console.error('Failed to create payment record:', paymentError);
        // Don't throw, payment is already processed
      }

      // Fetch appointment details with user info for email notification
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
        // Fetch patient and doctor emails
        const [patientResult, doctorResult] = await Promise.all([
          this.supabase.auth.admin.getUserById(appointmentDetails.patient_id),
          this.supabase.auth.admin.getUserById(appointmentDetails.doctor_id),
        ]);

        const patientEmail = patientResult.data?.user?.email;
        const doctorEmail = doctorResult.data?.user?.email;

        // Fetch profile names
        const [patientProfile, doctorProfile] = await Promise.all([
          this.supabase.from('profiles').select('full_name').eq('id', appointmentDetails.patient_id).single(),
          this.supabase.from('profiles').select('full_name').eq('id', appointmentDetails.doctor_id).single(),
        ]);

        const patientName = patientProfile.data?.full_name || 'Patient';
        const doctorName = doctorProfile.data?.full_name || 'Doctor';

        if (patientEmail && doctorEmail) {
          // Send email notification asynchronously (don't wait)
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
            appointmentType: appointmentDetails.appt_type as 'video' | 'in_clinic',
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
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to verify payment: ${error.message}`);
    }
  }

  /**
   * Calculate refund amount based on cancellation timing
   */
  private calculateRefundAmount(
    paymentAmount: number,
    appointmentDate: string,
    appointmentTime: string
  ): number {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment > 24) {
      return paymentAmount; // Full refund
    } else if (hoursUntilAppointment > 12) {
      return Math.floor(paymentAmount * 0.5); // 50% refund
    } else if (hoursUntilAppointment > 6) {
      return Math.floor(paymentAmount * 0.25); // 25% refund
    } else {
      return 0; // No refund
    }
  }

  /**
   * Process refund for cancelled appointment
   */
  async createRefund(dto: CreateRefundDto) {
    if (!this.razorpay || !this.supabase) {
      throw new BadRequestException('Payment service not configured. Please configure Razorpay and Supabase credentials.');
    }

    try {
      // Get appointment details
      const { data: appointment, error: apptError } = await this.supabase
        .from('appointments')
        .select('id, payment_id, payment_amount, payment_status, appt_date, appt_time')
        .eq('id', dto.appointmentId)
        .single();

      if (apptError || !appointment) {
        throw new BadRequestException('Appointment not found');
      }

      if (!appointment.payment_id) {
        throw new BadRequestException('No payment found for this appointment');
      }

      if (appointment.payment_status === 'refunded' || appointment.payment_status === 'partial_refund') {
        throw new BadRequestException('Refund already processed');
      }

      // Calculate refund amount
      const refundAmount = dto.amount || this.calculateRefundAmount(
        appointment.payment_amount || 0,
        appointment.appt_date,
        appointment.appt_time
      );

      if (refundAmount <= 0) {
        throw new BadRequestException('No refund available based on cancellation timing');
      }

      // Create refund via Razorpay
      const refund = await this.razorpay.payments.refund(appointment.payment_id, {
        amount: refundAmount,
        notes: {
          reason: dto.reason || 'Appointment cancelled',
          appointment_id: dto.appointmentId.toString(),
        },
      });

      // Update appointment
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
        throw new InternalServerErrorException(`Failed to update appointment: ${updateError.message}`);
      }

      // Update payment record
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
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(webhookBody: string, signature: string): boolean {
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
}
