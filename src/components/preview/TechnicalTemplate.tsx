"use client";
// Deprecated - MarineTemplate is the active template
import { QuotationState } from "@/types/quotation.types";
export function TechnicalTemplate({ data }: { data: QuotationState }) { return <div>{data.company.name}</div>; }
