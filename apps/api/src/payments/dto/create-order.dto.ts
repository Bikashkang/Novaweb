export class CreateOrderDto {
  appointmentId: number;
  amount: number; // in smallest currency unit (paise)
  currency?: string; // default 'INR'
}
