'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Page racine utilisant un redirect client pour une compatibilité maximale 
 * avec l'exportation statique et éviter les lenteurs au démarrage.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/');
  }, [router]);

  return null;
}
