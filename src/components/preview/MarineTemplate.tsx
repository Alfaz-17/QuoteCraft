"use client";

import { QuotationState } from "@/types/quotation.types";
import { calculateRowTotal } from "@/utils/calculations";

interface TemplateProps {
  data: QuotationState;
}

export function MarineTemplate({ data }: TemplateProps) {
  const { branding, documentInfo, company, client, items, terms, introText } = data;
  const visibleColumns = data.tableColumns.filter(c => c.visible);
  const primaryColor = branding.primaryColor || "#2563eb";

  const getCellValue = (item: typeof items[0], col: typeof visibleColumns[0], index: number): string => {
    if (col.key === "sno") return (index + 1).toString();
    if (col.key === "total") return calculateRowTotal(item).toFixed(2);
    const val = item[col.key];
    if (val === undefined || val === null) return "-";
    if (typeof val === "number") return col.type === "number" ? val.toFixed(2) : val.toString();
    return String(val) || "-";
  };

  return (
    <div
      className="bg-white p-10 mx-auto min-h-[1123px] w-[794px] border border-gray-200 flex flex-col"
      style={{ fontFamily: branding.font }}
    >
      {/* Header - Centered Logo */}
      <div className="flex flex-col items-center mb-5">
        <div className="mb-3">
          {branding.logo ? (
            <img src={branding.logo} alt="Logo" className="max-h-20 object-contain" />
          ) : (
            <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: primaryColor }}>{company.name}</h1>
          )}
        </div>
        <div className="text-center w-full relative">
          <h2 className="text-lg font-bold uppercase tracking-[0.15em] mb-3" style={{ color: primaryColor }}>
            {documentInfo.type === "rfq" ? "Request for Quotation" : "Quotation"}
          </h2>
          <div className="absolute right-0 top-0">
            <p className="text-xs font-medium">DATE: <span className="font-bold">{documentInfo.date}</span></p>
          </div>
        </div>
      </div>

      {/* Intro */}
      <div className="mb-5">
        <p className="font-bold text-xs mb-2">Dear Team,</p>
        <p className="text-xs leading-relaxed text-gray-700">
          {introText || `We hereby invite you to submit your best quotation for the items listed below.`}
        </p>
      </div>

      {/* Machine Info Table - Dynamic Color */}
      {data.showMachineInfo !== false && (
        <div className="mb-6">
          <table className="w-full text-xs border border-gray-300">
            <tbody>
              {[
                { label: "Scope of Supply", value: documentInfo.scope },
                { label: "Make", value: documentInfo.make },
                { label: "Model", value: documentInfo.model },
              ].map((row, i) => (
                <tr key={i} className={i < 2 ? "border-b border-gray-300" : ""}>
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
          <p className="font-bold uppercase text-[10px] tracking-wider mb-1" style={{ color: primaryColor }}>To:</p>
          <p className="font-bold">{client.companyName || client.name}</p>
          {client.address && <p className="text-gray-600">{client.address}</p>}
          {client.attn && <p className="text-gray-600">Attn: {client.attn}</p>}
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
                    col.key === "sno" || col.type === "number" || col.key === "total" ? "text-center font-medium" : ""
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

      {/* Subtotal */}
      {items.length > 0 && visibleColumns.some(c => c.key === "total") && (
        <div className="flex justify-end mb-6">
          <div className="flex gap-8 items-center px-4 py-2 rounded" style={{ backgroundColor: `${primaryColor}10` }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Subtotal</span>
            <span className="text-sm font-black" style={{ color: primaryColor }}>
              {items.reduce((sum, item) => sum + calculateRowTotal(item), 0).toFixed(2)}
            </span>
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

      {/* Checklist */}
      {data.showChecklist && (
        <div className="mb-5 text-[10px] space-y-1.5">
          <p className="font-bold italic text-xs">*Please ensure the following in your Commercial offer:</p>
          <ul className="ml-3 space-y-0.5 text-gray-700">
            {[
              "Delivery time and availability",
              "Country of origin and manufacturer",
              "OEM or genuine/high quality parts confirmation",
              "Warranty terms",
              "Packing and Handling charges",
              "Shipping terms (EXW, FOB, CIF, etc.)",
              "Unit and total prices",
              "Payment terms",
              "Quotation validity",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span style={{ color: primaryColor }}>✓</span> {item}
              </li>
            ))}
          </ul>
          <p className="font-bold uppercase text-xs tracking-tight pt-2">Kindly acknowledge the receipt of RFQ</p>
        </div>
      )}

      {/* Footer Logo */}
      <div className="mt-auto">
        <div className="mb-4">
          {branding.logo ? (
            <img src={branding.logo} alt="" className="h-8 object-contain opacity-70 grayscale" />
          ) : (
            <p className="font-bold text-gray-400 text-xs">{company.name}</p>
          )}
        </div>
        <div className="flex justify-between items-end text-[8px] text-gray-500 uppercase font-bold tracking-tight border-t pt-2" style={{ borderColor: `${primaryColor}30` }}>
          <div>
            <p>{company.address}</p>
            <p>{company.email} | {company.phone}</p>
          </div>
          <div className="text-right">
            <p>Website: {company.website || `www.${(company.email.split("@")[1] || "example.com")}`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
