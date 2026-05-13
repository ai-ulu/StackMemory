'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/auth/password';
import { getWorkflowLabel } from '@/content/workflows';
import { AuthErrorAlert } from '@/components/auth/AuthErrorAlert';
import { AuthIconInput } from '@/components/auth/AuthIconInput';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthWorkflowBadge } from '@/components/auth/AuthWorkflowBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

function SignupContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const supabase = createClient();
  const workflow = searchParams.get('workflow') || 'claude_code';
  const workflowLabel = getWorkflowLabel(workflow);

  const handleSignup = async (e) => {
    e.preventDefault();
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
  };

  if (success) {
    return (
      <AuthShell showLogo={false}>
        <Card className="w-full border-2 border-green-500/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Email Doğrulama Gerekli</CardTitle>
            <CardDescription className="text-base">
              <strong>{email}</strong> adresine bir doğrulama linki gönderdik.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Lütfen email kutunuzu kontrol edin ve linke tıklayarak hesabınızı aktifleştirin.
            </p>
            <Alert>
              <AlertDescription>
                Email gelmediyse spam klasörünü kontrol edin veya birkaç dakika bekleyin.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href={`/login?workflow=${workflow}`} className="w-full">
              <Button variant="outline" className="w-full">
                Giriş Sayfasına Dön
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Card className="border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Hesap Oluştur</CardTitle>
          <CardDescription>Ücretsiz hesabınızı oluşturun ve proje hafızanızı başlatın</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthWorkflowBadge label={workflowLabel} />
          <div className="mb-5 rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
            İlk gün için ideal kullanım: proje kurallarını kaydet, tercih ettiğin stack'i belirt, aktif işleri not et ve bunu Claude Code, Cursor, Codex-style ajanlar veya kendi uygulaman için tekrar kullan.
          </div>
          <form onSubmit={handleSignup} className="space-y-4">
            <AuthErrorAlert error={error} />

            <AuthIconInput
              id="email"
              label="Email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
            />

            <AuthIconInput
              id="password"
              label="Şifre"
              type="password"
              placeholder="En az 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
            />
            <p className="-mt-2 text-xs text-muted-foreground">Büyük harf, küçük harf ve rakam içermeli</p>

            <AuthIconInput
              id="confirmPassword"
              label="Şifre Tekrar"
              type="password"
              placeholder="Şifrenizi tekrar girin"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            Zaten hesabınız var mı? <Link href={`/login?workflow=${workflow}`} className="text-primary hover:underline font-medium">Giriş Yap</Link>
          </div>
        </CardFooter>
      </Card>
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
