"use client";

import { QuotationState, CURRENCY_SYMBOLS } from "@/types/quotation.types";
import { MarineTemplate } from "./MarineTemplate";
import { useEffect, useRef, useState } from "react";
import type React from "react";
import { calculateDiscountAmount, calculateGrandTotal, calculateRowTotal, calculateSubtotal, calculateTaxAmount } from "@/utils/calculations";
import { CalendarDays, FileText, Ship, UserRound, Package, ReceiptText } from "lucide-react";

interface PreviewContainerProps {
  data: QuotationState;
  isMobile?: boolean;
}

export function PreviewContainer({ data, isMobile }: PreviewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isMobile) {
      setScale(0.45);
      return;
    }

    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth - 64; // padding
      const targetWidth = 794; // A4 width at 96dpi
      if (containerWidth < targetWidth) {
        setScale(containerWidth / targetWidth);
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [isMobile]);

  if (isMobile) {
    return <MobilePreview data={data} />;
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex flex-col items-center p-8 bg-slate-200/50 overflow-y-auto min-h-0"
    >
      <div 
        className="shadow-2xl origin-top transition-transform duration-300"
        style={{ 
          transform: `scale(${scale})`,
          width: "794px",
          marginBottom: `-${794 * (1 - scale)}px` // Prevents empty space below scaled item
        }}
      >
        <MarineTemplate data={data} />
      </div>
    </div>
  );
}

function MobilePreview({ data }: { data: QuotationState }) {
  const { branding, documentInfo, company, client, items, terms, introText } = data;
  const primaryColor = branding.primaryColor || "#2563eb";
  const currencySymbol = CURRENCY_SYMBOLS[data.currency] || "$";
  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscountAmount(subtotal, data.discount, data.discountType);
  const tax = calculateTaxAmount(subtotal - discount, data.taxPercent);
  const grandTotal = calculateGrandTotal(subtotal, data.discount, data.discountType, data.taxPercent, data.shippingCharge);
  const visibleColumns = data.tableColumns.filter((column) => column.visible);

  const formatValue = (num: number) => (num % 1 === 0 ? num.toFixed(0) : num.toFixed(2));
  const title = documentInfo.type === "rfq" ? "Request for Quotation" : documentInfo.type === "proforma" ? "Proforma Invoice" : "Quotation";
  const defaultIntro = documentInfo.type === "rfq"
    ? "Please submit your best quotation for the listed marine items."
    : documentInfo.type === "proforma"
      ? "Proforma invoice details for the listed marine items."
      : "Quotation details for the listed marine items.";

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-100 pb-5">
      <div className="sticky top-0 z-10 border-b bg-white px-3 py-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Preview</p>
            <h2 className="truncate text-sm font-black text-slate-900">{title}</h2>
          </div>
          <div className="rounded-lg px-2.5 py-1 text-right text-[11px] font-black text-white" style={{ backgroundColor: primaryColor }}>
            {documentInfo.number || "Draft"}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <section className="rounded-xl border bg-white p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">From</p>
              <h3 className="truncate text-base font-black uppercase" style={{ color: primaryColor }}>
                {company.name || "Your Company"}
              </h3>
              {company.website && <p className="truncate text-[11px] font-semibold text-slate-500">{company.website}</p>}
            </div>
            {branding.logo && <img src={branding.logo} alt="" className="h-10 w-10 rounded-lg border bg-white object-contain p-1" />}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-600">{introText || defaultIntro}</p>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <InfoCard icon={<CalendarDays className="h-3.5 w-3.5" />} label="Date" value={documentInfo.date || "-"} color={primaryColor} />
          <InfoCard icon={<FileText className="h-3.5 w-3.5" />} label="Valid Until" value={documentInfo.validUntil || "-"} color={primaryColor} />
          {(documentInfo.vessel || documentInfo.reference) && (
            <>
              <InfoCard icon={<Ship className="h-3.5 w-3.5" />} label="Vessel" value={documentInfo.vessel || "-"} color={primaryColor} />
              <InfoCard icon={<ReceiptText className="h-3.5 w-3.5" />} label="Reference" value={documentInfo.reference || "-"} color={primaryColor} />
            </>
          )}
        </section>

        {(client.name || client.companyName || client.address || client.attn) && (
          <section className="rounded-xl border bg-white p-3 shadow-sm">
            <SectionTitle icon={<UserRound className="h-4 w-4" />} title="Customer Details" color={primaryColor} />
            <div className="mt-2 space-y-1">
              <p className="text-sm font-black text-slate-900">{client.companyName || client.name || "Customer"}</p>
              {client.attn && <p className="text-xs font-semibold text-slate-600">Attn: {client.attn}</p>}
              {client.address && <p className="text-xs leading-relaxed text-slate-500">{client.address}</p>}
            </div>
          </section>
        )}

        {(documentInfo.make || documentInfo.model) && (
          <section className="rounded-xl border bg-white p-3 shadow-sm">
            <SectionTitle icon={<Ship className="h-4 w-4" />} title="Machine Information" color={primaryColor} />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <InfoRow label="Make" value={documentInfo.make || "-"} />
              <InfoRow label="Model" value={documentInfo.model || "-"} />
            </div>
          </section>
        )}

        <section className="rounded-xl border bg-white p-3 shadow-sm">
          <SectionTitle icon={<Package className="h-4 w-4" />} title={`Line Items (${items.length})`} color={primaryColor} />
          <div className="mt-3 space-y-2">
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed bg-slate-50 p-4 text-center text-xs font-semibold text-slate-500">
                No items added yet.
              </div>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className="rounded-lg border bg-slate-50/70 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400">#{index + 1}</p>
                      <p className="text-sm font-black text-slate-900">{item.itemName || "Unnamed item"}</p>
                    </div>
                    <p className="shrink-0 text-sm font-black" style={{ color: primaryColor }}>
                      {currencySymbol}{formatValue(calculateRowTotal(item))}
                    </p>
                  </div>
                  {item.description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>}
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    <InfoPill label="Qty" value={`${item.quantity || 0}`} />
                    <InfoPill label="Unit" value={(item.unit || "pcs").toUpperCase()} />
                    <InfoPill label="Price" value={`${currencySymbol}${formatValue(item.unitPrice || 0)}`} />
                  </div>
                  {visibleColumns.some((column) => column.key === "partNumber") && item.partNumber && (
                    <p className="mt-2 text-[11px] font-semibold text-slate-500">Part No: {item.partNumber}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-3 shadow-sm">
          <SectionTitle icon={<ReceiptText className="h-4 w-4" />} title="Financial Summary" color={primaryColor} />
          <div className="mt-3 space-y-2 text-xs">
            <TotalLine label="Subtotal" value={`${currencySymbol}${formatValue(subtotal)}`} />
            {data.discount > 0 && <TotalLine label={`Discount${data.discountType === "percent" ? ` (${data.discount}%)` : ""}`} value={`-${currencySymbol}${formatValue(discount)}`} muted />}
            {data.taxPercent > 0 && <TotalLine label={`Tax (${data.taxPercent}%)`} value={`+${currencySymbol}${formatValue(tax)}`} muted />}
            {data.shippingCharge > 0 && <TotalLine label="Shipping" value={`+${currencySymbol}${formatValue(data.shippingCharge)}`} muted />}
            <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-black text-white" style={{ backgroundColor: primaryColor }}>
              <span>Grand Total</span>
              <span>{currencySymbol}{formatValue(grandTotal)}</span>
            </div>
          </div>
        </section>

        {terms && (
          <section className="rounded-xl border bg-white p-3 shadow-sm">
            <SectionTitle icon={<FileText className="h-4 w-4" />} title="Terms & Notes" color={primaryColor} />
            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-600">{terms}</p>
          </section>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ backgroundColor: color }}>{icon}</span>
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">{title}</h3>
    </div>
  );
}

function InfoCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="min-w-0 rounded-xl border bg-white p-2.5 shadow-sm">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color }}>
        {icon}
        <span>{label}</span>
      </div>
      <p className="truncate text-xs font-bold text-slate-800">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-xs font-bold text-slate-800">{value}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white px-2 py-1">
      <p className="text-[9px] font-black uppercase text-slate-400">{label}</p>
      <p className="truncate text-[11px] font-bold text-slate-800">{value}</p>
    </div>
  );
}

function TotalLine({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-1 ${muted ? "text-slate-500" : "text-slate-700"}`}>
      <span className="font-semibold">{label}</span>
      <span className="font-mono font-bold">{value}</span>
    </div>
  );
}
