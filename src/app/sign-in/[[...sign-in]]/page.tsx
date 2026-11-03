import { SignIn } from "@clerk/nextjs";
import { Ship } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#071329] flex flex-col justify-center items-center p-4">
      <div className="text-center mb-6 space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Ship className="w-6 h-6 stroke-[2]" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">QuoteCraft</h1>
        <p className="text-xs text-blue-200">Marine Quotation & RFQ Processing</p>
      </div>

      <div className="w-full max-w-md flex justify-center">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}

