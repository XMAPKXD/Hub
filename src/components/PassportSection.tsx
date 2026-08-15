import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { 
  PKXDPassport, 
  PassportBadge, 
  PassportStamp, 
  PassportFriend, 
  CommunityEvent 
} from '../types';
import { 
  User, 
  QrCode, 
  Award, 
  BookmarkCheck, 
  Users, 
  Calendar, 
  Share2, 
  Edit3, 
  Sparkles, 
  Copy, 
  Check, 
  Gamepad2, 
  Trophy, 
  Plus, 
  Trash2, 
  X, 
  CheckCircle2, 
  Flame, 
  UploadCloud, 
  ShieldCheck, 
  Star,
  Search,
  Filter
} from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface PassportSectionProps {
  currentUser?: any;
  isAdmin: boolean;
  fanXP: number;
  onAddXP?: (amount: number, reason: string) => void;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'spin' | 'success') => void;
  events?: CommunityEvent[];
}

const DEFAULT_BADGES: PassportBadge[] = [
  {
    id: 'badge_pioneer',
    title: 'Pioneiro da Central',
    description: 'Acessou e explorou a plataforma PK XD.',
    icon: '🌟',
    category: 'community',
    unlocked: true,
    unlockedAt: Date.now() - 30 * 24 * 3600 * 1000,
    rarity: 'Comum'
  },
  {
    id: 'badge_spoiler_hunter',
    title: 'Caçador de Spoilers',
    description: 'Acompanhou os spoilers semanais e reagiu às novidades.',
    icon: '🔮',
    category: 'spoilers',
    unlocked: true,
    unlockedAt: Date.now() - 10 * 24 * 3600 * 1000,
    rarity: 'Raro'
  },
  {
    id: 'badge_active_voter',
    title: 'Cidadão Eleitor',
    description: 'Votou em enquetes e decisões da comunidade.',
    icon: '🗳️',
    category: 'social',
    unlocked: false,
    rarity: 'Comum'
  },
  {
    id: 'badge_event_master',
    title: 'Estrela dos Eventos',
    description: 'Participou ou criou eventos oficiais na Central.',
    icon: '🏆',
    category: 'events',
    unlocked: false,
    rarity: 'Épico'
  },
  {
    id: 'badge_pwa_pro',
    title: 'Aplicativo Instalado',
    description: 'Instalou o PK XD Central como aplicativo no celular ou PC.',
    icon: '📱',
    category: 'special',
    unlocked: false,
    rarity: 'Raro'
  },
  {
    id: 'badge_theorist',
    title: 'Teórico da Ilha',
    description: 'Enviou teorias e descobertas sobre o universo de PK XD.',
    icon: '📝',
    category: 'community',
    unlocked: false,
    rarity: 'Épico'
  },
  {
    id: 'badge_code_hunter',
    title: 'Colecionador VIP',
    description: 'Resgatou códigos promocionais de gemas e moedas.',
    icon: '💎',
    category: 'special',
    unlocked: false,
    rarity: 'Raro'
  },
  {
    id: 'badge_friendly',
    title: 'Amigo da Ilha',
    description: 'Conectou amigos ao seu Passaporte PK XD.',
    icon: '🤝',
    category: 'social',
    unlocked: false,
    rarity: 'Comum'
  },
  {
    id: 'badge_legend',
    title: 'Lenda do PK XD',
    description: 'Alcançou o Nível 10+ de fã e conquistou respeito na Ilha.',
    icon: '👑',
    category: 'special',
    unlocked: false,
    rarity: 'Lendário'
  }
];

const DEFAULT_STAMPS: PassportStamp[] = [];

export interface MinigameItem {
  name: string;
  icon: string;
}

export const PKXD_MINIGAMES: MinigameItem[] = [
  { name: 'Crazy Run', icon: '⚡' },
  { name: 'Pet Parade', icon: '🐶' },
  { name: 'Falcon XD', icon: '🦅' },
  { name: 'XD Turbo Race', icon: '🚗' },
  { name: 'Coleta de Frutas', icon: '🍎' },
  { name: 'Entrega de Pizzas', icon: '🍕' },
  { name: 'Freezing Fun', icon: '❄️' },
  { name: 'XD Champions', icon: '🏆' },
  { name: 'Fashion Star', icon: '👗' },
  { name: 'Monster Lab', icon: '👹' },
  { name: 'Pet Run', icon: '🐾' },
  { name: 'XD Race', icon: '🏎️' },
  { name: 'Robot Arena', icon: '🤖' },
  { name: 'Shooter', icon: '🔫' },
  { name: 'XD Hide', icon: '🙈' },
  { name: 'Miraculous Hunt', icon: '🐞' }
];

export function getMinigameIcon(gameName: string): string {
  const match = PKXD_MINIGAMES.find(g => g.name.toLowerCase() === gameName?.toLowerCase());
  return match ? match.icon : '🎮';
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Armor&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Star&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Gamer&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Cyber&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Flame&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PKXD_Neon&backgroundColor=c1f2d5'
];

export default function PassportSection({
  currentUser,
  isAdmin,
  fanXP,
  onAddXP,
  triggerAudio,
  events = []
}: PassportSectionProps) {
  // Current user's calculated level
  const userLevel = Math.max(1, Math.floor(fanXP / 100) + 1);
  const currentLevelProgress = fanXP % 100;

  // Active tab inside Passport
  const [activeTab, setActiveTab] = useState<'card' | 'badges' | 'stamps' | 'friends' | 'events'>('card');
  
  // Filter for Badges
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [friendSearch, setFriendSearch] = useState('');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddStampModalOpen, setIsAddStampModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<PassportBadge | null>(null);
  
  // Notifications & Copy state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Friend input form
  const [newFriendTag, setNewFriendTag] = useState('');
  const [newFriendNick, setNewFriendNick] = useState('');
  const [newFriendGame, setNewFriendGame] = useState('Crazy Run');
  const [friendError, setFriendError] = useState('');

  // Admin Stamp creation form state
  const [newStampTitle, setNewStampTitle] = useState('');
  const [newStampEvent, setNewStampEvent] = useState('');
  const [newStampLocation, setNewStampLocation] = useState('Central Plaza');
  const [newStampDate, setNewStampDate] = useState('2026');
  const [newStampIcon, setNewStampIcon] = useState('🏆');
  const [newStampColor, setNewStampColor] = useState('#8b5cf6');

  // Loaded passport data
  const [passport, setPassport] = useState<PKXDPassport>(() => {
    const userAccountName = currentUser?.displayName || 
      (currentUser?.email ? currentUser.email.split('@')[0] : '') || 
      localStorage.getItem('pkxd_nickname') || 
      localStorage.getItem('pkxd_username_nickname') || 
      '';

    const saved = localStorage.getItem('pkxd_passport_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If current user has a real account name and the saved tag is JOGADOR or generic, replace with the account name
        const isGenericTag = !parsed.playerTag || parsed.playerTag === 'JOGADOR' || parsed.playerTag === 'JOGADOR#000' || parsed.playerTag === 'GUEST';
        const isGenericNick = !parsed.nickname || parsed.nickname === 'Explorador' || parsed.nickname === 'Fã Secreto' || parsed.nickname === 'JOGADOR';

        const effectiveTag = (isGenericTag && userAccountName) ? userAccountName : (parsed.playerTag || userAccountName || 'Explorador');
        const effectiveNick = (isGenericNick && userAccountName) ? userAccountName : (parsed.nickname || userAccountName || 'Explorador');

        // If current user has a photoURL and the saved one is stock or missing, use currentUser.photoURL!
        const effectiveAvatar = currentUser?.photoURL || (parsed.avatarUrl && !parsed.avatarUrl.includes('images.unsplash.com') ? parsed.avatarUrl : PRESET_AVATARS[0]);
        // Clean out default mock stamps if any were saved
        const effectiveStamps = (parsed.stamps || []).filter((s: PassportStamp) => 
          s.id !== 'stamp_central_launch' && s.id !== 'stamp_summer_fest' && s.id !== 'stamp_crazy_run'
        );
        // Ensure badges match latest text/descriptions
        const effectiveBadges = DEFAULT_BADGES.map(defB => {
          const existing = (parsed.badges || []).find((b: PassportBadge) => b.id === defB.id);
          return existing ? { ...defB, unlocked: existing.unlocked, unlockedAt: existing.unlockedAt } : defB;
        });

        return {
          ...parsed,
          userId: currentUser?.uid || parsed.userId || 'guest_user',
          playerTag: effectiveTag,
          nickname: effectiveNick,
          avatarUrl: effectiveAvatar,
          level: userLevel,
          xp: fanXP,
          badges: effectiveBadges,
          stamps: effectiveStamps
        };
      } catch (e) {}
    }

    const rawSavedTag = localStorage.getItem('pkxd_player_tag');
    const rawSavedNick = localStorage.getItem('pkxd_nickname');

    const savedTag = (rawSavedTag && rawSavedTag !== 'JOGADOR' && rawSavedTag !== 'JOGADOR#000')
      ? rawSavedTag
      : (userAccountName || 'Explorador');

    const savedNick = (rawSavedNick && rawSavedNick !== 'Explorador' && rawSavedNick !== 'Fã Secreto' && rawSavedNick !== 'JOGADOR')
      ? rawSavedNick
      : (userAccountName || 'Explorador');

    return {
      id: currentUser?.uid || 'passport_' + Date.now(),
      userId: currentUser?.uid || 'guest_user',
      playerTag: savedTag,
      nickname: savedNick,
      avatarUrl: currentUser?.photoURL || PRESET_AVATARS[0],
      bio: 'Apaixonado por PK XD! Adoro disputar no Crazy Run, personalizar minha casa e curtir eventos com a galera!',
      title: isAdmin ? 'Lorde da Moderação' : 'Explorador da Ilha',
      level: userLevel,
      xp: fanXP,
      joinedAt: Date.now() - 45 * 24 * 3600 * 1000,
      timeInCommunity: 'Membro Ativo da Central',
      favoriteMinigame: 'Crazy Run',
      houseTheme: 'Mansão Gamer',
      cardTheme: 'neon-purple',
      badges: DEFAULT_BADGES,
      stamps: DEFAULT_STAMPS,
      friends: [
        {
          id: 'friend_1',
          playerTag: 'LunaStar',
          nickname: 'LunaStar',
          avatarUrl: PRESET_AVATARS[1],
          level: 7,
          favoriteMinigame: 'Corrida de Pets',
          addedAt: Date.now() - 12 * 24 * 3600 * 1000
        },
        {
          id: 'friend_2',
          playerTag: 'GabePKXD',
          nickname: 'GabePKXD',
          avatarUrl: PRESET_AVATARS[2],
          level: 12,
          favoriteMinigame: 'Crazy Run',
          addedAt: Date.now() - 5 * 24 * 3600 * 1000
        }
      ],
      eventHistory: [
        {
          id: 'ev_1',
          eventName: 'Mega Torneio Crazy Run Central',
          role: 'participante',
          date: '20/08/2026',
          category: 'Mini-games'
        },
        {
          id: 'ev_2',
          eventName: 'Grande Desfile Fashion & Festa na Piscina',
          role: 'participante',
          date: '25/08/2026',
          category: 'Social'
        }
      ],
      updatedAt: Date.now()
    };
  });

  // Form edit states
  const [editNick, setEditNick] = useState(passport.nickname);
  const [editTag, setEditTag] = useState(passport.playerTag);
  const [editBio, setEditBio] = useState(passport.bio);
  const [editTitle, setEditTitle] = useState(passport.title);
  const [editMinigame, setEditMinigame] = useState(passport.favoriteMinigame);
  const [editHouse, setEditHouse] = useState(passport.houseTheme);
  const [editTheme, setEditTheme] = useState(passport.cardTheme);
  const [editAvatar, setEditAvatar] = useState(passport.avatarUrl);

  // Sync profile photo and account name whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      const accountName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : '');

      setPassport(prev => {
        const isGenericTag = !prev.playerTag || prev.playerTag === 'JOGADOR' || prev.playerTag === 'JOGADOR#000' || prev.playerTag === 'GUEST' || prev.userId === 'guest_user';
        const isGenericNick = !prev.nickname || prev.nickname === 'Explorador' || prev.nickname === 'Fã Secreto' || prev.nickname === 'JOGADOR' || prev.userId === 'guest_user';

        const updatedTag = (isGenericTag && accountName) ? accountName : prev.playerTag;
        const updatedNick = (isGenericNick && accountName) ? accountName : prev.nickname;
        const updatedAvatar = currentUser.photoURL || prev.avatarUrl;

        const updated = {
          ...prev,
          userId: currentUser.uid,
          playerTag: updatedTag,
          nickname: updatedNick,
          avatarUrl: updatedAvatar
        };
        localStorage.setItem('pkxd_passport_data', JSON.stringify(updated));
        localStorage.setItem('pkxd_player_tag', updated.playerTag);
        localStorage.setItem('pkxd_nickname', updated.nickname);
        return updated;
      });

      if (accountName) {
        setEditTag(prevTag => (!prevTag || prevTag === 'JOGADOR' || prevTag === 'JOGADOR#000' || prevTag === 'GUEST') ? accountName : prevTag);
        setEditNick(prevNick => (!prevNick || prevNick === 'Explorador' || prevNick === 'Fã Secreto' || prevNick === 'JOGADOR') ? accountName : prevNick);
      }
      if (currentUser.photoURL) {
        setEditAvatar(currentUser.photoURL);
      }
    }
  }, [currentUser?.uid, currentUser?.displayName, currentUser?.email, currentUser?.photoURL]);

  // Sync Level & XP on props change
  useEffect(() => {
    setPassport(prev => {
      const updatedBadges = prev.badges.map(b => {
        if (b.id === 'badge_legend' && userLevel >= 10 && !b.unlocked) {
          return { ...b, unlocked: true, unlockedAt: Date.now() };
        }
        return b;
      });

      const updated = {
        ...prev,
        level: userLevel,
        xp: fanXP,
        badges: updatedBadges
      };
      localStorage.setItem('pkxd_passport_data', JSON.stringify(updated));
      return updated;
    });
  }, [userLevel, fanXP]);

  // Load from Firestore on user mount
  useEffect(() => {
    async function loadRemotePassport() {
      if (!currentUser?.uid || !db) return;
      try {
        const docRef = doc(db, 'pkxd_passports', currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as PKXDPassport;
          const accountName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : '');
          const isGenericTag = !data.playerTag || data.playerTag === 'JOGADOR' || data.playerTag === 'JOGADOR#000';
          const isGenericNick = !data.nickname || data.nickname === 'Explorador' || data.nickname === 'Fã Secreto' || data.nickname === 'JOGADOR';
          const finalTag = (isGenericTag && accountName) ? accountName : (data.playerTag || accountName || 'Explorador');
          const finalNick = (isGenericNick && accountName) ? accountName : (data.nickname || accountName || 'Explorador');

          setPassport(prev => {
            const merged = { 
              ...prev, 
              ...data,
              playerTag: finalTag,
              nickname: finalNick,
              avatarUrl: currentUser?.photoURL || data.avatarUrl || prev.avatarUrl,
              level: userLevel, 
              xp: fanXP 
            };
            localStorage.setItem('pkxd_passport_data', JSON.stringify(merged));
            localStorage.setItem('pkxd_player_tag', merged.playerTag);
            localStorage.setItem('pkxd_nickname', merged.nickname);
            return merged;
          });
        }
      } catch (err) {
        console.warn('Erro ao carregar passaporte do Firestore:', err);
      }
    }
    loadRemotePassport();
  }, [currentUser?.uid, currentUser?.displayName, currentUser?.email]);

  // Generate QR Code
  useEffect(() => {
    const passportUrl = `${window.location.origin}/?passaporte=${encodeURIComponent(passport.playerTag)}`;
    QRCode.toDataURL(passportUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Erro gerando QR Code:', err));
  }, [passport.playerTag]);

  // Save passport helper
  const savePassport = async (newPassport: PKXDPassport) => {
    setPassport(newPassport);
    localStorage.setItem('pkxd_passport_data', JSON.stringify(newPassport));
    localStorage.setItem('pkxd_player_tag', newPassport.playerTag);
    localStorage.setItem('pkxd_nickname', newPassport.nickname);

    if (currentUser?.uid && db) {
      try {
        await setDoc(doc(db, 'pkxd_passports', currentUser.uid), newPassport, { merge: true });
      } catch (err) {
        console.warn('Erro ao salvar passaporte no Firestore:', err);
      }
    }
  };

  // Handle Edit Submit (no mandatory '#')
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNick.trim() || !editTag.trim()) return;

    const formattedTag = editTag.trim();

    const updated: PKXDPassport = {
      ...passport,
      nickname: editNick.trim(),
      playerTag: formattedTag,
      bio: editBio.trim() || 'Explorador da Ilha PK XD!',
      title: editTitle,
      favoriteMinigame: editMinigame,
      houseTheme: editHouse.trim() || 'Mansão Gamer',
      cardTheme: editTheme,
      avatarUrl: editAvatar || currentUser?.photoURL || PRESET_AVATARS[0],
      updatedAt: Date.now()
    };

    savePassport(updated);
    setIsEditModalOpen(false);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (triggerAudio) triggerAudio('success');
    if (onAddXP) onAddXP(10, 'Atualizou perfil do Passaporte');
  };

  // Avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setEditAvatar(uploadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Add Friend (no mandatory '#')
  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendTag.trim()) {
      setFriendError('Insira o Nome ou Tag do amigo.');
      return;
    }

    const formattedTag = newFriendTag.trim();

    if (passport.friends.some(f => f.playerTag.toLowerCase() === formattedTag.toLowerCase())) {
      setFriendError('Este amigo já está na sua lista do Passaporte!');
      return;
    }

    const newFriend: PassportFriend = {
      id: 'friend_' + Date.now(),
      playerTag: formattedTag,
      nickname: newFriendNick.trim() || formattedTag,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(formattedTag)}&backgroundColor=b6e3f4`,
      level: Math.floor(Math.random() * 15) + 1,
      favoriteMinigame: newFriendGame,
      addedAt: Date.now()
    };

    const updatedFriends = [...passport.friends, newFriend];
    const updatedBadges = passport.badges.map(b => {
      if (b.id === 'badge_friendly' && !b.unlocked) {
        return { ...b, unlocked: true, unlockedAt: Date.now() };
      }
      return b;
    });

    const updated: PKXDPassport = {
      ...passport,
      friends: updatedFriends,
      badges: updatedBadges,
      updatedAt: Date.now()
    };

    savePassport(updated);
    setNewFriendTag('');
    setNewFriendNick('');
    setFriendError('');
    setIsAddFriendModalOpen(false);

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 }
    });

    if (onAddXP) onAddXP(15, 'Adicionou amigo ao Passaporte');
    if (triggerAudio) triggerAudio('levelUp');
  };

  // Remove friend
  const handleRemoveFriend = (friendId: string) => {
    if (confirm('Deseja remover este amigo da sua lista do passaporte?')) {
      const updatedFriends = passport.friends.filter(f => f.id !== friendId);
      const updated = {
        ...passport,
        friends: updatedFriends,
        updatedAt: Date.now()
      };
      savePassport(updated);
      if (triggerAudio) triggerAudio('tap');
    }
  };

  // Handle Create Stamp (Admin)
  const handleCreateStamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStampTitle.trim()) return;

    const newStamp: PassportStamp = {
      id: 'stamp_' + Date.now(),
      title: newStampTitle.trim(),
      eventOrSeason: newStampEvent.trim() || 'Evento Oficial',
      location: newStampLocation.trim() || 'Central Plaza',
      date: newStampDate.trim() || '2026',
      icon: newStampIcon.trim() || '🏆',
      color: newStampColor || '#8b5cf6',
      acquiredAt: Date.now()
    };

    const updatedStamps = [newStamp, ...(passport.stamps || [])];
    const updated: PKXDPassport = {
      ...passport,
      stamps: updatedStamps,
      updatedAt: Date.now()
    };

    savePassport(updated);
    setNewStampTitle('');
    setNewStampEvent('');
    setNewStampLocation('Central Plaza');
    setNewStampDate('2026');
    setNewStampIcon('🏆');
    setNewStampColor('#8b5cf6');
    setIsAddStampModalOpen(false);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (triggerAudio) triggerAudio('success');
    if (onAddXP) onAddXP(25, 'Criou um novo Selo Oficial no Passaporte');
  };

  // Handle Delete Stamp (Admin)
  const handleDeleteStamp = (stampId: string, stampTitle: string) => {
    if (confirm(`Deseja realmente excluir o selo "${stampTitle}"?`)) {
      const updatedStamps = (passport.stamps || []).filter(s => s.id !== stampId);
      const updated: PKXDPassport = {
        ...passport,
        stamps: updatedStamps,
        updatedAt: Date.now()
      };
      savePassport(updated);
      if (triggerAudio) triggerAudio('tap');
    }
  };

  // Copy Profile Link
  const handleCopyLink = () => {
    const passportUrl = `${window.location.origin}/?passaporte=${encodeURIComponent(passport.playerTag)}`;
    navigator.clipboard.writeText(passportUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      if (triggerAudio) triggerAudio('tap');
    });
  };

  // Copy Player Tag
  const handleCopyTag = () => {
    navigator.clipboard.writeText(passport.playerTag).then(() => {
      setCopiedTag(true);
      setTimeout(() => setCopiedTag(false), 2500);
      if (triggerAudio) triggerAudio('tap');
    });
  };

  // Get theme card gradients
  const getThemeGradients = (theme: PKXDPassport['cardTheme']) => {
    switch (theme) {
      case 'cyber-blue':
        return 'from-blue-600 via-indigo-900 to-cyan-950 border-cyan-400/60 shadow-[0_10px_35px_rgba(6,182,212,0.25)]';
      case 'golden-vip':
        return 'from-amber-600 via-yellow-900 to-zinc-950 border-yellow-400/70 shadow-[0_10px_35px_rgba(234,179,8,0.25)]';
      case 'sunset-pink':
        return 'from-pink-600 via-purple-900 to-rose-950 border-pink-400/60 shadow-[0_10px_35px_rgba(236,72,153,0.25)]';
      case 'emerald-gamer':
        return 'from-emerald-600 via-teal-900 to-zinc-950 border-emerald-400/60 shadow-[0_10px_35px_rgba(16,185,129,0.25)]';
      case 'neon-purple':
      default:
        return 'from-purple-700 via-indigo-950 to-pink-950 border-purple-500/60 shadow-[0_10px_35px_rgba(168,85,247,0.25)]';
    }
  };

  // Filtered badges
  const filteredBadges = passport.badges.filter(b => {
    if (badgeFilter === 'unlocked') return b.unlocked;
    if (badgeFilter === 'locked') return !b.unlocked;
    return true;
  });

  // Filtered friends
  const filteredFriends = passport.friends.filter(f => 
    f.nickname.toLowerCase().includes(friendSearch.toLowerCase()) ||
    f.playerTag.toLowerCase().includes(friendSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left animate-fade-in" id="passport-root-container">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-purple-950 via-zinc-900 to-indigo-950 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 bg-purple-500/15 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-pink-500/10 rounded-full filter blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 px-3.5 py-1 rounded-full text-pink-300 font-mono text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" />
              Identidade Digital da Comunidade
            </div>
            <h2 className="font-sans font-black text-2xl sm:text-4xl text-white uppercase tracking-tight leading-tight">
              PASSAPORTE <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400">PK XD</span> 🛂
            </h2>
            <p className="font-sans text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
              Seu documento oficial na Ilha! Colecione medalhas, carimbos de temporadas, conecte amigos, suba de nível com suas atividades e compartilhe seu QR Code exclusivo!
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                setEditNick(passport.nickname);
                setEditTag(passport.playerTag);
                setEditBio(passport.bio);
                setEditTitle(passport.title);
                setEditMinigame(passport.favoriteMinigame);
                setEditHouse(passport.houseTheme);
                setEditTheme(passport.cardTheme);
                setEditAvatar(passport.avatarUrl);
                setIsEditModalOpen(true);
              }}
              className="px-4 py-2.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/30 hover:border-purple-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-md"
            >
              <Edit3 className="w-4 h-4 text-purple-300" />
              <span>Editar Perfil</span>
            </button>

            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                setIsShareModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-lg"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code & Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Horizontal Tabs Navigation with smooth pill design */}
      <div className="bg-zinc-900/90 p-1.5 sm:p-2 rounded-2xl border border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-lg">
        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('card');
          }}
          className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'card'
              ? 'bg-purple-600 text-white shadow-md border border-purple-400/50 scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <User className="w-4 h-4 text-purple-300" />
          <span>Cartão ID</span>
        </button>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('badges');
          }}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'badges'
              ? 'bg-purple-600 text-white shadow-md border border-purple-400/50 scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Award className="w-4 h-4 text-yellow-300" />
          <span>Medalhas ({passport.badges.filter(b => b.unlocked).length}/{passport.badges.length})</span>
        </button>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('stamps');
          }}
          className={`flex-1 min-w-[95px] py-2.5 px-3 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'stamps'
              ? 'bg-purple-600 text-white shadow-md border border-purple-400/50 scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <BookmarkCheck className="w-4 h-4 text-cyan-300" />
          <span>Selos ({passport.stamps.length})</span>
        </button>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('friends');
          }}
          className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'friends'
              ? 'bg-purple-600 text-white shadow-md border border-purple-400/50 scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Users className="w-4 h-4 text-pink-300" />
          <span>Amigos ({passport.friends.length})</span>
        </button>

        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setActiveTab('events');
          }}
          className={`flex-1 min-w-[95px] py-2.5 px-3 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'events'
              ? 'bg-purple-600 text-white shadow-md border border-purple-400/50 scale-[1.02]'
              : 'text-gray-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-300" />
          <span>Eventos</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: VISUAL PASSPORT CARD (HOLOGRAPHIC OFFICIAL CARD) */}
      {/* ========================================================= */}
      {activeTab === 'card' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          {/* Main Holographic Card */}
          <div className="lg:col-span-7">
            <div className={`bg-gradient-to-br ${getThemeGradients(passport.cardTheme)} border-2 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-300`}>
              {/* Holographic Watermark Glow */}
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full filter blur-xl pointer-events-none" />
              <div className="absolute top-1/2 left-0 w-36 h-36 bg-purple-500/20 rounded-full filter blur-2xl pointer-events-none" />
              <div className="absolute bottom-2 right-4 font-mono text-[9px] text-white/30 uppercase tracking-widest select-none">
                PKXD CITIZENSHIP CARD • ID #{passport.playerTag.replace('#', '')}
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                    <ShieldCheck className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-sm tracking-wider uppercase">
                      REPÚBLICA DE PK XD
                    </h3>
                    <p className="font-mono text-[9px] text-white/70 uppercase tracking-widest">
                      PASSAPORTE OFICIAL DA COMUNIDADE
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full font-mono font-bold text-xs text-yellow-300 flex items-center gap-1.5 shadow-sm">
                  <Flame className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span>NÍVEL {passport.level}</span>
                </div>
              </div>

              {/* Card Main Body */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar with Ring */}
                <div className="relative group flex-shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/40 shadow-xl bg-black/60 p-1">
                    <img 
                      src={passport.avatarUrl} 
                      alt={passport.nickname} 
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as any).src = PRESET_AVATARS[0];
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black font-black text-[10px] px-2 py-0.5 rounded-md shadow uppercase">
                    LVL {passport.level}
                  </div>
                </div>

                {/* Info and Tags */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h4 className="font-sans font-black text-xl sm:text-2xl tracking-tight uppercase text-white drop-shadow-sm">
                        {passport.nickname}
                      </h4>
                      <button
                        onClick={handleCopyTag}
                        className="px-2 py-0.5 bg-black/40 hover:bg-black/60 border border-white/20 rounded-md font-mono text-xs font-bold text-cyan-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="Clique para copiar a Tag"
                      >
                        <span>{passport.playerTag}</span>
                        {copiedTag ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    
                    <p className="font-sans font-extrabold text-xs text-yellow-300 uppercase tracking-wide flex items-center justify-center sm:justify-start gap-1">
                      <Sparkles className="w-3 h-3 text-yellow-300" />
                      <span>{passport.title}</span>
                    </p>
                  </div>

                  <p className="font-sans text-xs text-white/85 leading-relaxed italic bg-black/20 p-2.5 rounded-xl border border-white/10">
                    "{passport.bio}"
                  </p>

                  {/* Level Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-white/80">
                      <span>Progresso Nível {passport.level}</span>
                      <span>{fanXP} XP Total ({currentLevelProgress}/100 para Lv.{passport.level + 1})</span>
                    </div>
                    <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/20">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-300 rounded-full transition-all duration-500"
                        style={{ width: `${currentLevelProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Meta Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-6 pt-4 border-t border-white/15 text-xs font-sans">
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 space-y-0.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-white/60 block">🎮 Minigame Favorito</span>
                  <strong className="text-white text-xs truncate flex items-center gap-1">
                    <span>{getMinigameIcon(passport.favoriteMinigame)}</span>
                    <span className="truncate">{passport.favoriteMinigame}</span>
                  </strong>
                </div>

                <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 space-y-0.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-white/60 block">🏠 Estilo de Casa</span>
                  <strong className="text-white text-xs truncate block">{passport.houseTheme}</strong>
                </div>

                <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-white/60 block">⏱️ Na Comunidade</span>
                  <strong className="text-white text-xs truncate block">{passport.timeInCommunity}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Side Info: QR Code + Quick Stats & Badges Highlight */}
          <div className="lg:col-span-5 space-y-5">
            {/* QR Code Card */}
            <div className="bg-zinc-900/90 border border-purple-500/30 rounded-3xl p-5 sm:p-6 text-center space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-purple-300 font-black text-xs uppercase tracking-wider">
                  <QrCode className="w-4 h-4" />
                  <span>QR Code do Passaporte</span>
                </div>
                <span className="text-[9px] font-mono text-gray-400">Escaneie para ver perfil</span>
              </div>

              {qrCodeDataUrl ? (
                <div className="w-44 h-44 mx-auto bg-white p-2.5 rounded-2xl shadow-xl border-2 border-purple-500/30 hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                  <img src={qrCodeDataUrl} alt="Passport QR Code" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-44 h-44 mx-auto bg-neutral-800 rounded-2xl flex items-center justify-center text-xs text-gray-400 animate-pulse">
                  Gerando QR Code...
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>

                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-purple-500/30 font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  title="Compartilhar"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Badges Highlights */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-sans font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>Destaques de Medalhas</span>
                </h4>
                <button
                  onClick={() => setActiveTab('badges')}
                  className="text-[10px] font-mono text-pink-400 hover:text-pink-300 hover:underline cursor-pointer uppercase"
                >
                  Ver Todas →
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {passport.badges.slice(0, 4).map((badge) => (
                  <div
                    key={badge.id}
                    onClick={() => setSelectedBadge(badge)}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-105 ${
                      badge.unlocked
                        ? 'bg-purple-950/40 border-purple-500/40 shadow-sm'
                        : 'bg-black/40 border-white/5 opacity-40 grayscale'
                    }`}
                  >
                    <span className="text-2xl mb-1">{badge.icon}</span>
                    <span className="text-[9px] font-bold text-white truncate max-w-full">{badge.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MEDALHAS & CONQUISTAS (BADGES) */}
      {/* ========================================================= */}
      {activeTab === 'badges' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="font-sans font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Mural de Medalhas & Conquistas
              </h3>
              <p className="text-xs text-gray-400">
                Ganhe XP, participe de enquetes, adicione amigos e explore a Central para desbloquear todas as medalhas!
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 self-start sm:self-center bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setBadgeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  badgeFilter === 'all' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Todas ({passport.badges.length})
              </button>
              <button
                onClick={() => setBadgeFilter('unlocked')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  badgeFilter === 'unlocked' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Desbloqueadas ({passport.badges.filter(b => b.unlocked).length})
              </button>
              <button
                onClick={() => setBadgeFilter('locked')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  badgeFilter === 'locked' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Bloqueadas ({passport.badges.filter(b => !b.unlocked).length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-5 rounded-2xl border-2 transition-all flex items-start gap-4 cursor-pointer relative overflow-hidden ${
                  badge.unlocked
                    ? 'bg-zinc-900/90 border-purple-500/40 hover:border-purple-400 shadow-lg hover:shadow-purple-500/10'
                    : 'bg-zinc-950/60 border-white/5 opacity-55 hover:opacity-75'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border ${
                  badge.unlocked 
                    ? 'bg-gradient-to-br from-purple-800 to-indigo-900 border-purple-400/40 shadow-inner' 
                    : 'bg-zinc-900 border-white/10 grayscale'
                }`}>
                  {badge.icon}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-sans font-black text-sm text-white uppercase truncate">
                      {badge.title}
                    </h4>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold flex-shrink-0 ${
                      badge.rarity === 'Lendário'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : badge.rarity === 'Épico'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : badge.rarity === 'Raro'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-neutral-800 text-gray-400'
                    }`}>
                      {badge.rarity || 'Comum'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                    {badge.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-[10px] font-mono">
                    {badge.unlocked ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Desbloqueada
                      </span>
                    ) : (
                      <span className="text-gray-500 font-bold">
                        🔒 Bloqueada
                      </span>
                    )}
                    <span className="text-purple-300 hover:underline">Ver detalhes →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SELOS ESPECIAIS & CARIMBOS (STAMPS) */}
      {/* ========================================================= */}
      {activeTab === 'stamps' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="font-sans font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-cyan-400" />
                Caderno de Carimbos & Selos da Ilha
              </h3>
              <p className="text-xs text-gray-400">
                Colecione os carimbos oficiais emitidos em temporadas comemorativas e grandes eventos de PK XD!
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-center">
              <div className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl font-mono text-xs font-bold text-cyan-300">
                Selos: {passport.stamps.length}
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    if (triggerAudio) triggerAudio('tap');
                    setIsAddStampModalOpen(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Selo (ADM)</span>
                </button>
              )}
            </div>
          </div>

          {passport.stamps.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/40 rounded-3xl border border-dashed border-white/10 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto text-2xl">
                <BookmarkCheck className="w-7 h-7" />
              </div>
              <h4 className="font-sans font-black text-base text-white uppercase">Nenhum Selo Cadastrado</h4>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Nenhum carimbo oficial registrado no momento. Novos selos e carimbos de eventos serão disponibilizados aqui!
              </p>
              {isAdmin && (
                <button
                  onClick={() => {
                    if (triggerAudio) triggerAudio('tap');
                    setIsAddStampModalOpen(true);
                  }}
                  className="mt-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Primeiro Selo (Modo ADM)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {passport.stamps.map((stamp) => (
                <div
                  key={stamp.id}
                  className="bg-zinc-900/80 border-2 border-white/10 hover:border-cyan-400/50 rounded-3xl p-5 shadow-xl transition-all relative overflow-hidden group"
                >
                  {/* Stamp Postal Border Effect */}
                  <div className="absolute top-2 right-2 border-2 border-dashed border-white/20 rounded-full px-2 py-0.5 text-[8px] font-mono text-white/50 uppercase tracking-widest">
                    OFFICIAL STAMP
                  </div>

                  <div className="flex items-start gap-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg border border-white/20 transform group-hover:rotate-6 transition-transform"
                      style={{ backgroundColor: stamp.color ? `${stamp.color}30` : 'rgba(139,92,246,0.3)' }}
                    >
                      {stamp.icon}
                    </div>

                    <div className="space-y-1 flex-1 pr-4">
                      <h4 className="font-sans font-black text-base text-white uppercase">
                        {stamp.title}
                      </h4>
                      <p className="text-xs text-cyan-300 font-bold">
                        {stamp.eventOrSeason}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        📍 {stamp.location || 'Central PK XD'} • 📅 {stamp.date}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteStamp(stamp.id, stamp.title)}
                      className="absolute bottom-3 right-3 p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 rounded-lg border border-red-500/30 transition-all cursor-pointer z-10"
                      title="Excluir Selo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AMIGOS DA ILHA (FRIENDS LIST) */}
      {/* ========================================================= */}
      {activeTab === 'friends' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="font-sans font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                Amigos Conectados no Passaporte
              </h3>
              <p className="text-xs text-gray-400">
                Adicione as Tags de PK XD dos seus amigos para acompanhar seus níveis e minigames favoritos!
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar amigo..."
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 w-36 sm:w-44"
                />
              </div>

              <button
                onClick={() => {
                  if (triggerAudio) triggerAudio('tap');
                  setFriendError('');
                  setIsAddFriendModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Amigo</span>
              </button>
            </div>
          </div>

          {filteredFriends.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/40 rounded-3xl border border-dashed border-white/10 space-y-3">
              <Users className="w-12 h-12 text-gray-500 mx-auto" />
              <h4 className="font-sans font-bold text-white text-sm">
                {passport.friends.length === 0 ? 'Nenhum amigo adicionado ainda' : 'Nenhum amigo encontrado na busca'}
              </h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Clique no botão "Adicionar Amigo" acima e insira a Tag de PK XD dos seus colegas de jogo!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-zinc-900/80 border border-white/10 hover:border-pink-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-white/20 flex-shrink-0">
                      <img 
                        src={friend.avatarUrl || PRESET_AVATARS[0]} 
                        alt={friend.nickname} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-sans font-black text-sm text-white truncate">
                        {friend.nickname}
                      </h4>
                      <p className="font-mono text-xs text-cyan-300 font-bold">
                        {friend.playerTag}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                        <span>{getMinigameIcon(friend.favoriteMinigame || 'Crazy Run')}</span>
                        <span className="truncate">{friend.favoriteMinigame || 'Crazy Run'} • Nível {friend.level || 5}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer flex-shrink-0"
                    title="Remover Amigo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: HISTÓRICO DE EVENTOS */}
      {/* ========================================================= */}
      {activeTab === 'events' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-900/60 p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="font-sans font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Histórico de Participação em Eventos
              </h3>
              <p className="text-xs text-gray-400">
                Veja o histórico de eventos que você organizou ou confirmou presença na plataforma!
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {passport.eventHistory.map((hist) => (
              <div
                key={hist.id}
                className="bg-zinc-900/80 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold flex-shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white">
                      {hist.eventName}
                    </h4>
                    <p className="text-xs text-gray-400">
                      Função: <span className="text-emerald-400 font-bold uppercase">{hist.role}</span> • Categoria: {hist.category}
                    </p>
                  </div>
                </div>

                <span className="font-mono text-xs text-gray-400 bg-black/40 px-3 py-1 rounded-xl border border-white/5 self-start sm:self-auto">
                  📅 {hist.date}
                </span>
              </div>
            ))}

            {events.length > 0 && (
              <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-2xl flex items-center justify-between">
                <div className="text-xs text-gray-300">
                  <span>Há <strong>{events.length} eventos comunitários</strong> disponíveis na Central de Eventos!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR PERFIL DO PASSAPORTE */}
      {/* ========================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 w-full max-w-lg relative shadow-2xl space-y-5 my-8 text-left max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-purple-400">
              <Edit3 className="w-5 h-5" />
              <h3 className="font-sans font-black text-lg text-white uppercase tracking-wider">
                Editar Passaporte PKXD ✏️
              </h3>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">Nickname no PK XD *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Koosh"
                    value={editNick}
                    onChange={(e) => setEditNick(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">Identificador / Tag ou Nick *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: KOOSH ou SeuNick"
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white font-bold uppercase focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-neutral-400">Título de Cidadão</label>
                <select
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-white/15 rounded-xl text-xs text-white font-bold cursor-pointer focus:outline-none focus:border-purple-500"
                >
                  <option value="Explorador da Ilha">🌟 Explorador da Ilha</option>
                  <option value="Caçador de Spoilers">🔮 Caçador de Spoilers</option>
                  <option value="Mestre dos Mini-Games">🏆 Mestre dos Mini-Games</option>
                  <option value="Lenda do PK XD">👑 Lenda do PK XD</option>
                  <option value="Creator Estrela">⭐ Creator Estrela</option>
                  <option value="Arquiteto de Casas">🏠 Arquiteto de Casas</option>
                  <option value="Piloto do Crazy Run">⚡ Piloto do Crazy Run</option>
                  {isAdmin && <option value="Lorde da Moderação">🛡️ Lorde da Moderação</option>}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-neutral-400">Bio do Perfil</label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Conte um pouco sobre suas aventuras no PK XD..."
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">Minigame Favorito</label>
                  <select
                    value={editMinigame}
                    onChange={(e) => setEditMinigame(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-white/15 rounded-xl text-xs text-white font-bold cursor-pointer focus:outline-none focus:border-purple-500"
                  >
                    {PKXD_MINIGAMES.map((game) => (
                      <option key={game.name} value={game.name}>
                        {game.icon} {game.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">Estilo de Casa</label>
                  <input
                    type="text"
                    value={editHouse}
                    onChange={(e) => setEditHouse(e.target.value)}
                    placeholder="Ex: Mansão Gamer, Castelo Mágico"
                    className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Card Theme Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-neutral-400">Tema Visual do Cartão</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'neon-purple', label: 'Neon Purple', color: 'bg-purple-600' },
                    { id: 'cyber-blue', label: 'Cyber Blue', color: 'bg-cyan-600' },
                    { id: 'golden-vip', label: 'Golden VIP', color: 'bg-yellow-600' },
                    { id: 'sunset-pink', label: 'Sunset Pink', color: 'bg-pink-600' },
                    { id: 'emerald-gamer', label: 'Emerald', color: 'bg-emerald-600' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditTheme(t.id as any)}
                      className={`p-2 rounded-xl border text-[10px] font-bold text-white flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        editTheme === t.id ? 'border-white scale-105 shadow-md bg-white/10' : 'border-white/10 opacity-60'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${t.color}`} />
                      <span className="truncate max-w-full">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Options & Selection */}
              <div className="space-y-2.5 border border-white/10 bg-black/30 p-3.5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-300">Foto do Avatar & Perfil</label>
                  {currentUser?.photoURL && (
                    <button
                      type="button"
                      onClick={() => setEditAvatar(currentUser.photoURL!)}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Usar Foto da Minha Conta</span>
                    </button>
                  )}
                </div>

                {/* Selected Preview and Upload button */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-purple-400/50 bg-black flex-shrink-0 shadow-md">
                    <img 
                      src={editAvatar} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as any).src = PRESET_AVATARS[0];
                      }}
                    />
                  </div>
                  <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 py-2.5 px-3 rounded-xl text-xs font-bold text-purple-300 cursor-pointer transition-all">
                    <UploadCloud className="w-4 h-4" />
                    <span>Enviar Foto da Galeria</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>

                {/* Preset Avatars */}
                <div className="space-y-1 pt-1 border-t border-white/5">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase">Ou escolha um avatar gamer:</span>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {PRESET_AVATARS.map((avatarUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditAvatar(avatarUrl)}
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                          editAvatar === avatarUrl ? 'border-pink-400 scale-110 shadow-md' : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={avatarUrl} alt={`Avatar ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Salvar Alterações ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADICIONAR AMIGO */}
      {/* ========================================================= */}
      {isAddFriendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border-2 border-pink-500/50 rounded-3xl p-6 sm:p-8 w-full max-w-md relative shadow-2xl space-y-4 text-left">
            <button
              onClick={() => setIsAddFriendModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-pink-400">
              <Users className="w-5 h-5" />
              <h3 className="font-sans font-black text-lg text-white uppercase tracking-wider">
                Adicionar Amigo PKXD 🤝
              </h3>
            </div>

            <form onSubmit={handleAddFriend} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-neutral-400">Nome ou Tag do Amigo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: LunaStar ou Gabriel"
                  value={newFriendTag}
                  onChange={(e) => setNewFriendTag(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/60 border border-white/15 rounded-xl text-sm text-white font-bold uppercase focus:outline-none focus:border-pink-500"
                />
                <p className="text-[10px] text-neutral-400">Digite o nickname ou identificador do amigo.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-neutral-400">Nome / Apelido (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Luna"
                  value={newFriendNick}
                  onChange={(e) => setNewFriendNick(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-neutral-400">Minigame que jogam juntos</label>
                <select
                  value={newFriendGame}
                  onChange={(e) => setNewFriendGame(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-white/15 rounded-xl text-xs text-white font-bold cursor-pointer focus:outline-none focus:border-pink-500"
                >
                  {PKXD_MINIGAMES.map((game) => (
                    <option key={game.name} value={game.name}>
                      {game.icon} {game.name}
                    </option>
                  ))}
                </select>
              </div>

              {friendError && (
                <div className="p-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-xs text-red-300 font-bold">
                  ⚠️ {friendError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFriendModalOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Adicionar Amigo 🎉
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: QR CODE & COMPARTILHAMENTO */}
      {/* ========================================================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 w-full max-w-md relative shadow-2xl space-y-5 text-center">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto mb-2">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-sans font-black text-xl text-white uppercase tracking-wider">
                Compartilhar Passaporte
              </h3>
              <p className="text-xs text-gray-300">
                Mostre suas conquistas e medalhas para seus amigos de PK XD!
              </p>
            </div>

            {qrCodeDataUrl && (
              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl border-2 border-purple-500/30 flex items-center justify-center">
                <img src={qrCodeDataUrl} alt="Passport QR" className="w-full h-full object-contain" />
              </div>
            )}

            <div className="space-y-3">
              {/* Direct URL input preview */}
              <div className="bg-black/60 border border-purple-500/30 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-left">
                <div className="flex-1 overflow-hidden">
                  <span className="block text-[9px] font-mono uppercase font-bold text-pink-400">Seu Link Oficial:</span>
                  <span className="font-mono text-xs text-yellow-300 truncate block">
                    {typeof window !== 'undefined' ? `${window.location.origin}/?passaporte=${encodeURIComponent(passport.playerTag)}` : `https://pkxdcentral.site/?passaporte=${passport.playerTag}`}
                  </span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-sans font-black text-[11px] uppercase rounded-xl transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`✨ Confira meu Passaporte Oficial no PK XD Central com minhas conquistas e medalhas!\n🎮 Meu Nick: ${passport.nickname}\n🆔 Tag: ${passport.playerTag}\n🛂 Acesse meu Passaporte: ${typeof window !== 'undefined' ? window.location.origin : 'https://pkxdcentral.site'}/?passaporte=${encodeURIComponent(passport.playerTag)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                >
                  <span>💬 Enviar no WhatsApp</span>
                </a>
              </div>

              <button
                onClick={handleCopyTag}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedTag ? 'Tag Copiada!' : `Copiar Tag: ${passport.playerTag}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETALHES DA MEDALHA SELECIONADA */}
      {/* ========================================================= */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 w-full max-w-sm relative shadow-2xl space-y-4 text-center">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl border-2 ${
              selectedBadge.unlocked
                ? 'bg-gradient-to-br from-purple-800 to-indigo-900 border-purple-400 shadow-xl'
                : 'bg-neutral-800 border-white/10 grayscale opacity-60'
            }`}>
              {selectedBadge.icon}
            </div>

            <div className="space-y-1">
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-bold ${
                selectedBadge.rarity === 'Lendário'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : selectedBadge.rarity === 'Épico'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}>
                Raridade: {selectedBadge.rarity || 'Comum'}
              </span>
              <h3 className="font-sans font-black text-lg text-white uppercase pt-1">
                {selectedBadge.title}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs font-mono">
              {selectedBadge.unlocked ? (
                <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Conquista Desbloqueada!
                </span>
              ) : (
                <span className="text-amber-400 font-bold">
                  🔒 Bloqueada — Conclua os objetivos para liberar!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CRIAR NOVO SELO OFICIAL (MODO ADM) */}
      {/* ========================================================= */}
      {isAddStampModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 w-full max-w-lg relative shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddStampModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="font-sans font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-cyan-400" />
                Criar Selo Oficial (Modo ADM)
              </h3>
              <p className="text-xs text-gray-400">
                Adicione carimbos comemorativos e oficiais ao Passaporte PK XD.
              </p>
            </div>

            {/* Live Preview */}
            <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-2">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">Pré-visualização do Selo:</span>
              <div className="bg-zinc-900 border-2 border-white/10 rounded-2xl p-4 relative overflow-hidden flex items-start gap-3">
                <div className="absolute top-2 right-2 border border-dashed border-white/20 rounded-full px-2 py-0.5 text-[7px] font-mono text-white/50 uppercase">
                  OFFICIAL STAMP
                </div>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg border border-white/20"
                  style={{ backgroundColor: newStampColor ? `${newStampColor}30` : 'rgba(139,92,246,0.3)' }}
                >
                  {newStampIcon || '🏆'}
                </div>
                <div className="space-y-0.5 flex-1 pr-6">
                  <h5 className="font-sans font-black text-sm text-white uppercase">
                    {newStampTitle || 'Nome do Selo'}
                  </h5>
                  <p className="text-[11px] text-cyan-300 font-bold">
                    {newStampEvent || 'Temporada / Evento'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    📍 {newStampLocation || 'Central Plaza'} • 📅 {newStampDate || '2026'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateStamp} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-300 font-bold uppercase mb-1">
                  Título do Selo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Campeão Crazy Run"
                  value={newStampTitle}
                  onChange={(e) => setNewStampTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-cyan-500 rounded-xl text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-gray-300 font-bold uppercase mb-1">
                    Evento ou Temporada
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Torneio de Velocidade"
                    value={newStampEvent}
                    onChange={(e) => setNewStampEvent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-cyan-500 rounded-xl text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 font-bold uppercase mb-1">
                    Localização na Ilha
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Circuito dos Robôs"
                    value={newStampLocation}
                    onChange={(e) => setNewStampLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-cyan-500 rounded-xl text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 font-bold uppercase mb-1">
                  Data / Período
                </label>
                <input
                  type="text"
                  placeholder="Ex: 2026 ou Agosto 2026"
                  value={newStampDate}
                  onChange={(e) => setNewStampDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-cyan-500 rounded-xl text-sm text-white outline-none"
                />
              </div>

              {/* Icon selector */}
              <div>
                <label className="block text-xs font-mono text-gray-300 font-bold uppercase mb-1.5">
                  Ícone / Emoji do Carimbo
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['🏆', '🌟', '🚀', '🏖️', '⚡', '🎉', '👾', '👑', '🔥', '💎', '🐾', '🎮', '🎯', '🎃'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewStampIcon(emoji)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all cursor-pointer ${
                        newStampIcon === emoji
                          ? 'bg-cyan-500/20 border-cyan-400 scale-110 shadow-md'
                          : 'bg-black/40 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Ou digite outro emoji/ícone..."
                  value={newStampIcon}
                  onChange={(e) => setNewStampIcon(e.target.value)}
                  className="w-full px-3.5 py-2 bg-black/50 border border-white/10 focus:border-cyan-500 rounded-xl text-sm text-white outline-none"
                />
              </div>

              {/* Color glow selector */}
              <div>
                <label className="block text-xs font-mono text-gray-300 font-bold uppercase mb-1.5">
                  Cor de Destaque
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { name: 'Roxo', color: '#8b5cf6' },
                    { name: 'Ciano', color: '#06b6d4' },
                    { name: 'Rosa', color: '#ec4899' },
                    { name: 'Dourado', color: '#eab308' },
                    { name: 'Esmeralda', color: '#10b981' },
                    { name: 'Laranja', color: '#f97316' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setNewStampColor(c.color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                        newStampColor === c.color ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddStampModalOpen(false)}
                  className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Emitir Selo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
