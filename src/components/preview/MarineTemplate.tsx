"use client";

import { QuotationState, CURRENCY_SYMBOLS, LineItem } from "@/types/quotation.types";
import { toNumber, calculateRowTotal, calculateSubtotal, calculateDiscountAmount, calculateTaxAmount, calculateGrandTotal } from "@/utils/calculations";

interface TemplateProps {
  data: QuotationState;
}

export function MarineTemplate({ data }: TemplateProps) {
  const { branding, documentInfo, company, client, items, terms, introText } = data;
  const isLandscape = data.pdfOrientation === "landscape";
  const isCleanMode = data.pdfLayoutMode !== "detailed";
  const primaryColor = branding.primaryColor || "#1e3a8a";
  const currencySymbol = CURRENCY_SYMBOLS[data.currency] || "$";

  const subtotal = calculateSubtotal(items, data.tableColumns);
  const discountAmt = calculateDiscountAmount(subtotal, data.discount, data.discountType);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = calculateTaxAmount(afterDiscount, data.taxPercent);
  const grandTotal = calculateGrandTotal(subtotal, data.discount, data.discountType, data.taxPercent, data.shippingCharge);

  const formatValue = (num: number): string => {
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
  };

  const getTitle = () => {
    switch (documentInfo.type) {
      case "rfq": return "REQUEST FOR QUOTATION";
      case "proforma": return "PROFORMA INVOICE";
      default: return "QUOTATION";
    }
  };

  const defaultIntro = documentInfo.type === "rfq"
    ? "Please quote your best price and delivery time for the following items:"
    : "We are pleased to submit our formal commercial quotation for the items detailed below:";
  const intro = introText || defaultIntro;

  const hasPartNumber = items.some(i => i.partNumber && i.partNumber.trim().length > 0);

  // Sub-detail formatter (Technical specs, brand, custom fields underneath item name)
  const renderItemSubDetails = (item: LineItem) => {
    const details: string[] = [];
    if (!hasPartNumber && item.partNumber) {
      details.push(`Part No: ${item.partNumber}`);
    }
    if (item.condition) {
      details.push(`Condition: ${item.condition}`);
    }

    const standardKeys = new Set(["id", "itemName", "partNumber", "quantity", "unit", "condition", "unitPrice", "total", "needsReview", "isMissingQty", "description"]);
    for (const [key, val] of Object.entries(item)) {
      if (!standardKeys.has(key) && val !== undefined && val !== null && String(val).trim()) {
        const colDef = data.tableColumns.find(c => c.key === key);
        const label = colDef?.label || key;
        details.push(`${label}: ${val}`);
      }
    }

    return (
      <div className="space-y-0.5 mt-0.5">
        {details.length > 0 && (
          <p className="text-[10px] text-slate-500 font-medium tracking-normal normal-case">
            {details.join("  •  ")}
          </p>
        )}
        {item.description && item.description.trim() && (
          <p className="text-[10px] text-slate-600 font-normal italic tracking-normal normal-case">
            Spec: {item.description.trim()}
          </p>
        )}
      </div>
    );
  };

  const hasMissingPrices = items.some(i => !toNumber(i.unitPrice) || toNumber(i.unitPrice) <= 0);

  return (
    <div
      className={`bg-white p-8 md:p-12 mx-auto min-h-[1123px] flex flex-col border border-slate-200/90 shadow-sm transition-all duration-200 ${
        isLandscape ? "w-[1123px]" : "w-[794px]"
      }`}
      style={{
        fontFamily: branding.font || "Inter, system-ui, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* 1. HEADER: SUPPLIER BRANDING (LEFT) & QUOTE METADATA (RIGHT) */}
      <div className="flex justify-between items-start pb-4 border-b border-slate-200/90 gap-6">
        {/* Left: Supplier Logo & Name */}
        <div className="flex items-start gap-3.5 max-w-[60%]">
          {branding.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logo} alt="Logo" className="max-h-14 max-w-[120px] object-contain shrink-0" />
          )}
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight" style={{ color: primaryColor }}>
              {company.name || "OUR COMPANY"}
            </h1>
            {company.address && (
              <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5 max-w-sm">
                {company.address}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-slate-400 font-medium mt-1">
              {company.phone && <span>Tel: {company.phone}</span>}
              {company.email && <span>Email: {company.email}</span>}
              {company.website && <span>{company.website.toLowerCase()}</span>}
            </div>
          </div>
        </div>

        {/* Right: Document Details Badge */}
        <div className="text-right shrink-0">
          <h2 className="text-base font-black uppercase tracking-wider mb-0.5" style={{ color: primaryColor }}>
            {getTitle()}
          </h2>
          <p className="text-xs font-mono font-bold text-slate-800">
            NO: {documentInfo.number || "QT-DRAFT"}
          </p>
          <div className="mt-1 text-[11px] text-slate-600 space-y-0.5">
            <p><span className="font-semibold text-slate-400">DATE:</span> {documentInfo.date}</p>
            {documentInfo.validUntil && (
              <p><span className="font-semibold text-slate-400">VALID UNTIL:</span> {documentInfo.validUntil}</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. VESSEL & REFERENCE BANNER */}
      {(documentInfo.vessel || documentInfo.reference || documentInfo.make || documentInfo.model) && (
        <div className="my-3.5 p-2.5 px-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
          {documentInfo.vessel && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[10px] tracking-wide uppercase" style={{ color: primaryColor }}>VESSEL:</span>
              <span className="font-black text-slate-900 uppercase">{documentInfo.vessel}</span>
            </div>
          )}
          {documentInfo.reference && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[10px] tracking-wide uppercase" style={{ color: primaryColor }}>REF / REQ:</span>
              <span className="font-medium text-slate-800">{documentInfo.reference}</span>
            </div>
          )}
          {(documentInfo.make || documentInfo.model) && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[10px] tracking-wide uppercase" style={{ color: primaryColor }}>EQUIPMENT:</span>
              <span className="font-medium text-slate-800">
                {[documentInfo.make, documentInfo.model].filter(Boolean).join(" / ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. BUYER (CUSTOMER) DETAILS */}
      {data.showCustomerDetails !== false && (client.name || client.companyName) && (
        <div className="mt-2 mb-3 text-xs">
          <p className="font-bold uppercase text-[9.5px] tracking-wider mb-0.5" style={{ color: primaryColor }}>
            QUOTATION FOR (BUYER):
          </p>
          <p className="font-black text-sm uppercase text-slate-900 leading-tight">
            {client.companyName || client.name}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-600 mt-0.5">
            {client.attn && <span>Attn: <strong className="text-slate-800">{client.attn}</strong></span>}
            {client.address && <span>{client.address}</span>}
            {client.phone && <span>Tel: {client.phone}</span>}
            {client.email && <span>Email: {client.email}</span>}
          </div>
        </div>
      )}

      {/* Intro Note */}
      <p className="text-[11px] text-slate-500 mb-2.5 font-medium">
        {intro}
      </p>

      {/* 4. MAIN LINE-ITEM QUOTATION TABLE */}
      <div className="overflow-hidden rounded-md border border-slate-200/90 mb-5">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr style={{ backgroundColor: primaryColor }} className="text-white text-[10px] uppercase font-bold tracking-wider">
              <th className="py-2 px-2 text-center w-10">#</th>
              <th className="py-2 px-3">Item Description & Specifications</th>
              {hasPartNumber && <th className="py-2 px-3 text-center w-32">Part Number</th>}
              <th className="py-2 px-3 text-center w-20">Qty</th>
              <th className="py-2 px-3 text-right w-24">Rate ({currencySymbol})</th>
              <th className="py-2 px-3 text-right w-28">Amount ({currencySymbol})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const qtyVal = toNumber(item.quantity) || 1;
              const unitStr = (item.unit || "PCS").toUpperCase();
              const priceVal = toNumber(item.unitPrice);
              const isMissingPrice = !priceVal || priceVal <= 0;

              return (
                <tr key={item.id} className={index % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-400 font-semibold align-top text-[11px]">
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <p className="font-bold text-slate-900 tracking-tight leading-snug">
                      {(item.itemName || "Unnamed Item").toUpperCase()}
                    </p>
                    {isCleanMode && renderItemSubDetails(item)}
                  </td>
                  {hasPartNumber && (
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 align-top text-[11px]">
                      {item.partNumber ? (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/70 font-semibold">
                          {item.partNumber}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-800 align-top text-[11px]">
                    {qtyVal} <span className="text-[10px] text-slate-500 uppercase">{unitStr}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold align-top text-[11px]">
                    {isMissingPrice ? (
                      <span className="text-slate-400 italic font-normal">TBA</span>
                    ) : (
                      formatValue(priceVal)
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 align-top text-[11px]">
                    {isMissingPrice ? (
                      <span className="text-slate-300 font-normal">-</span>
                    ) : (
                      formatValue(calculateRowTotal(item, data.tableColumns))
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. TOTALS SECTION */}
      <div className="flex justify-end mb-6">
        <div className="w-72 space-y-1.5 text-xs">
          <div className="flex justify-between py-0.5 text-slate-600 font-medium">
            <span>Subtotal:</span>
            <span className="font-mono font-bold text-slate-800">{currencySymbol} {formatValue(subtotal)}</span>
          </div>

          {data.discount > 0 && (
            <div className="flex justify-between py-0.5 text-red-600 font-medium">
              <span>Discount ({data.discountType === "percent" ? `${data.discount}%` : "Flat"}):</span>
              <span className="font-mono font-bold">-{currencySymbol} {formatValue(discountAmt)}</span>
            </div>
          )}

          {data.taxPercent > 0 && (
            <div className="flex justify-between py-0.5 text-slate-600 font-medium">
              <span>Tax / VAT ({data.taxPercent}%):</span>
              <span className="font-mono font-bold text-slate-800">+{currencySymbol} {formatValue(taxAmt)}</span>
            </div>
          )}

          {data.shippingCharge > 0 && (
            <div className="flex justify-between py-0.5 text-slate-600 font-medium">
              <span>Freight / Shipping:</span>
              <span className="font-mono font-bold text-slate-800">+{currencySymbol} {formatValue(data.shippingCharge)}</span>
            </div>
          )}

          <div
            className="flex justify-between items-center px-3 py-2 rounded-md text-white font-bold text-sm tracking-tight mt-1"
            style={{ backgroundColor: primaryColor }}
          >
            <span>GRAND TOTAL:</span>
            <span className="font-mono text-base font-black">{currencySymbol} {formatValue(grandTotal)}</span>
          </div>

          {hasMissingPrices && (
            <p className="text-[10px] text-slate-400 italic text-right mt-1">
              * Items marked TBA are pending final confirmation and excluded from total.
            </p>
          )}
        </div>
      </div>

      {/* 6. COMMERCIAL TERMS & SIGNATURE BLOCK */}
      <div className="mt-auto pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-start gap-6">
        {/* Left: Terms */}
        <div className="flex-1 space-y-1 text-xs">
          <h4 className="font-bold uppercase text-[10px] tracking-wider" style={{ color: primaryColor }}>
            COMMERCIAL TERMS & CONDITIONS:
          </h4>
          <div className="text-[11px] text-slate-600 space-y-1 font-medium leading-relaxed">
            {terms ? (
              terms.split("\n").filter(Boolean).map((t, idx) => (
                <p key={idx}>• {t}</p>
              ))
            ) : (
              <>
                <p>• Delivery Terms: As agreed / CIF / FOB</p>
                <p>• Payment Terms: As agreed / 30 Days from invoice</p>
                <p>• Quotation Validity: 30 days from date of issue</p>
                <p>• Warranty: Standard manufacturer warranty against defects</p>
              </>
            )}
          </div>
        </div>

        {/* Right: Signature & Stamp Box */}
        {data.pdfShowSignatureBlock !== false && (
          <div className="w-56 shrink-0 border-2 border-dashed border-slate-300 rounded-lg p-3 text-center space-y-6 bg-slate-50/50">
            <p className="text-[10.5px] font-bold text-slate-800 uppercase tracking-tight">
              For {company.name || "OUR COMPANY"}
            </p>
            <p className="text-[9.5px] font-semibold text-slate-400 italic">
              (Authorized Signature & Stamp)
            </p>
          </div>
        )}
      </div>

      {/* 7. RUNNING FOOTER */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 font-medium">
        <span>{(company.name || "QuoteCraft").toUpperCase()} • {documentInfo.number || "QUOTATION"}</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
}
