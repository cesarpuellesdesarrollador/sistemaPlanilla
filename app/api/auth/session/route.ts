import { NextRequest, NextResponse } from 'next/server'
import { MOCK_TOKEN, MOCK_USER } from '@/lib/mockAuth'

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get('auth_token')?.value || null
    if (cookie && cookie === MOCK_TOKEN) {
      return NextResponse.json({ user: MOCK_USER })
    }
    return NextResponse.json({ user: null })
  } catch (error) {
    return NextResponse.json({ user: null })
  }
}
