export type MetricType = 
  | 'subscribers' 
  | 'views_3months' 
  | 'pkxd_long_videos' 
  | 'pkxd_shorts' 
  | 'monthly_frequency' 
  | 'avg_views' 
  | 'community_compliance' 
  | 'program_terms';

export type CreatorFormat = 'long_video' | 'shorts' | 'both';

export type ProgramTier = 'admission' | 'stardust' | 'rising_star';

export interface TierInfo {
  id: ProgramTier;
  level: number;
  name: string;
  badgeName: string;
  tagline: string;
  icon: string;
  accentColor: string;
  borderClass: string;
  bgGradient: string;
  minSubscribersLong: number;
  minSubscribersShorts: number;
  minAvgViewsLong: number;
  minAvgViewsShorts: number;
  monthlyFrequency: number;
  monthlyGems: number;
  benefits: string[];
}

export interface CreatorRequirement {
  id: string;
  name: string;
  metricType: MetricType;
  category: ProgramTier;
  targetValue: number;
  unit: string;
  isRequired: boolean;
  description: string;
  officialSourceUrl: string;
  lastUpdated: string;
  autoVerifiable: boolean;
  applicableFormat?: CreatorFormat; // applies to specific creator format or all
  eitherOrGroupId?: string; // e.g. 10 long videos OR 30 shorts
  eitherOrLabel?: string;
  notes?: string;
}

export interface YouTubeRecentVideo {
  id: string;
  title: string;
  publishedAt: string;
  views?: number;
  isShort?: boolean;
  isPkxdContent?: boolean;
}

export interface ChannelMetrics {
  channelId: string;
  title: string;
  handle: string;
  avatarUrl: string;
  subscriberCount: number;
  videoCount: number;
  totalViews?: number;
  views3MonthsEstimated?: number;
  recentVideos: YouTubeRecentVideo[];
  estimatedMonthlyGrowth?: number;
  averageRecentViews?: number;
  pkxdVideosDetected?: number;
  isPublicDataAvailable: boolean;
  lastCheckedAt: string;
  // User overrides / manual declarations for non-public data
  manualOverrides?: {
    pkxdLongVideosCount?: number;
    pkxdShortsCount?: number;
    pkxdViews3Months?: number;
    communityCompliant?: boolean;
    termsAccepted?: boolean;
  };
}

export interface EvaluatedRequirement {
  requirement: CreatorRequirement;
  currentValue: number | boolean;
  targetValue: number;
  percentage: number;
  isMet: boolean;
  isAutoVerified: boolean;
  statusMessage: string;
  deficitText?: string;
  estimateText?: string;
  isEitherOrMet?: boolean;
}

export interface AnalysisSummary {
  channel: ChannelMetrics;
  creatorFormat: CreatorFormat;
  targetTier: ProgramTier;
  overallPercentage: number;
  metCount: number;
  totalCount: number;
  isAllRequiredMet: boolean;
  evaluatedRequirements: EvaluatedRequirement[];
  pendingRequirements: EvaluatedRequirement[];
  metRequirements: EvaluatedRequirement[];
}
