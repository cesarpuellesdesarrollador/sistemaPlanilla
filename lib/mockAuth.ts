export const MOCK_USER = {
  id: 'mock-user-id',
  email: 'admin@local.test',
  user_metadata: {
    full_name: 'Admin General',
    role: 'ADMIN',
    plantel: 'Plantel Central',
  },
  created_at: new Date().toISOString(),
}

export const mockAuth = {
  async getSession() {
    return { data: { session: { user: MOCK_USER } } };
  },

  auth: {
    onAuthStateChange(_cb: any) {
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async getSession() {
      return { data: { session: { user: MOCK_USER } } };
    }
  }
}

export const AUTH_CREDENTIALS = {
  username: 'admin_staff',
  password: 'SecurePassword2026!'
}

export const MOCK_TOKEN = '6a3f9c8d47b1e2f09a5d4c3b2f7e8a9c1d3b5f6a7c8e9d0b1a2c3e4f5a6b7c8'
