"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sign-up");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#071329] flex items-center justify-center text-white">
      <p className="text-sm font-medium">Redirecting to sign up...</p>
    </div>
  );
}
