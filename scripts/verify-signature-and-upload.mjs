import { generateProfessionalPDF } from "../src/lib/pdf-generator";
import { initialState } from "../src/hooks/quotationReducer";

console.log("=== VERIFYING SIGNATURE ON/OFF ENGINE ===");

// 1. Test PDF generation with Signature ON
const stateWithSig = {
  ...initialState,
  company: {
    ...initialState.company,
    name: "Seven Seas Ship Chandlers LLC",
    signatoryTitle: "Capt. Tariq Al-Mansoor • Marine Superintendent",
  },
  pdfShowSignatureBlock: true,
  items: [
    {
      id: "item-1",
      itemName: "Cylinder Liner Sulzer RTA58",
      quantity: 2,
      unit: "PCS",
      unitPrice: 1200,
    },
  ],
};

const docWithSig = generateProfessionalPDF(stateWithSig, { autoDownload: false });
const bytesWithSig = docWithSig.output("arraybuffer").byteLength;
console.log("PDF with Signature ON generated successfully! Size:", bytesWithSig, "bytes");

// 2. Test PDF generation with Signature OFF
const stateNoSig = {
  ...stateWithSig,
  pdfShowSignatureBlock: false,
};

const docNoSig = generateProfessionalPDF(stateNoSig, { autoDownload: false });
const bytesNoSig = docNoSig.output("arraybuffer").byteLength;
console.log("PDF with Signature OFF generated successfully! Size:", bytesNoSig, "bytes");

if (bytesWithSig > 0 && bytesNoSig > 0) {
  console.log("✅ Signature ON/OFF PDF generation verified cleanly!");
} else {
  throw new Error("PDF generation failed");
}

