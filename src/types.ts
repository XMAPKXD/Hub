export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'spoilers' | 'updates' | 'codes' | 'events';
  imageUrl: string;
  date: string;
  author: string;
  scheduledAt?: string;
}

export interface SpoilerConfig {
  title: string;
  description: string;
  revealDateOverride?: string; // in case they want a custom specific date
}

export interface FeaturedVideo {
  id: string;
  title: string;
  youtubeUrl: string;
  type: 'game_highlight' | 'panel_video';
  author?: string;
  createdAt: number;
}

export interface Theory {
  id: string;
  title: string;
  content: string;
  author: string;
  likes: number;
  createdAt: number;
}

export interface ShortItem {
  id: string;
  title: string;
  youtubeUrl: string;
  createdAt: number;
}

export interface AppSettings {
  logoUrl?: string;
  spoilerTitle?: string;
  spoilerDesc?: string;
  extraCountdownTitle?: string;
  extraCountdownDate?: string; // ISO string or date string
  extraCountdownEnabled?: boolean;
  isDelayed?: boolean;
  delayMessage?: string;
  giftCountdownTitle?: string;
  giftCountdownDate?: string;
  giftCountdownEnabled?: boolean;
  giftCountdownContent?: string;
}

export interface PastSpoiler {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: number;
  ratingSum?: number;
  ratingCount?: number;
  reactions?: Record<string, number>;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'story_published' | 'countdown_alert' | 'custom_push' | 'delayed_alert';
  createdAt: number;
}

export interface AppComment {
  id: string;
  targetId: string; // theory id, video id, or post id
  targetType: 'theory' | 'video' | 'post';
  authorName: string;
  authorId?: string; // firebase user uid if authenticated
  authorAvatar?: string; // photoURL if logged in
  content: string;
  status: 'approved' | 'pending_review' | 'blocked';
  createdAt: number;
}

export interface Post {
  id: string;
  authorName: string;
  authorId: string;
  authorAvatar?: string;
  content: string;
  likes: number;
  likedBy: string[]; // user uids
  createdAt: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
  type: 'post' | 'spin' | 'chest' | 'like' | 'visit_whatsapp';
}

export interface GeneratedPromoCode {
  code: string;
  gems: number;
  coins: number;
  maxRedeems: number;
  currentRedeems: number;
  createdAt: number;
  redeemedUsers: string[];
}

export interface ArtAsset {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  downloadUrl?: string;
  category: string; // e.g. Renders, Vídeos, Logos, Fundos, Outros
  createdAt: number;
  isVideo?: boolean;
  order?: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: number;
  isActive: boolean;
  totalVotes: number;
  imageUrl?: string;
}

export type EventStatus = 'Em análise' | 'Aprovado' | 'Em breve' | 'Ao vivo' | 'Encerrado';

export interface EventParticipant {
  id: string;
  eventId: string;
  playerIdentifier: string; // e.g. "KOOSH#000"
  registeredAt: number;
}

export interface CommunityEvent {
  id: string;
  name: string;
  description: string;
  category: string; // e.g. Torneios, Festas, Esconder-Esconder, Encontros, Mini-Games, Outros
  date: string; // e.g. "2026-08-15"
  time: string; // e.g. "18:00"
  bannerUrl: string;
  organizerName: string; // e.g. "KOOSH#000"
  organizerContact?: string;
  rules: string;
  maxParticipants?: number; // optional limit
  status: EventStatus;
  createdAt: number;
  approvedAt?: number;
  createdById?: string;
  admin_secret?: string;
  requiresPin?: boolean; // Whether registration requires a security PIN / password
  pinCode?: string; // Secret PIN or password set by organizer to confirm presence
}

// ===================================
// PASSAPORTE PKXD (PASSPORT SYSTEM)
// ===================================

export interface PassportBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'community' | 'events' | 'spoilers' | 'social' | 'special';
  unlocked: boolean;
  unlockedAt?: number;
  rarity?: 'Comum' | 'Raro' | 'Épico' | 'Lendário';
  canClaim?: boolean;
  xpReward?: number;
}

export interface PassportStamp {
  id: string;
  title: string;
  eventOrSeason: string;
  location: string;
  date: string;
  icon: string;
  color: string;
  acquiredAt?: number;
  secretCode?: string;
  description?: string;
  xpReward?: number;
  isAvailable?: boolean;
}

export interface PassportFriend {
  id: string;
  playerTag: string; // e.g. "LUNA#245"
  nickname: string;
  avatarUrl?: string;
  level?: number;
  addedAt: number;
  favoriteMinigame?: string;
}

export interface PassportEventHistory {
  id: string;
  eventId: string;
  eventName: string;
  role: 'organizador' | 'participante';
  date: string;
  category: string;
}

export interface PKXDPassport {
  id: string;
  userId: string;
  playerTag: string; // e.g. "KOOSH#000"
  nickname: string;
  avatarUrl: string;
  bio: string;
  title: string; // e.g. "Explorador da Ilha"
  level: number;
  xp: number;
  joinedAt: number;
  timeInCommunity: string;
  favoriteMinigame: string;
  houseTheme: string;
  cardTheme: 'neon-purple' | 'cyber-blue' | 'golden-vip' | 'sunset-pink' | 'emerald-gamer' | 'volcano-red' | 'frost-diamond';
  badges: PassportBadge[];
  stamps: PassportStamp[];
  friends: PassportFriend[];
  eventHistory: PassportEventHistory[];
  isPublic: boolean;
  updatedAt: number;
}

export interface UpcomingStreamItem {
  id: string;
  title: string;
  creatorOrChannel: string;
  streamType: 'live_codes' | 'spoiler_premiere' | 'special_event' | 'gem_giveaway';
  platform: 'youtube' | 'twitch' | 'whatsapp' | 'pkxd';
  scheduledDate: string; // ISO string e.g. "2026-08-16T18:30:00"
  targetUrl: string;
  rewardsSummary: string; // e.g. "3 Códigos de 50 Gemas + 10.000 Moedas"
  hintsOrInstructions?: string; // e.g. "Os códigos aparecem na tela durante o Crazy Run!"
  bannerUrl?: string;
  status?: 'scheduled' | 'live_now' | 'completed';
  remindersCount?: number;
  createdAt: number;
}


