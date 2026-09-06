import { 
  CreatorRequirement, 
  ChannelMetrics, 
  CreatorFormat, 
  ProgramTier, 
  EvaluatedRequirement, 
  AnalysisSummary 
} from '../types/creator';

export function evaluateRequirements(
  requirements: CreatorRequirement[],
  channel: ChannelMetrics,
  format: CreatorFormat,
  targetTier: ProgramTier = 'stardust'
): AnalysisSummary {
  // Filter requirements relevant to the selected format and tier
  const relevantReqs = requirements.filter(req => {
    // Format check
    if (req.applicableFormat && req.applicableFormat !== 'both' && format !== 'both') {
      if (req.applicableFormat !== format) return false;
    }

    // Tier check
    if (targetTier === 'rising_star') {
      return req.category === 'rising_star' || req.category === 'admission';
    } else {
      // admission + stardust criteria
      return req.category === 'admission' || req.category === 'stardust';
    }
  });

  // Track either-or groups (e.g., 10 long videos OR 30 shorts)
  const groupMetMap: Record<string, boolean> = {};

  // First pass: compute current values and basic completion
  const preliminaryEvaluations = relevantReqs.map(req => {
    let currentValue = 0;
    let isAutoVerified = req.autoVerifiable;

    switch (req.metricType) {
      case 'subscribers':
        currentValue = channel.subscriberCount || 0;
        break;

      case 'views_3months':
        // Conta todas as visualizações dos vídeos de PK XD / vídeos do canal
        if (channel.manualOverrides?.pkxdViews3Months !== undefined) {
          currentValue = channel.manualOverrides.pkxdViews3Months;
        } else if (channel.totalViews !== undefined && channel.totalViews > 0) {
          currentValue = channel.totalViews;
        } else if (channel.views3MonthsEstimated !== undefined && channel.views3MonthsEstimated > 0) {
          currentValue = channel.views3MonthsEstimated;
        } else if (channel.recentVideos && channel.recentVideos.length > 0) {
          currentValue = channel.recentVideos.reduce((acc, v) => acc + (v.views || 0), 0);
        } else {
          currentValue = 0;
        }
        isAutoVerified = true;
        break;

      case 'pkxd_long_videos':
        if (channel.manualOverrides?.pkxdLongVideosCount !== undefined) {
          currentValue = channel.manualOverrides.pkxdLongVideosCount;
          isAutoVerified = false;
        } else if (channel.pkxdVideosDetected !== undefined && channel.pkxdVideosDetected > 0) {
          currentValue = channel.pkxdVideosDetected;
          isAutoVerified = true;
        } else {
          // If total public videos is known, display it as reference
          currentValue = channel.videoCount || 0;
          isAutoVerified = false;
        }
        break;

      case 'pkxd_shorts':
        if (channel.manualOverrides?.pkxdShortsCount !== undefined) {
          currentValue = channel.manualOverrides.pkxdShortsCount;
          isAutoVerified = false;
        } else {
          currentValue = channel.videoCount || 0;
          isAutoVerified = false;
        }
        break;

      case 'monthly_frequency': {
        // Calculate based on recent video frequency (estimated videos in last 30 days)
        const recentCount = channel.recentVideos?.length || 0;
        // If user published multiple videos recently, calculate approximate monthly pace
        const estimatedMonthly = Math.max(recentCount, Math.round((channel.videoCount || 0) / 12));
        currentValue = estimatedMonthly;
        isAutoVerified = channel.recentVideos && channel.recentVideos.length > 0;
        break;
      }

      case 'avg_views':
        currentValue = channel.averageRecentViews || (channel.totalViews && channel.videoCount ? Math.round(channel.totalViews / channel.videoCount) : 0);
        break;

      case 'community_compliance':
        currentValue = channel.manualOverrides?.communityCompliant ? 1 : 0;
        isAutoVerified = false;
        break;

      case 'program_terms':
        currentValue = channel.manualOverrides?.termsAccepted ? 1 : 0;
        isAutoVerified = false;
        break;

      default:
        currentValue = 0;
        break;
    }

    const isMet = currentValue >= req.targetValue;
    if (req.eitherOrGroupId && isMet) {
      groupMetMap[req.eitherOrGroupId] = true;
    }

    return {
      req,
      currentValue,
      isAutoVerified,
      isMet
    };
  });

  // Second pass: apply either-or resolution, status messages, deficit & estimates
  const evaluatedRequirements: EvaluatedRequirement[] = preliminaryEvaluations.map(item => {
    const { req, currentValue, isAutoVerified } = item;
    let isMet = item.isMet;
    let isEitherOrMet = false;

    if (req.eitherOrGroupId && groupMetMap[req.eitherOrGroupId]) {
      isEitherOrMet = true;
      isMet = true; // satisfied because the alternative requirement in the group was met!
    }

    const percentage = req.targetValue > 0 
      ? Math.min(100, Math.round(((Number(currentValue) || 0) / req.targetValue) * 100))
      : 100;

    let deficitText: string | undefined;
    let estimateText: string | undefined;
    let statusMessage = '';

    if (isMet) {
      statusMessage = isEitherOrMet && !item.isMet
        ? `✓ Requisito atendido pela opção alternativa (${req.eitherOrLabel})`
        : '✓ Requisito atingido';
    } else {
      if (!isAutoVerified && currentValue === 0 && (req.metricType === 'community_compliance' || req.metricType === 'program_terms')) {
        statusMessage = 'Não foi possível verificar este requisito automaticamente.';
        deficitText = 'Requer confirmação direta do criador';
      } else {
        const remaining = Math.max(0, req.targetValue - Number(currentValue));
        deficitText = `Faltam ${remaining.toLocaleString('pt-BR')} ${req.unit}`;
        statusMessage = `Faltam ${remaining.toLocaleString('pt-BR')} para cumprir este requisito`;
        
        // Detailed estimation
        estimateText = `🚀 Você está a ${remaining.toLocaleString('pt-BR')} ${req.unit} de atingir esse requisito.`;

        // Historical / growth pace estimate if available
        if (req.metricType === 'subscribers') {
          const monthlyGrowth = channel.estimatedMonthlyGrowth && channel.estimatedMonthlyGrowth > 0 
            ? channel.estimatedMonthlyGrowth 
            : 120; // sensible illustrative benchmark
          const monthsNeeded = Math.ceil(remaining / monthlyGrowth);
          estimateText += `\n📈 Seu canal está com ritmo estimado de ~${monthlyGrowth.toLocaleString('pt-BR')} novos inscritos por mês. Mantendo esse ritmo, você pode atingir este requisito em aproximadamente ${monthsNeeded} ${monthsNeeded === 1 ? 'mês' : 'meses'}.`;
        } else if (req.metricType === 'monthly_frequency') {
          estimateText += `\n📅 Publicar regularmente acelera a análise de consistência pela equipe Afterverse.`;
        }
      }
    }

    return {
      requirement: req,
      currentValue,
      targetValue: req.targetValue,
      percentage: isMet ? 100 : percentage,
      isMet,
      isAutoVerified,
      statusMessage,
      deficitText,
      estimateText,
      isEitherOrMet
    };
  });

  // Calculate overall progress percentage
  const totalScore = evaluatedRequirements.reduce((acc, curr) => acc + curr.percentage, 0);
  const overallPercentage = evaluatedRequirements.length > 0 
    ? Math.round(totalScore / evaluatedRequirements.length) 
    : 0;

  const metList = evaluatedRequirements.filter(r => r.isMet);
  const pendingList = evaluatedRequirements
    .filter(r => !r.isMet)
    .sort((a, b) => {
      // Prioritize mandatory requirements first, then lowest percentage to reach
      if (a.requirement.isRequired && !b.requirement.isRequired) return -1;
      if (!a.requirement.isRequired && b.requirement.isRequired) return 1;
      return a.percentage - b.percentage;
    });

  const isAllRequiredMet = evaluatedRequirements
    .filter(r => r.requirement.isRequired)
    .every(r => r.isMet);

  return {
    channel,
    creatorFormat: format,
    targetTier,
    overallPercentage,
    metCount: metList.length,
    totalCount: evaluatedRequirements.length,
    isAllRequiredMet,
    evaluatedRequirements,
    pendingRequirements: pendingList,
    metRequirements: metList
  };
}

export interface TierProgressionStatus {
  tierId: ProgramTier;
  level: number;
  name: string;
  isUnlocked: boolean;
  percentage: number;
  metCount: number;
  totalCount: number;
  subscribersNeeded: number;
  isCurrent: boolean;
  isNextToClimb: boolean;
  summary: AnalysisSummary;
}

export function getChannelTierProgressions(
  requirements: CreatorRequirement[],
  channel: ChannelMetrics,
  format: CreatorFormat
): {
  currentTier: ProgramTier | 'aspirant';
  nextTier: ProgramTier | null;
  progressions: TierProgressionStatus[];
} {
  const tiers: { id: ProgramTier; level: number; name: string }[] = [
    { id: 'stardust', level: 1, name: 'Stardust' },
    { id: 'rising_star', level: 2, name: 'Rising Star' }
  ];

  const evaluations: { tier: typeof tiers[0]; summary: AnalysisSummary }[] = tiers.map(t => ({
    tier: t,
    summary: evaluateRequirements(requirements, channel, format, t.id)
  }));

  // Determine highest tier unlocked
  let currentTier: ProgramTier | 'aspirant' = 'aspirant';
  for (const item of evaluations) {
    if (item.summary.isAllRequiredMet) {
      currentTier = item.tier.id;
    } else {
      break;
    }
  }

  // Next tier to climb is the first one where isAllRequiredMet is false
  const nextTierItem = evaluations.find(item => !item.summary.isAllRequiredMet);
  const nextTier: ProgramTier | null = nextTierItem ? nextTierItem.tier.id : null;

  const progressions: TierProgressionStatus[] = evaluations.map((item, idx) => {
    const isUnlocked = item.summary.isAllRequiredMet;
    const isCurrent = currentTier === item.tier.id;
    const isNextToClimb = nextTier === item.tier.id;

    // Find subscribers requirement
    const subReq = item.summary.evaluatedRequirements.find(r => r.requirement.metricType === 'subscribers');
    const subCurrent = typeof subReq?.currentValue === 'number' ? subReq.currentValue : (channel.subscriberCount || 0);
    const subTarget = subReq?.targetValue || 1000;
    const subscribersNeeded = Math.max(0, subTarget - subCurrent);

    return {
      tierId: item.tier.id,
      level: item.tier.level,
      name: item.tier.name,
      isUnlocked,
      percentage: item.summary.overallPercentage,
      metCount: item.summary.metCount,
      totalCount: item.summary.totalCount,
      subscribersNeeded,
      isCurrent,
      isNextToClimb,
      summary: item.summary
    };
  });

  return {
    currentTier,
    nextTier,
    progressions
  };
}
