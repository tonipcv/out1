/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center">
      <div className="w-full max-w-[480px] mx-auto px-4">
        <div className="flex justify-center mb-8 items-center gap-3">
          <div className="relative w-20 h-7">
            <Image
              src="/logo.png"
              alt="MED1 Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-3xl font-semibold text-[#5c5b60]"></span>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                If this email is registered in our database, you will receive a link to reset your password.
              </p>
              <Link 
                href="/auth/signin" 
                className="text-gray-600 hover:text-black text-sm block"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black font-light">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Work e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-gray-200 text-black placeholder:text-gray-400 focus:ring-2 focus:ring-black/50 focus:border-transparent"
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}
              <Button 
                type="submit" 
                className="w-full bg-[#0070df] text-white hover:bg-[#0070df]/90 transition-colors border-none rounded-full"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send recovery link"}
              </Button>

              <div className="text-center">
                <Link 
                  href="/auth/signin" 
                  className="text-gray-600 hover:text-black text-sm"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 