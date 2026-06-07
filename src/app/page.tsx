'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePOSStore } from '@/lib/pos-store';

export default function Home() {
  const router = useRouter();
  const currentUser = usePOSStore((state) => state.currentUser);

  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard/pos');
    } else {
      router.push('/login');
    }
  }, [currentUser, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-primary rounded-full" />
        <p className="text-primary font-medium">Initializing NovaPOS...</p>
      </div>
    </div>
  );
}
