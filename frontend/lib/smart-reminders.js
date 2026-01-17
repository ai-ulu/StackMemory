/**
 * AI-ULU Smart Reminders
 * 
 * Memory-based intelligent reminders.
 * - Detects time-based mentions in memories
 * - Suggests reminders based on patterns
 * - Integrates with memory decay
 */

/**
 * Parse memories for time-related content
 */
export function extractTimeReferences(memories) {
  const timePatterns = [
    // Turkish patterns
    { pattern: /yarın/gi, offset: 1 },
    { pattern: /bu hafta/gi, offset: 7 },
    { pattern: /gelecek hafta/gi, offset: 14 },
    { pattern: /bu ay/gi, offset: 30 },
    { pattern: /gelecek ay/gi, offset: 60 },
    // Date patterns
    { pattern: /(\d{1,2})[\./](\d{1,2})(?:[\./](\d{2,4}))?/g, type: 'date' },
    // Deadline keywords
    { pattern: /deadline|teslim|bitiş|son tarih/gi, type: 'deadline' },
    // Meeting keywords
    { pattern: /toplantı|meeting|görüşme/gi, type: 'meeting' },
  ];

  const reminders = [];

  for (const memory of memories) {
    const content = memory.content.toLowerCase();
    
    for (const { pattern, offset, type } of timePatterns) {
      if (pattern.test(content)) {
        const reminder = {
          memoryId: memory.id,
          memoryContent: memory.content,
          type: type || 'general',
          suggestedDate: offset ? addDays(new Date(), offset) : null,
          confidence: memory.confidence || 0.7,
        };
        reminders.push(reminder);
      }
    }
  }

  return reminders;
}

/**
 * Generate smart reminder suggestions
 */
export function generateReminderSuggestions(memories, userPreferences = {}) {
  const suggestions = [];
  const now = new Date();

  // Group memories by type
  const byType = {
    identity: memories.filter(m => m.type === 'identity'),
    preference: memories.filter(m => m.type === 'preference'),
    fact: memories.filter(m => m.type === 'fact'),
  };

  // Suggest review for old identity memories (might be outdated)
  for (const mem of byType.identity) {
    const age = daysSince(mem.created_at);
    if (age > 180) { // 6 months
      suggestions.push({
        type: 'review',
        priority: 'low',
        title: 'Bilgi Güncellemesi',
        message: `"${truncate(mem.content, 50)}" bilgisi 6 aydan eski. Güncellemek ister misiniz?`,
        memoryId: mem.id,
        suggestedAction: 'update',
      });
    }
  }

  // Suggest adding more if too few memories
  if (memories.length < 10) {
    suggestions.push({
      type: 'onboarding',
      priority: 'high',
      title: 'Hafıza Geliştirme',
      message: `Henüz ${memories.length} hafızanız var. Daha fazla bilgi ekleyerek AI deneyiminizi iyileştirin.`,
      suggestedAction: 'add_memories',
    });
  }

  // Check for missing essential memories
  const hasJobInfo = byType.identity.some(m => 
    /meslek|iş|job|çalış/i.test(m.content)
  );
  if (!hasJobInfo) {
    suggestions.push({
      type: 'missing',
      priority: 'medium',
      title: 'Eksik Bilgi',
      message: 'Mesleğiniz hakkında bilgi yok. Eklemek ister misiniz?',
      suggestedAction: 'add_job_info',
    });
  }

  // Low confidence memories to verify
  const lowConfidence = memories.filter(m => (m.confidence || 0.8) < 0.6);
  if (lowConfidence.length > 0) {
    suggestions.push({
      type: 'verify',
      priority: 'low',
      title: 'Doğrulama Gerekli',
      message: `${lowConfidence.length} hafıza düşük güvenilirliğe sahip. Doğrulamak ister misiniz?`,
      memories: lowConfidence.map(m => m.id),
      suggestedAction: 'verify_memories',
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Create reminder from memory
 */
export function createReminderFromMemory(memory, options = {}) {
  return {
    id: crypto.randomUUID(),
    memoryId: memory.id,
    title: options.title || `Hatırlatma: ${truncate(memory.content, 30)}`,
    description: memory.content,
    dueDate: options.dueDate || addDays(new Date(), 1),
    repeatInterval: options.repeat || null, // 'daily', 'weekly', 'monthly'
    priority: options.priority || 'medium',
    status: 'active',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Check due reminders
 */
export function checkDueReminders(reminders) {
  const now = new Date();
  return reminders.filter(r => {
    if (r.status !== 'active') return false;
    const dueDate = new Date(r.dueDate);
    return dueDate <= now;
  });
}

// Utility functions
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysSince(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - date) / (1000 * 60 * 60 * 24));
}

function truncate(str, length) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export default {
  extractTimeReferences,
  generateReminderSuggestions,
  createReminderFromMemory,
  checkDueReminders,
};
