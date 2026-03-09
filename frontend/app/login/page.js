'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Loader2, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [workflow, setWorkflow] = useState('claude_code');
  const router = useRouter();
  const supabase = createClient();
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setWorkflow(params.get('workflow') || 'claude_code');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Lütfen email adresinizi girin');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) throw error;

      toast.success('Şifre sıfırlama linki gönderildi. Email kutunuzu kontrol edin.');
    } catch (err) {
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

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
              <CardTitle className="text-2xl">Tekrar Hoş Geldiniz</CardTitle>
              <CardDescription>Proje hafızanıza giriş yapın</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Selected workflow: {workflowLabel}
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Şifre</Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-primary hover:underline"
                    >
                      Şifremi Unuttum
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
        </div>
      </div>
    </div>
  );
}
