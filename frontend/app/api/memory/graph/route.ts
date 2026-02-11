import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface MemoryData {
  id: string;
  type: string;
  content: any;
  metadata: {
    timestamp: number;
    tags?: string[];
    score?: number;
    [key: string]: any;
  };
  connections?: string[];
}

/**
 * GET /api/memory/graph
 * Hafıza sisteminden bellek verilerini ve ilişkilerini getirir
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Gerçek hafıza sisteminden veri çek
    // Şimdilik demo data döndür
    const memories: MemoryData[] = generateDemoMemories();

    return NextResponse.json({
      success: true,
      memories,
      count: memories.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Memory graph error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Bellek verileri alınamadı',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}

/**
 * Demo bellek verileri oluştur
 * Gerçek implementasyonda ~/.kiro/memory/ klasöründen okunacak
 */
function generateDemoMemories(): MemoryData[] {
  const types = [
    'CONVERSATION',
    'KNOWLEDGE',
    'COMMAND',
    'PREFERENCE',
    'FEEDBACK',
    'PATTERN',
    'SOLUTION',
  ];

  const memories: MemoryData[] = [];
  const baseTime = Date.now();

  // Ana konuşma bellekleri
  for (let i = 0; i < 10; i++) {
    const id = `conv-${baseTime}-${i}`;
    memories.push({
      id,
      type: 'CONVERSATION',
      content: {
        messages: [
          { role: 'user', content: `Kullanıcı mesajı ${i}` },
          { role: 'assistant', content: `Asistan yanıtı ${i}` },
        ],
        summary: `Konuşma özeti ${i}`,
      },
      metadata: {
        timestamp: baseTime - i * 3600000,
        tags: ['conversation', `topic-${i % 3}`],
        score: 0.7 + Math.random() * 0.3,
      },
      connections: i > 0 ? [`conv-${baseTime}-${i - 1}`] : [],
    });
  }

  // Bilgi tabanı bellekleri
  for (let i = 0; i < 8; i++) {
    const id = `know-${baseTime}-${i}`;
    memories.push({
      id,
      type: 'KNOWLEDGE',
      content: {
        title: `Bilgi ${i}`,
        description: `Öğrenilen bilgi açıklaması ${i}`,
        source: 'user-interaction',
      },
      metadata: {
        timestamp: baseTime - i * 7200000,
        tags: ['knowledge', `category-${i % 4}`],
        score: 0.8 + Math.random() * 0.2,
      },
      connections: [`conv-${baseTime}-${i % 10}`],
    });
  }

  // Komut bellekleri
  for (let i = 0; i < 5; i++) {
    const id = `cmd-${baseTime}-${i}`;
    memories.push({
      id,
      type: 'COMMAND',
      content: {
        command: `npm run ${['dev', 'build', 'test', 'lint', 'start'][i]}`,
        exitCode: 0,
        duration: Math.floor(Math.random() * 5000),
      },
      metadata: {
        timestamp: baseTime - i * 1800000,
        tags: ['command', 'npm'],
        score: 0.6 + Math.random() * 0.2,
      },
      connections: [`know-${baseTime}-${i % 8}`],
    });
  }

  // Tercih bellekleri
  for (let i = 0; i < 3; i++) {
    const id = `pref-${baseTime}-${i}`;
    memories.push({
      id,
      type: 'PREFERENCE',
      content: {
        key: ['theme', 'language', 'editor'][i],
        value: ['dark', 'tr', 'vscode'][i],
      },
      metadata: {
        timestamp: baseTime - i * 86400000,
        tags: ['preference', 'user-settings'],
        score: 0.9 + Math.random() * 0.1,
      },
      connections: [],
    });
  }

  // Pattern bellekleri
  for (let i = 0; i < 4; i++) {
    const id = `pat-${baseTime}-${i}`;
    memories.push({
      id,
      type: 'PATTERN',
      content: {
        pattern: `Pattern ${i}`,
        frequency: Math.floor(Math.random() * 10) + 1,
        context: `Kullanım bağlamı ${i}`,
      },
      metadata: {
        timestamp: baseTime - i * 43200000,
        tags: ['pattern', `type-${i % 2}`],
        score: 0.75 + Math.random() * 0.25,
      },
      connections: [
        `know-${baseTime}-${i % 8}`,
        `conv-${baseTime}-${i % 10}`,
      ],
    });
  }

  return memories;
}
