import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { QuoteCraftLogo } from "@/components/ui/QuoteCraftLogo";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Sea Sunrise Glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#E0F2F1]/60 via-[#FFFBEB]/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0F766E] transition-colors py-1.5 px-3 rounded-md hover:bg-slate-100"
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
          Sign in to access your marine quotations and RFQs
        </p>
      </div>

      {/* Clerk Auth Box */}
      <div className="w-full max-w-md flex justify-center shadow-md rounded-lg overflow-hidden border border-slate-200 bg-white">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
        />
      </div>

      {/* Bottom Maritime Flourish */}
      <div className="mt-8 text-center text-xs font-semibold text-slate-400">
        QuoteCraft &bull; Simple. Powerful. Built for Marine Business.
      </div>
    </div>
  );
}
