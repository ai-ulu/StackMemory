'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  MessageSquare,
  Zap,
  Shield,
  Github,
  Moon,
  Sun,
  Check
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';

// Animated memory demo component
function MemoryDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const conversation = [
    { role: 'user', text: 'Favori kahvem latte, her sabah içiyorum.', time: '2 hafta önce' },
    { role: 'assistant', text: 'Anladım! Latte\'yi not ettim. ☕', time: '2 hafta önce' },
    { role: 'user', text: 'Bugün için bir içecek önerir misin?', time: 'Bugün' },
    { 
      role: 'assistant', 
      text: 'Sabah rutininize uygun olarak bir latte öneririm! Belki bu sefer vanilyalı deneyin? 🌟', 
      time: 'Bugün',
      memory: true 
    },
  ];

  useEffect(() => {
    if (!isAnimating) return;
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= conversation.length - 1) {
          setTimeout(() => setCurrentStep(0), 2000);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [isAnimating]);

  return (
    <div className="relative bg-card border rounded-2xl p-6 shadow-2xl max-w-lg mx-auto">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <Badge variant="secondary" className="bg-primary text-primary-foreground">
          <Brain className="w-3 h-3 mr-1" />
          Canlı Demo
        </Badge>
      </div>
      
      <div className="space-y-4 min-h-[280px]">
        {conversation.slice(0, currentStep + 1).map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
          >
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : ''}`}>
              <div className="text-xs text-muted-foreground mb-1 px-1">
                {msg.time}
              </div>
              <div
                className={`rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}
              >
                {msg.memory && (
                  <div className="flex items-center gap-1 text-xs text-amber-500 mb-1">
                    <Brain className="w-3 h-3" />
                    <span>Hafıza kullanılıyor</span>
                  </div>
                )}
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-dashed">
        <p className="text-xs text-center text-muted-foreground">
          AI-ULU, 2 hafta önceki bilgiyi hatırladı ✨
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'Kalıcı Hafıza',
      description: 'Kendinizi asla tekrar etmeyin. AI-ULU tüm konuşmalarınızı hatırlar ve bağlamı korur.',
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      icon: RefreshCw,
      title: 'Çoklu Model',
      description: 'GPT-4o, Claude Sonnet, Gemini arasında geçiş yapın. Hafıza korunur.',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      icon: FileText,
      title: 'Dosya Desteği',
      description: 'Belgelerinizi ve kodlarınızı analiz edin. Yakında aktif.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  const pricingPlans = [
    {
      name: 'Ücretsiz',
      price: '0',
      description: 'Başlamak için mükemmel',
      features: [
        '100 mesaj/ay',
        'Temel hafıza',
        '2 model seçeneği',
        'Email desteği',
      ],
      cta: 'Başla',
      popular: false,
    },
    {
      name: 'Pro',
      price: '29',
      description: 'Güçlü kullanıcılar için',
      features: [
        'Sınırsız mesaj',
        'Gelişmiş hafıza',
        'Tüm modeller',
        'Dosya yükleme',
        'Öncelikli destek',
        'API erişimi',
      ],
      cta: 'Pro\'ya Geç',
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">AI-ULU</span>
          </Link>
          
          <div className="flex items-center gap-3">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            )}
            <Link href="/login">
              <Button variant="ghost">Giriş Yap</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-primary to-violet-600 hover:opacity-90">
                Ücretsiz Başla
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        
        <div className="container relative py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Yeni nesil yapay zeka deneyimi</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Sizi{' '}
                <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                  Gerçekten
                </span>{' '}
                Hatırlayan AI
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                Standart chatbot’lar her sohbette sıfırdan başlar. 
                AI-ULU ise tüm geçmiş konuşmalarınızı semantik olarak hatırlar 
                ve bağlamı hiç kaybetmez.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 text-lg h-12 px-8">
                    Hemen Dene
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-12 px-8">
                    Nasıl Çalışır?
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Anında başla</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Verileriniz güvende</span>
                </div>
              </div>
            </div>
            
            <div className="lg:pl-8">
              <MemoryDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Özellikler
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Neden AI-ULU?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Diğer AI asistanlardan farkımız, sizinle gerçek bir ilişki kurmamız.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-2 hover:border-primary/50 transition-colors group">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Nasıl Çalışır?
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Hafıza Sistemi
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Konuşun',
                desc: 'AI-ULU ile doğal bir şekilde sohbet edin. Her mesajınız otomatik olarak hafızaya alınır.',
              },
              {
                step: '2',
                title: 'Vektör Arama',
                desc: 'Yeni mesajınız gönderildiğinde, semantik benzerlik ile geçmiş bilgiler bulunur.',
              },
              {
                step: '3',
                title: 'Akıllı Yanıt',
                desc: 'AI, geçmiş bağlamı kullanarak kişiselleştirilmiş yanıt üretir.',
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Fiyatlandırma
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Basit ve Şeffaf
            </h2>
            <p className="text-muted-foreground">
              Ücretsiz başlayın, ihtiyacınız olduğunda yükseltin.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <Card key={idx} className={`relative ${plan.popular ? 'border-primary border-2 shadow-xl' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Popüler</Badge>
                  </div>
                )}
                <CardHeader className="pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/ay</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  <Link href="/signup" className="block pt-4">
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-gradient-to-r from-primary to-violet-600' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary to-violet-600 p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Hafızasız AI dönemi bitti.
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                AI-ULU ile tanışın ve bir yapay zekanın sizi gerçekten tanımasının nasıl bir şey olduğunu keşfedin.
              </p>
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="text-lg h-12 px-8">
                  Ücretsiz Hesap Oluştur
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">AI-ULU</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Gizlilik</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Kullanım Koşulları</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Destek</Link>
            </div>
            
            <div className="flex items-center gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon">
                  <Github className="w-5 h-5" />
                </Button>
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 AI-ULU. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}