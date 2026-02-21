"use client";

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_USER } from '@/lib/mockAuth'
import { useAuthStore } from '@/stores/useAuthStore'
import { toast } from 'sonner'

export function useAuth() {
  const router = useRouter()
  const { user, loading, signingOut, setUser, setLoading, setSigningOut, clearAuth, initialized, setInitialized } = useAuthStore()
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (initialized) return

    let aborted = false
    setLoading(true)

    const initSession = async () => {
      try {
        const resp = await fetch('/api/auth/session')
        if (aborted) return
        const data = await resp.json()
        const sessionUser = data?.user ?? null
        setUser(sessionUser)
        lastUserId.current = sessionUser?.id ?? null
      } catch (e) {
        if (!aborted) setUser(null)
      } finally {
        if (!aborted) setLoading(false)
        setInitialized(true)
      }
    }

    initSession()

    return () => {
      aborted = true
    }
  }, [initialized, setUser, setLoading, setInitialized])

  const signIn = async (email: string, password: string) => {
    const loadId = toast.loading('Iniciando sesión...')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Error al iniciar sesión')
        return { error: data.error || 'Error al iniciar sesión' }
      }

      // Obtener sesión desde endpoint (cookie HTTP only)
      const sessionResp = await fetch('/api/auth/session')
      const sessionData = await sessionResp.json()
      const sessionUser = sessionData?.user ?? data.user ?? null

      setUser(sessionUser)
      lastUserId.current = sessionUser?.id ?? null

      toast.dismiss(loadId)
      toast.success('Sesión iniciada correctamente')

      return { error: null, user: sessionUser }
    } catch (error: any) {
      toast.dismiss(loadId)
      toast.error(error?.message || 'Error al iniciar sesión')
      return { error: error.message }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true)
    const loadId = toast.loading('Registrando usuario...')
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.dismiss(loadId)
        toast.error(data.error || 'Error al registrar')
        throw new Error(data.error || 'Error al registrar')
      }

      // iniciar sesión después de registro
      const login = await signIn(email, password)
      setLoading(false)
      toast.dismiss(loadId)
      toast.success('Registro completado y sesión iniciada')
      return login
    } catch (error: any) {
      setLoading(false)
      toast.dismiss(loadId)
      toast.error(error?.message || 'Error al registrar')
      return { error: error.message }
    }
  }

  const signOut = async () => {
    setSigningOut(true)
    const loadId = toast.loading('Cerrando sesión...')
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      clearAuth()
      toast.dismiss(loadId)
      toast.success('Sesión cerrada')
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      toast.dismiss(loadId)
      toast.error('Error al cerrar sesión')
    } finally {
      setSigningOut(false)
    }
  }

  return {
    user,
    loading: loading || signingOut,
    signIn,
    signUp,
    signOut,
  }
}
