/**
 * PKXD Central - Local Browser Cache Engine
 * Provides instant 0-second page hydration, offline support, and background Firestore revalidation.
 */

const CACHE_VERSION = 'pkxd_cache_v2_';

export function loadFromCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(CACHE_VERSION + key);
    if (!raw || raw === 'undefined' || raw === 'null') {
      // Check legacy un-versioned key as fallback
      const legacy = localStorage.getItem(key);
      if (legacy && legacy !== 'undefined' && legacy !== 'null') {
        return JSON.parse(legacy) as T;
      }
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback;
  } catch (err) {
    console.warn(`[PKXD Cache] Could not load key "${key}":`, err);
    return fallback;
  }
}

export function saveToCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_VERSION + key, JSON.stringify(data));
    // Also save legacy key for backward compatibility
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[PKXD Cache] Could not persist key "${key}":`, err);
  }
}

export function clearCacheKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_VERSION + key);
    localStorage.removeItem(key);
  } catch (err) {}
}

// Rich default media & video items so preview and instant load are populated right away
export const DEFAULT_CACHED_VIDEOS = [
  {
    id: 'vid_default_1',
    title: 'NOVA ATUALIZAÇÃO DO PK XD: VAZOU O CASTELO SECRETO E NOVA ARMADURA! 🏰✨',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'game_highlight' as const,
    author: 'Equipe PKXD Central',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'vid_default_2',
    title: 'COMO CONSEGUIR 100K MOEDAS E TODAS AS GEMAS NO NOVO CRAZY RUN! 💎🏃‍♂️',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'panel_video' as const,
    author: 'Criadores da Comunidade',
    createdAt: Date.now() - 7200000
  }
];

export const DEFAULT_CACHED_ARTES = [
  {
    id: 'art_default_1',
    title: 'Logo Oficial PK XD Central HD',
    description: 'Logo oficial do canal e site em alta definição com fundo transparente!',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
    downloadUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
    category: 'Logos',
    isVideo: false,
    createdAt: Date.now() - 60000
  },
  {
    id: 'art_default_2',
    title: 'Render 3D Koosh Gamer com Fone',
    description: 'Render transparente do Koosh em pose gamer 3D, ideal para thumbnails!',
    imageUrl: 'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?auto=format&fit=crop&q=80&w=600',
    downloadUrl: 'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?auto=format&fit=crop&q=80&w=1200',
    category: 'Renders',
    isVideo: false,
    createdAt: Date.now() - 50000
  },
  {
    id: 'art_default_3',
    title: 'Fundo Espacial Neon Galaxy',
    description: 'Wallpaper e background espacial estilizado para webcams e vídeos!',
    imageUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=600',
    downloadUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=1200',
    category: 'Fundos',
    isVideo: false,
    createdAt: Date.now() - 40000
  },
  {
    id: 'art_default_4',
    title: 'Borda Webcam Holográfica PKXD',
    description: 'Moldura de tela transparente com efeito neon rosa e roxo para criadores!',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600',
    downloadUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200',
    category: 'Overlays',
    isVideo: false,
    createdAt: Date.now() - 30000
  },
  {
    id: 'art_default_5',
    title: 'Trailer Oficial & Animação Especial PKXD',
    description: 'Clipe oficial em alta qualidade para edição e recortes em shorts!',
    imageUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    downloadUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Vídeos',
    isVideo: true,
    createdAt: Date.now() - 20000
  }
];
