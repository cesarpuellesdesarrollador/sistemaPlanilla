import { NextRequest, NextResponse } from 'next/server'
import { AUTH_CREDENTIALS, MOCK_USER, MOCK_TOKEN } from '@/lib/mockAuth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email ?? body.username
    const password = body.password

    if (!email || !password) {
      return NextResponse.json({ error: 'Email/Usuario y contraseña son requeridos' }, { status: 400 })
    }

    // Validación contra mock
    if (email === AUTH_CREDENTIALS.username && password === AUTH_CREDENTIALS.password) {
      const res = NextResponse.json({ user: MOCK_USER })
      // Set cookie auth_token (httpOnly)
      res.headers.set('Set-Cookie', `auth_token=${MOCK_TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24}`)
      return res
    }

    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 })
  }
}
