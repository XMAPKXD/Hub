import React, { useRef, useState, useEffect } from 'react';
import { 
  Smartphone, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Flame, 
  Share2, 
  Check,
  MoveHorizontal
} from 'lucide-react';
import { ShortItem } from '../types';
import { playTapSound } from '../utils/audio';

interface BestShortsProps {
  shorts: ShortItem[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onNavigate?: (path: string) => void;
}

// Curated default shorts if none in database yet
const DEFAULT_SHORTS: ShortItem[] = [
  {
    id: 'default_short_1',
    title: 'NOVA ATUALIZAÇÃO SECRETA DO PK XD! 😱🔥',
    youtubeUrl: 'https://youtube.com/shorts/5JqR2_e7YkM',
    createdAt: Date.now() - 24 * 3600 * 1000
  },
  {
    id: 'default_short_2',
    title: 'TESTEI O NOVO BUG DA ARMADURA NO CRAZY RUN! ⚡🏃‍♂️',
    youtubeUrl: 'https://youtube.com/shorts/6rZlQ1W9e0k',
    createdAt: Date.now() - 48 * 3600 * 1000
  },
  {
    id: 'default_short_3',
    title: 'TODOS OS CÓDIGOS SECRETOS DE GEMAS DESTA SEMANA! 💎',
    youtubeUrl: 'https://youtube.com/shorts/3XkM8_q1Z2w',
    createdAt: Date.now() - 72 * 3600 * 1000
  },
  {
    id: 'default_short_4',
    title: 'DECORANDO A NOVA CASA TECH COM 100K MOEDAS! 🏡✨',
    youtubeUrl: 'https://youtube.com/shorts/7YwQ4_p9L1m',
    createdAt: Date.now() - 96 * 3600 * 1000
  }
];

export default function BestShorts({ shorts, isAdmin, onDelete, onNavigate }: BestShortsProps) {
  const displayShorts = shorts && shorts.length > 0 ? shorts : DEFAULT_SHORTS;
  const isUsingDefaults = (!shorts || shorts.length === 0);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mouse drag-to-scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasMovedDistance, setHasMovedDistance] = useState(false);

  const getYoutubeEmbedId = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\/shorts\/|shorts\?v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch (e) {
      return null;
    }
  };

  // Check scroll position to update arrows and active indicator
  const updateScrollState = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Calculate approximate active card index
    const cardWidth = 280; // approximate width + gap
    const index = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(displayShorts.length - 1, Math.max(0, index)));
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [displayShorts.length]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    playTapSound();
    if (!carouselRef.current) return;
    const cardWidth = 300;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const scrollToIndex = (index: number) => {
    playTapSound();
    if (!carouselRef.current) return;
    const cardWidth = 300;
    carouselRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
  };

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setHasMovedDistance(false);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeftState(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 6) {
      setHasMovedDistance(true);
    }
    carouselRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWatchClick = (url: string) => {
    if (hasMovedDistance) return; // ignore click if user was dragging
    playTapSound();
    window.open(url, '_blank', 'noreferrer');
  };

  const handleCopyLink = (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    playTapSound();
    try {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {}
  };

  return (
    <section 
      id="best-shorts-section" 
      className="bg-zinc-900/50 border-2 border-cyan-500/20 rounded-3xl p-5 sm:p-7 space-y-6 text-left relative overflow-hidden shadow-2xl backdrop-blur-md"
    >
      {/* Accent glow spots */}
      <div className="absolute -top-10 left-1/4 w-48 h-48 bg-cyan-500/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-1/4 w-48 h-48 bg-pink-500/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header with Title, Actions & Carousel Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-400/30 rounded-2xl shadow-inner flex-shrink-0 animate-pulse">
            <Smartphone className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-sans font-black text-xl sm:text-2xl tracking-tight text-white uppercase flex items-center gap-1.5">
                <span>Melhores Shorts da Semana</span>
                <span className="text-yellow-300">⚡</span>
              </h3>
              <span className="font-black text-[9px] uppercase font-mono px-2.5 py-0.5 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 rounded-full border border-cyan-400/40 shadow-sm flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                <span>Curadoria PKXD Central</span>
              </span>
            </div>
            <p className="font-sans text-xs sm:text-sm text-cyan-100/80 mt-0.5">
              Vídeos curtos e explosivos selecionados com exclusividade pelo <strong className="text-pink-400">PKXD Central</strong>!
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Arrows */}
        <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
          {onNavigate ? (
            <button
              onClick={() => { playTapSound(); onNavigate('/inscricoes#shorts'); }}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 text-cyan-200 border border-cyan-400/40 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 text-center flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Envie seu vídeo para aparecer aqui"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
              <span>Enviar Shorts</span>
            </button>
          ) : (
            <a
              href="https://forms.gle/bmJqrXkSa9uibQqo9"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 text-cyan-200 border border-cyan-400/40 rounded-xl font-sans font-black text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 text-center flex items-center gap-1.5 shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
              <span>Enviar Shorts</span>
            </a>
          )}

          {/* Carousel Arrow Buttons */}
          <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-white/10 shadow-inner">
            <button
              onClick={() => scrollByAmount('left')}
              disabled={!canScrollLeft}
              className={`p-2 rounded-lg transition-all duration-150 cursor-pointer ${
                canScrollLeft 
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 active:scale-90' 
                  : 'text-zinc-600 cursor-not-allowed opacity-40'
              }`}
              title="Ver Short anterior"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono text-[10px] font-bold text-zinc-400 px-1.5 select-none">
              {activeIndex + 1}/{displayShorts.length}
            </span>

            <button
              onClick={() => scrollByAmount('right')}
              disabled={!canScrollRight}
              className={`p-2 rounded-lg transition-all duration-150 cursor-pointer ${
                canScrollRight 
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 active:scale-90' 
                  : 'text-zinc-600 cursor-not-allowed opacity-40'
              }`}
              title="Ver próximo Short"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Helper Cue: Arraste para o lado */}
      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
        <div className="flex items-center gap-1.5 text-cyan-300 font-bold animate-pulse">
          <MoveHorizontal className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-wider">Arraste para o lado para ver outros vídeos ↔</span>
        </div>
        <span className="text-[10px] text-zinc-400 hidden sm:inline">
          {displayShorts.length} shorts selecionados
        </span>
      </div>

      {/* CAROUSEL TRACK */}
      <div className="relative group/carousel">
        {/* Floating Left Scroll Button for Desktop */}
        {canScrollLeft && (
          <button
            onClick={() => scrollByAmount('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-zinc-950/90 hover:bg-cyan-950 text-cyan-300 border-2 border-cyan-400/50 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 hidden md:flex"
            title="Short anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Floating Right Scroll Button for Desktop */}
        {canScrollRight && (
          <button
            onClick={() => scrollByAmount('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-zinc-950/90 hover:bg-cyan-950 text-cyan-300 border-2 border-cyan-400/50 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 hidden md:flex"
            title="Próximo Short"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Horizontal Scrollable Container with Snap & Drag Support */}
        <div
          ref={carouselRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory py-2 px-1 no-scrollbar select-none scroll-smooth transition-colors ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {displayShorts.map((short, idx) => {
            const embedId = getYoutubeEmbedId(short.youtubeUrl);
            const isCurrentActive = idx === activeIndex;

            return (
              <div
                key={short.id || idx}
                className={`w-[240px] xs:w-[260px] sm:w-[280px] md:w-[290px] flex-shrink-0 snap-center sm:snap-start bg-zinc-950/90 border-2 rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 relative shadow-xl hover:-translate-y-1 ${
                  isCurrentActive 
                    ? 'border-cyan-400 shadow-[0_10px_30px_rgba(34,211,238,0.25)]' 
                    : 'border-white/10 hover:border-cyan-400/50'
                }`}
              >
                {/* Header Badge */}
                <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
                  <span className="bg-black/80 backdrop-blur-md text-cyan-300 text-[10px] font-black font-mono px-2 py-0.5 rounded-md border border-cyan-400/40 uppercase shadow-md flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-yellow-400 text-yellow-400 animate-pulse" />
                    <span>#{idx + 1} SHORT</span>
                  </span>

                  <button
                    onClick={(e) => handleCopyLink(e, short.youtubeUrl, short.id)}
                    className="pointer-events-auto p-1.5 bg-black/80 hover:bg-zinc-800 text-white rounded-lg border border-white/20 transition-all cursor-pointer shadow-md active:scale-90"
                    title="Copiar link do Short"
                  >
                    {copiedId === short.id ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Share2 className="w-3 h-3 text-zinc-300 hover:text-cyan-300" />
                    )}
                  </button>
                </div>

                {/* Embed player formatted for vertical 9:16 Shorts ratio */}
                <div className="relative aspect-[9/16] bg-zinc-950 w-full overflow-hidden">
                  {embedId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${embedId}?enablejsapi=1&rel=0&modestbranding=1`}
                      title={short.title}
                      className="w-full h-full border-0 absolute inset-0 pointer-events-auto"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  ) : (
                    <div 
                      onClick={() => handleWatchClick(short.youtubeUrl)}
                      className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center cursor-pointer bg-gradient-to-b from-zinc-900 via-zinc-950 to-black hover:bg-zinc-900 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-full bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(34,211,238,0.4)] group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-cyan-300 ml-1" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                        Assistir no YouTube
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-1">Toque para abrir</span>
                    </div>
                  )}
                </div>

                {/* Card Details & Actions */}
                <div className="p-3.5 space-y-2.5 bg-gradient-to-b from-zinc-950/80 to-zinc-900/90 border-t border-white/10">
                  <h4 
                    title={short.title}
                    className="font-sans font-black text-xs sm:text-sm text-gray-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug"
                  >
                    {short.title}
                  </h4>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                    <button
                      onClick={() => handleWatchClick(short.youtubeUrl)}
                      className="font-black text-cyan-400 hover:text-cyan-200 flex items-center gap-1.5 cursor-pointer uppercase text-[10px] tracking-wide transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Abrir no App</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playTapSound();
                          onDelete(short.id);
                        }}
                        className="font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-md border border-red-500/20 transition-all active:scale-95"
                        title="Deletar este Short"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="text-[10px]">Excluir</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CAROUSEL PAGINATION DOTS */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {displayShorts.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              i === activeIndex 
                ? 'w-6 h-2 bg-gradient-to-r from-cyan-400 to-teal-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]' 
                : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-500'
            }`}
            title={`Ir para Short #${i + 1}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
