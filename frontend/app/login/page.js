'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';

export const dynamic = 'force-dynamic';

function LoginContent() {
  const searchParams = useSearchParams();
  const workflow = searchParams.get('workflow') || 'claude_code';

  return (
    <AuthShell>
      <LoginForm workflow={workflow} />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
