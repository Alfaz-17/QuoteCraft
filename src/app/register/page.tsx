"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/Toast";
import { Loader2, Ship, ArrowRight, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { error: toastError, info: toastInfo } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || name.trim().length < 2) {
      setError("Name must be at least 2 characters long");
      return;
    }

    const phoneRegex = /^[+]?[0-9\s\-()]{7,25}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError("Please enter a valid phone number (at least 7 digits)");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register");
      }

      // Successful registration -> go to login
      router.push("/login?registered=true");
    } catch (err: any) {
      if (err.message === "User with this phone number is already registered") {
        setError(err.message);
        toastInfo("Looks like you already have an account! Navigating to login...");
      } else {
        setError(err.message || "An unexpected error occurred");
        toastError(err.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 px-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
          <Ship className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create your Account</h2>
        <p className="text-sm text-muted-foreground font-medium">Get started with professional B2B quotation generator</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="border-none shadow-xl bg-white/70 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold">Register</CardTitle>
            <CardDescription className="text-xs">Enter your details to create a trading agent profile</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error === "User with this phone number is already registered" ? (
                <div className="p-4 text-xs bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-medium flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="leading-snug">You already have an account with this number.</p>
                  </div>
                  <Button type="button" variant="outline" className="w-full text-xs h-9 bg-white border-amber-200 hover:bg-amber-100 hover:text-amber-900 transition-colors" onClick={() => router.push("/login")}>
                    Sign In instead
                  </Button>
                </div>
              ) : error ? (
                <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100 font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-tight">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. Capt. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-tight">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  placeholder="e.g. +1 555 0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-tight">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-10 font-bold text-xs gap-1.5 shadow-md shadow-primary/10 mt-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating profile...
                  </>
                ) : (
                  <>
                    Sign Up <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pt-2 flex justify-center border-t py-4">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-green-500" /> Secure 256-bit Database Encryption
        </div>
      </div>
    </main>
  );
}
