"use client";

import { QuotationState, CURRENCY_SYMBOLS } from "@/types/quotation.types";
import { calculateRowTotal, calculateSubtotal, calculateDiscountAmount, calculateTaxAmount, calculateGrandTotal } from "@/utils/calculations";

interface TemplateProps {
  data: QuotationState;
}

export function MarineTemplate({ data }: TemplateProps) {
  const { branding, documentInfo, company, client, items, terms, introText } = data;
  const visibleColumns = data.tableColumns.filter(c => c.visible);
  const primaryColor = branding.primaryColor || "#2563eb";
  const currencySymbol = CURRENCY_SYMBOLS[data.currency] || "$";

  const subtotal = calculateSubtotal(items);
  const discountAmt = calculateDiscountAmount(subtotal, data.discount, data.discountType);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = calculateTaxAmount(afterDiscount, data.taxPercent);
  const grandTotal = calculateGrandTotal(subtotal, data.discount, data.discountType, data.taxPercent, data.shippingCharge);

  const hasExtras = (data.discount > 0) || (data.taxPercent > 0) || (data.shippingCharge > 0);

  const formatValue = (num: number): string => {
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
  };

  const getCellValue = (item: typeof items[0], col: typeof visibleColumns[0], index: number): string => {
    if (col.key === "sno") return (index + 1).toString();
    if (col.key === "total") return `${currencySymbol}${formatValue(calculateRowTotal(item))}`;
    if (col.key === "unitPrice") return `${currencySymbol}${formatValue(item.unitPrice || 0)}`;
    const val = item[col.key];
    if (val === undefined || val === null) return "-";
    if (col.key === "unit") return String(val).toUpperCase();
    if (typeof val === "number") return col.type === "number" ? formatValue(val) : val.toString();
    return String(val) || "-";
  };

  // Title based on doc type
  const getTitle = () => {
    switch (documentInfo.type) {
      case "rfq": return "Request for Quotation";
      case "proforma": return "Proforma Invoice";
      default: return "Quotation";
    }
  };

  // Default intro text based on doc type
  const getDefaultIntro = () => {
    switch (documentInfo.type) {
      case "rfq": return "We hereby invite you to submit your best quotation for the items listed below.";
      case "proforma": return "We are pleased to submit our proforma invoice for the items listed below.";
      default: return "We are pleased to submit our best quotation for the items listed below.";
    }
  };

  return (
    <div
      className="bg-white p-[50px] mx-auto min-h-[1123px] w-[794px] flex flex-col border border-gray-100 shadow-sm"
      style={{ 
        fontFamily: branding.font,
        boxSizing: "border-box"
      }}
    >
      {/* Header - Logo/Name on Left, Doc Details on Right */}
      <div className="flex justify-between items-start mb-6 border-b pb-4">
        {/* Top-Left: Logo & Company Name Side-by-Side */}
        <div className="flex items-center gap-3">
          {branding.logo && (
            <img src={branding.logo} alt="Logo" className="max-h-14 object-contain" />
          )}
          {company.name && (
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight" style={{ color: primaryColor }}>
                {company.name}
              </h1>
              {company.website && (
                <p className="text-[9px] text-gray-400 font-semibold tracking-wider">{company.website.toLowerCase()}</p>
              )}
            </div>
          )}
        </div>

        {/* Top-Right: Document details */}
        <div className="text-right">
          <h2 className="text-base font-extrabold uppercase tracking-widest mb-0.5" style={{ color: primaryColor }}>
            {getTitle()}
          </h2>
          <p className="text-xs font-mono font-bold text-gray-700">{documentInfo.number}</p>
          <div className="mt-1.5 text-[11px] text-gray-600 space-y-0.5">
            <p><span className="font-semibold text-gray-500">DATE:</span> {documentInfo.date}</p>
            {documentInfo.validUntil && (
              <p><span className="font-semibold text-gray-500">VALID UNTIL:</span> {documentInfo.validUntil}</p>
            )}
          </div>
        </div>
      </div>

      {/* Vessel & Reference row */}
      {(documentInfo.vessel || documentInfo.reference) && (
        <div className="flex gap-6 mb-4 text-xs">
          {documentInfo.vessel && (
            <div>
              <span className="font-bold uppercase text-[10px] tracking-wider" style={{ color: primaryColor }}>Vessel: </span>
              <span className="font-bold">{documentInfo.vessel}</span>
            </div>
          )}
          {documentInfo.reference && (
            <div>
              <span className="font-bold uppercase text-[10px] tracking-wider" style={{ color: primaryColor }}>Ref: </span>
              <span className="font-bold">{documentInfo.reference}</span>
            </div>
          )}
        </div>
      )}

      {/* Intro */}
      <div className="mb-5">
        <p className="font-bold text-xs mb-2">Dear Team,</p>
        <p className="text-xs leading-relaxed text-gray-700">
          {introText || getDefaultIntro()}
        </p>
      </div>

      {/* Machine Info Table - Dynamic Color */}
      {data.showMachineInfo !== false && (documentInfo.make || documentInfo.model) && (
        <div className="mb-6">
          <table className="w-full text-xs border border-gray-300">
            <tbody>
              {[
                { label: "Make", value: documentInfo.make },
                { label: "Model", value: documentInfo.model },
              ].filter(row => row.value).map((row, i) => (
                <tr key={i} className={i < 1 ? "border-b border-gray-300" : ""}>
                  <td
                    className="w-1/4 p-2 text-white font-bold uppercase tracking-wider text-center border-r border-gray-300"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {row.label}
                  </td>
                  <td className="p-2 font-bold uppercase text-center">{row.value || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Client Info */}
      {data.showCustomerDetails !== false && (client.name || client.companyName) && (
        <div className="mb-5 text-xs">
          <p className="font-bold uppercase text-[10px] tracking-wider mb-1" style={{ color: primaryColor }}>To (Buyer):</p>
          <p className="font-black text-sm uppercase text-gray-800">{client.companyName || client.name}</p>
          {client.address && <p className="text-gray-600 leading-normal">{client.address}</p>}
          {client.attn && <p className="text-gray-500 mt-1">Attn: <span className="font-semibold text-gray-700">{client.attn}</span></p>}
        </div>
      )}

      {/* Dynamic Items Table */}
      <table className="w-full mb-6 border border-gray-300 text-xs">
        <thead>
          <tr>
            {visibleColumns.map(col => (
              <th
                key={col.id}
                className="py-2 px-2.5 text-center text-[10px] uppercase font-bold tracking-wider text-white border-r border-white/30 last:border-r-0"
                style={{ backgroundColor: primaryColor, width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className="border-b border-gray-200">
              {visibleColumns.map(col => (
                <td
                  key={col.id}
                  className={`py-2 px-2.5 border-r border-gray-200 last:border-r-0 ${
                    col.key === "sno" || col.type === "number" || col.key === "total" || col.key === "unitPrice" ? "text-center font-medium" : ""
                  } ${col.key === "itemName" ? "font-bold uppercase" : ""} ${col.key === "total" ? "font-bold" : ""}`}
                >
                  {col.key === "itemName" ? (
                    <div>
                      <span className="font-bold uppercase">{item.itemName || "-"}</span>
                      {item.description && (
                        <p className="text-[10px] text-gray-500 normal-case mt-0.5 font-normal">{item.description}</p>
                      )}
                    </div>
                  ) : (
                    getCellValue(item, col, index)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      {items.length > 0 && visibleColumns.some(c => c.key === "total") && (
        <div className="flex justify-end mb-6">
          <div className="w-64 text-xs space-y-1">
            <div className="flex justify-between px-3 py-1.5">
              <span className="font-bold uppercase tracking-wider text-gray-600">Subtotal</span>
              <span className="font-bold">{currencySymbol}{formatValue(subtotal)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between px-3 py-1.5 text-red-600">
                <span className="font-medium">
                  Discount {data.discountType === "percent" ? `(${data.discount}%)` : ""}
                </span>
                <span className="font-medium">-{currencySymbol}{formatValue(discountAmt)}</span>
              </div>
            )}
            {data.taxPercent > 0 && (
              <div className="flex justify-between px-3 py-1.5">
                <span className="font-medium text-gray-600">Tax ({data.taxPercent}%)</span>
                <span className="font-medium">+{currencySymbol}{formatValue(taxAmt)}</span>
              </div>
            )}
            {data.shippingCharge > 0 && (
              <div className="flex justify-between px-3 py-1.5">
                <span className="font-medium text-gray-600">Shipping</span>
                <span className="font-medium">+{currencySymbol}{formatValue(data.shippingCharge)}</span>
              </div>
            )}
            {/* Grand Total — always show if there are extras, otherwise show as the subtotal line */}
            <div className="flex justify-between px-3 py-2 rounded-md font-black text-sm border-t-2" style={{ borderColor: primaryColor, color: primaryColor, backgroundColor: `${primaryColor}10` }}>
              <span className="uppercase tracking-wider">{hasExtras ? "Grand Total" : "Total"}</span>
              <span>{currencySymbol}{formatValue(hasExtras ? grandTotal : subtotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Terms */}
      {terms && (
        <div className="mb-6 text-[10px]">
          <p className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: primaryColor }}>Commercial Terms:</p>
          <p className="whitespace-pre-line text-gray-700 leading-relaxed">{terms}</p>
        </div>
      )}


      {/* Footer Logo */}
      <div className="mt-auto">
        <div className="mb-4">
          {branding.logo ? (
            <img src={branding.logo} alt="" className="h-8 object-contain opacity-70 grayscale" />
          ) : (
            company.name && <p className="font-bold text-gray-400 text-xs">{company.name}</p>
          )}
        </div>
        <div className="flex justify-between items-end text-[8px] text-gray-500 uppercase font-bold tracking-tight border-t pt-2" style={{ borderColor: `${primaryColor}30` }}>
          <div>
            {company.address && <p>{company.address}</p>}
            <p>{[company.email, company.phone].filter(Boolean).join(" | ")}</p>
          </div>
          <div className="text-right">
            {company.website && <p>Website: {company.website}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
