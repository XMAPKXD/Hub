import React, { useState } from 'react';
import { MessageSquare, Heart, Bookmark, ExternalLink, ArrowRight, ShieldCheck, Zap, Ticket } from 'lucide-react';
import { playTapSound, playSuccessSound } from '../utils/audio';

interface WhatsAppPromoProps {
  channelUrl: string;
  onAddXP?: (amount: number, reason: string) => void;
}

export default function WhatsAppPromo({ channelUrl, onAddXP }: WhatsAppPromoProps) {
  const [likes, setLikes] = useState(384);
  const [hasLiked, setHasLiked] = useState(false);
  const [xpClaimed, setXpClaimed] = useState(() => {
    try {
      return localStorage.getItem('pkxd_whatsapp_xp_claimed') === 'true';
    } catch {
      return false;
    }
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasLiked) {
      setLikes(likes + 1);
      setHasLiked(true);
      playSuccessSound();
    } else {
      setLikes(likes - 1);
      setHasLiked(false);
      playTapSound();
    }
  };

  const handleJoinClick = () => {
    playLevelUpSound();
    
    // Award 250 XP if not already claimed
    if (!xpClaimed && onAddXP) {
      onAddXP(250, 'Comunidade WhatsApp 🟢');
      setXpClaimed(true);
      try {
        localStorage.setItem('pkxd_whatsapp_xp_claimed', 'true');
      } catch {}
    }

    // Also redirect
    window.open(channelUrl, '_blank', 'noreferrer');
  };

  function playLevelUpSound() {
    // Just reuse or call local Audio
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      [261.63, 329.63, 392.00, 523.25].forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        gain.gain.setValueAtTime(0.12, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.15);
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.16);
      });
    } catch (e) {}
  }

  return (
    <div 
      id="whatsapp-promo-container"
      className="bg-[#1D1638]/72 backdrop-blur-xl p-6 sm:p-8 rounded-[20px] border border-white/[0.09] shadow-[0_8px_32px_rgba(0,0,0,0.38)] text-[#F8F7FF] overflow-hidden relative"
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        
        {/* Left Side: Mockup WhatsApp Message Feed */}
        <div className="w-full md:w-5/12 flex-shrink-0">
          <div className="bg-[#0B0817]/80 backdrop-blur-md rounded-[14px] border border-white/[0.08] overflow-hidden shadow-xl relative select-none">
            {/* Header / Chat Name */}
            <div className="bg-[#15102A]/90 p-3.5 flex items-center gap-3 border-b border-white/[0.08]">
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-tr from-[#7C3AED] via-[#9B5CFF] to-[#22D3EE] flex items-center justify-center font-bold font-sans text-sm text-white shadow-md">
                PC
              </div>
              <div>
                <h4 className="font-sans font-bold text-sm text-[#F8F7FF] flex items-center gap-1.5">
                  PKXD Central
                  <span className="bg-[#25D366] text-[9px] font-black tracking-wider text-black px-1.5 py-0.5 rounded-full flex items-center">
                    ✓
                  </span>
                </h4>
                <p className="font-mono text-[10px] text-[#25D366] font-semibold">Canal Oficial • Online</p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-4 space-y-4 max-h-[220px] overflow-y-auto bg-[#0B0817]/80">
              
               {/* Message bubble 1 */}
               <div className="bg-[#15102A]/85 text-[#B8B2CC] p-3 rounded-[14px] rounded-tl-sm max-w-[85%] text-xs shadow-md border-l-2 border-[#22D3EE] backdrop-blur-sm">
                <span className="text-[#22D3EE] font-bold text-[10px] block mb-1">📢 COMUNIDADE PKXD CENTRAL</span>
                Fala galera de PK XD! 🕹️ Aqui postamos com total exclusividade os spoilers das novas atualizações e códigos ativos!
                <span className="text-[9px] text-[#716A83] text-right block mt-1.5">17:28</span>
              </div>

              {/* Message bubble 2 */}
              <div className="bg-[#15102A]/85 text-[#B8B2CC] p-3 rounded-[14px] rounded-tl-sm max-w-[85%] text-xs shadow-md border-l-2 border-[#E83EBC] backdrop-blur-sm">
                <span className="text-[#E83EBC] font-bold text-[10px] block mb-1">🚀 SPOILERS SEMANAIS</span>
                Tem spoiler novo toda semana, SEGUNDA-FEIRA às 17:30h (NORMALMENTE)! Ative o sininho no canal para não perder nada! 🔮✨
                
                {/* Fake action/reaction bar in chat bubble */}
                <div className="mt-3 pt-2 border-t border-white/[0.08] flex justify-between items-center">
                  <button 
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[10px] text-[10px] font-bold transition-all ${
                      hasLiked ? 'bg-[#3A1947] text-[#E83EBC] border border-[#E83EBC]/40' : 'bg-[#1D1638] text-[#B8B2CC]'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-[#E83EBC] text-[#E83EBC]' : 'text-[#716A83]'}`} />
                    <span>{likes} curtidas</span>
                  </button>
                  <span className="text-[9px] text-[#716A83]">17:31</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Informative Title & Call To Action */}
        <div className="flex-1 space-y-5 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#123225] border border-[#25D366]/40 text-[#25D366] font-mono text-[10px] font-bold rounded-full uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" /> Canal Oficial do WhatsApp
            </div>
            
            <h3 className="font-sans font-black text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-wide uppercase text-[#F8F7FF]">
              SEJA O PRIMEIRO A SABER DE TUDO!
            </h3>
            
            <p className="font-sans text-sm sm:text-base text-[#B8B2CC] leading-relaxed max-w-xl mt-2">
              Junte-se à nossa comunidade no WhatsApp! Receba diretamente as notícias do PK XD, alertas de códigos, novidades da administração e a contagem regressiva para os spoilers semanais sem complicação.
            </p>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto md:mx-0">
            {[
              { icon: Ticket, text: 'Códigos Exclusivos', color: 'text-[#F5C542] border-white/[0.08] bg-[#15102A]/75 backdrop-blur-md' },
              { icon: ShieldCheck, text: 'Notícias Oficiais', color: 'text-[#22D3EE] border-white/[0.08] bg-[#15102A]/75 backdrop-blur-md' }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-2 p-2.5 rounded-[12px] border ${feature.color} select-none`}
              >
                <feature.icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-sans font-bold text-xs">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Main Join CTA Button */}
          <div className="pt-2 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={handleJoinClick}
                  className="w-full px-5 sm:px-7 py-3 sm:py-3.5 bg-[#123225] hover:bg-[#184232] text-[#25D366] border border-[#25D366] font-sans font-black text-xs sm:text-sm rounded-[14px] shadow-sm transition-all active:scale-95 cursor-pointer flex flex-wrap items-center justify-center gap-2 group text-center"
                >
                  <MessageSquare className="w-4 h-4 fill-[#25D366] flex-shrink-0" />
                  <span className="break-words">ENTRAR NO CANAL AGORA</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform flex-shrink-0" />
                </button>
                {/* Floating Badge */}
                <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-[#251B46] text-[#F5C542] border border-[#F5C542]/40 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                  {xpClaimed ? "✓ +250 XP Coletado" : "⚡ +250 XP Grátis!"}
                </div>
              </div>

              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(channelUrl);
                    playSuccessSound();
                    alert("Link do Canal copiado com sucesso! Compartilhe com os seus amigos de PK XD! 🕹️");
                  } catch (e) {
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Acesse o canal de Spoilers e Códigos Oficiais de PK XD: ' + channelUrl)}`, '_blank');
                  }
                }}
                className="w-full sm:w-auto px-4 py-3 sm:py-3.5 bg-[#15102A]/80 hover:bg-[#251B46]/80 text-[#B8B2CC] hover:text-[#F8F7FF] font-sans font-bold text-xs sm:text-sm rounded-[14px] border border-white/10 backdrop-blur-md transition-all flex flex-wrap items-center justify-center gap-2 cursor-pointer text-center"
              >
                <span>🔗 COMPARTILHAR CANAL</span>
              </button>
            </div>

            <p className="font-sans text-xs text-[#716A83]">
              ⚡ <strong className="text-[#25D366]">Gostou da Central?</strong> Copie o link do canal ou use o botão para compartilhar os spoilers e códigos legítimos com todo o seu clã de amigos no WhatsApp!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
