'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Brain,
  Bot,
  User,
  Copy,
  Check,
  Clock,
  Eye,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

// Message component
function Message({ message, isUser }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Kopyalandı!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      'group flex gap-3 px-4 py-6 transition-colors',
      isUser ? 'bg-transparent' : 'bg-muted/30'
    )}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
        isUser 
          ? 'bg-gradient-to-br from-primary to-violet-600' 
          : 'bg-gradient-to-br from-emerald-500 to-teal-600'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {isUser ? 'User' : 'StackMemory'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString('tr-TR')}
          </span>
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({ children, ...props }) {
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              },
              pre({ children }) {
                return (
                  <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-4 overflow-x-auto text-sm">
                    {children}
                  </pre>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SharedPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadShared = async () => {
      try {
        const res = await fetch(`/api/share/${params.token}`);
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to load');
        }
        
        const data = await res.json();
        setData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.token) {
      loadShared();
    }
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link Geçersiz</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ana Sayfaya Dön
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">StackMemory</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Eye className="w-3 h-3" />
              {data?.view_count} görüntüleme
            </Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-8 max-w-4xl">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{data?.conversation?.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {new Date(data?.conversation?.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <Badge variant="outline">{data?.conversation?.model}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-border/50">
                {data?.messages?.map((msg, idx) => (
                  <Message
                    key={msg.id || idx}
                    message={msg}
                    isUser={msg.role === 'user'}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">
            StackMemory ile kendi hafızalı AI workflow'unuzu oluşturun
          </p>
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-primary to-violet-600">
              Ücretsiz Başla
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
