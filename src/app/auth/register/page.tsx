/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, slug, specialty })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error creating account');
      }

      router.push('/auth/signin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating account');
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-black font-light">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white border-gray-200 text-black placeholder:text-gray-400 focus:ring-2 focus:ring-black/50 focus:border-transparent"
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-black font-light">Username</Label>
              <Input
                id="slug"
                type="text"
                placeholder="Choose your username"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="bg-white border-gray-200 text-black placeholder:text-gray-400 focus:ring-2 focus:ring-black/50 focus:border-transparent"
              />
              <p className="text-xs text-gray-500">
                This will be your personal URL: app.io/<span className="text-black">{slug || 'username'}</span>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty" className="text-black font-light">Specialty</Label>
              <Input
                id="specialty"
                type="text"
                placeholder="Your medical specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="bg-white border-gray-200 text-black placeholder:text-gray-400 focus:ring-2 focus:ring-black/50 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black font-light">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {isLoading ? "Creating account..." : "Create account"}
            </Button>

            <div className="text-center">
              <Link 
                href="/auth/signin" 
                className="text-gray-600 hover:text-black text-sm"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            4.7/5 based on 8,111 reviews
          </p>
        </div>
      </div>
    </div>
  );
} 