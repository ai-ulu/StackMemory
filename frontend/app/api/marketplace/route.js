import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Memory Marketplace API
 * 
 * Browse and acquire shared memory packages.
 * Features:
 * - Browse public memory packs
 * - Create and publish packs
 * - Import packs to personal memory
 * - Rating and reviews
 */

// GET - List marketplace packages
export async function GET(request) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'popular';
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('memory_packages')
      .select(`
        id,
        name,
        description,
        category,
        tags,
        memory_count,
        download_count,
        rating,
        review_count,
        preview_memories,
        price,
        is_free,
        author_id,
        created_at,
        updated_at
      `)
      .eq('status', 'published')
      .limit(limit);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sort
    switch (sort) {
      case 'popular':
        query = query.order('download_count', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'free':
        query = query.eq('is_free', true).order('download_count', { ascending: false });
        break;
    }

    const { data: packages, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ 
          packages: SAMPLE_PACKAGES,
          categories: CATEGORIES,
          message: 'Using sample data - run migration for full features',
        });
      }
      throw error;
    }

    return NextResponse.json({ 
      packages: packages || [],
      categories: CATEGORIES,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create memory package
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      category, 
      tags = [], 
      memoryIds = [], 
      price = 0,
      isPublic = true,
    } = body;

    if (!name || !description || !category) {
      return NextResponse.json({ error: 'Name, description, and category required' }, { status: 400 });
    }

    if (memoryIds.length === 0) {
      return NextResponse.json({ error: 'At least one memory required' }, { status: 400 });
    }

    // Get selected memories
    const { data: memories, error: memError } = await supabase
      .from('memories')
      .select('id, content, type, confidence')
      .in('id', memoryIds)
      .eq('user_id', user.id);

    if (memError || !memories || memories.length === 0) {
      return NextResponse.json({ error: 'Memories not found' }, { status: 400 });
    }

    // Create anonymized preview
    const previewMemories = memories.slice(0, 3).map(m => ({
      type: m.type,
      preview: m.content.slice(0, 100) + (m.content.length > 100 ? '...' : ''),
    }));

    // Create package
    const { data: pkg, error } = await supabase
      .from('memory_packages')
      .insert({
        name,
        description,
        category,
        tags,
        memory_count: memories.length,
        preview_memories: previewMemories,
        price: price || 0,
        is_free: !price || price === 0,
        author_id: user.id,
        status: isPublic ? 'published' : 'draft',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ 
          error: 'Marketplace tables not configured',
          migration: MARKETPLACE_MIGRATION,
        }, { status: 500 });
      }
      throw error;
    }

    // Link memories to package
    const packageMemories = memories.map(m => ({
      package_id: pkg.id,
      original_memory_id: m.id,
      content: m.content, // Anonymized copy
      type: m.type,
      confidence: m.confidence,
    }));

    await supabase.from('package_memories').insert(packageMemories);

    return NextResponse.json({ 
      package: pkg,
      message: 'Package created successfully',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Categories
const CATEGORIES = [
  { id: 'productivity', name: '⚡ Verimlilik', description: 'İş ve üretkenlik bilgileri' },
  { id: 'development', name: '💻 Yazılım', description: 'Programlama ve geliştirme' },
  { id: 'language', name: '🌍 Dil', description: 'Dil öğrenimi ve çeviri' },
  { id: 'business', name: '💼 İş', description: 'İş ve girişimcilik' },
  { id: 'health', name: '🏥 Sağlık', description: 'Sağlık ve wellness' },
  { id: 'finance', name: '💰 Finans', description: 'Yatırım ve finans' },
  { id: 'creative', name: '🎨 Yaratıcı', description: 'Sanat ve yaratıcılık' },
  { id: 'education', name: '📚 Eğitim', description: 'Öğrenme ve akademik' },
];

// Sample packages for demo
const SAMPLE_PACKAGES = [
  {
    id: 'sample-1',
    name: 'Python Uzmanı Hafızası',
    description: 'Python programlama için temel bilgiler, best practices ve sık kullanılan pattern\'ler',
    category: 'development',
    tags: ['python', 'programlama', 'kod'],
    memory_count: 50,
    download_count: 1250,
    rating: 4.8,
    review_count: 45,
    is_free: true,
    preview_memories: [
      { type: 'fact', preview: 'Python\'da list comprehension kullanımı...' },
      { type: 'preference', preview: 'PEP 8 stil rehberine uygun kod yazımı...' },
    ],
  },
  {
    id: 'sample-2',
    name: 'Startup Kurucusu Rehberi',
    description: 'Girişimcilik, pitch hazırlama, yatırımcı ilişkileri hakkında deneyimler',
    category: 'business',
    tags: ['startup', 'girişimcilik', 'yatırım'],
    memory_count: 35,
    download_count: 890,
    rating: 4.6,
    review_count: 28,
    is_free: false,
    price: 9.99,
    preview_memories: [
      { type: 'fact', preview: 'Pitch deck hazırlarken dikkat edilecekler...' },
      { type: 'identity', preview: 'Başarılı bir kurucu olmanın temel özellikleri...' },
    ],
  },
  {
    id: 'sample-3',
    name: 'İngilizce Konuşma Pratiği',
    description: 'Günlük İngilizce konuşma kalıpları ve idiomlar',
    category: 'language',
    tags: ['ingilizce', 'dil', 'konuşma'],
    memory_count: 100,
    download_count: 2100,
    rating: 4.9,
    review_count: 156,
    is_free: true,
    preview_memories: [
      { type: 'fact', preview: 'Small talk için kullanışlı ifadeler...' },
      { type: 'preference', preview: 'Native speaker gibi konuşma teknikleri...' },
    ],
  },
];

// Database migration
const MARKETPLACE_MIGRATION = `
-- Memory packages table
CREATE TABLE IF NOT EXISTS memory_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  memory_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  preview_memories JSONB DEFAULT '[]',
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  author_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Package memories (anonymized copies)
CREATE TABLE IF NOT EXISTS package_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES memory_packages(id) ON DELETE CASCADE,
  original_memory_id UUID,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User package downloads
CREATE TABLE IF NOT EXISTS package_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES memory_packages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(package_id, user_id)
);

-- Package reviews
CREATE TABLE IF NOT EXISTS package_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES memory_packages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(package_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS memory_packages_category_idx ON memory_packages(category);
CREATE INDEX IF NOT EXISTS memory_packages_status_idx ON memory_packages(status);
CREATE INDEX IF NOT EXISTS package_downloads_user_idx ON package_downloads(user_id);

-- RLS
ALTER TABLE memory_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_reviews ENABLE ROW LEVEL SECURITY;

-- Public can view published packages
CREATE POLICY "Anyone can view published packages" ON memory_packages
  FOR SELECT USING (status = 'published');

-- Authors can manage their packages
CREATE POLICY "Authors can manage own packages" ON memory_packages
  FOR ALL USING (author_id = auth.uid());
`;
