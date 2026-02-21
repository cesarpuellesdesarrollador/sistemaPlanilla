import { NextRequest, NextResponse } from 'next/server'
import { MOCK_USER } from '@/lib/mockAuth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // En modo mock, simplemente devolver un usuario mock
    return NextResponse.json({ user: MOCK_USER, session: null })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    )
  }
}
