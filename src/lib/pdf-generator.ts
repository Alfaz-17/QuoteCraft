import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { QuotationState } from "@/types/quotation.types";
import { calculateRowTotal, calculateSubtotal } from "@/utils/calculations";

export const generateProfessionalPDF = (data: QuotationState) => {
  const doc = new jsPDF();
  const primaryColor = data.branding.primaryColor || "#2563eb";

  // Convert hex to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [37, 99, 235];
  };

  const rgb = hexToRgb(primaryColor);
  const visibleColumns = data.tableColumns.filter(c => c.visible);

  // Helper to get cell value
  const getCellValue = (item: typeof data.items[0], colKey: string, index: number): string => {
    if (colKey === "sno") return (index + 1).toString();
    if (colKey === "total") return calculateRowTotal(item).toFixed(2);
    const val = item[colKey];
    if (val === undefined || val === null) return "-";
    if (typeof val === "number") return val.toFixed(2);
    return String(val).toUpperCase() || "-";
  };

  // 1. Logo (Centered)
  let currentY = 18;
  if (data.branding.logo) {
    try {
      doc.addImage(data.branding.logo, "PNG", 82, 10, 46, 22, undefined, "FAST");
      currentY = 40;
    } catch (e) {
      console.error("Logo failed", e);
    }
  }

  // 2. Title (Centered, uses primary color)
  doc.setFontSize(14);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.setFont("helvetica", "bold");
  const title = data.documentInfo.type === "rfq" ? "REQUEST FOR QUOTATION" : "QUOTATION";
  doc.text(title, 105, currentY, { align: "center" });

  // Underline
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  doc.setLineWidth(0.5);
  const titleWidth = doc.getTextWidth(title);
  doc.line(105 - titleWidth / 2, currentY + 2, 105 + titleWidth / 2, currentY + 2);

  // Date
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.text(`DATE: ${data.documentInfo.date}`, 190, currentY + 8, { align: "right" });
  currentY += 15;

  // 3. Intro
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Dear Team,", 15, currentY);
  currentY += 6;
  doc.setFont("helvetica", "normal");
  const intro = data.introText || "We hereby invite you to submit your best quotation for the items listed below.";
  const splitIntro = doc.splitTextToSize(intro, 180);
  doc.text(splitIntro, 15, currentY);
  currentY += splitIntro.length * 4.5 + 4;

  // 4. Machine Info Table (uses primary color)
  if (data.showMachineInfo !== false) {
    autoTable(doc, {
      startY: currentY,
      body: [
        ["SCOPE OF SUPPLY", (data.documentInfo.scope || "-").toUpperCase()],
        ["MAKE", (data.documentInfo.make || "-").toUpperCase()],
        ["MODEL", (data.documentInfo.model || "-").toUpperCase()],
      ],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2, halign: "center", fontStyle: "bold" },
      columnStyles: {
        0: { fillColor: rgb, textColor: [255, 255, 255], cellWidth: 50 },
        1: { cellWidth: 130 },
      },
      margin: { left: 15, right: 15 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 8; // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  // 5. Client Info
  if (data.showCustomerDetails !== false && (data.client.name || data.client.companyName)) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text("TO:", 15, currentY);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(data.client.companyName || data.client.name, 25, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    if (data.client.address) doc.text(data.client.address, 15, currentY + 5);
    if (data.client.attn) doc.text(`Attn: ${data.client.attn}`, 15, currentY + 9);
    currentY += 15;
  }

  // 6. Dynamic Items Table (uses primary color for headers)
  const tableHead = visibleColumns.map(col => col.label.toUpperCase());

  autoTable(doc, {
    startY: currentY,
    head: [tableHead],
    body: data.items.map((item, i) =>
      visibleColumns.map(col => getCellValue(item, col.key, i))
    ),
    theme: "grid",
    headStyles: {
      fillColor: rgb,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 2,
      textColor: [255, 255, 255],
    },
    columnStyles: visibleColumns.reduce((styles, col, idx) => {
      if (col.key === "sno") styles[idx] = { halign: "center", cellWidth: 12 };
      else if (col.key === "itemName") styles[idx] = { halign: "left", cellWidth: "auto" };
      else if (col.type === "number" || col.key === "total") styles[idx] = { halign: "center", cellWidth: 22 };
      else styles[idx] = { halign: "center", cellWidth: 25 };
      return styles;
    }, {} as Record<number, any>), // eslint-disable-line @typescript-eslint/no-explicit-any
    styles: { fontSize: 8, cellPadding: 2, halign: "center" },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    margin: { left: 15, right: 15 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 5; // eslint-disable-line @typescript-eslint/no-explicit-any

  // 7. Subtotal
  if (visibleColumns.some(c => c.key === "total")) {
    const subtotal = calculateSubtotal(data.items);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text(`SUBTOTAL: ${subtotal.toFixed(2)}`, 190, finalY + 3, { align: "right" });
  }

  let contentY = finalY + 12;

  // 8. Terms
  if (data.terms && contentY < 240) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text("COMMERCIAL TERMS:", 15, contentY);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const splitTerms = doc.splitTextToSize(data.terms, 170);
    doc.text(splitTerms, 15, contentY + 6);
    contentY += 6 + splitTerms.length * 4;
  }



  // 10. Footer Logo
  if (data.branding.logo && contentY < 260) {
    try {
      doc.addImage(data.branding.logo, "PNG", 15, contentY + 5, 18, 9, undefined, "FAST");
    } catch (e) {}
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.company.name, 36, contentY + 11);
  }

  // 11. Page Footer (uses primary color accent)
  const pageCount = (doc as any).internal.getNumberOfPages(); // eslint-disable-line @typescript-eslint/no-explicit-any
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Accent line
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 281, 195, 281);
    // Text
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text((data.company.address || "").toUpperCase(), 15, 285);
    doc.text(`${data.company.email} | ${data.company.phone}`, 15, 289);
    const website = data.company.website || `www.${(data.company.email.split("@")[1] || "example.com")}`;
    doc.text(website.toUpperCase(), 195, 285, { align: "right" });
    doc.text(`Page ${i} of ${pageCount}`, 195, 289, { align: "right" });
  }

  doc.save(`${data.documentInfo.number || "RFQ"}.pdf`);
};
