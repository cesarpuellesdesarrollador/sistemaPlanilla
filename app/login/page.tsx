"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building } from 'lucide-react';

function LoginButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={pending}>
      {pending ? 'Iniciando...' : 'Iniciar Sesión'}
    </Button>
  );
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const username = (formData.get('username') as string) || '';
    const password = (formData.get('password') as string) || '';

    const result = await signIn(username, password);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    } else {
      // redirigir al dashboard en cliente tras login exitoso
      // no cambiamos `pending` aquí: mantener "Iniciando..." hasta que ocurra la navegación
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 font-sans p-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-gray-900 rounded-2xl shadow-2xl shadow-black/25 border border-gray-800">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-6 bg-gray-800 border border-gray-700 rounded-full">
            <Building className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Acceso al Sistema</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-400">Gestión de Planificación de Personal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Usuario
            </label>
            <div className="mt-2">
              <Input id="username" name="username" type="text" required placeholder="admin_staff" className="w-full bg-gray-800 border-gray-700 text-white focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Contraseña
            </label>
            <div className="mt-2">
              <Input id="password" name="password" type="password" required placeholder="••••••••" className="w-full bg-gray-800 border-gray-700 text-white focus:ring-indigo-500" />
            </div>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <LoginButton pending={pending} />
          </div>
        </form>
      </div>
    </div>
  );
}