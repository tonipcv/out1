'use client';

import { useState, Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from '@/components/ui/logo';

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get('error');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log("Usuário autenticado, redirecionando para:", callbackUrl);
      router.push(callbackUrl);
    }
  }, [status, session, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      console.log("Iniciando processo de login com:", email);
      const result = await signIn('credentials', {
        email,
        password,
        type: 'user',
        redirect: false,
        callbackUrl
      });

      console.log("Resultado do login:", result);

      if (result?.error) {
        console.error("Erro no login:", result.error);
        setLoginError(result.error);
        return;
      }

      if (result?.ok) {
        console.log("Login bem-sucedido, aguardando sessão...");
        // Aguarda um momento para a sessão ser atualizada
        setTimeout(() => {
          console.log("Redirecionando para:", callbackUrl);
          window.location.href = callbackUrl;
        }, 1000);
      }
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setLoginError("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Se já estiver autenticado, mostre uma mensagem
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-2">Você já está autenticado</h2>
          <p className="mb-4">Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center">
      <div className="w-full max-w-[480px] mx-auto px-4">
        <div className="flex justify-center mb-8 items-center gap-3">
          <Logo size="lg" />
          <span className="text-3xl font-semibold text-[#5c5b60]"></span>
        </div>
        
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Work e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white text-black"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white text-black"
              />
            </div>
            {(error || loginError) && (
              <div className="text-red-600 text-sm">{error || loginError}</div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-[#0070df] text-white hover:bg-[#0070df]/90 transition-colors border-none rounded-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/forgot-password" 
              className="text-gray-600 hover:text-black text-sm block mb-2"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 