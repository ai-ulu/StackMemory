'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignupForm } from '@/components/auth/SignupForm';

export const dynamic = 'force-dynamic';

function SignupContent() {
  const searchParams = useSearchParams();
  const workflow = searchParams.get('workflow') || 'claude_code';

  return (
    <AuthShell>
      <SignupForm workflow={workflow} />
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}
