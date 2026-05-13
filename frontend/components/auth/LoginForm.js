'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { AuthErrorAlert } from '@/components/auth/AuthErrorAlert';
import { AuthIconInput } from '@/components/auth/AuthIconInput';
import { AuthWorkflowBadge } from '@/components/auth/AuthWorkflowBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getWorkflowLabel } from '@/content/workflows';

export function LoginForm({ workflow = 'claude_code' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();
  const workflowLabel = getWorkflowLabel(workflow);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Email veya şifre hatalı. Lütfen kontrol edin.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Email adresinizi doğrulamadınız. Lütfen email kutunuzu kontrol edin.');
        } else {
          setError(authError.message);
        }
        return;
      }

      toast.success('Giriş başarılı!');
      router.push(`/chat?workflow=${workflow}`);
      router.refresh();
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      toast.error('Lütfen email adresinizi girin');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (resetError) throw resetError;
      toast.success('Şifre sıfırlama linki gönderildi. Email kutunuzu kontrol edin.');
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-2">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Tekrar Hoş Geldiniz</CardTitle>
        <CardDescription>Proje hafızanıza giriş yapın</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthWorkflowBadge label={workflowLabel} />
        <form onSubmit={handleLogin} className="space-y-4">
          <AuthErrorAlert error={error} />

          <AuthIconInput
            id="email"
            label="Email"
            type="email"
            placeholder="ornek@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            icon={Mail}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Şifre
              </label>
              <button type="button" onClick={handleForgotPassword} className="text-sm text-primary hover:underline">
                Şifremi Unuttum
              </button>
            </div>
            <AuthIconInput
              id="password"
              label=""
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              icon={Lock}
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-primary to-violet-600 hover:opacity-90" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Giriş Yapılıyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-center text-sm text-muted-foreground">
          Hesabınız yok mu?{' '}
          <Link href={`/signup?workflow=${workflow}`} className="text-primary hover:underline font-medium">
            Hesap Oluştur
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
