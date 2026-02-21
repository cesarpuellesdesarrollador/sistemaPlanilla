import { NextResponse } from 'next/server'
import { MOCK_TOKEN } from '@/lib/mockAuth'

export async function POST() {
  try {
    const res = NextResponse.json({ success: true })
    // Clear cookie
    res.headers.set('Set-Cookie', `auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
    return res
  } catch (error) {
    return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 })
  }
}
