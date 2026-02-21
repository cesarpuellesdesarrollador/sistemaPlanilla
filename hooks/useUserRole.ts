import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export type UserRole = 'ADMIN' | 'ENCARGADO_PLANTEL' | 'CONTADOR' | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function fetchRole() {
      if (!user?.id) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Obtener rol desde user_metadata (modo mock)
      const roleFromMeta = (user as any)?.user_metadata?.role ?? null;
      setRole(roleFromMeta);
      setLoading(false);
    }

    fetchRole();
  }, [user?.id]);

  const isAdmin = role === 'ADMIN';
  const isReadOnly = role === 'CONTADOR';
  const canEdit = role === 'ADMIN' || role === 'ENCARGADO_PLANTEL';

  return { role, loading, isAdmin, isReadOnly, canEdit };
}
