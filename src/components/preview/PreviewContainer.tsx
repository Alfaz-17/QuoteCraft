"use client";

import { QuotationState } from "@/types/quotation.types";
import { MarineTemplate } from "./MarineTemplate";

interface PreviewContainerProps {
  data: QuotationState;
}

export function PreviewContainer({ data }: PreviewContainerProps) {
  return (
    <div className="w-full bg-slate-100 p-8 h-full overflow-y-auto flex justify-center">
      <div className="transform scale-[0.6] origin-top md:scale-[0.8] lg:scale-[0.85] xl:scale-100 shadow-2xl transition-all duration-500">
        <MarineTemplate data={data} />
      </div>
    </div>
  );
}
