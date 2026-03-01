"use client";
// Deprecated - MarineTemplate is the active template
import { QuotationState } from "@/types/quotation.types";
export function ClassicTemplate({ data }: { data: QuotationState }) { return <div>{data.company.name}</div>; }
