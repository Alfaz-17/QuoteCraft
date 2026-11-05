"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { HeroSailingLoader } from "@/components/ui/Loaders";

export default function RegisterPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        router.replace("/dashboard");
      } else {
        router.replace("/sign-up");
      }
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4">
      <HeroSailingLoader statusMessage="Redirecting to registration..." />
    </div>
  );
}
