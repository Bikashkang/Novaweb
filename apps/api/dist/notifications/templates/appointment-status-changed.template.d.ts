export declare function getAppointmentStatusChangedTemplate(data: {
    patientName: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: string;
    status: 'accepted' | 'declined' | 'cancelled';
    frontendUrl: string;
}): string;
