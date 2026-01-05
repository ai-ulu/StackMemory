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
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Clock,
  History,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Lock,
  Gauge,
  Globe,
  Timer,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

// Memory card with version history
function MemoryCard({ memory, onDelete, onRestore }) {
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const loadVersions = async () => {
    if (versions.length > 0) return;
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/memories/${memory.id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (e) {
      console.error('Load versions error:', e);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestore = async (version) => {
    try {
      const res = await fetch(`/api/memories/${memory.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });
      if (res.ok) {
        toast.success(`Version ${version} restored`);
        onRestore?.();
      }
    } catch (e) {
      toast.error('Restore failed');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'identity': return <User className="w-4 h-4 text-blue-400" />;
      case 'preference': return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'fact': return <Database className="w-4 h-4 text-green-400" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'pending': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
      case 'deprecated': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Deprecated</Badge>;
      default: return null;
    }
  };

  const decayPercentage = Math.round((memory.decay_factor || 1) * 100);

  return (
    <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {getTypeIcon(memory.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm">{memory.content}</p>
            
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {getStatusBadge(memory.status)}
              <Badge variant="outline" className="text-xs">{memory.type}</Badge>
              <Badge variant="outline" className="text-xs">{memory.scope}</Badge>
              {memory.version > 1 && (
                <Badge variant="outline" className="text-xs">
                  <History className="w-3 h-3 mr-1" />
                  v{memory.version}
                </Badge>
              )}
            </div>

            {/* Confidence & Decay */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Confidence</span>
                <Progress value={memory.confidence * 100} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground w-10">{Math.round(memory.confidence * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Freshness</span>
                <Progress 
                  value={decayPercentage} 
                  className="h-1.5 flex-1"
                />
                <span className="text-xs text-muted-foreground w-10">{decayPercentage}%</span>
              </div>
            </div>

            {/* Write Intent Info */}
            {memory.write_intent && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  {memory.write_intent} via {memory.write_source}
                </span>
              </div>
            )}

            {/* Access stats */}
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {memory.access_count || 0} accesses
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(memory.last_accessed_at || memory.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Version History */}
          <Collapsible open={showVersions} onOpenChange={(open) => {
            setShowVersions(open);
            if (open) loadVersions();
          }}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <History className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Memory</AlertDialogTitle>
                <AlertDialogDescription>
                  This memory will be shadow-deleted (hidden but retained for audit purposes).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(memory.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Version History Panel */}
      <Collapsible open={showVersions}>
        <CollapsibleContent>
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <History className="w-4 h-4" />
              Version History
            </h4>
            {loadingVersions ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : versions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No previous versions</p>
            ) : (
              <div className="space-y-2">
                {versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs">
                    <div>
                      <span className="font-medium">v{v.version}</span>
                      <span className="text-muted-foreground ml-2">
                        {formatRelativeTime(v.created_at)}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        ({v.change_type})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => handleRestore(v.version)}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

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
    safe_mode: false,
    auto_save: true,
    show_resonance: true,
    show_heatmap: true,
    cross_language_memory: true,
    preferred_language: 'en',
    enable_decay: true,
    decay_half_life_days: 90,
  });
  
  // Memories
  const [memories, setMemories] = useState([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [memoryFilter, setMemoryFilter] = useState('all');

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
        toast.success('Settings saved');
      }
    } catch (error) {
      toast.error('Failed to save settings');
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
        toast.success('Memory shadow-deleted');
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredMemories = memories.filter(m => {
    if (memoryFilter === 'all') return true;
    return m.type === memoryFilter;
  });

  const memoryStats = {
    total: memories.length,
    identity: memories.filter(m => m.type === 'identity').length,
    preference: memories.filter(m => m.type === 'preference').length,
    fact: memories.filter(m => m.type === 'fact').length,
    avgConfidence: memories.length ? (memories.reduce((sum, m) => sum + m.confidence, 0) / memories.length * 100).toFixed(0) : 0,
    avgDecay: memories.length ? (memories.reduce((sum, m) => sum + (m.decay_factor || 1), 0) / memories.length * 100).toFixed(0) : 100,
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
      <nav className="border-b sticky top-0 bg-background/80 backdrop-blur z-10">
        <div className="container flex h-16 items-center gap-4">
          <Link href="/chat" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat</span>
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
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <Tabs defaultValue="memory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="memory">
              <Brain className="w-4 h-4 mr-2" />
              Memory
            </TabsTrigger>
            <TabsTrigger value="memories">
              <Database className="w-4 h-4 mr-2" />
              My Memories
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Sun className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Memory Settings Tab */}
          <TabsContent value="memory" className="space-y-6">
            {/* Core Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Hafıza Kontrolleri
                </CardTitle>
                <CardDescription>
                  Temel hafıza sistemi ayarları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Memory Enabled */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Hafıza Sistemi</Label>
                    <p className="text-sm text-muted-foreground">AI'nin sizi hatırlamasını sağlayın</p>
                  </div>
                  <Switch
                    checked={memorySettings.enabled}
                    onCheckedChange={(checked) => 
                      setMemorySettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>

                <Separator />

                {/* Privacy Mode (Stealth) */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-amber-500" />
                      Gizlilik Modu (Stealth)
                    </Label>
                    <p className="text-sm text-muted-foreground">Okuma yok, yazma yok, rezonans yok</p>
                  </div>
                  <Switch
                    checked={memorySettings.privacy_mode}
                    onCheckedChange={(checked) => 
                      setMemorySettings(prev => ({ ...prev, privacy_mode: checked }))
                    }
                  />
                </div>

                {/* Safe Mode */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      Güvenli Mod
                    </Label>
                    <p className="text-sm text-muted-foreground">Okuma izinli, yazma tamamen devre dışı</p>
                  </div>
                  <Switch
                    checked={memorySettings.safe_mode}
                    onCheckedChange={(checked) => 
                      setMemorySettings(prev => ({ ...prev, safe_mode: checked }))
                    }
                  />
                </div>

                {/* Auto Save */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Otomatik Kayıt</Label>
                    <p className="text-sm text-muted-foreground">Önemli bilgileri otomatik kaydet</p>
                  </div>
                  <Switch
                    checked={memorySettings.auto_save}
                    onCheckedChange={(checked) => 
                      setMemorySettings(prev => ({ ...prev, auto_save: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Görünüm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Show Resonance */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nöral Rezonans</Label>
                    <p className="text-sm text-muted-foreground">Hangi hafızaların yanıtı etkilediğini göster</p>
                  </div>
                  <Switch
                    checked={memorySettings.show_resonance}
                    onCheckedChange={(checked) => 
                      setMemorySettings(prev => ({ ...prev, show_resonance: checked }))
                    }
                  />
                </div>

                {/* Show Heatmap */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Hafıza Isı Haritası</Label>
                    <p className="text-sm text-muted-foreground">Etki yüzdelerini görselleştir</p>
                  </div>
                  <Switch
                    checked={memorySettings.show_heatmap}
                    onCheckedChange={(checked) => 
                      setMemorySettings(prev => ({ ...prev, show_heatmap: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Decay Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Hafıza Çürümesi
                </CardTitle>
                <CardDescription>
                  Kullanılmayan hafızalar zamanla etki kaybeder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Çürümeyi Etkinleştir</Label>
                    <p className="text-sm text-muted-foreground">Taze hafızalar daha fazla etkiye sahip</p>
                  </div>
                  <Switch
                    checked={memorySettings.enable_decay}
                    onCheckedChange={(checked) => 
                      setMemorySettings(prev => ({ ...prev, enable_decay: checked }))
                    }
                  />
                </div>

                {memorySettings.enable_decay && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Yarı Ömür (gün)</Label>
                      <span className="text-sm text-muted-foreground">
                        {memorySettings.decay_half_life_days} gün
                      </span>
                    </div>
                    <Slider
                      value={[memorySettings.decay_half_life_days]}
                      onValueChange={([value]) => 
                        setMemorySettings(prev => ({ ...prev, decay_half_life_days: value }))
                      }
                      min={7}
                      max={365}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Hafızalar {memorySettings.decay_half_life_days} gün erişim olmazsa %50 etki kaybeder
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Language */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Dil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Diller Arası Hafıza</Label>
                    <p className="text-sm text-muted-foreground">Semantik hafızaları diller arasında paylaş</p>
                  </div>
                  <Switch
                    checked={memorySettings.cross_language_memory}
                    onCheckedChange={(checked) => 
                      setMemorySettings(prev => ({ ...prev, cross_language_memory: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Tercih Edilen Dil</Label>
                  <Select
                    value={memorySettings.preferred_language}
                    onValueChange={(value) => 
                      setMemorySettings(prev => ({ ...prev, preferred_language: value }))
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="tr">Türkçe</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button onClick={saveMemorySettings} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Ayarları Kaydet
                </>
              )}
            </Button>
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
                  <div className="flex items-center gap-2">
                    <Select value={memoryFilter} onValueChange={setMemoryFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Filtre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tümü</SelectItem>
                        <SelectItem value="identity">Kimlik</SelectItem>
                        <SelectItem value="preference">Preference</SelectItem>
                        <SelectItem value="fact">Fact</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant="outline">{filteredMemories.length}</Badge>
                  </div>
                </CardTitle>
                <CardDescription>
                  View, manage, and restore memory versions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{memoryStats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{memoryStats.avgConfidence}%</p>
                    <p className="text-xs text-muted-foreground">Avg Confidence</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{memoryStats.avgDecay}%</p>
                    <p className="text-xs text-muted-foreground">Avg Freshness</p>
                  </div>
                </div>

                {loadingMemories ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : filteredMemories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No memories yet</p>
                    <p className="text-sm">Chat with AI to build your memory</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {filteredMemories.map((memory) => (
                        <MemoryCard
                          key={memory.id}
                          memory={memory}
                          onDelete={deleteMemory}
                          onRestore={loadMemories}
                        />
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
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable dark theme</p>
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
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={saving || !newPassword || !confirmPassword}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Account ID</Label>
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
