'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import {
  Brain,
  ArrowLeft,
  User,
  Moon,
  Sun,
  Shield,
  Loader2,
  Save,
  Database,
  Trash2,
  Eye,
  EyeOff,
  Activity,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Memory settings
  const [memorySettings, setMemorySettings] = useState({
    enabled: true,
    privacy_mode: false,
    auto_save: true,
    show_resonance: true,
  });
  
  // Memories list
  const [memories, setMemories] = useState([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      await loadMemorySettings();
      await loadMemories();
      setLoading(false);
    };
    init();
  }, []);

  const loadMemorySettings = async () => {
    try {
      const res = await fetch('/api/memory-settings');
      if (res.ok) {
        const data = await res.json();
        setMemorySettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const saveMemorySettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/memory-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memorySettings),
      });
      if (res.ok) {
        toast.success('Ayarlar kaydedildi');
      }
    } catch (error) {
      toast.error('Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const loadMemories = async () => {
    setLoadingMemories(true);
    try {
      const res = await fetch('/api/memories');
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (error) {
      console.error('Load memories error:', error);
    } finally {
      setLoadingMemories(false);
    }
  };

  const deleteMemory = async (id) => {
    try {
      const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMemories(prev => prev.filter(m => m.id !== id));
        toast.success('Hafıza silindi (gölge olarak saklandı)');
      }
    } catch (error) {
      toast.error('Hafıza silinemedi');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Şifre en az 8 karakter olmalı');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Şifre başarıyla güncellendi');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Şifre güncellenemedi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getMemoryTypeIcon = (type) => {
    switch (type) {
      case 'identity': return <User className="w-4 h-4 text-blue-400" />;
      case 'preference': return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'fact': return <Database className="w-4 h-4 text-green-400" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Aktif</Badge>;
      case 'pending': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Beklemede</Badge>;
      case 'deprecated': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Devre Dışı</Badge>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b">
        <div className="container flex h-16 items-center gap-4">
          <Link href="/chat" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Sohbete Dön</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">AI-ULU</span>
          </div>
        </div>
      </nav>

      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Ayarlar</h1>

        <Tabs defaultValue="memory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="memory">
              <Brain className="w-4 h-4 mr-2" />
              Hafıza
            </TabsTrigger>
            <TabsTrigger value="memories">
              <Database className="w-4 h-4 mr-2" />
              Hafızalarım
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Sun className="w-4 h-4 mr-2" />
              Görünüm
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Güvenlik
            </TabsTrigger>
          </TabsList>

          {/* Memory Settings Tab */}
          <TabsContent value="memory">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Hafıza Ayarları
                </CardTitle>
                <CardDescription>
                  Memory-First Architecture ayarlarını yönetin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Memory Enabled */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Hafıza Sistemi</Label>
                    <p className="text-sm text-muted-foreground">
                      AI'ın sizi hatırlamasını sağlar
                    </p>
                  </div>
                  <Switch
                    checked={memorySettings.enabled}
                    onCheckedChange={(checked) => 
                      setMemorySettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>

                {/* Privacy Mode */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-amber-500" />
                      Gizlilik Modu (Stealth)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Aktifken hiçbir veri okunmaz veya yazılmaz
                    </p>
                  </div>
                  <Switch
                    checked={memorySettings.privacy_mode}
                    onCheckedChange={(checked) => 
                      setMemorySettings(prev => ({ ...prev, privacy_mode: checked }))
                    }
                  />
                </div>

                {/* Auto Save */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Otomatik Kayıt</Label>
                    <p className="text-sm text-muted-foreground">
                      Önemli bilgileri otomatik olarak hafızaya al
                    </p>
                  </div>
                  <Switch
                    checked={memorySettings.auto_save}
                    onCheckedChange={(checked) => 
                      setMemorySettings(prev => ({ ...prev, auto_save: checked }))
                    }
                  />
                </div>

                {/* Show Resonance */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-500" />
                      Neural Resonance Gösterimi
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Yanıtlarda hangi hafızaların kullanıldığını göster
                    </p>
                  </div>
                  <Switch
                    checked={memorySettings.show_resonance}
                    onCheckedChange={(checked) => 
                      setMemorySettings(prev => ({ ...prev, show_resonance: checked }))
                    }
                  />
                </div>

                <Button onClick={saveMemorySettings} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Kaydet
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Memories List Tab */}
          <TabsContent value="memories">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Hafızalarım
                  </span>
                  <Badge variant="outline">{memories.length} kayıt</Badge>
                </CardTitle>
                <CardDescription>
                  AI'ın sizin hakkınızda hatırladıkları
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMemories ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : memories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz hafıza kaydı yok</p>
                    <p className="text-sm">AI ile sohbet ettikçe burada görünecek</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {memories.map((memory) => (
                        <div
                          key={memory.id}
                          className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {getMemoryTypeIcon(memory.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">{memory.content}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {getStatusBadge(memory.status)}
                                  <Badge variant="outline" className="text-xs">
                                    {memory.type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Güven: %{Math.round(memory.confidence * 100)}
                                  </span>
                                </div>
                                <Progress 
                                  value={memory.confidence * 100} 
                                  className="h-1 mt-2 w-32" 
                                />
                              </div>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hafızayı Sil</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu hafıza silinecek ancak gölge olarak saklanacak (Shadow Memory).
                                    Bir daha asla kullanılmayacak.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMemory(memory.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Sil
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Görünüm</CardTitle>
                <CardDescription>
                  Uygulamanın görünümünü özelleştirin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Koyu Mod</Label>
                    <p className="text-sm text-muted-foreground">
                      Koyu temayı etkinleştirin
                    </p>
                  </div>
                  {mounted && (
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Şifre Değiştir</CardTitle>
                <CardDescription>
                  Hesabınızın şifresini güncelleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Yeni Şifre</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="En az 8 karakter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Şifreyi tekrar girin"
                    />
                  </div>
                  <Button type="submit" disabled={saving || !newPassword || !confirmPassword}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Şifreyi Güncelle
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Hesap Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Hesap ID</Label>
                  <Input value={user?.id || ''} disabled className="font-mono text-sm" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
