'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const settingGroups = [
  {
    title: 'Core memory behavior',
    description: 'Controls whether the app can read or write memory.',
    items: [
      ['enabled', 'Memory enabled', 'Turns the memory system on or off.'],
      ['privacyMode', 'Privacy mode', 'Stealth mode: blocks memory read and write.'],
      ['safeMode', 'Safe mode', 'Read-only mode: blocks memory writes.'],
      ['autoSave', 'Auto save', 'Allows explicit app flows to save memories automatically.'],
    ],
  },
  {
    title: 'Display and language',
    description: 'Controls how memory signals appear in the product UI.',
    items: [
      ['showResonance', 'Show resonance', 'Display memory influence and matching signals.'],
      ['showHeatmap', 'Show heatmap', 'Display density and freshness heatmap views.'],
      ['crossLanguageMemory', 'Cross-language memory', 'Align memories across languages.'],
    ],
  },
  {
    title: 'Decay',
    description: 'Controls time-based fading for unused memories.',
    items: [
      ['enableDecay', 'Enable decay', 'Let old unused memories fade over time.'],
    ],
  },
];

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-4">
      <div>
        <div className="font-medium">{label}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={Boolean(checked)} onCheckedChange={onChange} />
    </div>
  );
}

export function MemorySettingsClient() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function loadSettings() {
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const body = await parseResponse(await fetch('/api/settings/memory'));
      setSettings(body.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load settings');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const body = await parseResponse(await fetch('/api/settings/memory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      }));
      setSettings(body.settings);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/60 bg-card/60">
        <CardContent className="flex items-center justify-center gap-3 p-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {saved && (
        <Card className="border-primary/40 bg-primary/10">
          <CardContent className="p-4 text-sm">Settings saved.</CardContent>
        </Card>
      )}

      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Memory control plane</CardTitle>
                <CardDescription>Backed by the `memory_settings` table through the app service boundary.</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadSettings}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
              <Button onClick={saveSettings} disabled={saving || !settings}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {settings && settingGroups.map((group) => (
        <Card key={group.title} className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.items.map(([key, label, description]) => (
              <ToggleRow
                key={key}
                label={label}
                description={description}
                checked={settings[key]}
                onChange={(value) => setSettings({ ...settings, [key]: value })}
              />
            ))}

            {group.title === 'Decay' && (
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">Decay half-life days</div>
                    <p className="mt-1 text-sm text-muted-foreground">Recommended range: 30 to 180 days.</p>
                  </div>
                  <Badge variant="outline">{settings.decayHalfLifeDays} days</Badge>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.decayHalfLifeDays}
                  onChange={(event) => setSettings({ ...settings, decayHalfLifeDays: Number(event.target.value) })}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
