"use client";

import { QuotationState } from "@/types/quotation.types";
import { MarineTemplate } from "./MarineTemplate";

interface PreviewContainerProps {
  data: QuotationState;
  isMobile?: boolean;
}

export function PreviewContainer({ data, isMobile }: PreviewContainerProps) {
  if (isMobile) {
    return (
      <div className="w-full bg-white shadow-2xl">
        <MarineTemplate data={data} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex justify-center p-8 bg-slate-100 overflow-visible">
      <div className="shadow-2xl transition-all duration-500 bg-white">
        <MarineTemplate data={data} />
      </div>
    </div>
  );
}
