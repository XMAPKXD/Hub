import { CreatorRequirement } from '../types/creator';

export const OFFICIAL_CREATOR_REQUIREMENTS: CreatorRequirement[] = [
  {
    id: 'subscribers_min',
    name: 'Inscritos no Canal',
    metricType: 'subscribers',
    category: 'stardust',
    targetValue: 1000,
    unit: 'inscritos',
    isRequired: true,
    description: 'Ter no mínimo 1.000 seguidores/inscritos no seu canal para o Tier Stardust de entrada.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'both',
    notes: 'Contabilizado diretamente da métrica pública de inscritos do YouTube.'
  },
  {
    id: 'pkxd_long_videos',
    name: 'Vídeos Longos de PK XD (+5 min)',
    metricType: 'pkxd_long_videos',
    category: 'admission',
    targetValue: 10,
    unit: 'vídeos longos',
    isRequired: true,
    description: 'Ter pelo menos 10 vídeos longos (+5 minutos) de PK XD já publicados no canal (OU cumprir a meta de 30 Shorts).',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'long_video',
    eitherOrGroupId: 'content_volume',
    eitherOrLabel: 'OU 30 Shorts/TikToks de PK XD',
    notes: 'Requisito alternativo com Shorts. Cumprir um dos dois valida este critério de admissão.'
  },
  {
    id: 'pkxd_shorts',
    name: 'Shorts de PK XD Publicados',
    metricType: 'pkxd_shorts',
    category: 'admission',
    targetValue: 30,
    unit: 'Shorts',
    isRequired: true,
    description: 'Ter pelo menos 30 Shorts de PK XD já publicados no canal (OU cumprir a meta de 10 vídeos longos).',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'shorts',
    eitherOrGroupId: 'content_volume',
    eitherOrLabel: 'OU 10 vídeos longos (+5 min) de PK XD',
    notes: 'Requisito alternativo com vídeos longos. Cumprir um dos dois valida este critério de admissão.'
  },
  {
    id: 'views_3months_pkxd',
    name: 'Visualizações de PK XD (Todas as Views)',
    metricType: 'views_3months',
    category: 'admission',
    targetValue: 10000,
    unit: 'visualizações',
    isRequired: true,
    description: 'Ter acumulado ao menos 10.000 visualizações de PK XD (contabiliza todas as visualizações dos vídeos do canal).',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'both',
    notes: 'Contabiliza todas as visualizações dos vídeos de PK XD acumuladas no canal.'
  },
  {
    id: 'monthly_frequency_long',
    name: 'Frequência Mensal (Vídeo Longo)',
    metricType: 'monthly_frequency',
    category: 'stardust',
    targetValue: 8,
    unit: 'vídeos/mês',
    isRequired: true,
    description: 'Manter um ritmo de publicação consistente de no mínimo 8 vídeos longos por mês.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'long_video',
    notes: 'Aplicável para criadores classificados no formato YouTube Longo.'
  },
  {
    id: 'monthly_frequency_shorts',
    name: 'Frequência Mensal (Shorts)',
    metricType: 'monthly_frequency',
    category: 'stardust',
    targetValue: 16,
    unit: 'shorts/mês',
    isRequired: true,
    description: 'Manter um ritmo de publicação consistente de no mínimo 16 Shorts por mês.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'shorts',
    notes: 'Aplicável para criadores classificados no formato YouTube Shorts.'
  },
  {
    id: 'avg_views_long',
    name: 'Média de Visualizações (Vídeo Longo)',
    metricType: 'avg_views',
    category: 'stardust',
    targetValue: 700,
    unit: 'views/vídeo',
    isRequired: true,
    description: 'Média mínima de 700 visualizações por vídeo para criadores de YouTube Longo no Tier Stardust.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'long_video',
    notes: 'Calculado com base nas visualizações das publicações recentes.'
  },
  {
    id: 'avg_views_shorts',
    name: 'Média de Visualizações (Shorts)',
    metricType: 'avg_views',
    category: 'stardust',
    targetValue: 1000,
    unit: 'views/short',
    isRequired: true,
    description: 'Média mínima de 1.000 visualizações por vídeo para criadores de YouTube Shorts no Tier Stardust.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'shorts',
    notes: 'Calculado com base nas visualizações dos Shorts recentes.'
  },
  {
    id: 'community_rules',
    name: 'Conformidade com as Regras da Comunidade',
    metricType: 'community_compliance',
    category: 'admission',
    targetValue: 1,
    unit: 'conformidade',
    isRequired: true,
    description: 'Estar em total conformidade com as regras da comunidade do PK XD e os termos oficiais do programa.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: false,
    applicableFormat: 'both',
    notes: 'Requisito avaliado diretamente pela equipe da Afterverse Creators.'
  },
  {
    id: 'program_terms_acceptance',
    name: 'Aceite das Diretrizes do Programa',
    metricType: 'program_terms',
    category: 'admission',
    targetValue: 1,
    unit: 'aceite',
    isRequired: true,
    description: 'Aceitar os Termos e Condições do Programa de Creators PK XD.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: false,
    applicableFormat: 'both',
    notes: 'Confirmação realizada no ato da inscrição oficial.'
  }
];

// Tier definitions and progression metadata
export const PKXD_CREATOR_TIERS: import('../types/creator').TierInfo[] = [
  {
    id: 'stardust',
    level: 1,
    name: 'Stardust',
    badgeName: 'Creator Stardust',
    tagline: 'Porta de entrada no Programa Oficial',
    icon: '⭐',
    accentColor: '#8b5cf6', // purple-500
    borderClass: 'border-purple-500/40 hover:border-purple-500',
    bgGradient: 'from-purple-950/40 via-zinc-900 to-zinc-950',
    minSubscribersLong: 1000,
    minSubscribersShorts: 5000,
    minAvgViewsLong: 700,
    minAvgViewsShorts: 1000,
    monthlyFrequency: 8,
    monthlyGems: 500,
    benefits: [
      'Selo Oficial de Creator PK XD no jogo',
      '500 Gemas mensais creditadas na conta',
      'Cargo exclusivo de Criador no Discord Oficial',
      'Acesso ao canal VIP com spoilers e teasers'
    ]
  },
  {
    id: 'rising_star',
    level: 2,
    name: 'Rising Star',
    badgeName: 'Creator Rising Star',
    tagline: 'Criador em ascensão com audiência ativa',
    icon: '🚀',
    accentColor: '#f59e0b', // amber-500
    borderClass: 'border-amber-500/40 hover:border-amber-500',
    bgGradient: 'from-amber-950/40 via-zinc-900 to-zinc-950',
    minSubscribersLong: 5000,
    minSubscribersShorts: 10000,
    minAvgViewsLong: 1500,
    minAvgViewsShorts: 10000,
    monthlyFrequency: 10,
    monthlyGems: 1500,
    benefits: [
      'Códigos promocionais de Gemas/Moedas para sortear aos inscritos',
      '1.500 Gemas mensais + Pacote de Moedas',
      'Divulgação do canal nas redes sociais oficiais do PK XD',
      'Acesso antecipado aos testes de novas atualizações (Beta Tester)'
    ]
  }
];

// Rising Star requirements (for tier advancement preview)
export const RISING_STAR_REQUIREMENTS: CreatorRequirement[] = [
  {
    id: 'rs_subscribers_long',
    name: 'Inscritos (Vídeo Longo)',
    metricType: 'subscribers',
    category: 'rising_star',
    targetValue: 5000,
    unit: 'inscritos',
    isRequired: true,
    description: 'No mínimo 5.000 inscritos para criadores de YouTube Longo no Tier Rising Star.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'long_video'
  },
  {
    id: 'rs_subscribers_shorts',
    name: 'Inscritos (Shorts)',
    metricType: 'subscribers',
    category: 'rising_star',
    targetValue: 10000,
    unit: 'inscritos',
    isRequired: true,
    description: 'No mínimo 10.000 inscritos para criadores de YouTube Shorts no Tier Rising Star.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'shorts'
  },
  {
    id: 'rs_avg_views_long',
    name: 'Média de Views (Vídeo Longo)',
    metricType: 'avg_views',
    category: 'rising_star',
    targetValue: 1500,
    unit: 'views/vídeo',
    isRequired: true,
    description: 'Média de 1.500 visualizações por vídeo no Tier Rising Star.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'long_video'
  },
  {
    id: 'rs_avg_views_shorts',
    name: 'Média de Views (Shorts)',
    metricType: 'avg_views',
    category: 'rising_star',
    targetValue: 10000,
    unit: 'views/short',
    isRequired: true,
    description: 'Média de 10.000 visualizações por vídeo no Tier Rising Star.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'shorts'
  },
  {
    id: 'rs_monthly_frequency',
    name: 'Frequência de Publicações',
    metricType: 'monthly_frequency',
    category: 'rising_star',
    targetValue: 10,
    unit: 'vídeos/mês',
    isRequired: true,
    description: 'Publicar com consistência no mínimo 10 vídeos ou shorts por mês no Tier Rising Star.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: true,
    applicableFormat: 'both'
  }
];

// Official full requirements list (Admission + Stardust + Rising Star)
export const ALL_CREATOR_REQUIREMENTS: CreatorRequirement[] = [
  ...OFFICIAL_CREATOR_REQUIREMENTS,
  ...RISING_STAR_REQUIREMENTS
];

const LOCAL_STORAGE_KEY = 'pkxd_custom_creator_requirements';

export function getStoredRequirements(): CreatorRequirement[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Exclusively maintain official tiers: Stardust and Rising Star (+ admission criteria)
        const validTiers = new Set(['admission', 'stardust', 'rising_star']);
        const filtered = parsed
          .filter((r: any) => validTiers.has(r.category))
          .map((r: any) => {
            // Update legacy 15000 shorts requirement to 10000
            if (r.id === 'rs_subscribers_shorts' && r.targetValue === 15000) {
              return {
                ...r,
                targetValue: 10000,
                description: 'No mínimo 10.000 inscritos para criadores de YouTube Shorts no Tier Rising Star.'
              };
            }
            return r;
          });
        const existingIds = new Set(filtered.map(p => p.id));
        const missing = ALL_CREATOR_REQUIREMENTS.filter(r => !existingIds.has(r.id));
        return [...filtered, ...missing];
      }
    }
  } catch (e) {
    console.warn('Erro ao ler requisitos customizados do localStorage:', e);
  }
  return ALL_CREATOR_REQUIREMENTS;
}

export function saveStoredRequirements(reqs: CreatorRequirement[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reqs));
  } catch (e) {
    console.error('Erro ao salvar requisitos customizados:', e);
  }
}

export function resetToDefaultRequirements(): CreatorRequirement[] {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {}
  return ALL_CREATOR_REQUIREMENTS;
}
