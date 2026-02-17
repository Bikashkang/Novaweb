export function getAppointmentReminderTemplate(data: {
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  frontendUrl: string;
}): string {
  const { patientName, doctorName, appointmentDate, appointmentTime, appointmentType, frontendUrl } = data;
  const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #f59e0b; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Appointment Reminder</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello ${patientName},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                This is a friendly reminder that you have an appointment scheduled for tomorrow.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #666666;">Doctor:</strong>
                    <span style="color: #333333; margin-left: 10px;">${doctorName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #666666;">Date:</strong>
                    <span style="color: #333333; margin-left: 10px;">${formattedDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #666666;">Time:</strong>
                    <span style="color: #333333; margin-left: 10px;">${appointmentTime}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <strong style="color: #666666;">Type:</strong>
                    <span style="color: #333333; margin-left: 10px;">${appointmentType === 'video' ? 'Video Consultation' : 'In-Clinic Visit'}</span>
                  </td>
                </tr>
              </table>
              
              ${appointmentType === 'video' ? `
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Please ensure you have a stable internet connection and your camera/microphone are working properly before the appointment time.
              </p>
              ` : `
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Please arrive on time for your appointment. If you need to reschedule or cancel, please do so as soon as possible.
              </p>
              `}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/my/bookings" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
                  View Appointment Details
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #666666; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} NOVAHDL Solutions. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
