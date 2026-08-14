import React, { useState, useEffect } from 'react';
import { PastSpoiler } from '../types';
import { Trash2, Calendar, Flame, Edit, Star, Maximize2, X, Share2 } from 'lucide-react';

interface PastSpoilersSectionProps {
  spoilers: PastSpoiler[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onEdit?: (spoil: PastSpoiler) => void;
  onRate: (id: string, rating: number) => void;
  onReact?: (id: string, emoji: string) => void;
}

// Utility to clean up and extract a short plain text snippet from markdown description
function getPlainSnippet(text: string): string {
  if (!text) return "";
  // Strip markdown image syntax
  let clean = text.replace(/!\[.*?\]\([^\)]+\)/g, "");
  // Strip HTML image syntax
  clean = clean.replace(/<img\s+[^>]*src=["'](?:[^"']+)["'][^>]*>/gi, "");
  // Strip raw image URLs
  clean = clean.replace(/https?:\/\/[^\s]+?(?:\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp)(?:\?[^\s]*)?/gi, "");
  // Standardize spacing
  clean = clean.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
  return clean;
}

// Utility to extract the first image URL from description (markdown, HTML or raw URL)
function getFirstImageFromDescription(text: string): string | null {
  if (!text) return null;
  // Match Markdown Image: ![alt](url)
  const mdMatched = text.match(/!\[.*?\]\((.*?)\)/i);
  if (mdMatched && mdMatched[1]) {
    return mdMatched[1];
  }
  // Match HTML Image src: <img src="url">
  const htmlMatched = text.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (htmlMatched && htmlMatched[1]) {
    return htmlMatched[1];
  }
  // Match raw image URLs
  const rawMatched = text.match(/https?:\/\/[^\s]+?(?:\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp)(?:\?[^\s]*)?/i);
  if (rawMatched && rawMatched[0]) {
    return rawMatched[0];
  }
  return null;
}

// Custom parser to split paragraphs, lists, headers, and media links in order
function renderRichContent(text: string) {
  if (!text) return null;

  // Split content into segments of media (images or base64) and text blocks
  const mediaRegex = /(!\[.*?\]\([^\)]+\)|<img\s+[^>]*src=["'](?:[^"']+)["'][^>]*>|(?:https?:\/\/[^\s]+?(?:\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp)(?:\?[^\s]*)?))/gi;
  const parts = text.split(mediaRegex);

  return (
    <div className="space-y-4 text-left mt-2 text-gray-300">
      {parts.map((part, partIdx) => {
        if (!part) return null;

        // Check for Markdown Image syntax: ![Alt](url)
        const mdMatched = part.match(/!\[(.*?)\]\((.*?)\)/i);
        if (mdMatched) {
          const altText = mdMatched[1] || 'Imagem do Spoiler';
          const imageUrl = mdMatched[2];
          return (
            <div key={`part-${partIdx}`} className="my-3 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/60 p-2 text-center">
              <img 
                src={imageUrl} 
                alt={altText} 
                className="w-full max-h-[500px] object-contain hover:scale-[1.01] transition-transform duration-300 mx-auto rounded-xl" 
                referrerPolicy="no-referrer"
              />
              {altText && altText !== 'Spoiler' && (
                <span className="text-xs text-gray-400 block pt-2 font-mono uppercase tracking-wider">
                  ✦ {altText}
                </span>
              )}
            </div>
          );
        }

        // Check for HTML img tag syntax
        const htmlMatched = part.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
        if (htmlMatched) {
          const imageUrl = htmlMatched[1];
          return (
            <div key={`part-${partIdx}`} className="my-3 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/60 p-2">
              <img 
                src={imageUrl} 
                alt="Spoiler Media" 
                className="w-full max-h-[500px] object-contain hover:scale-[1.01] transition-transform duration-300 mx-auto rounded-xl" 
                referrerPolicy="no-referrer"
              />
            </div>
          );
        }

        // Check for raw image URL match
        if (part.match(/^https?:\/\/[^\s]+?(?:\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp)(?:\?[^\s]*)?$/i)) {
          return (
            <div key={`part-${partIdx}`} className="my-3 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/60 p-2">
              <img src={part} alt="Raw URL Web Image" className="w-full max-h-[500px] object-contain hover:scale-[1.01] transition-transform duration-300 mx-auto rounded-xl" referrerPolicy="no-referrer" />
            </div>
          );
        }

        // Otherwise, it's a plain text run
        const lines = part.split('\n');
        return (
          <div key={`part-${partIdx}`} className="space-y-2">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lineIdx} className="h-1" />;

              // Bullet lists
              if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                const content = trimmed.substring(1).trim();
                return (
                  <div key={lineIdx} className="flex items-start gap-2 text-sm text-gray-200 pl-1">
                    <span className="text-pink-400 mt-1 flex-shrink-0 text-xs">✦</span>
                    <span>{content}</span>
                  </div>
                );
              }

              // Headers
              if (trimmed.startsWith('###')) {
                return <h5 key={lineIdx} className="font-sans font-extrabold text-sm text-cyan-400 uppercase tracking-wider pt-2">{trimmed.replace('###', '').trim()}</h5>;
              }
              if (trimmed.startsWith('##')) {
                return <h4 key={lineIdx} className="font-sans font-black text-base text-yellow-300 uppercase tracking-widest pt-2">{trimmed.replace('##', '').trim()}</h4>;
              }

              return (
                <p key={lineIdx} className="font-sans text-sm text-gray-300 leading-relaxed">
                  {trimmed}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function PastSpoilersSection({ spoilers, isAdmin, onDelete, onEdit, onRate, onReact }: PastSpoilersSectionProps) {
  // Track selected spoiler for full screen immersive overlay
  const [immersiveSpoiler, setImmersiveSpoiler] = useState<PastSpoiler | null>(null);

  // State to track copied feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Track reacted state from localStorage
  const [reactedSpoilers, setReactedSpoilers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('pkxd_reacted_spoilers');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const handleReactAction = (spoilerId: string, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (reactedSpoilers[spoilerId]) return; // already reacted
    
    const nextReacted = { ...reactedSpoilers, [spoilerId]: emoji };
    setReactedSpoilers(nextReacted);
    try {
      localStorage.setItem('pkxd_reacted_spoilers', JSON.stringify(nextReacted));
    } catch (e) {}

    if (onReact) {
      onReact(spoilerId, emoji);
    }
  };

  const handleShare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const deepLink = `${window.location.origin}${window.location.pathname}?spoiler=${id}`;
    
    navigator.clipboard.writeText(deepLink)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      })
      .catch((err) => {
        console.error('Failed to copy link: ', err);
      });
  };

  // Deep Link handler
  useEffect(() => {
    if (!spoilers || spoilers.length === 0) return;
    
    const params = new URLSearchParams(window.location.search);
    const spoilerIdParam = params.get('spoiler');
    
    if (spoilerIdParam) {
      const matched = spoilers.find(s => s.id === spoilerIdParam);
      if (matched) {
        setImmersiveSpoiler(matched);
        
        // Scroll to container element
        setTimeout(() => {
          const sectionEl = document.getElementById('past-spoilers-history-section');
          if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      }
    }
  }, [spoilers]);

  // Track rated state from keys to values (1-5 star)
  const [ratedSpoilers, setRatedSpoilers] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('pkxd_rated_spoilers');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [hoveredStars, setHoveredStars] = useState<Record<string, number>>({});

  const handleRateAction = (spoilerId: string, rating: number) => {
    if (ratedSpoilers[spoilerId]) return; // already rated
    const nextRated = { ...ratedSpoilers, [spoilerId]: rating };
    setRatedSpoilers(nextRated);
    try {
      localStorage.setItem('pkxd_rated_spoilers', JSON.stringify(nextRated));
    } catch (e) {}
    onRate(spoilerId, rating);
    
    // Dynamically update immersive view rating on-screen if it matches
    if (immersiveSpoiler && immersiveSpoiler.id === spoilerId) {
      setImmersiveSpoiler(prev => {
        if (!prev) return null;
        const currentSum = prev.ratingSum || 0;
        const currentCount = prev.ratingCount || 0;
        return {
          ...prev,
          ratingSum: currentSum + rating,
          ratingCount: currentCount + 1
        };
      });
    }
  };

  const isEmpty = !spoilers || spoilers.length === 0;

  return (
    <section 
      id="past-spoilers-history-section"
      className="bg-zinc-950/85 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden text-left"
    >
      {/* Decorative neon gradient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full filter blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/5 rounded-full filter blur-2xl pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-pink-500/10 rounded-xl border border-pink-500/25">
            <Flame className="w-5 h-5 text-pink-400 fill-pink-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-black text-lg sm:text-xl text-white uppercase tracking-wider">
              🔮 GALERIA DE SPOILERS & NOVIDADES
            </h3>
            <p className="font-sans text-xs text-gray-400">
              Clique nos cards compactos para abrir o Modo Imersivo em tela cheia e avalie com estrelas!
            </p>
          </div>
        </div>
        <span className="text-[10px] sm:text-xs font-mono font-bold px-3 py-1 bg-zinc-900 border border-zinc-800 text-pink-400 rounded-full flex-shrink-0 self-start sm:self-center">
          {isEmpty ? 0 : spoilers.length} Lançados
        </span>
      </div>

      {isEmpty ? (
        <div className="relative z-10 text-center py-10 px-4 bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 text-gray-400 font-sans space-y-3">
          <p className="text-sm font-semibold text-gray-300">
            Nenhum spoiler arquivado ainda 🔮
          </p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            Abra o Modo Admin e publique um spoiler! Ao salvar, ele será liberado instantaneamente e guardado no arquivo de spoilers antigos.
          </p>
        </div>
      ) : (
        /* Compact collection grids: delimited scrollable container with max-height */
        <div className="relative z-10 space-y-3">
          <div className="max-h-[520px] overflow-y-auto pr-1.5 sm:pr-2 space-y-4 scrollbar-thin scrollbar-thumb-purple-600/40 scrollbar-track-black/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {spoilers.map((spoil) => {
          const isDateValid = spoil.createdAt && !isNaN(new Date(spoil.createdAt).getTime());
          const formattedDate = isDateValid
            ? new Date(spoil.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })
            : 'Sem Data';

          const snippet = getPlainSnippet(spoil.description);
          const firstImgUrl = getFirstImageFromDescription(spoil.description) || spoil.imageUrl;
          const avgRating = spoil.ratingCount && spoil.ratingCount > 0 
            ? (spoil.ratingSum || 0) / spoil.ratingCount 
            : null;

          return (
            <div 
              key={spoil.id}
              onClick={() => setImmersiveSpoiler(spoil)}
              className="flex flex-col bg-zinc-900/45 hover:bg-zinc-900/80 border border-zinc-800 hover:border-pink-500/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-md group cursor-pointer relative"
            >
              {/* Card Image */}
              <div className="h-32 w-full overflow-hidden relative bg-black/40 border-b border-zinc-800/60">
                {firstImgUrl ? (
                  <img 
                    src={firstImgUrl} 
                    alt={spoil.title} 
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as any).src = "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=400"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-950 font-black text-2xl text-pink-500/20">
                    PKXD
                  </div>
                )}
                
                {/* Date overlay badge */}
                <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md text-[9px] text-zinc-300 font-mono px-2 py-0.5 rounded-md border border-white/10">
                  {formattedDate}
                </div>

                {/* Rating Badge */}
                <div className="absolute top-2 right-2 bg-yellow-400 text-black font-sans font-bold text-[9px] px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                  ⭐ {avgRating ? avgRating.toFixed(1) : 'S/N'}
                </div>
              </div>

              {/* Card Body (Simplified representation) */}
              <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h4 className="font-sans font-black text-sm text-yellow-400 group-hover:text-yellow-300 leading-tight transition-colors line-clamp-1">
                    {spoil.title}
                  </h4>
                  <p className="font-sans text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                    {snippet || "Toque para abrir a descrição imersiva..."}
                  </p>
                {/* Interactive Emoji Reaction Bar */}
                <div className="flex items-center justify-between bg-zinc-950/40 p-1.5 rounded-xl border border-white/5 my-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[9px] uppercase font-mono font-bold text-gray-500 tracking-wider pl-1 select-none">Reagir:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { emoji: '👍', label: 'Like' },
                      { emoji: '🔥', label: 'Amei' },
                      { emoji: '😮', label: 'Uau' },
                      { emoji: '🚀', label: 'Top' },
                      { emoji: '😢', label: 'Triste' }
                    ].map((item) => {
                      const count = spoil.reactions?.[item.emoji] || 0;
                      const hasReactedToThis = reactedSpoilers[spoil.id] === item.emoji;
                      const hasReactedToAny = !!reactedSpoilers[spoil.id];

                      return (
                        <button
                          key={item.emoji}
                          type="button"
                          onClick={(e) => handleReactAction(spoil.id, item.emoji, e)}
                          disabled={hasReactedToAny}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg transition-all duration-200 cursor-pointer text-[10px] select-none ${
                            hasReactedToThis
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 scale-110 font-bold'
                              : hasReactedToAny
                                ? 'opacity-40 grayscale pointer-events-none'
                                : 'hover:bg-white/5 text-gray-400 hover:text-white hover:scale-105 active:scale-95'
                          }`}
                          title={`Reagir com ${item.label}`}
                        >
                          <span>{item.emoji}</span>
                          {count > 0 && (
                            <span className="text-[8px] font-mono font-semibold text-zinc-400">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                        {/* Open detail trigger & Share row */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span 
                      onClick={() => setImmersiveSpoiler(spoil)}
                      className="text-[9px] uppercase font-mono tracking-wider text-pink-400 font-bold group-hover:text-pink-300 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Maximize2 className="w-3 h-3" />
                      TELA CHEIA
                    </span>

                    {/* Share Link Button */}
                    <button
                      type="button"
                      onClick={(e) => handleShare(spoil.id, e)}
                      className={`text-[9px] uppercase font-mono tracking-wider font-extrabold flex items-center gap-1 px-2 py-0.5 rounded-md border active:scale-95 transition-all text-xs cursor-pointer ${
                        copiedId === spoil.id 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10' 
                          : 'bg-cyan-500/5 hover:bg-cyan-500/15 border-cyan-500/15 text-cyan-400 hover:text-cyan-300'
                      }`}
                      title="Copiar Link para Compartilhar"
                    >
                      <Share2 className="w-2.5 h-2.5" />
                      {copiedId === spoil.id ? 'COPIADO! 🔗' : 'COMPARTILHAR'}
                    </button>
                  </div>

                  {/* Admin Direct Actions inside lists */}
                  {isAdmin && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {onEdit && (
                        <button 
                          type="button"
                          onClick={() => onEdit(spoil)}
                          className="text-yellow-400 hover:text-yellow-350 p-1 bg-yellow-950/40 rounded border border-yellow-500/20"
                          title="Editar"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => {
                          if (confirm("Deletar este spoiler?")) {
                            onDelete(spoil.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 p-1 bg-red-950/40 rounded border border-red-500/20"
                        title="Deletar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
         </div>
              </div>
            </div>
          );
        })}
            </div>
          </div>
          {spoilers.length > 3 && (
            <div className="text-center pt-1 border-t border-white/5">
              <span className="text-[10px] font-mono text-neutral-400 bg-black/50 px-3 py-1 rounded-full border border-white/10 inline-flex items-center gap-1">
                <span>↕ Role o painel acima para ver os {spoilers.length} spoilers</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* 🌟 IMMERSIVE FULL-SCREEN MODE MODAL 🌟 */}
      {immersiveSpoiler && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto animate-fade-in"
          onClick={() => setImmersiveSpoiler(null)}
        >
          {/* Main Modal Panel */}
          <div 
            className="relative bg-zinc-950 border-2 border-zinc-800 hover:border-pink-500/40 max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl my-8 text-slate-100 flex flex-col max-h-[90vh] scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Area */}
            <div className="p-5 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
                <span className="text-[10px] sm:text-xs font-mono font-black uppercase text-pink-400 tracking-widest">
                  🔮 VISUALIZAÇÃO IMERSIVA DE SPOILER
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImmersiveSpoiler(null)}
                className="text-zinc-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content inside */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-grow custom-scroll">
              
              {/* Optional big Cover image / GIF */}
              {immersiveSpoiler.imageUrl && (
                <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black/55 relative p-1.5 shadow-inner">
                  <img 
                    src={immersiveSpoiler.imageUrl} 
                    alt={immersiveSpoiler.title} 
                    className="w-full max-h-[380px] object-contain mx-auto rounded-xl" 
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as any).src = "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=400"; }}
                  />
                </div>
              )}

              {/* Title & Metadata */}
              <div className="space-y-2 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <Calendar className="w-4 h-4 text-pink-400" />
                  <span>
                    Publicado em {immersiveSpoiler.createdAt && !isNaN(new Date(immersiveSpoiler.createdAt).getTime())
                      ? new Date(immersiveSpoiler.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })
                      : 'Sem Data'}
                  </span>
                </div>
                <h3 className="font-sans font-black text-xl sm:text-2xl text-yellow-400 leading-tight">
                  {immersiveSpoiler.title}
                </h3>
              </div>

              {/* Description (Rich/Full rendered) */}
              <div className="prose prose-invert max-w-none text-zinc-200">
                {renderRichContent(immersiveSpoiler.description)}
              </div>

              {/* Glowing Fans Rating Box */}
              {(() => {
                const spId = immersiveSpoiler.id;
                const ratedValue = ratedSpoilers[spId];
                const hoverValue = hoveredStars[spId] || 0;
                const avgRating = immersiveSpoiler.ratingCount && immersiveSpoiler.ratingCount > 0 
                  ? (immersiveSpoiler.ratingSum || 0) / immersiveSpoiler.ratingCount 
                  : null;

                return (
                  <div className="flex flex-col gap-3 p-5 rounded-2xl bg-zinc-900/80 border-2 border-pink-500/20 shadow-lg mt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <span className="text-zinc-200 font-black uppercase text-xs tracking-wider flex items-center gap-2">
                        <Star className="w-4.5 h-4.5 text-yellow-400 fill-yellow-400" />
                        MÉDIA DE AVALIAÇÃO DOS FÃS:
                      </span>
                      <span className="text-yellow-400 font-mono font-black text-sm flex items-center gap-1.5 bg-yellow-400/10 px-3.5 py-1 rounded-full border border-yellow-400/25 shadow-sm">
                        ⭐ {avgRating ? `${avgRating.toFixed(1)} / 5.0` : 'Sem votos'}
                        {immersiveSpoiler.ratingCount ? ` (${immersiveSpoiler.ratingCount} votos)` : ''}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2 border-t border-white/5 pt-3">
                      <span className="text-zinc-300 text-xs font-semibold">
                        {ratedValue ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            ✓ Você deu nota {ratedValue} ★ (+15 XP Coletados!)
                          </span>
                        ) : (
                          <span className="text-zinc-400">Avalie esse Spoiler para ganhar <strong className="text-yellow-400 font-black">+15 XP</strong>:</span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = ratedValue ? star <= ratedValue : (hoverValue ? star <= hoverValue : false);
                          return (
                            <button
                              key={star}
                              disabled={!!ratedValue}
                              onClick={() => handleRateAction(spId, star)}
                              onMouseEnter={() => !ratedValue && setHoveredStars(prev => ({ ...prev, [spId]: star }))}
                              onMouseLeave={() => !ratedValue && setHoveredStars(prev => ({ ...prev, [spId]: 0 }))}
                              className={`cursor-pointer transition-all duration-150 ${!!ratedValue ? 'opacity-85' : 'hover:scale-130 active:scale-95'}`}
                            >
                              <Star 
                                className={`w-6 h-6 ${
                                  isFilled 
                                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' 
                                    : 'text-zinc-700'
                                }`} 
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Footer Row */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => handleShare(immersiveSpoiler.id, e)}
                className={`px-5 py-2.5 border font-sans font-black rounded-xl text-xs uppercase tracking-widest shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 ${
                  copiedId === immersiveSpoiler.id
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 animate-pulse'
                    : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-700 hover:border-cyan-500/35 text-cyan-400'
                }`}
                title="Copiar link direto para este spoiler"
              >
                <Share2 className="w-4 h-4" />
                {copiedId === immersiveSpoiler.id ? 'LINK COPIADO! 🔗' : 'COMPARTILHAR SPOILER'}
              </button>

              <button
                type="button"
                onClick={() => setImmersiveSpoiler(null)}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-sans font-black rounded-xl text-xs uppercase tracking-widest shadow-md hover:shadow-pink-500/10 cursor-pointer active:scale-95 transition-all"
              >
                Voltar para a Galeria
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}

