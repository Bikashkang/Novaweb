import type { Prescription } from "./prescriptions";
import { getLogoBase64 } from "./logo";

/**
 * Generate printable HTML for prescription
 */
export async function generatePrescriptionHTML(
  prescription: Prescription,
  patientName: string,
  doctorName: string,
  doctorDetails?: { phone?: string; email?: string; speciality?: string; registration_number?: string }
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
             <img src="${prescription.doctor_signature}" alt="Doctor Signature" style="max-width: 300px; height: auto; border: 1px solid #e2e8f0; border-radius: 4px; margin-left: auto;" />
             <p style="font-weight: 600; font-size: 14px; color: #1e293b; margin-top: 8px;">${doctorName}</p>
             ${doctorDetails?.speciality ? `<p style="font-size: 13px; color: #475569; margin-top: 4px;">${doctorDetails.speciality}</p>` : ""}
           </div>
         </div>
       </div>`
    : "";

  const doctorDetailsHTML = doctorDetails
    ? `${doctorDetails.registration_number ? `<p style="margin: 5px 0;"><strong>Reg. No:</strong> ${doctorDetails.registration_number}</p>` : ""}
       ${doctorDetails.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${doctorDetails.phone}</p>` : ""}
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
        <div style="font-size: 14px; color: #1e293b;">
          <p style="margin: 5px 0; font-weight: bold;">${doctorName}</p>
          ${doctorDetails?.speciality ? `<p style="margin: 5px 0; font-weight: bold;">${doctorDetails.speciality}</p>` : ""}
          ${doctorDetailsHTML}
        </div>
      </div>
    </div>
  </div>

  <div style="margin-bottom: 25px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h3 style="font-size: 14px; font-weight: 600; color: #475569; margin: 0;">PATIENT INFORMATION</h3>
      <p style="font-size: 14px; font-weight: 600; color: #475569; margin: 0;">Date: ${formatDate(prescription.created_at)}</p>
    </div>
    <div style="font-size: 14px; color: #1e293b;">
      ${prescription.appointment_id ? `<p style="margin: 5px 0;"><strong>Appointment ID:</strong> ${prescription.appointment_id}</p>` : ""}
      <p style="margin: 5px 0;"><strong>Name:</strong> ${displayPatientName}</p>
      ${prescription.patient_age ? `<p style="margin: 5px 0;"><strong>Age:</strong> ${prescription.patient_age}</p>` : ""}
      ${prescription.patient_address ? `<p style="margin: 5px 0;"><strong>Address:</strong> ${prescription.patient_address}</p>` : ""}
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
  doctorDetails?: { phone?: string; email?: string; speciality?: string; registration_number?: string }
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

  // Doctor Information on the right side of header (all aligned together)
  doc.setFontSize(8);
  const doctorInfoX = pageWidth - margin - 50;
  let doctorY = margin + 5;
  
  // Doctor name (bold)
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doctorY = addText(doctorName, doctorInfoX, doctorY, 50);
  
  // Speciality (bold)
  if (doctorDetails?.speciality) {
    doctorY = addText(doctorDetails.speciality, doctorInfoX, doctorY, 50);
  }
  
  // Other doctor details (normal)
  doc.setFont("helvetica", "normal");
  if (doctorDetails?.registration_number) {
    doctorY = addText(`Reg. No: ${doctorDetails.registration_number}`, doctorInfoX, doctorY, 50);
  }
  if (doctorDetails?.phone) {
    doctorY = addText(`Phone: ${doctorDetails.phone}`, doctorInfoX, doctorY, 50);
  }
  if (doctorDetails?.email) {
    doctorY = addText(`Email: ${doctorDetails.email}`, doctorInfoX, doctorY, 50);
  }

  // Add space and separator line between header and body
  yPos = Math.max(yPos, doctorY) + 10; // Ensure we're past the doctor info
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(1);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8; // Space after separator line

  // Patient Information
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text("PATIENT INFORMATION", margin, yPos);
  // Add date on the same line, aligned right
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const dateText = `Date: ${formatDate(prescription.created_at)}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, pageWidth - margin - dateWidth, yPos);
  yPos += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (prescription.appointment_id) {
    yPos = addText(`Appointment ID: ${prescription.appointment_id}`, margin, yPos, pageWidth / 2 - margin * 2);
  }
  yPos = addText(`Name: ${displayPatientName}`, margin, yPos, pageWidth / 2 - margin * 2);
  if (prescription.patient_age) {
    yPos = addText(`Age: ${prescription.patient_age}`, margin, yPos, pageWidth / 2 - margin * 2);
  }
  if (prescription.patient_address) {
    yPos = addText(`Address: ${prescription.patient_address}`, margin, yPos, pageWidth / 2 - margin * 2);
  }
  yPos += 10;

  // Observations
  if (prescription.observations) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("OBSERVATIONS", margin, yPos);
    yPos += 6;

    // Calculate text height first
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const obsLines = doc.splitTextToSize(prescription.observations, pageWidth - margin * 2 - 4);
    const obsTextHeight = obsLines.length * (9 * 0.4) + 4;
    
    // Draw background box for observations
    const obsStartY = yPos - 2;
    
    // Fill background (slate-50)
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, obsStartY, pageWidth - margin * 2, obsTextHeight, "F");
    
    yPos = addText(prescription.observations, margin + 2, yPos, pageWidth - margin * 2 - 4);
    yPos += 8;
  }

  // Medicines
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105); // slate-600
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

    // Medicine box (simulate border and background)
    const boxStartY = yPos - 2;
    const leftColX = margin + 3;
    const rightColX = margin + (pageWidth - margin * 2) / 2 + 3;
    let currentY = yPos + 3;
    
    // Calculate content height first (without drawing)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const medicineLines = doc.splitTextToSize(`Medicine: ${medicine.name}`, (pageWidth - margin * 2) / 2 - 6);
    let estimatedHeight = medicineLines.length * (9 * 0.4);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const dosageLines = doc.splitTextToSize(`Dosage: ${medicine.dosage}`, (pageWidth - margin * 2) / 2 - 6);
    const frequencyLines = doc.splitTextToSize(`Frequency: ${medicine.frequency}`, (pageWidth - margin * 2) / 2 - 6);
    estimatedHeight += Math.max(dosageLines.length, frequencyLines.length) * (8 * 0.4);
    
    const durationLines = doc.splitTextToSize(`Duration: ${medicine.duration}`, (pageWidth - margin * 2) / 2 - 6);
    estimatedHeight += durationLines.length * (8 * 0.4);
    
    if (medicine.instructions) {
      const instructionLines = doc.splitTextToSize(`Instructions: ${medicine.instructions}`, pageWidth - margin * 2 - 6);
      estimatedHeight += instructionLines.length * (8 * 0.4);
    }
    
    const boxHeight = estimatedHeight + 4;
    
    // Draw border rectangle (light gray)
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.rect(margin, boxStartY, pageWidth - margin * 2, boxHeight);
    
    // Fill with light background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(margin, boxStartY, pageWidth - margin * 2, boxHeight, "FD");
    
    // Draw text on top of background
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    currentY = addText(`Medicine: ${medicine.name}`, leftColX, currentY, (pageWidth - margin * 2) / 2 - 6, 9);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const dosageY = addText(`Dosage: ${medicine.dosage}`, leftColX, currentY, (pageWidth - margin * 2) / 2 - 6, 8);
    const frequencyY = addText(`Frequency: ${medicine.frequency}`, rightColX, currentY, (pageWidth - margin * 2) / 2 - 6, 8);
    currentY = Math.max(dosageY, frequencyY);
    
    const durationY = addText(`Duration: ${medicine.duration}`, leftColX, currentY, (pageWidth - margin * 2) / 2 - 6, 8);
    currentY = durationY;
    
    if (medicine.instructions) {
      currentY = addText(`Instructions: ${medicine.instructions}`, leftColX, currentY, pageWidth - margin * 2 - 6, 8);
    }
    
    yPos = currentY + 6;
  });

  // Signature - Bottom Right (positioned at bottom of page)
  if (prescription.doctor_signature) {
    const signatureData = prescription.doctor_signature; // Store in local variable for type narrowing
    const signatureX = pageWidth - margin;
    
    // Position signature at bottom of page
    // First, load image to get actual dimensions
    try {
      const img = new Image();
      img.src = signatureData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const imgWidth = 50; // 50mm width
          const imgHeight = (img.height / img.width) * imgWidth;
          
          // Position signature at bottom of page with proper spacing
          // Leave space for name (4mm) and speciality (4mm) = 8mm total
          const signatureBottomY = pageHeight - margin - 5; // 5mm from bottom
          const signatureY = signatureBottomY - imgHeight - 8; // 8mm for text below
          
          // Add border line above signature (8mm above signature image)
          const borderY = signatureY - 8;
          doc.setDrawColor(203, 213, 225); // slate-300
          doc.setLineWidth(0.5);
          doc.line(margin, borderY, pageWidth - margin, borderY);
          
          // Draw border around signature image
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.setLineWidth(0.5);
          doc.rect(signatureX - imgWidth - 1, signatureY - 1, imgWidth + 2, imgHeight + 2);
          
          // Add signature image
          doc.addImage(
            signatureData,
            "PNG",
            signatureX - imgWidth,
            signatureY,
            imgWidth,
            imgHeight
          );
          
          // Add doctor name and speciality below signature
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          doc.text(doctorName, signatureX, signatureY + imgHeight + 4, { align: "right" });
          
          if (doctorDetails?.speciality) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85); // slate-700
            doc.text(doctorDetails.speciality, signatureX, signatureY + imgHeight + 8, { align: "right" });
          }
          resolve();
        };
        img.onerror = () => {
          // Fallback if image fails to load
          const signatureBottomY = pageHeight - margin - 5;
          const signatureY = signatureBottomY - 15 - 8; // Default 15mm height
          const borderY = signatureY - 8;
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.5);
          doc.line(margin, borderY, pageWidth - margin, borderY);
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          doc.text(doctorName, signatureX, signatureY + 5, { align: "right" });
          if (doctorDetails?.speciality) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85);
            doc.text(doctorDetails.speciality, signatureX, signatureY + 9, { align: "right" });
          }
          resolve();
        };
      });
    } catch (error) {
      console.error("Error adding signature image:", error);
      // Fallback positioning
      const signatureBottomY = pageHeight - margin - 5;
      const signatureY = signatureBottomY - 15 - 8;
      const borderY = signatureY - 8;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.line(margin, borderY, pageWidth - margin, borderY);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(doctorName, signatureX, signatureY + 5, { align: "right" });
      if (doctorDetails?.speciality) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(doctorDetails.speciality, signatureX, signatureY + 9, { align: "right" });
      }
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
  doctorDetails?: { phone?: string; email?: string; speciality?: string; registration_number?: string },
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
  doctorDetails?: { phone?: string; email?: string; speciality?: string; registration_number?: string },
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
  doctorDetails?: { phone?: string; email?: string; speciality?: string; registration_number?: string }
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

