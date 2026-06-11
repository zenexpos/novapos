import { redirect } from 'next/navigation';

/**
 * RootPage — Redirection souveraine immédiate.
 * Résout le problème du 404 en mode export statique via une redirection serveur directe.
 */
export default function RootPage() {
    redirect('/dashboard');
}
