'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Sparkles, 
  ArrowRight, 
  Zap,
  Shield,
  Github,
  Moon,
  Sun,
  Check,
  Play,
  Users,
  Building2,
  Globe,
  Lock,
  Share2,
  Download,
  Smartphone,
  Monitor,
  RefreshCw,
  Eye,
  Database,
  Cpu,
  Network,
  ChevronRight,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

// Animated Brain Network Component
function BrainNetwork() {
  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
      {/* Glowing background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-violet-500/20 to-cyan-500/20 blur-3xl rounded-full" />
      
      {/* Brain icon with glow */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
        <div className="relative w-48 h-48 md:w-64 md:h-64">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-primary to-cyan-500 rounded-3xl rotate-6 opacity-80" />
          <div className="absolute inset-2 bg-background/90 backdrop-blur rounded-2xl flex items-center justify-center">
            <Brain className="w-24 h-24 md:w-32 md:h-32 text-primary" />
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 animate-bounce">
          <Database className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -bottom-4 -left-12 w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 animate-pulse">
          <Cpu className="w-7 h-7 text-white" />
        </div>
        <div className="absolute top-1/2 -right-16 w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Network className="w-6 h-6 text-white" />
        </div>
        
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'scale(2)' }}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, gradient }) {
  return (
    <Card className="group relative overflow-hidden border-2 border-transparent hover:border-primary/30 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${gradient}`} />
      <CardHeader className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <CardDescription className="text-base text-muted-foreground">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

// Trusted By Logo Component
function TrustedLogo({ name }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
      <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
        <Building2 className="w-4 h-4" />
      </div>
      <span className="font-medium">{name}</span>
    </div>
  );
}

// Mobile Mockup Component
function MobileMockup() {
  return (
    <div className="relative mx-auto w-64 md:w-72">
      {/* Phone frame */}
      <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[3rem] p-2 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-zinc-900 rounded-b-2xl" />
        <div className="bg-background rounded-[2.5rem] overflow-hidden">
          {/* Status bar */}
          <div className="h-6 bg-background flex items-center justify-between px-6 text-xs">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-foreground/50 rounded-sm" />
            </div>
          </div>
          {/* App content */}
          <div className="h-[400px] bg-gradient-to-b from-background to-muted/30 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6 text-primary" />
              <span className="font-semibold">AI-ULU</span>
            </div>
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-2xl rounded-bl-md p-3 max-w-[80%]">
                <p className="text-xs">Merhaba! Bugün size nasıl yardımcı olabilirim?</p>
              </div>
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md p-3 max-w-[80%] ml-auto">
                <p className="text-xs">Dün konuştuğumuz projeye devam edelim</p>
              </div>
              <div className="bg-muted/50 rounded-2xl rounded-bl-md p-3 max-w-[80%]">
                <div className="flex items-center gap-1 text-amber-500 text-[10px] mb-1">
                  <Brain className="w-3 h-3" />
                  <span>2 hafıza kullanılıyor</span>
                </div>
                <p className="text-xs">Tabii! E-ticaret projesi için React Native kullanmaya karar vermiştiniz...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-violet-500/20 to-cyan-500/20 blur-2xl -z-10 rounded-full" />
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
      title: 'Smart Capture',
      description: 'Düşüncelerinizi, görevlerinizi ve bilgilerinizi akıllıca yakalayın ve organize edin. AI otomatik olarak önemli bilgileri hafızaya alır.',
      gradient: 'from-violet-500/5 to-transparent',
    },
    {
      icon: RefreshCw,
      title: 'Contextual Recall',
      description: 'Semantik benzerlik ile geçmiş konuşmalarınızı anında hatırlayın. Doğru bilgiye doğru zamanda ulaşın.',
      gradient: 'from-cyan-500/5 to-transparent',
    },
    {
      icon: Sparkles,
      title: 'Personalized Insights',
      description: 'Kişiselleştirilmiş öneriler ve içgörüler alın. AI sizin çalışma tarzınızı ve tercihlerinizi öğrenir.',
      gradient: 'from-amber-500/5 to-transparent',
    },
  ];

  const securityFeatures = [
    { icon: Lock, title: 'End-to-End Encryption', desc: 'Verileriniz her zaman şifreli' },
    { icon: Shield, title: 'Zero Trust Security', desc: 'Hiçbir şeye varsayılan güven yok' },
    { icon: Eye, title: 'Full Transparency', desc: 'Her erişim loglanır' },
    { icon: Users, title: 'Role-Based Access', desc: 'Granüler izin kontrolü' },
  ];

  const plans = [
    {
      name: 'Free',
      price: '0',
      description: 'Bireysel kullanım için',
      features: ['100 mesaj/ay', 'Temel hafıza', '2 model', 'Email desteği'],
      cta: 'Ücretsiz Başla',
      popular: false,
    },
    {
      name: 'Pro',
      price: '29',
      description: 'Profesyoneller için',
      features: ['Sınırsız mesaj', 'Gelişmiş hafıza', 'Tüm modeller', 'Dosya yükleme', 'API erişimi', 'Öncelikli destek'],
      cta: 'Pro\'ya Geç',
      popular: true,
    },
    {
      name: 'Team',
      price: '79',
      description: 'Ekipler için',
      features: ['Pro özellikleri', 'Paylaşımlı hafıza', 'Ekip yönetimi', 'SSO entegrasyonu', 'Admin paneli', 'SLA garantisi'],
      cta: 'İletişime Geç',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">AI-ULU</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
          </div>
          
          <div className="flex items-center gap-3">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-xl"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            )}
            <Link href="/login">
              <Button variant="ghost" className="rounded-xl">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-xl bg-gradient-to-r from-primary via-violet-600 to-cyan-600 hover:opacity-90 shadow-lg shadow-primary/30">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-violet-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20 px-4 py-2 rounded-full text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Your Personal AI Memory Assistant</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Remember{' '}
                <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                  Everything
                </span>
                ,{' '}
                <br />
                Effortlessly.
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                Securely capture, organize, and recall all your important thoughts, tasks, and information with advanced AI. Available on all devices.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-primary via-violet-600 to-cyan-600 hover:opacity-90 text-lg h-14 px-8 shadow-xl shadow-primary/30">
                    Try for Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-xl text-lg h-14 px-8 border-2">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span>Free forever plan</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <BrainNetwork />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="container">
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Trusted by innovative companies</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <TrustedLogo name="TechFlow" />
            <TrustedLogo name="GlobalData" />
            <TrustedLogo name="FutureMind" />
            <TrustedLogo name="NeuralSoft" />
            <TrustedLogo name="DataPrime" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-1">
              Key Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Supercharge Your Memory
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              AI-powered tools to capture, organize, and recall everything that matters to you.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 px-4 py-1">
                Enterprise Ready
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Built for Teams & Organizations
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Güvenli ekip işbirliği, paylaşımlı hafıza havuzları ve gelişmiş yönetim özellikleri ile kurumsal ihtiyaçlarınızı karşılayın.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: Users, title: 'Team Workspaces', desc: 'Ekip bazlı hafıza havuzları' },
                  { icon: Share2, title: 'Smart Sharing', desc: 'Güvenli sohbet paylaşımı ve export' },
                  { icon: Lock, title: 'Privacy Controls', desc: 'Granüler erişim kontrolleri' },
                  { icon: Building2, title: 'Organization-wide', desc: 'Şirket genelinde bilgi yönetimi' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-card/50 backdrop-blur border hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              {/* Dashboard mockup */}
              <div className="relative bg-card rounded-2xl border shadow-2xl overflow-hidden">
                <div className="h-10 bg-muted/50 flex items-center gap-2 px-4 border-b">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Team Dashboard</h3>
                    <Badge>Pro</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-2xl font-bold">1,234</p>
                      <p className="text-xs text-muted-foreground">Memories</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-xs text-muted-foreground">Team Members</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-2xl font-bold">98%</p>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm">Team memory pool synced</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">3 active conversations</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-violet-500/10 to-cyan-500/10 blur-2xl -z-10 rounded-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* PWA & Mobile Section */}
      <section className="py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <MobileMockup />
            </div>
            
            <div className="order-1 lg:order-2">
              <Badge variant="secondary" className="mb-4 px-4 py-1">
                <Smartphone className="w-3 h-3 mr-1" />
                PWA Ready
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                PWA-Ready & Mobile-Responsive
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Access AI-ULU anywhere, on any device. Seamless web and mobile experience with offline support.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Smartphone, title: 'Mobile First', desc: 'Touch-optimized interface' },
                  { icon: Monitor, title: 'Desktop App', desc: 'Full-featured desktop experience' },
                  { icon: Globe, title: 'Offline Mode', desc: 'Work without internet' },
                  { icon: Zap, title: 'Fast Sync', desc: 'Real-time synchronization' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <item.icon className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-1">
              <Shield className="w-3 h-3 mr-1" />
              Enterprise Security
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Zero Trust Security Model
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Your data is protected with bank-grade encryption and strict access controls.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityFeatures.map((item, idx) => (
              <Card key={idx} className="text-center border-2 hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-1">
              Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground">
              Start free, upgrade when you need more.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, idx) => (
              <Card key={idx} className={`relative ${plan.popular ? 'border-primary border-2 shadow-xl shadow-primary/20' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-violet-600">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-8 text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  <Link href="/signup" className="block pt-4">
                    <Button 
                      className={`w-full rounded-xl ${plan.popular ? 'bg-gradient-to-r from-primary to-violet-600' : ''}`}
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
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-violet-600 to-cyan-600" />
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative p-12 md:p-16 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to boost your memory?
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto text-lg">
                Join thousands of users who never forget important information again.
              </p>
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="rounded-xl text-lg h-14 px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">AI-ULU</span>
              </Link>
              <p className="text-muted-foreground text-sm max-w-xs">
                Your personal AI memory assistant. Remember everything, effortlessly.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Changelog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">GDPR</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 AI-ULU. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
