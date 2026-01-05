'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Brain,
  Plus,
  Send,
  Menu,
  Settings,
  LogOut,
  Trash2,
  MessageSquare,
  Sparkles,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  Bot,
  User,
  Moon,
  Sun,
  Copy,
  MoreVertical,
  Paperclip,
  EyeOff,
  Eye,
  Zap,
  Share2,
  Download,
  Link as LinkIcon,
  FileJson,
  FileText,
  Database,
  Activity,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { formatRelativeTime, generateTitle, cn } from '@/lib/utils';
import { AVAILABLE_MODELS } from '@/lib/models';
import ReactMarkdown from 'react-markdown';

// Neural Resonance Panel - shows memory influences
function NeuralResonancePanel({ memories, isOpen, onToggle }) {
  if (!memories || memories.length === 0) return null;

  const totalInfluence = memories.reduce((sum, m) => sum + (m.influence || 0), 0);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 text-xs text-amber-500 hover:text-amber-400 transition-colors mb-2">
          <Brain className="w-3 h-3" />
          <span>{memories.length} hafıza kullanıldı</span>
          <ChevronRight className={cn("w-3 h-3 transition-transform", isOpen && "rotate-90")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-500 mb-2">
            <span className="font-medium">Neural Resonance</span>
            <span>Toplam Etki: %{totalInfluence}</span>
          </div>
          {memories.map((mem, idx) => (
            <div key={mem.id || idx} className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                {mem.type === 'identity' && <User className="w-3 h-3 text-blue-400" />}
                {mem.type === 'preference' && <Sparkles className="w-3 h-3 text-pink-400" />}
                {mem.type === 'fact' && <Database className="w-3 h-3 text-green-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{mem.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={mem.influence || 0} className="h-1 flex-1" />
                  <span className="text-[10px] text-muted-foreground">%{mem.influence || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Source Badge - shows response source
function SourceBadge({ source }) {
  const config = {
    memory: { icon: Brain, label: 'Hafıza', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    api: { icon: Zap, label: 'API', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    mixed: { icon: Activity, label: 'Karma', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  };

  const { icon: Icon, label, color } = config[source] || config.api;

  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", color)}>
      <Icon className="w-2.5 h-2.5 mr-1" />
      {label}
    </Badge>
  );
}

// Message component with markdown support and source transparency
function Message({ message, isUser, showResonance }) {
  const [copied, setCopied] = useState(false);
  const [resonanceOpen, setResonanceOpen] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
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
            {isUser ? 'Sen' : 'AI-ULU'}
          </span>
          {!isUser && message.source && (
            <SourceBadge source={message.source} />
          )}
        </div>
        
        {/* Neural Resonance Panel for assistant messages */}
        {!isUser && showResonance && message.memories && message.memories.length > 0 && (
          <NeuralResonancePanel 
            memories={message.memories} 
            isOpen={resonanceOpen}
            onToggle={setResonanceOpen}
          />
        )}
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
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
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
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

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 py-6 bg-muted/30">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex items-center gap-1">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

// Skeleton loader for conversations
function ConversationSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2.5">
          <Skeleton className="w-4 h-4 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state
function EmptyState({ onSuggestionClick }) {
  const suggestions = [
    '💡 Bir proje fikirim var, yardım eder misin?',
    '📝 Bu kodu açıklar mısın?',
    '🌟 Bugün nasıl yardımcı olabilirim?',
    '🚀 Yeni bir şeyler öğrenmek istiyorum',
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
        <Brain className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-2">AI-ULU'ya Hoş Geldiniz</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Sizi hatırlayan yapay zeka asistanınız. Bir soru sorun veya önerilerden birini seçin.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSuggestionClick(suggestion.slice(2).trim())}
            className="p-4 text-left rounded-xl border-2 border-transparent bg-muted/50 hover:bg-muted hover:border-primary/20 transition-all text-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

// Conversation item in sidebar
function ConversationItem({ conv, isActive, onClick, onDelete, onRename }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conv.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== conv.title) {
      onRename(conv.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditTitle(conv.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all',
        isActive 
          ? 'bg-primary/10 text-primary' 
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      )}
      onClick={() => !isEditing && onClick(conv.id)}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0" />
      
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{conv.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(conv.updated_at)}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 h-7 w-7"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}>
                <Edit3 className="w-4 h-4 mr-2" />
                Yeniden Adlandır
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Memory settings
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showResonance, setShowResonance] = useState(true);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      await loadConversations();
      await loadMemorySettings();
      setIsLoading(false);
    };
    init();
  }, []);

  // Load memory settings
  const loadMemorySettings = async () => {
    try {
      const res = await fetch('/api/memory-settings');
      if (res.ok) {
        const data = await res.json();
        setPrivacyMode(data.privacy_mode || false);
        setShowResonance(data.show_resonance !== false);
      }
    } catch (error) {
      console.error('Load memory settings error:', error);
    }
  };

  // Save memory settings
  const saveMemorySettings = async (settings) => {
    try {
      await fetch('/api/memory-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error('Save memory settings error:', error);
    }
  };

  // Load conversations
  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Load conversation messages
  const loadConversation = async (id) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data);
        setMessages(data.messages || []);
        setSelectedModel(data.model || 'gpt-4o-mini');
      }
    } catch (error) {
      console.error('Load conversation error:', error);
      toast.error('Sohbet yüklenemedi');
    }
    setSidebarOpen(false);
  };

  // Create new conversation
  const createConversation = async (title = 'Yeni Sohbet') => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, model: selectedModel }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(prev => [data, ...prev]);
        setActiveConversation(data);
        setMessages([]);
        return data;
      }
    } catch (error) {
      console.error('Create conversation error:', error);
      toast.error('Yeni sohbet oluşturulamadı');
    }
    return null;
  };

  // Delete conversation
  const deleteConversation = async (id) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversation?.id === id) {
          setActiveConversation(null);
          setMessages([]);
        }
        toast.success('Sohbet silindi');
      }
    } catch (error) {
      console.error('Delete conversation error:', error);
      toast.error('Sohbet silinemedi');
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  // Rename conversation
  const renameConversation = async (id, title) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        setConversations(prev => 
          prev.map(c => c.id === id ? { ...c, title } : c)
        );
        if (activeConversation?.id === id) {
          setActiveConversation(prev => ({ ...prev, title }));
        }
      }
    } catch (error) {
      console.error('Rename conversation error:', error);
    }
  };

  // Share conversation
  const shareConversation = async () => {
    if (!activeConversation?.id) return;
    
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          expiresIn: 7 * 24 * 60 * 60, // 7 days
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        await navigator.clipboard.writeText(data.share_url);
        toast.success('Paylaşım linki kopyalandı!');
      } else {
        throw new Error('Failed to create share link');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Paylaşım linki oluşturulamadı');
    }
  };

  // Export conversation
  const exportConversation = async (format = 'json') => {
    if (!activeConversation?.id) return;
    
    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      
      if (res.ok) {
        if (format === 'json') {
          const data = await res.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${activeConversation.title}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${activeConversation.title}.md`;
          a.click();
          URL.revokeObjectURL(url);
        }
        toast.success('Sohbet indirildi!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Dışa aktarma başarısız');
    }
  };

  // Send message
  const sendMessage = async (content = inputValue) => {
    if (!content.trim() || isSending) return;

    const messageContent = content.trim();
    setInputValue('');
    setIsSending(true);

    let convId = activeConversation?.id;

    // Create new conversation if needed
    if (!convId) {
      const title = generateTitle(messageContent);
      const newConv = await createConversation(title);
      if (!newConv) {
        setIsSending(false);
        return;
      }
      convId = newConv.id;
    } else {
      // Update title if first message
      if (messages.length === 0) {
        const title = generateTitle(messageContent);
        await renameConversation(convId, title);
      }
    }

    // Add user message to UI
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageContent,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    // Add placeholder for assistant message
    const assistantMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      memories: [],
      source: 'api',
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          conversationId: convId,
          model: selectedModel,
          privacyMode,
        }),
      });

      if (!res.ok) {
        throw new Error('Chat request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let sourceInfo = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              // Handle source info
              if (parsed.source) {
                sourceInfo = parsed;
                setMessages(prev => 
                  prev.map(m => 
                    m.id === assistantMessage.id 
                      ? { 
                          ...m, 
                          source: parsed.source,
                          memories: parsed.memories || [],
                        } 
                      : m
                  )
                );
              }
              
              // Handle content
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMessage.id
                      ? { ...m, content: fullContent }
                      : m
                  )
                );
              }
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Refresh conversations list
      await loadConversations();
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      // Remove the failed assistant message
      setMessages(prev => prev.filter(m => m.id !== assistantMessage.id));
    } finally {
      setIsSending(false);
      setIsStreaming(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle file upload click
  const handleFileClick = () => {
    toast.info('Dosya yükleme yakında aktif olacak!');
    // fileInputRef.current?.click();
  };

  // Toggle privacy mode
  const togglePrivacyMode = () => {
    const newValue = !privacyMode;
    setPrivacyMode(newValue);
    saveMemorySettings({ privacy_mode: newValue });
    toast.success(newValue ? 'Gizlilik Modu aktif - Hafıza devre dışı' : 'Gizlilik Modu kapatıldı');
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Sidebar content (reused for mobile and desktop)
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={() => {
            setActiveConversation(null);
            setMessages([]);
            setSidebarOpen(false);
          }}
          className="w-full bg-gradient-to-r from-primary to-violet-600 hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Sohbet
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2">
        {isLoadingConversations ? (
          <ConversationSkeleton />
        ) : (
          <div className="space-y-1 pb-4">
            {conversations.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Henüz sohbet yok
              </p>
            ) : (
              conversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeConversation?.id === conv.id}
                  onClick={loadConversation}
                  onDelete={(id) => {
                    setConversationToDelete(id);
                    setDeleteDialogOpen(true);
                  }}
                  onRename={renameConversation}
                />
              ))
            )}
          </div>
        )}
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-to-br from-primary to-violet-600 text-white">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Ücretsiz Plan</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {theme === 'dark' ? 'Açık Mod' : 'Koyu Mod'}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Ayarlar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="h-screen flex bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-72 border-r bg-sidebar flex-col">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-14 border-b flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                <span className="font-semibold">
                  {activeConversation?.title || 'Yeni Sohbet'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Privacy Mode Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={privacyMode ? "default" : "ghost"}
                    size="icon"
                    onClick={togglePrivacyMode}
                    className={privacyMode ? "bg-amber-500 hover:bg-amber-600" : ""}
                  >
                    {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {privacyMode ? 'Gizlilik Modu Aktif (Hafıza kapalı)' : 'Gizlilik Modu Kapalı'}
                </TooltipContent>
              </Tooltip>

              {/* Model Selector */}
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div>
                        <p className="font-medium">{model.name}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {messages.length === 0 ? (
                <EmptyState onSuggestionClick={(text) => sendMessage(text)} />
              ) : (
                <div className="divide-y divide-border/50">
                  {messages.map((msg, idx) => (
                    <Message
                      key={msg.id || idx}
                      message={msg}
                      isUser={msg.role === 'user'}
                      showResonance={showResonance}
                    />
                  ))}
                  {isStreaming && messages[messages.length - 1]?.content === '' && (
                    <TypingIndicator />
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="max-w-3xl mx-auto">
              {/* Privacy Mode Warning */}
              {privacyMode && (
                <div className="flex items-center gap-2 text-xs text-amber-500 mb-2">
                  <EyeOff className="w-3 h-3" />
                  <span>Gizlilik Modu aktif - Bu sohbet hafızaya kaydedilmeyecek</span>
                </div>
              )}
              
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mesajınızı yazın..."
                  className="min-h-[56px] max-h-[200px] pr-24 resize-none"
                  disabled={isSending}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  {/* File Upload Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={handleFileClick}
                      >
                        <Paperclip className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Dosya Ekle (Yakında)</TooltipContent>
                  </Tooltip>
                  
                  {/* Send Button */}
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!inputValue.trim() || isSending}
                    size="icon"
                    className="h-10 w-10 bg-gradient-to-r from-primary to-violet-600 hover:opacity-90"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".txt,.pdf,.doc,.docx,.md,.json,.csv"
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Cmd</kbd>
                  {' + '}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd>
                  {' ile gönder'}
                </span>
                <span>{inputValue.length} karakter</span>
              </div>
            </div>
          </div>
        </main>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sohbeti Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu sohbeti silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm mesajlar silinecektir.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConversation(conversationToDelete)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
