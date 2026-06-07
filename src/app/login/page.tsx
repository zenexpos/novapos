'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePOSStore } from '@/lib/pos-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, ShoppingBag } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = usePOSStore((state) => state.login);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username);
      router.push('/dashboard/pos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EBF0F6] p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-primary w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
            <ShoppingBag className="text-white w-8 h-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight text-primary">NovaPOS</CardTitle>
            <CardDescription className="text-muted-foreground">Sign in to your staff workstation</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input 
                placeholder="e.g. admin" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 py-6 text-lg group">
              Access System
              <LogIn className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Authorized Personnel Only</p>
        </CardFooter>
      </Card>
    </div>
  );
}
