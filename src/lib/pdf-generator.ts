import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { QuotationState, CURRENCY_SYMBOLS } from "@/types/quotation.types";
import { calculateRowTotal, calculateSubtotal, calculateDiscountAmount, calculateTaxAmount, calculateGrandTotal } from "@/utils/calculations";

const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ width: 0, height: 0 });
      return;
    }
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = base64;
  });
};

export const generateProfessionalPDF = async (data: QuotationState) => {
  const doc = new jsPDF();
  const primaryColor = data.branding.primaryColor || "#2563eb";
  const currencySymbol = CURRENCY_SYMBOLS[data.currency] || "$";

  // Convert hex to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [37, 99, 235];
  };

  const rgb = hexToRgb(primaryColor);
  const visibleColumns = data.tableColumns.filter(c => c.visible);

  const formatValue = (num: number): string => {
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
  };

  // Helper to get cell value
  const getCellValue = (item: typeof data.items[0], colKey: string, index: number): string => {
    if (colKey === "sno") return (index + 1).toString();
    if (colKey === "total") return `${currencySymbol}${formatValue(calculateRowTotal(item))}`;
    if (colKey === "unitPrice") return `${currencySymbol}${formatValue(item.unitPrice || 0)}`;
    
    if (colKey === "itemName") {
      const name = (item.itemName || "-").toUpperCase();
      if (item.description) {
        return `${name}\n${item.description}`;
      }
      return name;
    }

    const val = item[colKey];
    if (val === undefined || val === null) return "-";
    if (colKey === "unit") return String(val).toUpperCase();
    if (typeof val === "number") return formatValue(val);
    return String(val) || "-";
  };

  // Title based on doc type
  const getTitle = () => {
    switch (data.documentInfo.type) {
      case "rfq": return "Request for Quotation";
      case "proforma": return "Proforma Invoice";
      default: return "Quotation";
    }
  };

  // 1. Logo & Company Name Side-by-Side on the Top-Left, Document Info on Top-Right
  let logoH = 0;
  let logoW = 0;
  let hasLogo = false;

  if (data.branding.logo) {
    try {
      const dimensions = await getImageDimensions(data.branding.logo);
      if (dimensions.width > 0 && dimensions.height > 0) {
        const aspectRatio = dimensions.width / dimensions.height;
        const maxWidth = 35;  // Compact logo width
        const maxHeight = 15; // Compact logo height
        
        logoW = maxWidth;
        logoH = maxWidth / aspectRatio;
        
        if (logoH > maxHeight) {
          logoH = maxHeight;
          logoW = maxHeight * aspectRatio;
        }
        
        doc.addImage(data.branding.logo, "PNG", 15, 10, logoW, logoH, undefined, "FAST");
        hasLogo = true;
      }
    } catch (e) {
      console.error("Logo failed", e);
    }
  }

  // Draw Supplier Company Name next to the Logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  
  const companyNameX = hasLogo ? 15 + logoW + 4 : 15;
  const companyNameY = hasLogo ? (10 + (logoH / 2) - 1.5) : 17;
  doc.text((data.company.name || "OUR COMPANY").toUpperCase(), companyNameX, companyNameY);
  
  // Under Company Name, show website if exists
  if (data.company.website) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175); // text-gray-400
    doc.text(data.company.website.toLowerCase(), companyNameX, companyNameY + 4.5);
  }

  // Draw Document Details on Top-Right (aligned right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const title = getTitle().toUpperCase();
  doc.text(title, 195, 14, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81); // text-gray-700
  doc.text(data.documentInfo.number, 195, 19, { align: "right" });

  doc.setFontSize(8);
  // Date Row
  const dateVal = data.documentInfo.date;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128); // text-gray-500
  const dateLabel = "DATE: ";
  const dateValW = doc.getTextWidth(dateVal);
  doc.text(dateVal, 195, 23.5, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(dateLabel, 195 - dateValW, 23.5, { align: "right" });
  
  if (data.documentInfo.validUntil) {
    const validVal = data.documentInfo.validUntil;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128); // text-gray-500
    const validLabel = "VALID UNTIL: ";
    const validValW = doc.getTextWidth(validVal);
    doc.text(validVal, 195, 27.5, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(validLabel, 195 - validValW, 27.5, { align: "right" });
  }

  // Set currentY below this premium top header block
  let currentY = Math.max(10 + logoH, 29) + 4;

  // Draw Divider Line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, currentY, 195, currentY);
  currentY += 8;

  // Vessel & Reference
  if (data.documentInfo.vessel || data.documentInfo.reference) {
    doc.setFontSize(8.5);
    let vesRefX = 15;
    if (data.documentInfo.vessel) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text("Vessel: ", vesRefX, currentY);
      const vW = doc.getTextWidth("Vessel: ");
      doc.setTextColor(31, 41, 55); // text-gray-800
      doc.text(data.documentInfo.vessel, vesRefX + vW, currentY);
      vesRefX += vW + doc.getTextWidth(data.documentInfo.vessel) + 15;
    }
    if (data.documentInfo.reference) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text("Ref: ", vesRefX, currentY);
      const rW = doc.getTextWidth("Ref: ");
      doc.setTextColor(31, 41, 55); // text-gray-800
      doc.text(data.documentInfo.reference, vesRefX + rW, currentY);
    }
    currentY += 7;
  }

  // 3. Intro
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 41, 55); // text-gray-800
  doc.text("Dear Team,", 15, currentY);
  currentY += 5;
  
  // Default intro text based on doc type
  const getDefaultIntro = () => {
    switch (data.documentInfo.type) {
      case "rfq": return "We hereby invite you to submit your best quotation for the items listed below.";
      case "proforma": return "We are pleased to submit our proforma invoice for the items listed below.";
      default: return "We are pleased to submit our best quotation for the items listed below.";
    }
  };

  const intro = data.introText || getDefaultIntro();
  const splitIntro = doc.splitTextToSize(intro, 180);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(55, 65, 81); // text-gray-700
  doc.text(splitIntro, 15, currentY);
  currentY += splitIntro.length * 4.5 + 4;

  // 4. Machine Info Table (uses primary color)
  if (data.showMachineInfo !== false && (data.documentInfo.make || data.documentInfo.model)) {
    const machineRows = [
      ["Make", (data.documentInfo.make || "-").toUpperCase()],
      ["Model", (data.documentInfo.model || "-").toUpperCase()],
    ].filter(row => row[1] !== "-");

    if (machineRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        body: machineRows,
        theme: "grid",
        styles: { 
          fontSize: 8, 
          cellPadding: 2.5, 
          halign: "center", 
          fontStyle: "bold",
          lineColor: [209, 213, 219],
          lineWidth: 0.15,
        },
        columnStyles: {
          0: { fillColor: rgb, textColor: [255, 255, 255], cellWidth: 50 },
          1: { cellWidth: 130 },
        },
        margin: { left: 15, right: 15 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 8; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }

  // 5. Client Info
  currentY += 2;

  let clientEndY = currentY;

  // Render Client (To) on the Left margin (X = 15)
  if (data.showCustomerDetails !== false && (data.client.name || data.client.companyName)) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text("To (Buyer):", 15, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55); // text-gray-800
    const buyerName = (data.client.companyName || data.client.name).toUpperCase();
    doc.text(buyerName, 15, currentY + 5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99); // text-gray-600
    let toY = currentY + 9.5;
    if (data.client.address) {
      const splitAddr = doc.splitTextToSize(data.client.address, 170);
      doc.text(splitAddr, 15, toY);
      toY += splitAddr.length * 4;
    }
    if (data.client.attn) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128); // text-gray-500
      doc.text("Attn: ", 15, toY);
      const attnLabelW = doc.getTextWidth("Attn: ");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(55, 65, 81); // text-gray-700
      doc.text(data.client.attn, 15 + attnLabelW, toY);
      toY += 4;
    }
    clientEndY = toY;
  }

  // Calculate final Y position after client column (borderless vertical padding matching preview height)
  currentY = clientEndY + 4;

  // 6. Dynamic Items Table (uses primary color for headers)
  const tableHead = visibleColumns.map(col => col.label);

  autoTable(doc, {
    startY: currentY,
    head: [tableHead],
    body: data.items.map((item, i) =>
      visibleColumns.map(col => getCellValue(item, col.key, i))
    ),
    theme: "grid",
    headStyles: {
      fillColor: rgb,
      fontSize: 8.5,
      fontStyle: "bold",
      halign: "center",
      cellPadding: 3,
      textColor: [255, 255, 255],
      lineColor: [255, 255, 255],
      lineWidth: 0.1,
    },
    columnStyles: visibleColumns.reduce((styles, col, idx) => {
      let cellWidth: number | "auto" = "auto";
      if (col.width && col.key !== "itemName") {
        const px = parseInt(col.width, 10);
        if (!isNaN(px)) {
          // Map pixels directly to mm (0.259 mm per px) based on 180mm total table width
          cellWidth = Math.round(px * 0.259);
        }
      }
      
      let halign: "left" | "center" | "right" = "left";
      if (col.key === "sno" || col.key === "unit" || col.type === "number" || col.key === "total" || col.key === "unitPrice") {
        halign = "center";
      }

      styles[idx] = { halign, cellWidth };
      return styles;
    }, {} as Record<number, any>), // eslint-disable-line @typescript-eslint/no-explicit-any
    styles: { 
      fontSize: 8.5, 
      cellPadding: 3, 
      halign: "left",
      lineColor: [229, 231, 235], // border-gray-200
      lineWidth: 0.15,
      textColor: [55, 65, 81], // text-gray-700
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    margin: { left: 15, right: 15 },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 5; // eslint-disable-line @typescript-eslint/no-explicit-any

  // 7. Totals Section
  if (visibleColumns.some(c => c.key === "total")) {
    const subtotal = calculateSubtotal(data.items);
    const discountAmt = calculateDiscountAmount(subtotal, data.discount, data.discountType);
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = calculateTaxAmount(afterDiscount, data.taxPercent);
    const grandTotal = calculateGrandTotal(subtotal, data.discount, data.discountType, data.taxPercent, data.shippingCharge);
    const hasExtras = (data.discount > 0) || (data.taxPercent > 0) || (data.shippingCharge > 0);

    const totalsX = 130; // Shift totals left slightly to provide premium text breathing room
    const valX = 195;    // Align perfectly, pixel-for-pixel, with the table right edge!

    // Dynamically calculate the vertical height needed for the totals section
    const totalsHeight = 8 + (data.discount > 0 ? 5 : 0) + (data.taxPercent > 0 ? 5 : 0) + (data.shippingCharge > 0 ? 5 : 0);

    // If it overflows the printable vertical limit (255mm), insert a clean new page
    if (finalY + totalsHeight > 255) {
      doc.addPage();
      finalY = 25; // Reset top margin for the totals section
    }

    let totY = finalY + 3;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(75, 85, 99); // text-gray-600
    doc.text("Subtotal", totalsX, totY);
    doc.text(`${currencySymbol}${formatValue(subtotal)}`, valX, totY, { align: "right" });

    if (data.discount > 0) {
      totY += 5;
      doc.setTextColor(220, 38, 38); // text-red-600
      const discLabel = data.discountType === "percent" ? `Discount (${data.discount}%)` : "Discount";
      doc.text(discLabel, totalsX, totY);
      doc.text(`-${currencySymbol}${formatValue(discountAmt)}`, valX, totY, { align: "right" });
    }

    if (data.taxPercent > 0) {
      totY += 5;
      doc.setTextColor(75, 85, 99); // text-gray-600
      doc.text(`Tax (${data.taxPercent}%)`, totalsX, totY);
      doc.text(`+${currencySymbol}${formatValue(taxAmt)}`, valX, totY, { align: "right" });
    }

    if (data.shippingCharge > 0) {
      totY += 5;
      doc.setTextColor(75, 85, 99); // text-gray-600
      doc.text("Shipping", totalsX, totY);
      doc.text(`+${currencySymbol}${formatValue(data.shippingCharge)}`, valX, totY, { align: "right" });
    }

    // Grand Total line - draw filled capsule behind Grand Total
    totY += 3;
    
    // Top border-line of Grand Total (borderColor: primaryColor, weight: 0.4)
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
    doc.setLineWidth(0.4);
    doc.line(totalsX, totY - 1.2, valX, totY - 1.2);
    
    totY += 5.5;

    // Calculate 10% tint for background capsule
    const tintR = Math.round(rgb[0] + (255 - rgb[0]) * 0.9);
    const tintG = Math.round(rgb[1] + (255 - rgb[1]) * 0.9);
    const tintB = Math.round(rgb[2] + (255 - rgb[2]) * 0.9);
    
    doc.setFillColor(tintR, tintG, tintB);
    doc.rect(totalsX, totY - 4.5, valX - totalsX, 6.5, "F");

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text(hasExtras ? "Grand Total" : "Total", totalsX + 2, totY);
    doc.text(`${currencySymbol}${formatValue(hasExtras ? grandTotal : subtotal)}`, valX - 2, totY, { align: "right" });

    finalY = totY + 5;
  }

  let contentY = finalY + 5;

  // 8. Terms
  if (data.terms) {
    const splitTerms = doc.splitTextToSize(data.terms, 170);
    const termsHeight = 6 + splitTerms.length * 4;

    // Check if drawing terms overflows the bottom margin
    if (contentY + termsHeight > 255) {
      doc.addPage();
      contentY = 25; // Reset top margin for terms
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text("Commercial Terms:", 15, contentY);
    doc.setTextColor(55, 65, 81); // text-gray-700
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(splitTerms, 15, contentY + 6);
    contentY += termsHeight;
  }

  // 9. Footer Logo Fallback & Logo aspect ratio scale
  let footerLogoH = 8;
  let footerLogoW = 18;
  let hasFooterLogo = false;

  if (data.branding.logo) {
    try {
      const dimensions = await getImageDimensions(data.branding.logo);
      if (dimensions.width > 0 && dimensions.height > 0) {
        const aspectRatio = dimensions.width / dimensions.height;
        footerLogoH = 8; // Match h-8 (approx 8mm height)
        footerLogoW = 8 * aspectRatio;
        if (footerLogoW > 40) {
          footerLogoW = 40;
          footerLogoH = 40 / aspectRatio;
        }
        hasFooterLogo = true;
      }
    } catch (e) {
      console.error("Footer logo dimensions failed", e);
    }
  }

  const footerLogoHeight = hasFooterLogo ? footerLogoH + 6 : 12;
  if (contentY + footerLogoHeight > 260) {
    doc.addPage();
    contentY = 25; // Reset top margin for footer brand
  }

  if (hasFooterLogo && data.branding.logo) {
    try {
      doc.addImage(data.branding.logo, "PNG", 15, contentY + 5, footerLogoW, footerLogoH, undefined, "FAST");
    } catch (e) { /* ignore */ }
  } else if (data.company.name) {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(156, 163, 175); // text-gray-400
    doc.text(data.company.name, 15, contentY + 11);
  }

  // 10. Page Footer (uses primary color accent)
  const pageCount = (doc as any).internal.getNumberOfPages(); // eslint-disable-line @typescript-eslint/no-explicit-any
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Accent line with 30% primary color opacity/tint
    const lineR = Math.round(rgb[0] + (255 - rgb[0]) * 0.7);
    const lineG = Math.round(rgb[1] + (255 - rgb[1]) * 0.7);
    const lineB = Math.round(rgb[2] + (255 - rgb[2]) * 0.7);
    doc.setDrawColor(lineR, lineG, lineB);
    doc.setLineWidth(0.4);
    doc.line(15, 281, 195, 281);
    
    // Footer Details
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128); // text-gray-500
    
    if (data.company.address) {
      doc.text(data.company.address.toUpperCase(), 15, 285);
    }
    const contactParts = [data.company.email, data.company.phone].filter(Boolean);
    if (contactParts.length > 0) {
      doc.text(contactParts.join(" | ").toUpperCase(), 15, 289);
    }
    const website = data.company.website || (data.company.email ? `www.${data.company.email.split("@")[1] || "example.com"}` : "");
    if (website) {
      doc.text(`WEBSITE: ${website.toUpperCase()}`, 195, 285, { align: "right" });
    }
    doc.text(`PAGE ${i} OF ${pageCount}`, 195, 289, { align: "right" });
  }

  const filename = `${data.documentInfo.number || "RFQ"}_${data.documentInfo.date || "doc"}.pdf`;
  doc.save(filename);
};
