/**
 * AI-ULU Memory Templates
 * 
 * Pre-defined templates for quick memory setup.
 * Helps users quickly populate their AI memory with structured data.
 */

export const MEMORY_TEMPLATES = {
  // Professional Profile
  professional: {
    id: 'professional',
    name: '💼 Profesyonel Profil',
    description: 'İş ve kariyer bilgilerinizi hızlıca ekleyin',
    icon: '💼',
    fields: [
      { key: 'job_title', label: 'İş Ünvanı', type: 'identity', placeholder: 'Örn: Yazılım Mühendisi' },
      { key: 'company', label: 'Şirket', type: 'identity', placeholder: 'Örn: ABC Teknoloji' },
      { key: 'industry', label: 'Sektör', type: 'identity', placeholder: 'Örn: Fintech' },
      { key: 'experience', label: 'Deneyim (yıl)', type: 'identity', placeholder: 'Örn: 5 yıl' },
      { key: 'skills', label: 'Yetenekler', type: 'identity', placeholder: 'Örn: Python, React, AWS' },
      { key: 'education', label: 'Eğitim', type: 'identity', placeholder: 'Örn: Bilgisayar Mühendisliği, XYZ Üniversitesi' },
      { key: 'career_goal', label: 'Kariyer Hedefi', type: 'preference', placeholder: 'Örn: CTO olmak istiyorum' },
    ],
  },

  // Personal Preferences
  personal: {
    id: 'personal',
    name: '❤️ Kişisel Tercihler',
    description: 'Günlük tercihlerinizi ve alışkanlıklarınızı kaydedin',
    icon: '❤️',
    fields: [
      { key: 'food_likes', label: 'Sevdiğiniz Yemekler', type: 'preference', placeholder: 'Örn: İtalyan mutfağı, sushi' },
      { key: 'food_dislikes', label: 'Sevmediğiniz Yemekler', type: 'preference', placeholder: 'Örn: Acı yemekler, deniz ürünleri' },
      { key: 'hobbies', label: 'Hobiler', type: 'preference', placeholder: 'Örn: Kitap okumak, yüzme, fotoğrafçılık' },
      { key: 'music', label: 'Müzik Tercihi', type: 'preference', placeholder: 'Örn: Jazz, klasik müzik' },
      { key: 'morning_person', label: 'Sabahçı/Gececi', type: 'preference', placeholder: 'Örn: Gececi, sabahları 10dan önce toplantı istemem' },
      { key: 'communication', label: 'İletişim Tercihi', type: 'preference', placeholder: 'Örn: E-posta yerine mesaj tercih ederim' },
    ],
  },

  // Technical Setup
  developer: {
    id: 'developer',
    name: '💻 Yazılımcı Profili',
    description: 'Geliştirici tercihleri ve teknik stack',
    icon: '💻',
    fields: [
      { key: 'primary_language', label: 'Ana Programlama Dili', type: 'preference', placeholder: 'Örn: TypeScript' },
      { key: 'frameworks', label: 'Framework\'ler', type: 'preference', placeholder: 'Örn: React, Next.js, FastAPI' },
      { key: 'editor', label: 'Editör/IDE', type: 'preference', placeholder: 'Örn: VS Code, dark theme' },
      { key: 'os', label: 'İşletim Sistemi', type: 'preference', placeholder: 'Örn: macOS' },
      { key: 'coding_style', label: 'Kod Stili', type: 'preference', placeholder: 'Örn: Fonksiyonel programlama tercih ederim' },
      { key: 'testing', label: 'Test Tercihi', type: 'preference', placeholder: 'Örn: TDD yaklaşımı, Jest ile test' },
      { key: 'git_workflow', label: 'Git Workflow', type: 'preference', placeholder: 'Örn: Feature branch, squash merge' },
    ],
  },

  // Learning Goals
  learning: {
    id: 'learning',
    name: '📚 Öğrenme Hedefleri',
    description: 'Öğrenmek istediğiniz konuları takip edin',
    icon: '📚',
    fields: [
      { key: 'current_learning', label: 'Şu an Öğrendiğiniz', type: 'fact', placeholder: 'Örn: Rust programlama, makine öğrenmesi' },
      { key: 'want_to_learn', label: 'Öğrenmek İstediğiniz', type: 'preference', placeholder: 'Örn: Kubernetes, sistem tasarımı' },
      { key: 'learning_style', label: 'Öğrenme Stili', type: 'preference', placeholder: 'Örn: Video izleyerek, proje yaparak' },
      { key: 'time_available', label: 'Haftalık Öğrenme Süresi', type: 'preference', placeholder: 'Örn: Haftada 10 saat' },
      { key: 'resources', label: 'Tercih Edilen Kaynaklar', type: 'preference', placeholder: 'Örn: Udemy, YouTube, kitaplar' },
    ],
  },

  // Health & Wellness
  health: {
    id: 'health',
    name: '🏥 Sağlık Bilgileri',
    description: 'Sağlık tercihleri ve kısıtlamalar',
    icon: '🏥',
    fields: [
      { key: 'diet', label: 'Beslenme Düzeni', type: 'identity', placeholder: 'Örn: Vejeteryan, gluten-free' },
      { key: 'allergies', label: 'Alerjiler', type: 'identity', placeholder: 'Örn: Fıstık alerjim var' },
      { key: 'exercise', label: 'Egzersiz Rutini', type: 'preference', placeholder: 'Örn: Haftada 3 gün koşu' },
      { key: 'sleep', label: 'Uyku Düzeni', type: 'preference', placeholder: 'Örn: 23:00-07:00 arası uyurum' },
      { key: 'medications', label: 'Düzenli İlaçlar', type: 'identity', placeholder: 'Örn: Vitamin D takviyesi' },
    ],
  },

  // Communication Preferences
  communication: {
    id: 'communication',
    name: '💬 İletişim Tercihleri',
    description: 'AI ile nasıl iletişim kurmak istediğinizi belirleyin',
    icon: '💬',
    fields: [
      { key: 'language', label: 'Tercih Edilen Dil', type: 'preference', placeholder: 'Örn: Türkçe, teknik terimleri İngilizce' },
      { key: 'tone', label: 'İletişim Tonu', type: 'preference', placeholder: 'Örn: Samimi, profesyonel' },
      { key: 'detail_level', label: 'Detay Seviyesi', type: 'preference', placeholder: 'Örn: Kısa ve öz cevaplar tercih ederim' },
      { key: 'format', label: 'Format Tercihi', type: 'preference', placeholder: 'Örn: Maddeler halinde, tablolarla' },
      { key: 'examples', label: 'Örnek Tercihi', type: 'preference', placeholder: 'Örn: Her açıklamaya kod örneği ekle' },
    ],
  },

  // Project Context
  project: {
    id: 'project',
    name: '🚀 Proje Bağlamı',
    description: 'Aktif proje bilgilerini kaydedin',
    icon: '🚀',
    fields: [
      { key: 'project_name', label: 'Proje Adı', type: 'fact', placeholder: 'Örn: AI-ULU' },
      { key: 'project_type', label: 'Proje Türü', type: 'fact', placeholder: 'Örn: SaaS, E-ticaret' },
      { key: 'tech_stack', label: 'Teknoloji Stack', type: 'fact', placeholder: 'Örn: Next.js, Supabase, OpenAI' },
      { key: 'team_size', label: 'Takım Büyüklüğü', type: 'fact', placeholder: 'Örn: 5 kişi' },
      { key: 'deadline', label: 'Deadline', type: 'fact', placeholder: 'Örn: Mart 2025' },
      { key: 'priorities', label: 'Öncelikler', type: 'preference', placeholder: 'Örn: Performans, güvenlik, UX' },
    ],
  },
};

/**
 * Get all templates
 */
export function getTemplates() {
  return Object.values(MEMORY_TEMPLATES);
}

/**
 * Get template by ID
 */
export function getTemplateById(id) {
  return MEMORY_TEMPLATES[id] || null;
}

/**
 * Generate memories from filled template
 */
export function generateMemoriesFromTemplate(templateId, data) {
  const template = MEMORY_TEMPLATES[templateId];
  if (!template) return [];

  const memories = [];

  for (const field of template.fields) {
    const value = data[field.key];
    if (value && value.trim()) {
      memories.push({
        content: `${field.label}: ${value}`,
        type: field.type,
        confidence: 0.9,
        write_source: 'template',
        write_reason: `From template: ${template.name}`,
        tags: [templateId, field.key],
      });
    }
  }

  return memories;
}

/**
 * Get suggested templates based on user type
 */
export function getSuggestedTemplates(userType) {
  const suggestions = {
    developer: ['professional', 'developer', 'project'],
    business: ['professional', 'communication', 'learning'],
    student: ['learning', 'personal', 'health'],
    default: ['professional', 'personal', 'communication'],
  };

  const templateIds = suggestions[userType] || suggestions.default;
  return templateIds.map(id => MEMORY_TEMPLATES[id]).filter(Boolean);
}

/**
 * Quick setup wizard steps
 */
export const QUICK_SETUP_STEPS = [
  {
    step: 1,
    title: 'Kim olduğunuzu söyleyin',
    description: 'Temel profesyonel bilgileriniz',
    templateId: 'professional',
    required: ['job_title'],
    optional: ['company', 'skills'],
  },
  {
    step: 2,
    title: 'Tercihlerinizi belirtin',
    description: 'AI sizinle nasıl konuşsun?',
    templateId: 'communication',
    required: ['language', 'tone'],
    optional: ['detail_level'],
  },
  {
    step: 3,
    title: 'Kişisel detaylar',
    description: 'Günlük tercihleriniz (opsiyonel)',
    templateId: 'personal',
    required: [],
    optional: ['hobbies', 'morning_person'],
  },
];
