'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/auth/password';
import { getWorkflowLabel } from '@/content/workflows';
import { AuthErrorAlert } from '@/components/auth/AuthErrorAlert';
import { AuthIconInput } from '@/components/auth/AuthIconInput';
import { AuthWorkflowBadge } from '@/components/auth/AuthWorkflowBadge';
import { SignupIntroBox } from '@/components/auth/SignupIntroBox';
import { SignupSuccessCard } from '@/components/auth/SignupSuccessCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function SignupForm({ workflow = 'claude_code' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const supabase = createClient();
  const workflowLabel = getWorkflowLabel(workflow);

  async function handleSignup(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Bu email adresi zaten kayıtlı. Giriş yapmayı deneyin.');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data?.user?.identities?.length === 0) {
        setError('Bu email adresi zaten kayıtlı.');
        return;
      }

      setSuccess(true);
      toast.success('Hesap oluşturuldu! Email kutunuzu kontrol edin.');
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return <SignupSuccessCard email={email} workflow={workflow} />;
  }

  return (
    <Card className="border-2">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Hesap Oluştur</CardTitle>
        <CardDescription>Ücretsiz hesabınızı oluşturun ve proje hafızanızı başlatın</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthWorkflowBadge label={workflowLabel} />
        <SignupIntroBox />
        <form onSubmit={handleSignup} className="space-y-4">
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

          <AuthIconInput
            id="password"
            label="Şifre"
            type="password"
            placeholder="En az 8 karakter"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            icon={Lock}
          />
          <p className="-mt-2 text-xs text-muted-foreground">Büyük harf, küçük harf ve rakam içermeli</p>

          <AuthIconInput
            id="confirmPassword"
            label="Şifre Tekrar"
            type="password"
            placeholder="Şifrenizi tekrar girin"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            icon={Lock}
          />

          <Button type="submit" className="w-full bg-gradient-to-r from-primary to-violet-600 hover:opacity-90" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Hesap Oluşturuluyor...
              </>
            ) : (
              'Hesap Oluştur'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <p className="text-xs text-center text-muted-foreground">
          Hesap oluşturarak <Link href="#" className="text-primary hover:underline">Kullanım Koşullarını</Link> ve <Link href="#" className="text-primary hover:underline">Gizlilik Politikasını</Link> kabul etmiş olursunuz.
        </p>
        <div className="text-center text-sm text-muted-foreground">
          Zaten hesabınız var mı?{' '}
          <Link href={`/login?workflow=${workflow}`} className="text-primary hover:underline font-medium">
            Giriş Yap
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
