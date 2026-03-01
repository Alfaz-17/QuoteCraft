"use client";

import { QuotationState } from "@/types/quotation.types";
import { MarineTemplate } from "./MarineTemplate";
import { useEffect, useRef, useState } from "react";

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

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full flex flex-col items-center ${isMobile ? "p-0" : "p-8"} bg-slate-200/50 overflow-y-auto min-h-0`}
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
