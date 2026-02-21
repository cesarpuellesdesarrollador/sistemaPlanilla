"use client";

import { useState, useEffect } from "react";
import { User, Mail, Shield, Building2, Calendar, Edit2, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  plantel: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  'ADMIN': 'Administrador',
  'ENCARGADO_PLANTEL': 'Encargado de Plantel',
  'CONTADOR': 'Contador'
};

export default function ProfilePage() {
  const { user } = useAuth();
  const setUserProfile = useAuthStore(state => state.setUserProfile);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    // En modo mock obtenemos los datos desde `user`
    if (!user) return;
    const mockProfile = {
      id: user.id,
      email: user.email,
      full_name: (user.user_metadata?.full_name as string) || null,
      role: user.user_metadata?.role || 'ENCARGADO_PLANTEL',
      plantel: user.user_metadata?.plantel || null,
      created_at: user.created_at || new Date().toISOString(),
    } as Profile;

    setProfile(mockProfile);
    setFormData({ full_name: mockProfile.full_name || '', email: mockProfile.email || '' });
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    if (!formData.full_name.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Ingresa un correo válido');
      return;
    }

    // Modo mock: actualizar estado local y store
    setSaving(true);

    try {
      const updatedProfile = { ...profile, full_name: formData.full_name.trim(), email: formData.email.trim() };
      setProfile(updatedProfile);
      setUserProfile(updatedProfile.full_name || '', updatedProfile.role);
      setIsEditing(false);
      toast.success('Perfil actualizado exitosamente (modo mock)');
    } catch (error) {
      console.error('Error updating profile (mock):', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      email: profile?.email || ''
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || profile.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="max-w-full overflow-hidden space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Mi Perfil</h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">Información de tu cuenta</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
          >
            <Edit2 size={16} />
            Editar Perfil
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <X size={16} />
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="p-4 sm:p-6">
          {/* Avatar and Name */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-200 dark:border-slate-700 text-center sm:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {profile.full_name || 'Sin nombre'}
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                {ROLE_LABELS[profile.role] || profile.role}
              </p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <User size={16} />
                  Nombre Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Ingresa tu nombre completo"
                  />
                ) : (
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100">
                    {profile.full_name || 'Sin nombre'}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Mail size={16} />
                  Correo Electrónico
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="correo@ejemplo.com"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Recibirás un correo de confirmación si cambias tu email
                    </p>
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100">
                    {profile.email}
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Shield size={16} />
                  Rol
                </label>
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    profile.role === 'ADMIN' 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : profile.role === 'ENCARGADO_PLANTEL'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  }`}>
                    {ROLE_LABELS[profile.role] || profile.role}
                  </span>
                </div>
              </div>

              {/* Plantel (if applicable) */}
              {profile.plantel && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Building2 size={16} />
                    Plantel
                  </label>
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100">
                    {profile.plantel}
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Calendar size={16} />
                  Miembro desde
                </label>
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100">
                  {new Date(profile.created_at).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>

              {/* User ID */}
              {!isEditing && (
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <User size={16} />
                    ID de Usuario
                  </label>
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono text-xs">
                    {profile.id}
                  </div>
                </div>
              )}
              
              {isEditing && (
                <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 Los cambios en el correo electrónico requieren confirmación. Recibirás un email con un enlace de verificación.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
