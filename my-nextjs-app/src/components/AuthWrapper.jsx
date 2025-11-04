'use client';

import { AuthProvider } from '../hooks/useAuth';

export default function AuthWrapper({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}