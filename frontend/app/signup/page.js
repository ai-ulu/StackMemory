'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Loader2, Mail, Lock, User, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

function SignupContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const workflow = searchParams.get('workflow') || 'claude_code';
  const workflowLabel = useMemo(() => {
    const labels = {
      claude_code: 'Claude Code',
      cursor: 'Cursor',
      codex: 'Codex',
      replit: 'Replit',
      custom_app: 'Custom App / n8n',
    };
    return labels[workflow] || 'AI workflow';
  }, [workflow]);

  const validatePassword = (pass) => {
    if (pass.length < 8) return 'Şifre en az 8 karakter olmalı';
    if (!/[A-Z]/.test(pass)) return 'Şifre en az bir büyük harf içermeli';
    if (!/[a-z]/.test(pass)) return 'Şifre en az bir küçük harf içermeli';
    if (!/[0-9]/.test(pass)) return 'Şifre en az bir rakam içermeli';
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
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

      // Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        setError('Bu email adresi zaten kayıtlı.');
        return;
      }

      setSuccess(true);
      toast.success('Hesap oluşturuldu! Email kutunuzu kontrol edin.');
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <nav className="border-b">
          <div className="container flex h-16 items-center">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Ana Sayfa</span>
            </Link>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-2 border-green-500/50">
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
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full">
                  Giriş Sayfasına Dön
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <nav className="border-b">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfa</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold">StackMemory</span>
            </Link>
          </div>

          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Hesap Oluştur</CardTitle>
              <CardDescription>Ücretsiz hesabınızı oluşturun ve proje hafızanızı başlatın</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Selected workflow: {workflowLabel}
              </div>
              <div className="mb-5 rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                İlk gün için ideal kullanım:
                {' '}proje kurallarını kaydet, tercih ettiğin stack'i belirt, aktif işleri not et ve bunu Claude Code, Cursor, Codex-style ajanlar veya kendi uygulaman için tekrar kullan.
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="En az 8 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Büyük harf, küçük harf ve rakam içermeli
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Şifrenizi tekrar girin"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-violet-600 hover:opacity-90"
                  disabled={loading}
                >
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
                Hesap oluşturarak{' '}
                <Link href="#" className="text-primary hover:underline">Kullanım Koşullarını</Link>
                {' '}ve{' '}
                <Link href="#" className="text-primary hover:underline">Gizlilik Politikasını</Link>
                {' '}kabul etmiş olursunuz.
              </p>
              <div className="text-center text-sm text-muted-foreground">
                Zaten hesabınız var mı?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Giriş Yap
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}
