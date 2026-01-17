/**
 * AI-ULU Memory Insights
 * 
 * AI-powered analysis of user memories.
 * Generates summaries, patterns, and actionable insights.
 */

/**
 * Generate memory health score
 */
export function calculateMemoryHealth(memories) {
  if (memories.length === 0) return { score: 0, factors: {} };

  const factors = {
    // Volume
    volumeScore: Math.min(100, memories.length * 2),
    
    // Balance (good mix of types)
    typeBalance: calculateTypeBalance(memories),
    
    // Freshness (recent memories)
    freshnessScore: calculateFreshness(memories),
    
    // Confidence (average confidence)
    confidenceScore: calculateAverageConfidence(memories),
    
    // Usage (frequently accessed)
    usageScore: calculateUsageScore(memories),
  };

  // Weighted average
  const weights = {
    volumeScore: 0.15,
    typeBalance: 0.20,
    freshnessScore: 0.25,
    confidenceScore: 0.20,
    usageScore: 0.20,
  };

  const totalScore = Object.entries(factors).reduce((sum, [key, value]) => {
    return sum + (value * (weights[key] || 0));
  }, 0);

  return {
    score: Math.round(totalScore),
    grade: getGrade(totalScore),
    factors,
    suggestions: generateHealthSuggestions(factors),
  };
}

/**
 * Generate memory summary using patterns
 */
export function generateMemorySummary(memories) {
  const summary = {
    total: memories.length,
    byType: {
      identity: { count: 0, examples: [] },
      preference: { count: 0, examples: [] },
      fact: { count: 0, examples: [] },
    },
    recentActivity: [],
    topics: [],
    timespan: null,
  };

  // Count by type
  for (const mem of memories) {
    const type = mem.type || 'fact';
    if (summary.byType[type]) {
      summary.byType[type].count++;
      if (summary.byType[type].examples.length < 3) {
        summary.byType[type].examples.push(truncate(mem.content, 50));
      }
    }
  }

  // Recent activity (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  summary.recentActivity = memories.filter(m => 
    new Date(m.created_at) >= weekAgo
  ).length;

  // Extract topics
  summary.topics = extractTopics(memories);

  // Timespan
  if (memories.length > 0) {
    const dates = memories.map(m => new Date(m.created_at));
    const oldest = new Date(Math.min(...dates));
    const newest = new Date(Math.max(...dates));
    summary.timespan = {
      start: oldest.toISOString(),
      end: newest.toISOString(),
      days: Math.ceil((newest - oldest) / (1000 * 60 * 60 * 24)),
    };
  }

  return summary;
}

/**
 * Detect patterns in memories
 */
export function detectPatterns(memories) {
  const patterns = [];

  // Time patterns
  const hourDistribution = new Array(24).fill(0);
  const dayDistribution = new Array(7).fill(0);
  
  for (const mem of memories) {
    const date = new Date(mem.created_at);
    hourDistribution[date.getHours()]++;
    dayDistribution[date.getDay()]++;
  }

  // Find peak hours
  const peakHour = hourDistribution.indexOf(Math.max(...hourDistribution));
  patterns.push({
    type: 'time',
    title: 'En Aktif Saat',
    value: `${peakHour}:00`,
    description: `Çoğu hafızanızı saat ${peakHour} civarında oluşturuyorsunuz`,
  });

  // Find peak day
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const peakDay = dayDistribution.indexOf(Math.max(...dayDistribution));
  patterns.push({
    type: 'day',
    title: 'En Aktif Gün',
    value: days[peakDay],
    description: `${days[peakDay]} günleri en çok hafıza oluşturduğunuz gün`,
  });

  // Content patterns
  const wordFrequency = {};
  for (const mem of memories) {
    const words = mem.content.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 3) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    }
  }

  const topWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => word);

  patterns.push({
    type: 'topics',
    title: 'Sık Konular',
    value: topWords.join(', '),
    description: 'Hafızalarınızda en sık geçen kelimeler',
  });

  return patterns;
}

/**
 * Generate personalized insights
 */
export function generateInsights(memories, options = {}) {
  const insights = [];
  const summary = generateMemorySummary(memories);
  const health = calculateMemoryHealth(memories);
  const patterns = detectPatterns(memories);

  // Health insight
  insights.push({
    type: 'health',
    icon: health.score >= 70 ? '✨' : health.score >= 40 ? '📊' : '⚠️',
    title: 'Hafıza Sağlığı',
    value: `${health.score}/100 (${health.grade})`,
    description: getHealthDescription(health),
    priority: health.score < 50 ? 'high' : 'medium',
  });

  // Balance insight
  const dominant = Object.entries(summary.byType)
    .sort((a, b) => b[1].count - a[1].count)[0];
  
  if (dominant[1].count > memories.length * 0.6) {
    insights.push({
      type: 'balance',
      icon: '⚖️',
      title: 'Dengesizlik',
      value: `%${Math.round(dominant[1].count / memories.length * 100)} ${dominant[0]}`,
      description: `Hafızalarınızın çoğu "${dominant[0]}" türünde. Daha dengeli bir dağılım için diğer türleri de eklemeyi deneyin.`,
      priority: 'low',
    });
  }

  // Activity insight
  if (summary.recentActivity === 0) {
    insights.push({
      type: 'activity',
      icon: '😴',
      title: 'Düşük Aktivite',
      value: 'Son 7 günde 0 hafıza',
      description: 'Son bir haftadır yeni hafıza eklememişsiniz. AI\'ınız güncel kalmak için yeni bilgilere ihtiyaç duyar!',
      priority: 'high',
    });
  } else if (summary.recentActivity > 10) {
    insights.push({
      type: 'activity',
      icon: '🔥',
      title: 'Yüksek Aktivite',
      value: `Son 7 günde ${summary.recentActivity} hafıza`,
      description: 'Harika! Hafızanızı aktif olarak güncelliyorsunuz.',
      priority: 'low',
    });
  }

  // Add patterns as insights
  for (const pattern of patterns) {
    insights.push({
      type: 'pattern',
      icon: '📈',
      title: pattern.title,
      value: pattern.value,
      description: pattern.description,
      priority: 'low',
    });
  }

  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// Helper functions
function calculateTypeBalance(memories) {
  const types = { identity: 0, preference: 0, fact: 0 };
  for (const m of memories) {
    types[m.type || 'fact']++;
  }
  
  const total = memories.length;
  const idealRatio = total / 3;
  
  let balanceScore = 100;
  for (const count of Object.values(types)) {
    const deviation = Math.abs(count - idealRatio) / idealRatio;
    balanceScore -= deviation * 20;
  }
  
  return Math.max(0, balanceScore);
}

function calculateFreshness(memories) {
  const now = new Date();
  let totalAge = 0;
  
  for (const m of memories) {
    const age = (now - new Date(m.created_at)) / (1000 * 60 * 60 * 24);
    totalAge += Math.min(age, 365); // Cap at 1 year
  }
  
  const avgAge = totalAge / memories.length;
  return Math.max(0, 100 - (avgAge / 3.65)); // 1 year = 0 score
}

function calculateAverageConfidence(memories) {
  const sum = memories.reduce((acc, m) => acc + (m.confidence || 0.7), 0);
  return (sum / memories.length) * 100;
}

function calculateUsageScore(memories) {
  const sum = memories.reduce((acc, m) => acc + Math.min(m.access_count || 0, 50), 0);
  const maxPossible = memories.length * 50;
  return (sum / maxPossible) * 100;
}

function getGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function getHealthDescription(health) {
  if (health.score >= 80) return 'Hafızanız çok sağlıklı! Harika iş çıkarıyorsunuz.';
  if (health.score >= 60) return 'Hafızanız iyi durumda. Birkaç iyileştirme yapabilirsiniz.';
  if (health.score >= 40) return 'Hafızanız ortalama. Daha fazla bilgi ekleyin ve güncelleyin.';
  return 'Hafızanız iyileştirme gerektiyor. Önerileri inceleyin.';
}

function generateHealthSuggestions(factors) {
  const suggestions = [];
  
  if (factors.volumeScore < 50) {
    suggestions.push('Daha fazla hafıza ekleyin');
  }
  if (factors.typeBalance < 60) {
    suggestions.push('Farklı türlerde hafıza ekleyin');
  }
  if (factors.freshnessScore < 50) {
    suggestions.push('Eski hafızaları güncelleyin');
  }
  if (factors.confidenceScore < 70) {
    suggestions.push('Düşük güvenilirlikli hafızaları doğrulayın');
  }
  
  return suggestions;
}

function extractTopics(memories) {
  const stopWords = new Set(['bir', 'bu', 've', 'ile', 'için', 'olan', 'gibi', 'daha', 'çok']);
  const wordCount = {};
  
  for (const mem of memories) {
    const words = mem.content.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    }
  }
  
  return Object.entries(wordCount)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function truncate(str, length) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export default {
  calculateMemoryHealth,
  generateMemorySummary,
  detectPatterns,
  generateInsights,
};
