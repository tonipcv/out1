'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Image from "next/image";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-[100dvh] h-full bg-gray-50 flex flex-col items-center justify-center">
        <div className="mb-8">
          <div className="relative w-20 h-7">
            <Image
              src="/logo.png"
              alt="MED1 Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen h-full bg-white">
      <Navigation />
      <main className="h-full min-h-[100dvh] pt-16 pb-20 lg:pt-0 lg:pb-0">
        {children}
      </main>
    </div>
  );
} 