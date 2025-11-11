"use client";

import DASHBOARDpage from "@/components/DASHBOARDpage";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      logout();
      // AuthGuard will automatically redirect to login page
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthGuard>
      <main style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
        <DASHBOARDpage onLogout={handleLogout} />
      </main>
    </AuthGuard>
  );
}