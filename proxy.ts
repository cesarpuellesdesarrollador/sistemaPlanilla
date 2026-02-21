import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })

  // Verificación de autenticación mock
  const isAuthenticated = request.cookies.has('auth_token')

  // Rutas públicas
  const publicRoutes = ['/', '/login', '/explore', '/auction']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/profile', '/students']
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Redirigir a login si no está autenticado y accede a ruta protegida
  if (!isAuthenticated && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Redirigir a dashboard si está autenticado y accede a login
  if (isAuthenticated && request.nextUrl.pathname === '/login') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
