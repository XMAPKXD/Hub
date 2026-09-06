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
    name: 'Visualizações de PK XD (Últimos 3 meses)',
    metricType: 'views_3months',
    category: 'admission',
    targetValue: 10000,
    unit: 'visualizações',
    isRequired: true,
    description: 'Ter acumulado ao menos 10.000 visualizações de conteúdos de PK XD nos últimos 3 meses.',
    officialSourceUrl: 'https://playpkxd.com',
    lastUpdated: '2025-12-01',
    autoVerifiable: false, // cannot separate pkxd-only views for private 90-day window purely through public aggregate views
    applicableFormat: 'both',
    notes: 'O YouTube público exibe views totais do canal. A contagem específica de PK XD nos últimos 90 dias pode requerer confirmação declarada do criador.'
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
    targetValue: 1000,
    unit: 'views/vídeo',
    isRequired: true,
    description: 'Média de 1.000 visualizações por vídeo no Tier Rising Star.',
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
  }
];

const LOCAL_STORAGE_KEY = 'pkxd_custom_creator_requirements';

export function getStoredRequirements(): CreatorRequirement[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler requisitos customizados do localStorage:', e);
  }
  return OFFICIAL_CREATOR_REQUIREMENTS;
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
  return OFFICIAL_CREATOR_REQUIREMENTS;
}
