import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { QuotationState, CURRENCY_SYMBOLS, LineItem } from "@/types/quotation.types";
import { toNumber, calculateRowTotal, calculateSubtotal, calculateDiscountAmount, calculateTaxAmount, calculateGrandTotal } from "@/utils/calculations";

const getImageDimensions = (base64: string): Promise<{ width: number; height: number; img: HTMLImageElement | null }> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ width: 0, height: 0, img: null });
      return;
    }
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height, img });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0, img: null });
    };
    img.src = base64;
  });
};

export const generateProfessionalPDF = async (data: QuotationState) => {
  const isLandscape = data.pdfOrientation === "landscape";
  const doc = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const rightX = pageWidth - margin;
  const printableWidth = pageWidth - (margin * 2);

  const primaryColor = data.branding.primaryColor || "#1e3a8a"; // Marine navy by default
  const currencySymbol = CURRENCY_SYMBOLS[data.currency] || "$";

  // Convert hex to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [30, 58, 138];
  };

  const rgb = hexToRgb(primaryColor);

  const formatValue = (num: number): string => {
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
  };

  // Helper to determine document title
  const getTitle = () => {
    switch (data.documentInfo.type) {
      case "rfq": return "REQUEST FOR QUOTATION";
      case "proforma": return "PROFORMA INVOICE";
      default: return "QUOTATION";
    }
  };

  // =========================================================================
  // 1. TOP HEADER: SUPPLIER BRANDING (LEFT) & QUOTE METADATA (RIGHT)
  // =========================================================================
  const headerStartY = 13;
  let logoH = 0;
  let logoW = 0;
  let hasLogo = false;

  if (data.branding.logo) {
    try {
      const dimensions = await getImageDimensions(data.branding.logo);
      if (dimensions.width > 0 && dimensions.height > 0) {
        const aspectRatio = dimensions.width / dimensions.height;
        const maxW = 42;
        const maxH = 15;
        logoW = maxW;
        logoH = maxW / aspectRatio;
        if (logoH > maxH) {
          logoH = maxH;
          logoW = maxH * aspectRatio;
        }

        let imgFormat = "PNG";
        if (data.branding.logo.startsWith("data:image/")) {
          const match = data.branding.logo.match(/^data:image\/([a-zA-Z0-9]+);/);
          if (match && match[1]) {
            const fmt = match[1].toUpperCase();
            if (fmt === "PNG" || fmt === "JPEG" || fmt === "WEBP") imgFormat = fmt;
          }
        }
        doc.addImage(data.branding.logo, imgFormat, margin, headerStartY, logoW, logoH);
        hasLogo = true;
      }
    } catch (_e) {
      // ignore logo failure gracefully
    }
  }

  // Supplier Company Name & Details
  const companyX = hasLogo ? margin + logoW + 5 : margin;
  let companyY = headerStartY + 3.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text((data.company.name || "OUR COMPANY").toUpperCase(), companyX, companyY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500

  if (data.company.address) {
    companyY += 4.5;
    const splitAddr = doc.splitTextToSize(data.company.address, 95);
    doc.text(splitAddr[0] || "", companyX, companyY);
  }

  const contactLine = [
    data.company.phone ? `Tel: ${data.company.phone}` : "",
    data.company.email ? `Email: ${data.company.email}` : "",
    data.company.website ? data.company.website.toLowerCase() : "",
  ].filter(Boolean).join("  •  ");

  if (contactLine) {
    companyY += 4;
    doc.text(contactLine, companyX, companyY);
  }

  // Right Side: Document Meta Box
  let metaY = headerStartY + 3;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text(getTitle(), rightX, metaY, { align: "right" });

  metaY += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(`NO: ${data.documentInfo.number || "QT-DRAFT"}`, rightX, metaY, { align: "right" });

  metaY += 4.2;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${data.documentInfo.date || new Date().toISOString().split("T")[0]}`, rightX, metaY, { align: "right" });

  if (data.documentInfo.validUntil) {
    metaY += 3.8;
    doc.text(`Valid Until: ${data.documentInfo.validUntil}`, rightX, metaY, { align: "right" });
  }

  let currentY = Math.max(headerStartY + logoH, companyY, metaY) + 5;

  // Header Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.35);
  doc.line(margin, currentY, rightX, currentY);
  currentY += 5;

  // =========================================================================
  // 2. VESSEL & REFERENCE BANNER (CRITICAL FOR MARINE TRADING)
  // =========================================================================
  const hasVesselInfo = Boolean(
    data.documentInfo.vessel || 
    data.documentInfo.reference || 
    data.documentInfo.make || 
    data.documentInfo.model
  );

  if (hasVesselInfo) {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(margin, currentY, printableWidth, 8.5, 1.5, 1.5, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, printableWidth, 8.5, 1.5, 1.5, "D");

    let vX = margin + 4;
    const vY = currentY + 5.5;

    if (data.documentInfo.vessel) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text("VESSEL:", vX, vY);
      vX += doc.getTextWidth("VESSEL:") + 2;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(data.documentInfo.vessel.toUpperCase(), vX, vY);
      vX += doc.getTextWidth(data.documentInfo.vessel.toUpperCase()) + 8;
    }

    if (data.documentInfo.reference) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text("REF / REQ NO:", vX, vY);
      vX += doc.getTextWidth("REF / REQ NO:") + 2;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(data.documentInfo.reference, vX, vY);
      vX += doc.getTextWidth(data.documentInfo.reference) + 8;
    }

    if (data.documentInfo.make || data.documentInfo.model) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text("EQUIPMENT:", vX, vY);
      vX += doc.getTextWidth("EQUIPMENT:") + 2;

      const equip = [data.documentInfo.make, data.documentInfo.model].filter(Boolean).join(" / ");
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      doc.text(equip, vX, vY);
    }

    currentY += 12;
  }

  // =========================================================================
  // 3. BUYER (CUSTOMER) DETAILS & INTRO
  // =========================================================================
  if (data.showCustomerDetails !== false && (data.client.name || data.client.companyName)) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text("QUOTATION FOR (BUYER):", margin, currentY);

    currentY += 4.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    const buyerName = (data.client.companyName || data.client.name).toUpperCase();
    doc.text(buyerName, margin, currentY);

    currentY += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // slate-600

    const clientLines: string[] = [];
    if (data.client.attn) clientLines.push(`Attn: ${data.client.attn}`);
    if (data.client.address) clientLines.push(data.client.address);
    if (data.client.phone) clientLines.push(`Tel: ${data.client.phone}`);
    if (data.client.email) clientLines.push(`Email: ${data.client.email}`);

    if (clientLines.length > 0) {
      const clientStr = clientLines.join("  |  ");
      const splitClient = doc.splitTextToSize(clientStr, printableWidth);
      doc.text(splitClient, margin, currentY);
      currentY += (splitClient.length * 3.8);
    }
    currentY += 2;
  }

  // Introductory Note
  const defaultIntro = data.documentInfo.type === "rfq"
    ? "Please quote your best price and delivery time for the following items:"
    : "We are pleased to submit our formal commercial quotation for the items detailed below:";
  const intro = data.introText || defaultIntro;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(intro, margin, currentY);
  currentY += 5;

  // =========================================================================
  // 4. INTELLIGENT QUOTATION TABLE (SEPARATION OF EDITOR VS PDF LAYOUT)
  // =========================================================================
  // Key marine strategy: Do NOT cram 10 raw editor columns horizontally!
  // Instead, use 5-6 clean columns with secondary details rendered cleanly underneath.
  const hasPartNumber = data.items.some(i => i.partNumber && i.partNumber.trim().length > 0);
  const isCleanMode = data.pdfLayoutMode !== "detailed";

  // Build the secondary sub-text for each item (Technical specification, brand, remarks)
  const formatItemDescription = (item: LineItem): string => {
    const lines: string[] = [];
    const mainTitle = (item.itemName || "Unnamed Item").trim().toUpperCase();
    lines.push(mainTitle);

    const subDetails: string[] = [];
    // If clean mode doesn't have a separate Part No column, include it in subDetails
    if (!hasPartNumber && item.partNumber) {
      subDetails.push(`Part No: ${item.partNumber}`);
    }
    if (item.condition) {
      subDetails.push(`Condition: ${item.condition}`);
    }

    // Add any custom fields or dynamic attributes
    const standardKeys = new Set(["id", "itemName", "partNumber", "quantity", "unit", "condition", "unitPrice", "total", "needsReview", "isMissingQty", "description"]);
    for (const [key, val] of Object.entries(item)) {
      if (!standardKeys.has(key) && val !== undefined && val !== null && String(val).trim()) {
        const colDef = data.tableColumns.find(c => c.key === key);
        const label = colDef?.label || key;
        subDetails.push(`${label}: ${val}`);
      }
    }

    if (subDetails.length > 0) {
      lines.push(subDetails.join("   •   "));
    }

    if (item.description && item.description.trim()) {
      lines.push(`Spec: ${item.description.trim()}`);
    }

    return lines.join("\n");
  };

  // Define Columns and Widths
  interface PdfColConfig {
    header: string;
    width: number;
    halign: "left" | "center" | "right";
  }

  const columnsConfig: PdfColConfig[] = [];
  
  if (isCleanMode) {
    // Standard Professional Marine 5-6 column layout
    columnsConfig.push({ header: "#", width: isLandscape ? 12 : 10, halign: "center" });
    
    if (hasPartNumber) {
      const descWidth = isLandscape ? 140 : 86;
      columnsConfig.push({ header: "Item Description & Technical Specifications", width: descWidth, halign: "left" });
      columnsConfig.push({ header: "Part Number", width: isLandscape ? 35 : 28, halign: "center" });
    } else {
      const descWidth = isLandscape ? 175 : 114;
      columnsConfig.push({ header: "Item Description & Technical Specifications", width: descWidth, halign: "left" });
    }

    columnsConfig.push({ header: "Qty", width: isLandscape ? 22 : 16, halign: "center" });
    columnsConfig.push({ header: `Rate (${currencySymbol})`, width: isLandscape ? 28 : 22, halign: "right" });
    columnsConfig.push({ header: `Amount (${currencySymbol})`, width: isLandscape ? 30 : 24, halign: "right" });
  } else {
    // Detailed layout: use visible columns with normalized width proportions
    const visibleCols = data.tableColumns.filter(c => c.visible);
    const totalAssignedPx = visibleCols.reduce((acc, c) => acc + (parseInt(c.width || "80", 10) || 80), 0);
    
    for (const c of visibleCols) {
      const px = parseInt(c.width || "80", 10) || 80;
      const colWidth = Math.max(12, Math.round((px / totalAssignedPx) * printableWidth));
      let halign: "left" | "center" | "right" = "left";
      if (c.role === "qty" || c.key === "sno" || c.key === "unit") halign = "center";
      if (c.role === "price" || c.role === "total") halign = "right";
      columnsConfig.push({ header: c.label, width: colWidth, halign });
    }
  }

  // Build Table Rows
  let hasMissingPrices = false;
  const tableRows = data.items.map((item, index) => {
    const qtyVal = toNumber(item.quantity) || 1;
    const unitStr = (item.unit || "PCS").toUpperCase();
    const priceVal = toNumber(item.unitPrice);
    const isPriceMissing = !priceVal || priceVal <= 0;

    if (isPriceMissing) {
      hasMissingPrices = true;
    }

    const priceText = isPriceMissing ? "TBA" : formatValue(priceVal);
    const rowTotalText = isPriceMissing ? "-" : formatValue(calculateRowTotal(item, data.tableColumns));

    if (isCleanMode) {
      const row = [
        (index + 1).toString(),
        formatItemDescription(item),
      ];

      if (hasPartNumber) {
        row.push(item.partNumber || "-");
      }

      row.push(`${qtyVal} ${unitStr}`);
      row.push(priceText);
      row.push(rowTotalText);
      return row;
    } else {
      // Detailed mode row mapping
      return data.tableColumns.filter(c => c.visible).map(c => {
        if (c.key === "sno") return (index + 1).toString();
        if (c.role === "qty") return `${qtyVal} ${unitStr}`;
        if (c.role === "price") return priceText;
        if (c.role === "total") return rowTotalText;
        if (c.key === "itemName") return (item.itemName || "-").toUpperCase();
        const val = item[c.key];
        return val !== undefined && val !== null ? String(val) : "-";
      });
    }
  });

  // Render Table with autoTable
  autoTable(doc, {
    startY: currentY,
    head: [columnsConfig.map(c => c.header)],
    body: tableRows,
    theme: "grid",
    showHead: "everyPage", // REPEAT TABLE HEADERS ON EVERY SUBSEQUENT PAGE!
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.15,
      textColor: [30, 41, 59], // slate-800
      valign: "top",
      overflow: "linebreak", // PREVENTS LETTER BREAKS (NO "CYLINDE R")!
    },
    headStyles: {
      fillColor: rgb,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2.5,
      halign: "center",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: columnsConfig.reduce((acc, col, idx) => {
      acc[idx] = { cellWidth: col.width, halign: col.halign };
      return acc;
    }, {} as Record<number, { cellWidth: number; halign: "left" | "center" | "right" }>),
    margin: { left: margin, right: margin, bottom: 20 },
    pageBreak: "auto",
    rowPageBreak: "avoid", // PREVENTS ROWS FROM SPLITTING AWKWARDLY
  });

  // Calculate final Y after table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable.finalY + 5;

  // =========================================================================
  // 5. TOTALS SECTION
  // =========================================================================
  const subtotal = calculateSubtotal(data.items, data.tableColumns);
  const discountAmt = calculateDiscountAmount(subtotal, data.discount, data.discountType);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = calculateTaxAmount(afterDiscount, data.taxPercent);
  const grandTotal = calculateGrandTotal(subtotal, data.discount, data.discountType, data.taxPercent, data.shippingCharge);

  const totalsBoxWidth = 75;
  const totalsLeft = rightX - totalsBoxWidth;

  // Check if totals block fits on the current page
  if (finalY + 45 > pageHeight - 20) {
    doc.addPage();
    finalY = margin + 5;
  }

  let totY = finalY;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Subtotal:", totalsLeft, totY);
  doc.text(`${currencySymbol} ${formatValue(subtotal)}`, rightX, totY, { align: "right" });

  if (data.discount > 0) {
    totY += 4.5;
    doc.setTextColor(220, 38, 38);
    const discLabel = data.discountType === "percent" ? `Discount (${data.discount}%):` : "Discount:";
    doc.text(discLabel, totalsLeft, totY);
    doc.text(`-${currencySymbol} ${formatValue(discountAmt)}`, rightX, totY, { align: "right" });
  }

  if (data.taxPercent > 0) {
    totY += 4.5;
    doc.setTextColor(71, 85, 105);
    doc.text(`Tax / VAT (${data.taxPercent}%):`, totalsLeft, totY);
    doc.text(`+${currencySymbol} ${formatValue(taxAmt)}`, rightX, totY, { align: "right" });
  }

  if (data.shippingCharge > 0) {
    totY += 4.5;
    doc.setTextColor(71, 85, 105);
    doc.text("Freight / Shipping:", totalsLeft, totY);
    doc.text(`+${currencySymbol} ${formatValue(data.shippingCharge)}`, rightX, totY, { align: "right" });
  }

  // Grand Total Highlight Capsule
  totY += 3.5;
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  doc.roundedRect(totalsLeft - 2, totY, totalsBoxWidth + 2, 7.5, 1.2, 1.2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("GRAND TOTAL:", totalsLeft + 2, totY + 5.2);
  doc.text(`${currencySymbol} ${formatValue(grandTotal)}`, rightX - 2, totY + 5.2, { align: "right" });

  if (hasMissingPrices) {
    totY += 12;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("* Note: Items marked TBA are pending rate confirmation and excluded from grand total.", totalsLeft - 20, totY);
  }

  finalY = totY + 10;

  // =========================================================================
  // 6. COMMERCIAL TERMS & AUTHORIZED SIGNATURE SECTION
  // =========================================================================
  const closingBlockHeight = 42;
  if (finalY + closingBlockHeight > pageHeight - 20) {
    doc.addPage();
    finalY = margin + 5;
  }

  const termsWidth = printableWidth * 0.58;
  const signWidth = printableWidth * 0.38;
  const signLeft = rightX - signWidth;

  // Commercial Terms (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text("COMMERCIAL TERMS & CONDITIONS:", margin, finalY);

  let termLineY = finalY + 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const defaultTermsList = [
    `• Delivery Terms: As agreed / CIF / FOB`,
    `• Payment Terms: As agreed / 30 Days from invoice date`,
    `• Quotation Validity: 30 days from date of issue`,
    `• Warranty: Standard manufacturer warranty against manufacturing defects`,
  ];

  const termsToRender = data.terms ? data.terms.split("\n").filter(Boolean) : defaultTermsList;
  for (const line of termsToRender.slice(0, 5)) {
    const split = doc.splitTextToSize(line, termsWidth);
    doc.text(split, margin, termLineY);
    termLineY += (split.length * 3.6);
  }

  // Signature Block (Right)
  if (data.pdfShowSignatureBlock !== false) {
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.roundedRect(signLeft, finalY - 1, signWidth, 32, 2, 2, "D");
    doc.setLineDashPattern([], 0); // reset dash

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`For ${(data.company.name || "OUR COMPANY").toUpperCase()}`, signLeft + 4, finalY + 4);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("(Authorized Signature & Stamp)", signLeft + (signWidth / 2), finalY + 28, { align: "center" });
  }

  // =========================================================================
  // 7. RUNNING FOOTER & PAGE NUMBERING (PAGE X OF Y ON EVERY PAGE)
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Bottom border rule
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 10, rightX, pageHeight - 10);

    // Left: Supplier Name & Document Number
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${(data.company.name || "QuoteCraft").toUpperCase()}  •  ${data.documentInfo.number || "QUOTATION"}`,
      margin,
      pageHeight - 6.5
    );

    // Right: Page X of Y
    doc.text(
      `Page ${i} of ${totalPages}`,
      rightX,
      pageHeight - 6.5,
      { align: "right" }
    );
  }

  // Save the professional PDF document
  const fileName = `${data.documentInfo.number || "Quotation"}_${data.documentInfo.date || "Quote"}.pdf`;
  doc.save(fileName);
};
