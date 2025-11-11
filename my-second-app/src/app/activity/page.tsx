"use client";

import React from 'react';
import ACTIVITYpage from '@/components/ACTIVITYpage';
import AuthGuard from '@/components/AuthGuard';

export default function ActivityPage() {
  return (
    <AuthGuard>
      <ACTIVITYpage />
    </AuthGuard>
  );
}
