export declare class AppointmentStatusChangedDto {
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
    status: 'accepted' | 'declined' | 'cancelled';
}
