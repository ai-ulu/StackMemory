'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, Clock, ArrowRight, History } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

/**
 * ConflictDialog - Çelişki Çözümü Dialog Komponenti
 * 
 * Spesifikasyon: AI-ULU Teknik Blueprint - Algoritmik Detaylandırma
 * 
 * Kullanım:
 * <ConflictDialog
 *   open={showConflict}
 *   onOpenChange={setShowConflict}
 *   oldMemory={{ id, content, type, created_at }}
 *   newMemory={{ content, type }}
 *   onResolve={(resolution) => handleResolution(resolution)}
 * />
 */
export default function ConflictDialog({
  open,
  onOpenChange,
  oldMemory,
  newMemory,
  onResolve,
  loading = false,
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [customContent, setCustomContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolution options based on Blueprint spec
  const resolutionOptions = [
    {
      id: 'update',
      label: 'Güncelleme',
      description: 'Eski bilgiyi yenisiyle değiştir',
      action: 'Eski hafıza arşive taşınır, yeni hafıza aktif olur',
    },
    {
      id: 'keep_old',
      label: 'Eski Bilgiyi Koru',
      description: 'Yeni bilgiyi iptal et, eskiyi koru',
      action: 'Yeni hafıza kaydedilmez',
    },
    {
      id: 'keep_both',
      label: 'İkisini de Koru',
      description: 'Her iki bilgi de farklı bağlamlarda geçerli',
      action: 'Her iki hafıza da aktif kalır',
    },
    {
      id: 'custom',
      label: 'Manuel Düzenleme',
      description: 'Doğru bilgiyi kendin yaz',
      action: 'Özel içerik ile yeni hafıza oluşturulur',
    },
  ];

  const handleResolve = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    
    try {
      const resolution = {
        type: selectedOption,
        oldMemoryId: oldMemory?.id,
        newContent: selectedOption === 'custom' ? customContent : newMemory?.content,
        timestamp: new Date().toISOString(),
      };
      
      await onResolve?.(resolution);
      
      // Reset state
      setSelectedOption(null);
      setCustomContent('');
      onOpenChange(false);
    } catch (error) {
      console.error('Resolution error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = selectedOption && (selectedOption !== 'custom' || customContent.trim().length > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="w-5 h-5" />
            Hafıza Çelişkisi Tespit Edildi
          </AlertDialogTitle>
          <AlertDialogDescription>
            Mevcut hafızanızla çelişen yeni bir bilgi algılandı. Nasıl devam etmek istersiniz?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Memory comparison */}
        <div className="space-y-4 my-4">
          {/* Old memory */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Mevcut Hafıza</span>
              {oldMemory?.created_at && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatRelativeTime(oldMemory.created_at)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              "{oldMemory?.content || 'Yükleniyor...'}"
            </p>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* New memory */}
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-500">Yeni Bilgi</span>
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-500">
                Şimdi
              </Badge>
            </div>
            <p className="text-sm">
              "{newMemory?.content || 'Yükleniyor...'}"
            </p>
          </div>
        </div>

        {/* Resolution options */}
        <RadioGroup
          value={selectedOption}
          onValueChange={setSelectedOption}
          className="space-y-3"
        >
          {resolutionOptions.map((option) => (
            <div
              key={option.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedOption === option.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
              onClick={() => setSelectedOption(option.id)}
            >
              <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={option.id} className="font-medium cursor-pointer">
                  {option.label}
                </Label>
                <p className="text-sm text-muted-foreground">{option.description}</p>
                <p className="text-xs text-muted-foreground mt-1 italic">
                  → {option.action}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>

        {/* Custom content input */}
        {selectedOption === 'custom' && (
          <div className="mt-4">
            <Label htmlFor="custom-content" className="text-sm">
              Doğru bilgiyi yazın:
            </Label>
            <Textarea
              id="custom-content"
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="Örn: İstanbul'da yaşıyorum ve yazılım mühendisiyim."
              className="mt-2"
              rows={3}
            />
          </div>
        )}

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isSubmitting}>
            Daha Sonra
          </AlertDialogCancel>
          <Button
            onClick={handleResolve}
            disabled={!isValid || isSubmitting || loading}
            className="bg-amber-500 hover:bg-amber-600"
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                İşleniyor...
              </>
            ) : (
              'Çelişkiyi Çöz'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for conflict detection and resolution
 */
export function useConflictResolution() {
  const [conflictState, setConflictState] = useState({
    isOpen: false,
    oldMemory: null,
    newMemory: null,
    pendingResolve: null,
  });

  const showConflict = (oldMemory, newMemory) => {
    return new Promise((resolve) => {
      setConflictState({
        isOpen: true,
        oldMemory,
        newMemory,
        pendingResolve: resolve,
      });
    });
  };

  const handleResolve = async (resolution) => {
    if (conflictState.pendingResolve) {
      conflictState.pendingResolve(resolution);
    }
    setConflictState({
      isOpen: false,
      oldMemory: null,
      newMemory: null,
      pendingResolve: null,
    });
  };

  const handleClose = () => {
    if (conflictState.pendingResolve) {
      conflictState.pendingResolve(null); // User dismissed
    }
    setConflictState({
      isOpen: false,
      oldMemory: null,
      newMemory: null,
      pendingResolve: null,
    });
  };

  return {
    ...conflictState,
    showConflict,
    handleResolve,
    handleClose,
  };
}
