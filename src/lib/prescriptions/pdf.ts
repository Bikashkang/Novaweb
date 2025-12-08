import type { Prescription } from "./prescriptions";
import { getLogoBase64 } from "./logo";

/**
 * Generate printable HTML for prescription
 */
export async function generatePrescriptionHTML(
  prescription: Prescription,
  patientName: string,
  doctorName: string,
  doctorDetails?: { phone?: string; email?: string }
): Promise<string> {
  // Use patient_name from prescription if available, otherwise use provided patientName
  const displayPatientName = prescription.patient_name || patientName;
  // Load logo as base64
  const logoBase64 = await getLogoBase64();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const medicinesHTML = prescription.medicines
    .map(
      (medicine, index) => `
    <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
        <div><strong>Medicine:</strong> ${medicine.name}</div>
        <div><strong>Dosage:</strong> ${medicine.dosage}</div>
        <div><strong>Frequency:</strong> ${medicine.frequency}</div>
        <div><strong>Duration:</strong> ${medicine.duration}</div>
        ${medicine.instructions ? `<div style="grid-column: 1 / -1;"><strong>Instructions:</strong> ${medicine.instructions}</div>` : ""}
      </div>
    </div>
  `
    )
    .join("");

  const signatureHTML = prescription.doctor_signature
    ? `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #cbd5e1;">
         <div style="display: flex; justify-content: flex-end;">
           <div style="text-align: right;">
             <p style="font-weight: 600; font-size: 14px; color: #475569; margin-bottom: 10px;">Doctor Signature</p>
             <img src="${prescription.doctor_signature}" alt="Doctor Signature" style="max-width: 300px; height: auto; border: 1px solid #e2e8f0; border-radius: 4px; margin-left: auto;" />
             <p style="font-size: 14px; color: #64748b; margin-top: 8px;">${formatDate(prescription.created_at)}</p>
           </div>
         </div>
       </div>`
    : "";

  const doctorDetailsHTML = doctorDetails
    ? `${doctorDetails.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${doctorDetails.phone}</p>` : ""}
       ${doctorDetails.email ? `<p style="margin: 5px 0;"><strong>Email:</strong> ${doctorDetails.email}</p>` : ""}`
    : "";

  const observationsHTML = prescription.observations
    ? `<div style="margin-bottom: 25px;">
         <h3 style="font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 8px;">OBSERVATIONS</h3>
         <div style="font-size: 14px; color: #1e293b; white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 8px;">
           ${prescription.observations}
         </div>
       </div>`
    : "";

  const logoImgTag = logoBase64
    ? `<img src="${logoBase64}" alt="NOVAHDL Logo" style="width: 80px; height: 80px; object-fit: contain;" />`
    : `<div style="width: 80px; height: 80px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b;">NOVAHDL</div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prescription - ${displayPatientName}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    @media print {
      body { 
        margin: 0;
        padding: 0;
      }
      .no-print { display: none; }
      .prescription-container {
        width: 210mm;
        min-height: 297mm;
        padding: 15mm;
        margin: 0;
      }
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #1e293b;
      background: white;
    }
    .prescription-container {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      margin: 0 auto;
      background: white;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div class="prescription-container">
    <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #cbd5e1;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
        <div style="display: flex; align-items: center; gap: 15px;">
          ${logoImgTag}
        <div>
          <h1 style="font-size: 32px; font-weight: bold; color: #1e293b; margin: 0; margin-bottom: 5px;">NOVAHDL</h1>
          <p style="font-size: 14px; color: #64748b; margin: 0;">SOLUTIONS PVT. LTD</p>
          <p style="font-size: 12px; color: #94a3b8; margin: 2px 0 0 0;">HEALTHY DIGITAL LIFE</p>
        </div>
      </div>
      <div style="text-align: right;">
        <h3 style="font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 10px;">DOCTOR INFORMATION</h3>
        <div style="font-size: 14px; color: #1e293b;">
          <p style="margin: 5px 0;"><strong>Name:</strong> ${doctorName}</p>
          ${doctorDetailsHTML}
        </div>
      </div>
    </div>
  </div>

  <div style="margin-bottom: 25px;">
    <h3 style="font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 10px;">PATIENT INFORMATION</h3>
    <div style="font-size: 14px; color: #1e293b;">
      <p style="margin: 5px 0;"><strong>Name:</strong> ${displayPatientName}</p>
      ${prescription.patient_age ? `<p style="margin: 5px 0;"><strong>Age:</strong> ${prescription.patient_age}</p>` : ""}
      <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(prescription.created_at)}</p>
      ${prescription.appointment_id ? `<p style="margin: 5px 0;"><strong>Appointment ID:</strong> ${prescription.appointment_id}</p>` : ""}
    </div>
  </div>

  ${observationsHTML}

  <div style="margin-bottom: 25px;">
    <h3 style="font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 15px;">PRESCRIBED MEDICINES</h3>
    ${medicinesHTML}
  </div>

    ${signatureHTML}
  </div>
</body>
</html>
  `;
}

/**
 * Generate PDF from prescription using jsPDF
 */
export async function generatePrescriptionPDF(
  prescription: Prescription,
  patientName: string,
  doctorName: string,
  doctorDetails?: { phone?: string; email?: string }
): Promise<Blob> {
  // Use patient_name from prescription if available, otherwise use provided patientName
  const displayPatientName = prescription.patient_name || patientName;
  // Dynamic import to avoid SSR issues
  const { default: jsPDF } = await import("jspdf");

  // Create PDF in A4 format (210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  const pageWidth = doc.internal.pageSize.getWidth(); // Should be 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // Should be 297mm
  const margin = 15; // 15mm margins
  let yPos = margin;
  
  // Load logo as base64
  const logoBase64 = await getLogoBase64();

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * (fontSize * 0.4);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Add logo if available
  if (logoBase64) {
    try {
      const logoWidth = 20; // 20mm width
      const logoHeight = 20; // 20mm height (maintain aspect ratio)
      doc.addImage(logoBase64, "PNG", margin, yPos, logoWidth, logoHeight);
    } catch (error) {
      console.error("Error adding logo to PDF:", error);
    }
  }

  // Header with NOVAHDL (next to logo)
  const textStartX = margin + (logoBase64 ? 25 : 0);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("NOVAHDL", textStartX, yPos + 5);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("SOLUTIONS PVT. LTD", textStartX, yPos + 9);
  
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text("HEALTHY DIGITAL LIFE", textStartX, yPos + 12);
  
  yPos += 18;

  // Doctor Information on the right side of header
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  const doctorInfoX = pageWidth - margin - 50;
  doc.text("DOCTOR INFORMATION", doctorInfoX, margin + 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let doctorY = margin + 10;
  doctorY = addText(`Name: ${doctorName}`, doctorInfoX, doctorY, 50);
  if (doctorDetails?.phone) {
    doctorY = addText(`Phone: ${doctorDetails.phone}`, doctorInfoX, doctorY, 50);
  }
  if (doctorDetails?.email) {
    doctorY = addText(`Email: ${doctorDetails.email}`, doctorInfoX, doctorY, 50);
  }

  // Patient Information
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("PATIENT INFORMATION", margin, yPos);
  yPos += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  yPos = addText(`Name: ${displayPatientName}`, margin, yPos, pageWidth / 2 - margin * 2);
  if (prescription.patient_age) {
    yPos = addText(`Age: ${prescription.patient_age}`, margin, yPos, pageWidth / 2 - margin * 2);
  }
  yPos = addText(`Date: ${formatDate(prescription.created_at)}`, margin, yPos, pageWidth / 2 - margin * 2);
  if (prescription.appointment_id) {
    yPos = addText(`Appointment ID: ${prescription.appointment_id}`, margin, yPos, pageWidth / 2 - margin * 2);
  }
  yPos += 10;

  // Observations
  if (prescription.observations) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVATIONS", margin, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    yPos = addText(prescription.observations, margin, yPos, pageWidth - margin * 2);
    yPos += 8;
  }

  // Medicines
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PRESCRIBED MEDICINES", margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  prescription.medicines.forEach((medicine, index) => {
    // Check if we need a new page (leave 50mm for signature)
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${index + 1}. ${medicine.name}`, margin, yPos);
    yPos += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    yPos = addText(`Dosage: ${medicine.dosage}`, margin + 3, yPos, pageWidth - margin * 2 - 3, 8);
    yPos = addText(`Frequency: ${medicine.frequency}`, margin + 3, yPos, pageWidth - margin * 2 - 3, 8);
    yPos = addText(`Duration: ${medicine.duration}`, margin + 3, yPos, pageWidth - margin * 2 - 3, 8);
    if (medicine.instructions) {
      yPos = addText(`Instructions: ${medicine.instructions}`, margin + 3, yPos, pageWidth - margin * 2 - 3, 8);
    }
    yPos += 6;
  });

  // Signature - Bottom Right
  if (prescription.doctor_signature) {
    // Ensure signature is at bottom of page
    const signatureY = pageHeight - margin - 25;
    const signatureX = pageWidth - margin - 50;
    const signatureData = prescription.doctor_signature; // Store in local variable for type narrowing
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Doctor Signature", signatureX, signatureY, { align: "right" });
    
    try {
      // Add signature image
      const img = new Image();
      img.src = signatureData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const imgWidth = 50; // 50mm width
          const imgHeight = (img.height / img.width) * imgWidth;
          doc.addImage(
            signatureData,
            "PNG",
            signatureX - imgWidth,
            signatureY + 3,
            imgWidth,
            imgHeight
          );
          doc.setFontSize(7);
          doc.setFont("helvetica", "normal");
          doc.text(formatDate(prescription.created_at), signatureX, signatureY + imgHeight + 5, { align: "right" });
          resolve();
        };
        img.onerror = reject;
      });
    } catch (error) {
      console.error("Error adding signature image:", error);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(prescription.created_at), signatureX, signatureY + 5, { align: "right" });
    }
  }

  return doc.output("blob");
}

/**
 * Download prescription as PDF
 */
export async function downloadPrescriptionPDF(
  prescription: Prescription,
  patientName: string,
  doctorName: string,
  doctorDetails?: { phone?: string; email?: string },
  filename?: string
) {
  const blob = await generatePrescriptionPDF(prescription, patientName, doctorName, doctorDetails);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `prescription-${prescription.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download prescription as HTML
 */
export async function downloadPrescriptionHTML(
  prescription: Prescription,
  patientName: string,
  doctorName: string,
  doctorDetails?: { phone?: string; email?: string },
  filename?: string
) {
  const html = await generatePrescriptionHTML(prescription, patientName, doctorName, doctorDetails);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `prescription-${prescription.id}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Print prescription
 */
export async function printPrescription(
  prescription: Prescription,
  patientName: string,
  doctorName: string,
  doctorDetails?: { phone?: string; email?: string }
) {
  const html = await generatePrescriptionHTML(prescription, patientName, doctorName, doctorDetails);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

