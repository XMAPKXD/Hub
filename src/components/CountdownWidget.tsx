import React, { useState, useEffect } from 'react';
import { Timer, Sparkles, HelpCircle, Flame, Eye, ExternalLink, EyeOff } from 'lucide-react';
import { playTapSound, playLevelUpSound } from '../utils/audio';

interface CountdownWidgetProps {
  onReveal?: () => void;
  spoilerTitle: string;
  spoilerDesc: string;
  spoilerImageUrl?: string;
  extraCountdownTitle?: string;
  extraCountdownDate?: string;
  extraCountdownEnabled?: boolean;
  forceReveal?: boolean;
  revealedAt?: number;
  isDelayed?: boolean;
  delayMessage?: string;
  onOpenFullscreen?: (title: string, desc: string, imageUrl?: string) => void;
  onlyContent?: boolean;
}

// Helper to parse standard **bold** markers into strong tags
function parseBoldText(inputText: string): React.ReactNode {
  if (!inputText.includes('**')) return inputText;

  const parts = inputText.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-sans font-black text-white">
          {part}
        </strong>
      );
    }
    return part;
  });
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
function parseAndRenderContent(text: string) {
  if (!text) return null;

  // Split content into segments of media (images or base64) and text blocks
  const mediaRegex = /(!\[.*?\]\([^\)]+\)|<img\s+[^>]*src=["'](?:[^"']+)["'][^>]*>|(?:https?:\/\/[^\s]+?(?:\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp)(?:\?[^\s]*)?))/gi;
  const parts = text.split(mediaRegex);

  return (
    <div className="space-y-3.5 text-left">
      {parts.map((part, partIdx) => {
        if (!part) return null;

        // Check for Markdown Image syntax: ![Alt](url)
        const mdMatched = part.match(/!\[(.*?)\]\((.*?)\)/i);
        if (mdMatched) {
          const altText = mdMatched[1] || 'Imagem do Spoiler';
          const imageUrl = mdMatched[2];
          return (
            <div key={`part-${partIdx}`} className="my-4 rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black/20 p-2 text-center">
              <img 
                src={imageUrl} 
                alt={altText} 
                className="w-full max-h-72 object-contain hover:scale-[1.03] transition-all duration-300 mx-auto rounded-xl" 
                referrerPolicy="no-referrer"
              />
              {altText && altText !== 'Spoiler' && (
                <span className="text-[10px] text-gray-400 block pt-1.5 uppercase font-mono tracking-wider">
                  ⚡ {altText}
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
            <div key={`part-${partIdx}`} className="my-4 rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black/20 p-2">
              <img 
                src={imageUrl} 
                alt="Spoiler Media" 
                className="w-full max-h-72 object-contain hover:scale-[1.03] transition-all duration-300 mx-auto rounded-xl" 
                referrerPolicy="no-referrer"
              />
            </div>
          );
        }

        // Check for raw image URL match
        if (part.match(/^https?:\/\/[^\s]+?(?:\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp)(?:\?[^\s]*)?$/i)) {
          return (
            <div key={`part-${partIdx}`} className="my-4 rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black/20 p-2">
              <img src={part} alt="Raw URL Web Image" className="w-full max-h-72 object-contain hover:scale-[1.03] transition-all duration-300 mx-auto rounded-xl" referrerPolicy="no-referrer" />
            </div>
          );
        }

        // Otherwise, it's a plain text run
        const lines = part.split('\n');
        return (
          <div key={`part-${partIdx}`} className="space-y-2">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lineIdx} className="h-1.5" />;

              // Check for bullet lists
              if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                const content = trimmed.substring(1).trim();
                return (
                  <div key={lineIdx} className="flex items-start gap-2 text-gray-200 text-sm pl-2">
                    <span className="text-pink-400 mt-1 flex-shrink-0">✦</span>
                    <span>{parseBoldText(content)}</span>
                  </div>
                );
              }

              // Check for headers (e.g., #, ## or ###)
              if (trimmed.startsWith('###')) {
                return <h5 key={lineIdx} className="font-sans font-extrabold text-sm text-cyan-300 uppercase tracking-wider pt-1.5">{parseBoldText(trimmed.replace('###', '').trim())}</h5>;
              }
              if (trimmed.startsWith('##')) {
                return <h4 key={lineIdx} className="font-sans font-black text-base text-yellow-300 uppercase tracking-widest pt-1.5">{parseBoldText(trimmed.replace('##', '').trim())}</h4>;
              }
              if (trimmed.startsWith('#')) {
                return <h2 key={lineIdx} className="font-sans font-black text-lg md:text-xl text-yellow-300 uppercase tracking-wide pt-2.5 pb-1 border-b border-white/5">{parseBoldText(trimmed.replace('#', '').trim())}</h2>;
              }

              return (
                <p key={lineIdx} className="font-sans text-sm text-gray-200 leading-relaxed">
                  {parseBoldText(trimmed)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function CountdownWidget({ 
  spoilerTitle, 
  spoilerDesc, 
  spoilerImageUrl,
  onReveal,
  extraCountdownTitle,
  extraCountdownDate,
  extraCountdownEnabled,
  forceReveal = false,
  revealedAt,
  isDelayed = false,
  delayMessage = '',
  onOpenFullscreen,
  onlyContent = false
}: CountdownWidgetProps) {
  if (onlyContent) {
    return (
      <div className="space-y-1">
        {parseAndRenderContent(spoilerDesc)}
      </div>
    );
  }

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  // State for the alternative countdown
  const [extraTimeLeft, setExtraTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isFresh: boolean;
  } | null>(null);

  // Calculate milliseconds left to next Monday at 17:30
  const calculateTimeLeft = () => {
    const now = new Date();

    const normTitle = (spoilerTitle || '').toLowerCase().trim();
    const isNoActiveSpoiler = !spoilerTitle || 
      !normTitle ||
      normTitle === 'aguardando próximos spoilers! 🔮' || 
      normTitle === 'aguardando proximos spoilers! 🔮' ||
      normTitle.includes('aguardando') || 
      normTitle.includes('nenhum spoiler') ||
      normTitle.includes('sem spoiler') ||
      normTitle.includes('ainda não temos');

    // If there is no active spoiler uploaded yet, we are always in countdown mode!
    if (isNoActiveSpoiler) {
      const targetDay = 1; // Monday
      const targetHour = 17;
      const targetMinute = 30;

      const targetDate = new Date(now);
      let daysToTarget = (targetDay - now.getDay() + 7) % 7;
      
      if (daysToTarget === 0) {
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        if (currentHours > targetHour || (currentHours === targetHour && currentMinutes >= targetMinute)) {
          daysToTarget = 7;
        }
      }
      
      targetDate.setDate(now.getDate() + daysToTarget);
      targetDate.setHours(targetHour, targetMinute, 0, 0);

      const diff = targetDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return { days, hours, minutes, seconds, isExpired: false };
    }

    // Since there IS an active spoiler:
    // Check if forceReveal is active (no 1-hour limit as requested!)
    const isForceActive = !!forceReveal;

    if (isForceActive) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    // We want next Monday 17:30
    const targetDay = 1; // Monday
    const targetHour = 17;
    const targetMinute = 30;

    const targetDate = new Date(now);
    
    // Calculate days to next Monday
    let daysToTarget = (targetDay - now.getDay() + 7) % 7;
    
    // If it's Monday but already past 17:30, go to next Monday
    if (daysToTarget === 0) {
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      
      if (currentHours > targetHour || (currentHours === targetHour && currentMinutes >= targetMinute)) {
        daysToTarget = 7;
      }
    }
    
    targetDate.setDate(now.getDate() + daysToTarget);
    targetDate.setHours(targetHour, targetMinute, 0, 0);

    const diff = targetDate.getTime() - now.getTime();

    // Check if we are past Monday 17:30 THIS week showing the active spoiler
    const mondayThisWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const daysToMonday = (1 - dayOfWeek - 7) % 7; // Find this week's Monday
    mondayThisWeek.setDate(now.getDate() + (dayOfWeek === 1 ? 0 : daysToMonday));
    mondayThisWeek.setHours(17, 30, 0, 0);

    // Let the active spoiler show indefinitely once the window opens, until manually archived!
    const isInWindow = now >= mondayThisWeek;

    if (isInWindow) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds, isExpired: false };
  };

  // Helper to calculate time left for the extra countdown
  const calculateExtraTimeLeft = () => {
    if (!extraCountdownEnabled || !extraCountdownDate) return null;
    try {
      const target = new Date(extraCountdownDate).getTime();
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        return null; // Expired, hide itself automatically
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      return { days, hours, minutes, seconds, isFresh: true };
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    // Initial check
    setTimeLeft(calculateTimeLeft());
    setExtraTimeLeft(calculateExtraTimeLeft());

    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setExtraTimeLeft(calculateExtraTimeLeft());
      
      // If it just flipped to expired, trigger high quality celebratory sound
      if (updated.isExpired && !timeLeft.isExpired) {
        playLevelUpSound();
        if (onReveal) onReveal();
      }
      
      setTimeLeft(updated);
    }, 1000);

    return () => clearInterval(timer);
  }, [
    timeLeft.isExpired, 
    extraCountdownEnabled, 
    extraCountdownDate, 
    forceReveal, 
    revealedAt, 
    spoilerTitle, 
    spoilerDesc, 
    spoilerImageUrl, 
    onReveal
  ]);

  // Visual percentages of a week (10080 minutes) to fill the progress bar
  const totalSecondsInWeek = 7 * 24 * 60 * 60;
  const secondsLeft = timeLeft.days * 86400 + timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
  const progressPercent = Math.max(0, Math.min(100, 100 - (secondsLeft / totalSecondsInWeek) * 100));

  const pulseTap = () => {
    playTapSound();
  };

  const activeImageUrl = getFirstImageFromDescription(spoilerDesc) || spoilerImageUrl;

  return (
    <div 
      id="countdown-container"
      className="relative overflow-hidden bg-[#1D1638] border border-[#34275A] shadow-xl p-6 sm:p-8 rounded-[20px] text-[#F8F7FF]"
    >
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#34275A] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#251B46] rounded-[14px] border border-[#7C3AED]/40">
              <Flame className="w-6 h-6 text-[#7C3AED] fill-[#7C3AED]" />
            </div>
            <div>
              <h3 className="font-sans font-black text-xl sm:text-2xl tracking-tight text-[#F8F7FF] uppercase">
                Próximos Spoilers PK XD
              </h3>
              <p className="font-sans text-xs text-[#B8B2CC]">
                Toda segunda-feira às <span className="text-[#22D3EE] font-bold">17:30</span> ao vivo!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7C3AED] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7C3AED]"></span>
            </span>
            <span className="font-sans text-[10px] font-bold tracking-wider text-[#C4B5FD] uppercase bg-[#251B46] px-3 py-1 rounded-full border border-[#34275A]">
              {timeLeft.isExpired ? 'Liberado!' : 'Agendado'}
            </span>
          </div>
        </div>

        {/* Outer State Condition */}
        {timeLeft.isExpired ? (
          <div 
            id="spoiler-revealed-state"
            className="flex flex-col items-start justify-start p-5 sm:p-6 bg-[#15102A] border border-[#34275A] rounded-[16px] text-left relative overflow-hidden transition-all duration-200 w-full space-y-5"
          >
            <div className="relative z-10 w-full space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#34275A] pb-3">
                <div>
                  <span className="font-sans text-[9px] font-bold tracking-wider text-[#E83EBC] bg-[#3A1947] px-2.5 py-0.5 rounded-full uppercase border border-[#E83EBC]/30">
                    🔥 SPOILER CONFIRMADO & REVELADO
                  </span>
                  <h4 className="font-sans font-black text-xl sm:text-2xl text-[#F8F7FF] tracking-tight uppercase leading-tight mt-1.5">
                    {spoilerTitle || 'Nova Atualização Incrível!'}
                  </h4>
                </div>
                
                {onOpenFullscreen && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playTapSound();
                      onOpenFullscreen(spoilerTitle || 'Nova Atualização Incrível!', spoilerDesc, activeImageUrl);
                    }}
                    className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#9B5CFF] hover:brightness-110 text-white font-sans font-bold uppercase text-[10px] tracking-wider rounded-[14px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all border border-[#9B5CFF]/30"
                  >
                    <Eye className="w-3.5 h-3.5 text-white" /> Foco Imersivo
                  </button>
                )}
              </div>

              {/* CRISP AND CLEAR IMAGE DIRECT ENTRY */}
              {activeImageUrl ? (
                <div className="relative w-full overflow-hidden rounded-[14px] border border-[#34275A] bg-[#0B0817] flex items-center justify-center p-1.5">
                  <img 
                    src={activeImageUrl} 
                    alt="Imagem Revelada do Spoiler" 
                    className="w-full max-h-[400px] object-contain rounded-[10px] hover:scale-[1.01] transition-transform duration-300 mx-auto"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : null}

              {/* DIRECT TEXT PARSING & BEAUTIFUL DETAILS */}
              <div className="bg-[#0B0817]/60 p-4 sm:p-5 rounded-[14px] border border-[#34275A] space-y-2.5">
                <h5 className="font-sans font-bold text-xs text-[#22D3EE] uppercase tracking-wider border-b border-[#34275A] pb-1.5">
                  📋 Especificações da Atualização:
                </h5>
                <div className="max-h-[250px] overflow-y-auto pr-1 text-[#B8B2CC]">
                  {parseAndRenderContent(spoilerDesc)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Show Delayed banner warning if delay is active */}
            {isDelayed && (
              <div className="p-4 bg-[#251B46] border border-[#F5C542]/30 rounded-[14px] flex items-start gap-3 text-left">
                <span className="p-1.5 bg-[#15102A] text-[#F5C542] rounded-[8px] font-bold text-xs">
                  ⚠️
                </span>
                <div>
                  <h4 className="font-sans font-bold text-xs text-[#F5C542] uppercase tracking-wider">
                    Spoiler Adiado / Atrasado
                  </h4>
                  <p className="font-sans text-xs text-[#B8B2CC] mt-1">
                    {delayMessage || 'O spoiler desta segunda-feira foi adiado ou atrasará um pouquinho no envio. Fiquem calmos, já postaremos tudo!'}
                  </p>
                </div>
              </div>
            )}

            {/* Grid for Countdown digits */}
            <div className="grid grid-cols-4 gap-3 select-none">
              {[
                { label: 'DIAS', value: timeLeft.days },
                { label: 'HORAS', value: timeLeft.hours },
                { label: 'MINUTOS', value: timeLeft.minutes },
                { label: 'SEGUNDOS', value: timeLeft.seconds }
              ].map((column, idx) => (
                <div 
                  key={idx}
                  onClick={pulseTap}
                  className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-[14px] bg-[#15102A] hover:bg-[#251B46] border border-[#34275A] shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <span className="font-mono font-black text-2xl sm:text-4xl text-[#F8F7FF]">
                    {String(column.value).padStart(2, '0')}
                  </span>
                  <span className="font-sans font-bold text-[9px] sm:text-[10px] text-[#B8B2CC] tracking-wider uppercase mt-1">
                    {column.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress slider bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-[#B8B2CC] px-1 font-sans">
                <span>Carga de Energia do Spoiler</span>
                <span className="text-[#22D3EE] font-black">{Math.round(progressPercent)}% Pronto</span>
              </div>
              <div className="w-full h-2.5 bg-[#0B0817] rounded-full overflow-hidden p-0.5 border border-[#34275A]">
                <div 
                  className="h-full bg-gradient-to-r from-[#7C3AED] to-[#9B5CFF] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Prompt Card */}
            <div className="flex items-start gap-3 bg-[#15102A] border border-[#34275A] p-4 rounded-[14px]">
              <HelpCircle className="w-5 h-5 text-[#7C3AED] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-sans font-bold text-sm text-[#F8F7FF]">O que acontece na contagem?</h4>
                <p className="font-sans text-xs text-[#B8B2CC] leading-relaxed mt-0.5">
                  Toda segunda-feira às 17h30, o relógio zera e libera os exclusivos spoilers coletivos de PK XD. Fique ligado na página ou acesse nosso Canal no WhatsApp para receber em primeira mão!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alternative Extra Countdown Timer */}
        {extraTimeLeft && (
          <div className="mt-6 pt-5 border-t border-neutral-850 space-y-3.5 text-left">
            <div className="flex items-center gap-2 text-purple-300">
              <Flame className="w-4 h-4 text-purple-400 fill-purple-950" />
              <h4 className="font-sans font-black text-xs uppercase tracking-wider text-purple-250">
                {extraCountdownTitle || 'Contagem Alternativa / Spoiler Extra!'}
              </h4>
            </div>
            <div className="grid grid-cols-4 gap-3 select-none">
              {[
                { label: 'DIAS', value: extraTimeLeft.days },
                { label: 'HORAS', value: extraTimeLeft.hours },
                { label: 'MINUTOS', value: extraTimeLeft.minutes },
                { label: 'SEGUNDOS', value: extraTimeLeft.seconds }
              ].map((column, idx) => (
                <div 
                  key={idx}
                  onClick={pulseTap}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-neutral-900/50 hover:bg-purple-950/40 border border-purple-500/10 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span className="font-mono font-black text-sm sm:text-lg text-white">
                    {String(column.value).padStart(2, '0')}
                  </span>
                  <span className="font-sans font-extrabold text-[8px] sm:text-[9px] text-purple-300/80 tracking-wider uppercase mt-0.5">
                    {column.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
