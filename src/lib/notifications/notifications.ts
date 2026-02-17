const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function sendAppointmentCreatedNotification(data: {
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
}): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/notifications/appointment-created`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to send appointment created notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending appointment created notification:', error);
  }
}

export async function sendPrescriptionCreatedNotification(data: {
  prescriptionId: string;
  patientId: string;
  patientEmail: string;
  patientName: string;
  doctorId: string;
  doctorEmail: string;
  doctorName: string;
  appointmentId?: number;
}): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/notifications/prescription-created`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to send prescription created notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending prescription created notification:', error);
  }
}

export async function sendVideoCallReadyNotification(data: {
  appointmentId: number;
  patientId: string;
  patientEmail: string;
  patientName: string;
  doctorId: string;
  doctorEmail: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  roomUrl: string;
}): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/notifications/video-call-ready`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to send video call ready notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending video call ready notification:', error);
  }
}
