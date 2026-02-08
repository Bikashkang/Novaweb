export declare class PaymentConfirmedDto {
    appointmentId: number;
    patientId: string;
    patientEmail: string;
    patientName: string;
    doctorId: string;
    doctorEmail: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: 'video' | 'in_clinic';
    amount: number;
    currency: string;
    paymentId: string;
}
