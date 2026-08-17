import React, { useState } from 'react';
import { Sparkles, MessageSquare, ThumbsUp, Trash2, Calendar } from 'lucide-react';
import { Theory } from '../types';
import { playTapSound, playSuccessSound } from '../utils/audio';
import CommentsSection from './CommentsSection';

interface TheoriesSectionProps {
  theories: Theory[];
  isAdmin: boolean;
  currentUser: any;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onAddXP: (amount: number, reason: string) => void;
  onNavigate?: (path: string) => void;
}

export default function TheoriesSection({ theories, isAdmin, currentUser, onLike, onDelete, onAddXP, onNavigate }: TheoriesSectionProps) {
  // Toggle state for which theory comments are expanded
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  // We can track which theory IDs are liked locally to prevent multi-liking on same browser session easily
  const [likedList, setLikedList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_liked_theories');
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  const handleLikeClick = (id: string) => {
    if (likedList.includes(id)) {
      playTapSound();
      return; // already liked
    }
    
    // add to liked list
    const updated = [...likedList, id];
    setLikedList(updated);
    localStorage.setItem('pkxd_liked_theories', JSON.stringify(updated));
    onLike(id);
    playSuccessSound();
    onAddXP(80, 'Apoio a Teoria 🔮');
  };

  const toggleComments = (theoryId: string) => {
    playTapSound();
    setOpenComments(prev => ({
      ...prev,
      [theoryId]: !prev[theoryId]
    }));
  };


  return (
    <section id="theories-section" className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6 text-left relative overflow-hidden">
      {/* Visual neon assets */}
      <div className="absolute top-10 right-10 w-24 h-24 bg-pink-500/5 rounded-full filter blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/5 rounded-full filter blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-2xl">
            <Sparkles className="w-5 h-5 text-pink-400 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-sans font-black text-xl tracking-tight text-white uppercase">
              Teorias & Novidades do PK XD 🔮
            </h3>
            <p className="font-sans text-xs text-pink-200">
              Fique por dentro das maiores novidades e teorias insanas criadas pelo fã-clube oficial!
            </p>
          </div>
        </div>
        {onNavigate ? (
          <button
            onClick={() => { playTapSound(); onNavigate('/inscricoes#theory'); }}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-center inline-flex items-center justify-center gap-2 border border-white/10 cursor-pointer"
          >
            <span>✨ Enviar Teorias</span>
          </button>
        ) : (
          <a
            href="https://forms.gle/xzPA9LYofmPU4JTE9"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-center inline-flex items-center justify-center gap-2 border border-white/10"
          >
            <span>✨ Enviar Teorias</span>
          </a>
        )}
      </div>

      {theories.length === 0 ? (
        <div className="bg-black/20 border border-dashed border-white/5 p-8 rounded-2xl text-center">
          <MessageSquare className="w-8 h-8 text-pink-400/40 mx-auto mb-2 animate-bounce" />
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Ainda não há teorias postadas de pé. Fique atento às publicações do Admin!
          </p>
        </div>
      ) : (
        <div className="max-h-[520px] overflow-y-auto pr-1.5 sm:pr-2 space-y-4 scrollbar-thin scrollbar-thumb-pink-500/40 scrollbar-track-black/30">
          <div className="space-y-4">
            {theories.map((theory) => {
              const isLiked = likedList.includes(theory.id);
              return (
                <div 
                  key={theory.id}
                  className="bg-black/30 border border-white/5 hover:border-pink-500/20 p-5 rounded-2xl space-y-4 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-pink-400 px-2.5 py-1 bg-pink-500/10 border border-pink-500/20 rounded-md">
                        ✍️ {theory.author || 'PKXD Central'}
                      </span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {theory.createdAt && !isNaN(new Date(theory.createdAt).getTime())
                          ? new Date(theory.createdAt).toLocaleDateString('pt-BR')
                          : 'Sem Data'}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => { playTapSound(); onDelete(theory.id); }}
                        className="text-xs font-bold text-red-400 hover:text-red-300 inline-flex items-center gap-1 cursor-pointer"
                        title="Deletar teoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-sans font-black text-base text-gray-100 uppercase tracking-wide">
                      {theory.title}
                    </h4>
                    <p className="font-sans text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {theory.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => handleLikeClick(theory.id)}
                        disabled={isLiked}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isLiked 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default'
                            : 'bg-zinc-900 border-zinc-800 hover:border-pink-500/30 text-gray-300 hover:text-pink-400 cursor-pointer'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-emerald-400' : ''}`} />
                        <span>Concordar • {theory.likes || 0} Votos</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
