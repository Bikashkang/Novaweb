export class CreateRefundDto {
  appointmentId: number;
  amount?: number; // optional, if not provided calculates based on refund policy
  reason?: string;
}
