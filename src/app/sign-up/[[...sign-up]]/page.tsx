import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { QuoteCraftLogo } from "@/components/ui/QuoteCraftLogo";
import { ArrowLeft } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Sea Sunrise Glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#E0F2F1]/60 via-[#FFFBEB]/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0F766E] transition-colors py-1.5 px-3 rounded-full hover:bg-slate-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2">
        <div className="flex justify-center">
          <QuoteCraftLogo size={42} showTagline={true} />
        </div>
        <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto">
          Create an account to start generating branded marine quotations faster
        </p>
      </div>

      {/* Clerk Auth Box */}
      <div className="w-full max-w-md flex justify-center shadow-xl rounded-2xl overflow-hidden border border-slate-200/80 bg-white">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </div>

      {/* Bottom Maritime Flourish */}
      <div className="mt-8 text-center text-[11px] font-semibold text-slate-400">
        QuoteCraft &bull; Simple. Powerful. Built for Marine Business.
      </div>
    </div>
  );
}
