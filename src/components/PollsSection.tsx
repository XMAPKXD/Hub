import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, orderBy, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Poll, PollOption } from '../types';
import { playTapSound, playSuccessSound } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Vote, AlertCircle, CheckCircle2, History, PlusCircle, X, Send, Sparkles, Plus, Loader2, Share2, Copy, Image as ImageIcon, Upload, Link2, Check } from 'lucide-react';

interface PollsSectionProps {
  onAddXP: (amount: number, reason: string) => void;
  isAdmin: boolean;
}

export default function PollsSection({ onAddXP, isAdmin }: PollsSectionProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [votingStatus, setVotingStatus] = useState<Record<string, 'idle' | 'voting' | 'success' | 'error'>>({});

  // Poll Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '']);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load voted polls from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pkxd_voted_polls');
      if (saved) {
        setVotedPolls(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not parse voted polls from localStorage", e);
    }
  }, []);

  // Subscribe to polls from firestore
  useEffect(() => {
    const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPolls: Poll[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedPolls.push({
          id: docSnap.id,
          question: data.question || '',
          options: data.options || [],
          createdAt: data.createdAt || Date.now(),
          isActive: data.isActive !== false,
          totalVotes: data.totalVotes || 0,
          imageUrl: data.imageUrl || undefined,
        });
      });
      setPolls(loadedPolls);
      setLoading(false);
    }, (err) => {
      console.error("Error listening to polls:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("⚠️ Por favor, escolha uma imagem menor que 3MB.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSharePoll = (poll: Poll) => {
    playTapSound();
    const shareUrl = `${window.location.origin}${window.location.pathname}?enquete=${poll.id}#polls-section`;
    if (navigator.share) {
      navigator.share({
        title: `Enquete PK XD: ${poll.question}`,
        text: `📊 Dê o seu voto na enquete "${poll.question}" no PK XD Central!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setToastMsg(`🔗 Link da enquete copiado com sucesso!`);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleVote = async (pollId: string) => {
    const optionId = selectedOptions[pollId];
    if (!optionId) {
      playTapSound();
      alert('⚠️ Por favor, selecione uma opção antes de votar!');
      return;
    }

    if (votedPolls.includes(pollId)) {
      playTapSound();
      return;
    }

    playTapSound();
    setVotingStatus(prev => ({ ...prev, [pollId]: 'voting' }));

    try {
      const pollRef = doc(db, 'polls', pollId);
      const poll = polls.find(p => p.id === pollId);
      if (!poll) throw new Error("Enquete não encontrada!");

      // Build updated options list incrementing the specific option's votes
      const updatedOptions = poll.options.map((opt) => {
        if (opt.id === optionId) {
          return { ...opt, votes: (opt.votes || 0) + 1 };
        }
        return opt;
      });

      await updateDoc(pollRef, {
        options: updatedOptions,
        totalVotes: increment(1)
      });

      // Update local storage
      const newVoted = [...votedPolls, pollId];
      setVotedPolls(newVoted);
      localStorage.setItem('pkxd_voted_polls', JSON.stringify(newVoted));

      setVotingStatus(prev => ({ ...prev, [pollId]: 'success' }));
      playSuccessSound();

      // Give 50 XP reward to fan!
      onAddXP(50, 'Votou na Enquete de Atualização! 📊');
    } catch (err: any) {
      console.error("Error casting vote:", err);
      setVotingStatus(prev => ({ ...prev, [pollId]: 'error' }));
      alert("Não foi possível registrar o voto no momento. Tente novamente! (" + (err?.message || err) + ")");
    }
  };

  const handleSelectOption = (pollId: string, optionId: string) => {
    playTapSound();
    setSelectedOptions(prev => ({ ...prev, [pollId]: optionId }));
  };

  const handleAddOptionField = () => {
    if (newOptions.length >= 6) {
      alert("⚠️ Máximo de 6 opções por enquete!");
      return;
    }
    playTapSound();
    setNewOptions(prev => [...prev, '']);
  };

  const handleRemoveOptionField = (index: number) => {
    if (newOptions.length <= 2) {
      alert("⚠️ A enquete precisa de no mínimo 2 opções!");
      return;
    }
    playTapSound();
    setNewOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrSuggestPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    setCreatedShareUrl(null);
    setCopiedLink(false);

    const cleanQ = newQuestion.trim();
    if (!cleanQ) {
      setModalError("⚠️ Por favor, digite a pergunta da enquete!");
      return;
    }

    const cleanOpts = newOptions.map(o => o.trim()).filter(o => o !== '');
    if (cleanOpts.length < 2) {
      setModalError("⚠️ Por favor, preencha pelo menos duas opções de resposta!");
      return;
    }

    setIsSubmittingPoll(true);
    playTapSound();

    try {
      if (isAdmin) {
        // Admin creates live poll directly in Firestore
        // Deactivate old active polls first
        const activePollsSnapshot = polls.filter(p => p.isActive);
        for (const activePoll of activePollsSnapshot) {
          const pRef = doc(db, 'polls', activePoll.id);
          try {
            await setDoc(pRef, { isActive: false, admin_secret: "pkxd2026_super_secret_admin_key" }, { merge: true });
          } catch (e) {
            console.warn("Could not deactivate previous poll:", e);
          }
        }

        const pollId = 'poll_' + Date.now();
        const pollRef = doc(db, 'polls', pollId);
        const optionsArray = cleanOpts.map((opt, idx) => ({
          id: `opt_${idx}_${Date.now()}`,
          text: opt,
          votes: 0
        }));

        const pollData: Record<string, any> = {
          id: pollId,
          question: cleanQ,
          options: optionsArray,
          createdAt: Date.now(),
          isActive: true,
          totalVotes: 0,
          admin_secret: "pkxd2026_super_secret_admin_key"
        };
        if (newImageUrl.trim()) {
          pollData.imageUrl = newImageUrl.trim();
        }

        await setDoc(pollRef, pollData);

        const shareUrl = `${window.location.origin}${window.location.pathname}?enquete=${pollId}#polls-section`;
        setCreatedShareUrl(shareUrl);

        playSuccessSound();
        onAddXP(100, 'Criou uma nova Enquete Oficial! 📊');
        setModalSuccess("🎉 Enquete criada e publicada com sucesso no fã-clube!");
      } else {
        // Regular fan submits a suggested poll
        const suggestionId = 'sug_poll_' + Date.now();
        const sugRef = doc(db, 'suggested_polls', suggestionId);
        
        const sugData: Record<string, any> = {
          id: suggestionId,
          question: cleanQ,
          options: cleanOpts,
          createdAt: Date.now(),
          authorName: localStorage.getItem('pkxd_nickname') || 'Fã Anonimo',
          status: 'pending'
        };
        if (newImageUrl.trim()) {
          sugData.imageUrl = newImageUrl.trim();
        }

        await setDoc(sugRef, sugData);

        playSuccessSound();
        onAddXP(30, 'Sugeriu uma Enquete para o Fã-Clube! 🔮');
        setModalSuccess("🚀 Sua sugestão de enquete foi enviada para a Administração! Obrigado!");
        setTimeout(() => {
          setShowCreateModal(false);
          setNewQuestion('');
          setNewOptions(['', '']);
          setNewImageUrl('');
          setImageFile(null);
          setModalSuccess(null);
        }, 2200);
      }
    } catch (err: any) {
      console.error("Erro ao salvar enquete:", err);
      setModalError("❌ Ocorreu um erro ao salvar a enquete: " + (err?.message || String(err)));
    } finally {
      setIsSubmittingPoll(false);
    }
  };

  // Helper to calculate percentage
  const getPercentage = (votes: number, total: number) => {
    if (!total) return 0;
    return Math.round((votes / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-wider">Carregando Enquetes...</span>
      </div>
    );
  }

  const activePolls = polls.filter(p => p.isActive);
  const inactivePolls = polls.filter(p => !p.isActive);

  return (
    <section id="polls-section" className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-8 text-left relative overflow-hidden">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 right-6 z-50 bg-cyan-950 border-2 border-cyan-400 text-white font-sans text-xs font-black uppercase px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Neon Glow elements */}
      <div className="absolute top-10 right-10 w-24 h-24 bg-cyan-500/5 rounded-full filter blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/5 rounded-full filter blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-2xl">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-sans font-black text-xl tracking-tight text-white uppercase flex items-center gap-2">
              Enquetes e Opiniões
            </h3>
            <p className="font-sans text-xs text-cyan-200">
              Dê o seu voto, expresse a sua opinião e decida as melhores ideias para o PK XD com o resto dos fãs! 🚀
            </p>
          </div>
        </div>

        {/* Button to Create or Suggest Poll */}
        <button
          type="button"
          onClick={() => {
            playTapSound();
            setShowCreateModal(true);
            setModalError(null);
            setModalSuccess(null);
            setCreatedShareUrl(null);
            setNewImageUrl('');
            setImageFile(null);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-cyan-400/30 shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-cyan-200" />
          <span>{isAdmin ? '➕ Criar Nova Enquete' : '💡 Sugerir Enquete (+30 XP)'}</span>
        </button>
      </div>

      {/* Active Polls Container */}
      <div className="max-h-[580px] overflow-y-auto pr-1.5 sm:pr-2 space-y-6 scrollbar-thin scrollbar-thumb-cyan-500/40 scrollbar-track-black/30">
        <div className="space-y-6">
        {activePolls.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 bg-black/20 rounded-2xl border border-white/5 space-y-3">
            <p className="italic text-xs">Nenhuma enquete ativa no momento. Seja o primeiro a sugerir ou criar uma!</p>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAdmin ? 'Criar Enquete Agora' : 'Sugerir Ideia de Enquete'}</span>
            </button>
          </div>
        ) : (
          activePolls.map((poll) => {
            const alreadyVoted = votedPolls.includes(poll.id);
            const showResults = alreadyVoted;
            const currentSelected = selectedOptions[poll.id] || '';
            const status = votingStatus[poll.id] || 'idle';

            return (
              <div 
                key={poll.id} 
                className="bg-black/30 border border-white/5 rounded-2xl p-5 sm:p-6 space-y-4 shadow-inner relative group hover:border-cyan-500/20 transition-all duration-300 overflow-hidden"
              >
                {/* Active Tag & Share Button */}
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2.5 py-1 rounded-md font-sans font-black uppercase tracking-wider flex items-center gap-1">
                    <Vote className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    Enquete Ativa
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {alreadyVoted && (
                      <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-md font-sans font-black uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Votado
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSharePoll(poll)}
                      className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-sans font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      title="Compartilhar Enquete"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartilhar 🔗</span>
                    </button>
                  </div>
                </div>

                {/* Optional Poll Photo Banner */}
                {poll.imageUrl && (
                  <div className="relative w-full max-h-60 rounded-xl overflow-hidden border border-white/10 bg-black/50">
                    <img 
                      src={poll.imageUrl} 
                      alt={poll.question} 
                      className="w-full h-full object-cover max-h-60 hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Question */}
                <h4 className="font-sans font-black text-white text-base sm:text-lg leading-snug">
                  {poll.question}
                </h4>

                {/* Options list */}
                <div className="space-y-3 pt-2">
                  <AnimatePresence mode="wait">
                    {showResults ? (
                      // Show results layout
                      <div className="space-y-3">
                        {poll.options.map((option) => {
                          const pct = getPercentage(option.votes || 0, poll.totalVotes);
                          return (
                            <div key={option.id} className="space-y-1">
                              <div className="flex justify-between text-xs text-zinc-300 font-sans font-bold px-1">
                                <span>{option.text}</span>
                                <span className="font-mono text-cyan-400 font-black">{pct}% ({option.votes || 0} {option.votes === 1 ? 'voto' : 'votos'})</span>
                              </div>
                              <div className="h-3.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Interactive voting layout
                      <div className="space-y-2">
                        {poll.options.map((option) => {
                          const isSelected = currentSelected === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => handleSelectOption(poll.id, option.id)}
                              className={`w-full p-3.5 rounded-xl text-left text-xs font-sans font-bold flex items-center gap-3 transition-all duration-150 border cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-md scale-[1.01]'
                                  : 'bg-zinc-950/40 border-white/5 text-zinc-400 hover:border-white/10 hover:bg-zinc-950/60'
                              }`}
                            >
                              <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'border-cyan-400 bg-cyan-400/20' : 'border-zinc-700'
                              }`}>
                                {isSelected && <div className="w-2 h-2 bg-cyan-400 rounded-full" />}
                              </div>
                              <span>{option.text}</span>
                            </button>
                          );
                        })}

                        {/* Submit Button */}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            disabled={!currentSelected || status === 'voting'}
                            onClick={() => handleVote(poll.id)}
                            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-white/10"
                          >
                            <Vote className="w-3.5 h-3.5" />
                            <span>{status === 'voting' ? 'Processando...' : 'Enviar Meu Voto 🗳️'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer status */}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-3 border-t border-white/5">
                  <span>{poll.totalVotes} votos no total</span>
                  {alreadyVoted && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Voto registrado!
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* Closed Polls (History) */}
      {inactivePolls.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h4 className="font-sans font-black text-sm text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico de Enquetes Encerradas
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactivePolls.map((poll) => (
              <div 
                key={poll.id} 
                className="bg-black/20 border border-white/5 rounded-2xl p-4.5 space-y-3 opacity-80 hover:opacity-100 transition-all duration-150 relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider">
                    Encerrada
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-zinc-500">{poll.totalVotes} votos</span>
                    <button
                      type="button"
                      onClick={() => handleSharePoll(poll)}
                      className="p-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded cursor-pointer"
                      title="Compartilhar Enquete"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {poll.imageUrl && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/5 bg-black">
                    <img src={poll.imageUrl} alt={poll.question} className="w-full h-full object-cover" />
                  </div>
                )}
                
                <h5 className="font-sans font-black text-sm text-zinc-300 leading-snug">
                  {poll.question}
                </h5>

                <div className="space-y-2.5 pt-1">
                  {poll.options.map((option) => {
                    const pct = getPercentage(option.votes || 0, poll.totalVotes);
                    return (
                      <div key={option.id} className="space-y-0.5">
                        <div className="flex justify-between text-[10px] text-zinc-400 font-sans font-medium px-0.5">
                          <span>{option.text}</span>
                          <span className="font-mono text-zinc-300">{pct}% ({option.votes || 0})</span>
                        </div>
                        <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                          <div 
                            style={{ width: `${pct}%` }}
                            className="h-full bg-zinc-700 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE CRIAR OU SUGERIR ENQUETE */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 text-left shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-sans font-black text-lg text-white uppercase tracking-tight">
                    {isAdmin ? 'Criar Nova Enquete Oficial' : 'Sugerir Enquete para o Fã-Clube'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setShowCreateModal(false);
                  }}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Modal */}
              <form onSubmit={handleCreateOrSuggestPoll} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-cyan-300 mb-1.5">
                    Pergunta da Enquete *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Qual dessas novas roupas você quer na próxima atualização?"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>

                {/* Option to Add Photo / Image */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-cyan-300">
                    Foto / Banner da Enquete (Opcional 📸)
                  </label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border border-cyan-500/30 text-cyan-300 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2 transition-all shrink-0">
                        <Upload className="w-4 h-4" />
                        <span>Carregar do Dispositivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">ou insira um link:</span>
                    </div>

                    <input
                      type="url"
                      placeholder="https://exemplo.com/imagem_enquete.png"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />

                    {newImageUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 h-36 bg-black">
                        <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setNewImageUrl('');
                            setImageFile(null);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-cyan-300">
                      Opções de Resposta * (no mínimo 2)
                    </label>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {newOptions.length}/6 opções
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {newOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-500 font-mono">#{idx + 1}</span>
                        <input
                          type="text"
                          required={idx < 2}
                          placeholder={`Opção ${idx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newOptions];
                            updated[idx] = e.target.value;
                            setNewOptions(updated);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                        />
                        {newOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionField(idx)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {newOptions.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOptionField}
                      className="mt-1 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/20 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Outra Opção</span>
                    </button>
                  )}
                </div>

                {modalError && (
                  <p className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 p-3 rounded-xl font-sans">
                    {modalError}
                  </p>
                )}

                {modalSuccess && (
                  <div className="space-y-3 bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-xl text-left">
                    <p className="text-xs text-emerald-300 font-sans font-bold">
                      {modalSuccess}
                    </p>

                    {createdShareUrl && (
                      <div className="space-y-1.5 pt-1 border-t border-emerald-500/20">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                          <Link2 className="w-3.5 h-3.5 text-emerald-300" />
                          Link direto para compartilhar:
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={createdShareUrl}
                            className="flex-1 bg-black/60 border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-[11px] text-emerald-200 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              navigator.clipboard.writeText(createdShareUrl);
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2500);
                            }}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {copiedLink ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setShowCreateModal(false);
                      setCreatedShareUrl(null);
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    {createdShareUrl ? 'Fechar' : 'Cancelar'}
                  </button>

                  {!createdShareUrl && (
                    <button
                      type="submit"
                      disabled={isSubmittingPoll}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      {isSubmittingPoll ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{isAdmin ? 'Publicar Enquete Oficial! 🚀' : 'Enviar Sugestão (+30 XP) 🔮'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

