"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppointmentStatusChangedTemplate = getAppointmentStatusChangedTemplate;
function getAppointmentStatusChangedTemplate(data) {
    const { patientName, doctorName, appointmentDate, appointmentTime, appointmentType, status, frontendUrl } = data;
    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const statusMessages = {
        accepted: {
            title: 'Appointment Confirmed',
            message: 'Your appointment has been confirmed by the doctor.',
            color: '#10b981',
        },
        declined: {
            title: 'Appointment Declined',
            message: 'Unfortunately, your appointment request has been declined by the doctor.',
            color: '#ef4444',
        },
        cancelled: {
            title: 'Appointment Cancelled',
            message: 'Your appointment has been cancelled.',
            color: '#f59e0b',
        },
    };
    const statusInfo = statusMessages[status];
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusInfo.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: ${statusInfo.color}; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${statusInfo.title}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello ${patientName},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                ${statusInfo.message}
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
              
              ${status === 'accepted' ? `
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Please make sure to complete payment if required. You will receive a reminder 24 hours before your appointment.
              </p>
              ` : `
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                You can book another appointment with a different doctor or time slot.
              </p>
              `}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/my/bookings" style="display: inline-block; background-color: ${statusInfo.color}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">
                  View My Appointments
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
//# sourceMappingURL=appointment-status-changed.template.js.map