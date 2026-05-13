export const builderQuickStarts = [
  {
    title: 'n8n memory write',
    description: 'Capture a project rule or preference from any workflow node.',
    code: `POST /v1/memory\nAuthorization: Bearer ulu_full_xxx\n{\n  "content": "Prefer small diffs and TypeScript-first changes",\n  "type": "preference"\n}`,
  },
  {
    title: 'n8n memory search',
    description: 'Recall prior project context before triggering an agent step.',
    code: `POST /v1/search\nAuthorization: Bearer ulu_full_xxx\n{\n  "query": "active project constraints",\n  "limit": 5\n}`,
  },
  {
    title: 'Custom app bridge query',
    description: 'Ask the bridge for reusable project memory inside your own AI app.',
    code: `POST /v1/query\nAuthorization: Bearer ulu_full_xxx\n{\n  "query": "What should this coding agent remember?",\n  "source": "custom_app"\n}`,
  },
];

export const demoScenarios = [
  {
    badge: 'Tool Handoff',
    title: 'Claude Code -> Cursor handoff',
    description: 'Bir ajan oturumunda aldigin kararlar, bir sonraki editor oturumuna tekrar prompt yazmadan tasinsin.',
    steps: [
      'Claude Code ile repo kurallari, aktif TODOlar ve son mimari karari hafizaya yaz.',
      'Cursor oturumu acilmadan once ayni proje icin memory query calistir.',
      'Yeni oturum, mevcut task ve kurallari tekrar anlatmadan dogru baglamla baslasin.',
    ],
    ctaHref: '/signup?workflow=claude_code',
    ctaLabel: 'Start Claude Code flow',
  },
  {
    badge: 'Cloud IDE',
    title: 'Replit -> Codex-style prompt memory',
    description: 'Cloud IDE icindeki build notlari ve runtime kisitlari, sonraki ajan promptlarina kalici baglam olarak girsin.',
    steps: [
      'Replit icinde deployment notlari, env beklentileri ve runtime limitlerini kaydet.',
      'Codex-style agent calismadan once proje hafizasindan kisa prompt base uret.',
      'Yeni ajan, stack ve deploy kisitlarini tekrar sormadan ise baslasin.',
    ],
    ctaHref: '/signup?workflow=replit',
    ctaLabel: 'Start Replit flow',
  },
  {
    badge: 'Builder',
    title: 'Custom App / n8n -> memory write + recall',
    description: 'Kendi uygulaman veya workflow pipeline’in icinde durable memory yaz ve her agent step oncesi geri cagir.',
    steps: [
      'Bridge API ile project rules veya user preferences kaydet.',
      'Bir sonraki n8n node veya custom agent step oncesi /v1/search veya /v1/query kullan.',
      "Her onemli karar sonrasi yeni durable context'i tekrar StackMemory'ye yaz.",
    ],
    ctaHref: '/integrations',
    ctaLabel: 'Open builder guide',
  },
];

export const workflowTargets = [
  {
    key: 'claude_code',
    name: 'Claude Code',
    desc: 'Repo kurallari, aktif TODOlar ve karar gecmisini tekrar anlatmadan surdur.',
  },
  {
    key: 'cursor',
    name: 'Cursor',
    desc: 'Ayni proje tercihlerini editor icinde ve chat oturumlarinda paylas.',
  },
  {
    key: 'codex',
    name: 'Codex',
    desc: 'Tekrar eden prompt yerine kalici project context ve rule set kullan.',
  },
  {
    key: 'replit',
    name: 'Replit',
    desc: 'Cloud IDE ve agent akislarinda ayni hafizayi koru.',
  },
  {
    key: 'custom_app',
    name: 'Bolt / Lovable',
    desc: 'Hizli urun prototiplemede teknik kararlarini ve stack tercihlerini tasi.',
  },
  {
    key: 'custom_app',
    name: 'Custom App / n8n',
    desc: 'API, MCP veya bridge ile kendi agent pipelineina memory backend ekle.',
  },
];

export const proofPoints = [
  'Shared memory across Claude Code, Cursor, Codex-style agents, Replit, Bolt and custom apps',
  'Project, rule, decision, task and preference memory types built for real developer workflows',
  'MCP, bridge, REST and SDK surfaces for embedding memory into your own stack',
];

export const heroBenefits = [
  'Keep the same context across multiple AI tools',
  'Stop repeating project rules and preferences',
  'Connect memory via MCP, API, bridge, or SDK',
  'Use as a developer tool or memory backend',
];

export const developerMemoryPack = [
  ['Project', 'memory layer for AI coding workflows'],
  ['Stack', 'Next.js, FastAPI, MCP, API bridge'],
  ['Preferences', 'TypeScript, clean diffs, API-first design'],
  ['Decisions', 'MCP is the primary integration surface'],
  ['Current task', 'stabilize auth, memory UX, and positioning'],
];

export const integrationSurfaces = [
  { icon: 'Database', title: 'Memory workspace', desc: 'Inspect and manage stored project context in the app.' },
  { icon: 'Network', title: 'REST + WebSocket bridge', desc: 'Expose memory to agents, apps, and real-time workflows.' },
  { icon: 'Terminal', title: 'MCP server', desc: 'Connect memory to compatible AI coding clients.' },
  { icon: 'Wrench', title: 'SDK and integration path', desc: 'Embed memory into custom AI systems and internal tooling.' },
];

export const quickStartWorkflows = [
  {
    key: 'claude_code',
    title: 'Claude Code handoff',
    points: ['architecture decisions', 'repo rules', 'active tasks'],
  },
  {
    key: 'cursor',
    title: 'Cursor workspace memory',
    points: ['coding style', 'preferred stack', 'review constraints'],
  },
  {
    key: 'codex',
    title: 'Codex / agent prompt base',
    points: ['persistent system context', 'project assumptions', 'allowed actions'],
  },
  {
    key: 'replit',
    title: 'Replit / cloud IDE memory',
    points: ['deployment notes', 'runtime limits', 'shared project facts'],
  },
  {
    key: 'custom_app',
    title: 'Bolt / Lovable build loop',
    points: ['product rules', 'UI constraints', 'iteration history'],
  },
  {
    key: 'custom_app',
    title: 'Custom app / n8n pipeline',
    points: ['API memory writes', 'query policies', 'workflow recall'],
  },
];
