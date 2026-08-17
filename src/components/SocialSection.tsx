import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MessageSquare, Send, User, Award, Trash2, 
  Instagram, Sparkles, Clock, AlertTriangle, Smile, Shield 
} from 'lucide-react';
import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, 
  query, orderBy, limit, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Post, AppComment } from '../types';
import CommentsSection from './CommentsSection';

interface SocialSectionProps {
  currentUser: any;
  isAdmin: boolean;
  onAddXP: (amount: number, reason: string) => void;
  soundEnabled: boolean;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
  onLoginRedirect: () => void;
}

export default function SocialSection({
  currentUser,
  isAdmin,
  onAddXP,
  soundEnabled,
  triggerAudio,
  onLoginRedirect
}: SocialSectionProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  
  // Public Profile Modal State
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedProfileData, setSelectedProfileData] = useState<any>(null);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);

  // Local feedback message
  const [notif, setNotif] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  // Real-time listen to community posts from Firestore
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData: Post[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        postsData.push({
          id: docSnap.id,
          authorName: data.authorName || 'Fã Secreto',
          authorId: data.authorId || '',
          authorAvatar: data.authorAvatar || '',
          content: data.content || '',
          likes: Number(data.likes) || 0,
          likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
          createdAt: Number(data.createdAt) || Date.now()
        });
      });
      setPosts(postsData);
    }, (error) => {
      console.error("Error loading posts:", error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch or listen to profile stats when a profile is selected
  useEffect(() => {
    if (!selectedProfileId) {
      setSelectedProfileData(null);
      setProfilePosts([]);
      return;
    }

    // Get selected player stats from leaderboard
    const profileRef = doc(db, 'leaderboard', selectedProfileId);
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setSelectedProfileData({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Fallback info
        setSelectedProfileData({
          id: selectedProfileId,
          name: 'Fã Secreto',
          level: 1,
          flames: 1,
          xp: 0,
          bio: 'Este fã é super misterioso e ainda não configurou seu perfil público!'
        });
      }
    });

    // Get posts specifically by this user
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const pPosts: Post[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.authorId === selectedProfileId) {
          pPosts.push({
            id: docSnap.id,
            authorName: data.authorName || 'Fã Secreto',
            authorId: data.authorId || '',
            authorAvatar: data.authorAvatar || '',
            content: data.content || '',
            likes: Number(data.likes) || 0,
            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            createdAt: Number(data.createdAt) || Date.now()
          });
        }
      });
      setProfilePosts(pPosts);
    });

    return () => {
      unsubscribeProfile();
      unsubscribePosts();
    };
  }, [selectedProfileId]);

  // Create a new post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      triggerAudio('tap');
      showNotification("⚠️ Entre na sua conta para poder postar!");
      return;
    }

    const content = newPostContent.trim();
    if (content.length === 0) return;

    if (content.length > 500) {
      showNotification("⚠️ O post não pode passar de 500 caracteres!");
      return;
    }

    setIsSubmitting(true);
    triggerAudio('tap');

    const postId = 'post_' + Date.now();
    const nickname = localStorage.getItem('pkxd_username_nickname') || currentUser.displayName || 'Jogador_Convidado';

    try {
      const postRef = doc(db, 'posts', postId);
      await setDoc(postRef, {
        id: postId,
        authorName: nickname,
        authorId: currentUser.uid,
        authorAvatar: currentUser.photoURL || '',
        content: content,
        likes: 0,
        likedBy: [],
        createdAt: Date.now()
      });

      setNewPostContent('');
      triggerAudio('success');
      showNotification("🎉 Post compartilhado na Rede Social!");

      // Update Daily Mission status for posting
      try {
        const lastMissionsStr = localStorage.getItem('pkxd_daily_missions_state');
        if (lastMissionsStr) {
          const missions = JSON.parse(lastMissionsStr);
          const updated = missions.map((m: any) => {
            if (m.type === 'post' && !m.completed) {
              m.completed = true;
              onAddXP(m.xpReward, `Missão Cumprida: ${m.title}! 🎯`);
              showNotification(`⚡ Missão Completa: ${m.title}! +${m.xpReward} XP`);
            }
            return m;
          });
          localStorage.setItem('pkxd_daily_missions_state', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn(e);
      }

      // Add small baseline XP for posting anyway
      onAddXP(40, "Publicação de Post na Comunidade 💬");

    } catch (err: any) {
      console.error(err);
      showNotification("❌ Erro ao postar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Like Post
  const handleLikePost = async (post: Post) => {
    if (!currentUser) {
      triggerAudio('tap');
      showNotification("⚠️ Entre na sua conta para curtir as postagens!");
      return;
    }

    triggerAudio('tap');
    const postRef = doc(db, 'posts', post.id);
    const hasLiked = post.likedBy.includes(currentUser.uid);

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(currentUser.uid),
          likes: Math.max(0, post.likes - 1)
        });
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(currentUser.uid),
          likes: post.likes + 1
        });
        
        // Trigger audio success
        triggerAudio('success');

        // Check Daily Mission for Liking
        try {
          const lastMissionsStr = localStorage.getItem('pkxd_daily_missions_state');
          if (lastMissionsStr) {
            const missions = JSON.parse(lastMissionsStr);
            const updated = missions.map((m: any) => {
              if (m.type === 'like' && !m.completed) {
                m.completed = true;
                onAddXP(m.xpReward, `Missão Cumprida: ${m.title}! 🎯`);
                showNotification(`⚡ Missão Completa: ${m.title}! +${m.xpReward} XP`);
              }
              return m;
            });
            localStorage.setItem('pkxd_daily_missions_state', JSON.stringify(updated));
          }
        } catch (e) {
          console.warn(e);
        }

        // Add 10 baseline XP for liking posts
        onAddXP(10, "Apreciação de fã 💖");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete a post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Deseja apagar permanentemente este post do mural público?")) return;
    triggerAudio('tap');
    try {
      await deleteDoc(doc(db, 'posts', postId));
      showNotification("🗑️ Post removido com sucesso!");
    } catch (err: any) {
      showNotification("❌ Erro ao remover post: " + err.message);
    }
  };

  // Get generic avatar color or character based on user nickname
  const getAvatarFallback = (name: string) => {
    const chars = ['🤖', '🦄', '🐱', '🐶', '🦊', '🐻', '🐼', '🐯', '👽', '🦖', '🦁', '🦉'];
    const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return chars[sum % chars.length];
  };

  return (
    <div id="social-central-container" className="space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {notif && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 right-6 z-50 bg-gradient-to-r from-purple-600 to-indigo-650 text-white font-black px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-purple-400 text-xs sm:text-sm font-sans"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>{notif}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redesigned Social Central Header */}
      <div className="bg-gradient-to-br from-purple-950/40 via-zinc-900/40 to-black/30 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-4 text-left relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-pink-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase tracking-widest font-mono">
          <Shield className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
          <span>PKXD Central • Rede Social</span>
        </div>
        
        <h3 className="font-sans font-black text-2xl sm:text-3xl text-white uppercase tracking-tight flex items-center gap-2 flex-wrap">
          <span>👥 Mural da Comunidade PKXD Central</span>
          <span className="text-xs bg-pink-500 text-white font-mono font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
            NOVA FASE 🌟
          </span>
        </h3>
        
        <p className="font-sans text-xs sm:text-sm text-gray-300 leading-relaxed max-w-4xl">
          Seja bem-vindo ao fã-clube interativo oficial do PKXD Central! Escreva fofocas do jogo, comente sobre spoilers, faça novas amizades, curta teorias e compartilhe suas ideias com toda a comunidade conectada em tempo real!
        </p>
      </div>

      {/* Social Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns: Posting area and feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Creation Box */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-5 sm:p-6 text-left space-y-4">
            <h4 className="font-sans font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-pink-400" />
              <span>O que você está pensando agora?</span>
            </h4>

            {currentUser ? (
              <form onSubmit={handleCreatePost} className="space-y-3">
                <div className="relative">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Compartilhe teorias, novidades ou mande um 'Oi' para a comunidade do PKXD Central! ✨"
                    maxLength={500}
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[110px] resize-none font-sans leading-relaxed"
                  />
                  <div className="absolute bottom-3 right-4 text-[10px] font-mono text-gray-500">
                    {newPostContent.length}/500
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-sans">
                    <span className="text-lg">{getAvatarFallback(localStorage.getItem('pkxd_username_nickname') || 'Jogador_Convidado')}</span>
                    <span>Postando como: <strong className="text-cyan-300 font-mono">{localStorage.getItem('pkxd_username_nickname') || 'Fã Secreto'}</strong></span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || newPostContent.trim().length === 0}
                    className="px-5 py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-650 hover:from-pink-400 hover:to-indigo-550 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Publicando...' : 'Postar no Mural 🚀'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 rounded-2xl bg-zinc-950 border border-white/5 text-center space-y-4">
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans max-w-lg mx-auto">
                  Você precisa estar conectado à sua conta de fã para poder criar publicações, dar like e interagir no chat social de PKXD Central!
                </p>
                <button
                  onClick={() => {
                    triggerAudio('tap');
                    onLoginRedirect();
                    // Scroll to connection area
                    setTimeout(() => {
                      document.getElementById('fan-level-dashboard')?.scrollIntoView({ behavior: 'smooth' });
                    }, 200);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-550 active:scale-[0.98] text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Entrar / Criar Conta de Fã 🔓</span>
                </button>
              </div>
            )}
          </div>

          {/* Social Feed Items */}
          <div className="max-h-[580px] overflow-y-auto pr-1.5 sm:pr-2 space-y-4 scrollbar-thin scrollbar-thumb-purple-600/40 scrollbar-track-black/30">
            <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-zinc-900/40 rounded-3xl border border-white/5 p-12 text-center space-y-2 select-none">
                <Smile className="w-10 h-10 text-gray-600 mx-auto" />
                <h4 className="font-sans font-black text-sm text-gray-400 uppercase">Ainda não há posts</h4>
                <p className="font-sans text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                  Seja o primeiro a postar! Escreva algo legal e receba energia dos outros fãs de PKXD Central.
                </p>
              </div>
            ) : (
              posts.map((post) => {
                const isMyPost = currentUser && post.authorId === currentUser.uid;
                const isLikedByMe = currentUser && post.likedBy.includes(currentUser.uid);
                
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-950/60 border border-purple-500/20 rounded-2xl p-4 sm:p-5 text-left space-y-4 hover:border-purple-500/40 hover:shadow-2xl transition-all relative overflow-hidden"
                  >
                    {/* Author block - Instagram Style */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar with beautiful Instagram gradient ring */}
                        <button
                          onClick={() => {
                            triggerAudio('tap');
                            setSelectedProfileId(post.authorId || null);
                          }}
                          className="w-12 h-12 rounded-full p-[2.5px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
                        >
                          <div className="w-full h-full bg-neutral-900 rounded-full flex items-center justify-center text-xl text-white shadow-inner">
                            <span className="select-none">{getAvatarFallback(post.authorName)}</span>
                          </div>
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-neutral-900 rounded-full" title="Online" />
                        </button>

                        <div className="space-y-0.5">
                          <div className="flex items-center flex-wrap gap-1">
                            <button
                              onClick={() => {
                                triggerAudio('tap');
                                setSelectedProfileId(post.authorId || null);
                              }}
                              className="font-sans text-sm font-bold text-white hover:text-purple-300 hover:underline text-left cursor-pointer transition-colors block"
                            >
                              {post.authorName}
                            </button>
                            
                            {/* Blue Verified Badge for Admin and VIP Creators */}
                            {(post.authorName.toLowerCase().includes('admin') || post.authorId === 'admin_fallback' || post.authorId === 'p6u6hBInG8fS6hPzC78p4KXD') && (
                              <span className="inline-flex items-center justify-center bg-sky-500 text-white rounded-full text-[7px] font-black w-3.5 h-3.5 select-none" title="Criador Oficial Verificado">
                                ✓
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[10px] text-neutral-400 font-sans">
                            <span>{post.createdAt && !isNaN(new Date(post.createdAt).getTime())
                              ? `${new Date(post.createdAt).toLocaleDateString('pt-BR')} às ${new Date(post.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                              : 'Sem Data'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Admin Badge */}
                        {(post.authorName.toLowerCase().includes('admin') || post.authorId === 'admin_fallback' || post.authorId === 'p6u6hBInG8fS6hPzC78p4KXD') ? (
                          <span className="text-[8px] font-black bg-purple-900 text-purple-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            CREATOR
                          </span>
                        ) : null}

                        {/* Trash delete button */}
                        {(isAdmin || isMyPost) && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title="Excluir Post"
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-purple-950/40 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content text - clean, high legibility */}
                    <p className="font-sans text-sm text-neutral-250 leading-relaxed whitespace-pre-line pl-1 font-normal">
                      {post.content}
                    </p>

                    {/* Actions and triggers - Elegant Instagram Action Bar */}
                    <div className="flex items-center gap-6 pt-3 border-t border-neutral-800 text-neutral-400 text-xs font-semibold">
                      {/* Like button */}
                      <button
                        onClick={() => handleLikePost(post)}
                        className={`flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                          isLikedByMe 
                            ? 'text-rose-400' 
                            : 'text-neutral-400 hover:text-rose-400'
                        }`}
                      >
                        <Heart className={`w-5 h-5 transition-transform ${isLikedByMe ? 'fill-rose-400 text-rose-400 scale-110' : ''}`} />
                        <span>{post.likes === 1 ? "1 curtida" : `${post.likes} curtidas`}</span>
                      </button>

                      {/* Comment foldout trigger */}
                      <button
                        onClick={() => {
                          triggerAudio('tap');
                          setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id);
                        }}
                        className={`flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                          activeCommentsPostId === post.id
                            ? 'text-purple-300'
                            : 'text-neutral-400 hover:text-purple-300'
                        }`}
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>Comentários</span>
                      </button>
                    </div>

                    {/* Integrated Comments Area */}
                    <AnimatePresence>
                      {activeCommentsPostId === post.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden pt-4 mt-2 border-t border-neutral-800"
                        >
                          <CommentsSection
                            targetId={post.id}
                            targetType="post"
                            currentUser={currentUser}
                            isAdmin={isAdmin}
                            onAddXP={onAddXP}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column: Mini Info Cards */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {/* Rules / Conduct Box */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-5 text-left space-y-4">
            <h4 className="font-sans font-black text-sm text-yellow-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>Regras do Mural 🛡️</span>
            </h4>
            <ul className="list-disc pl-4 font-sans text-[11px] text-gray-300 space-y-2 leading-relaxed">
              <li>
                <strong className="text-white">Respeito sempre:</strong> Ofensas, bullying ou provocações não serão tolerados.
              </li>
              <li>
                <strong className="text-white">Sem Vazamentos / Spoilers Mentirosos:</strong> Somente divulgue informações confirmadas oficiais. Não poste links falsos ou vírus.
              </li>
              <li>
                <strong className="text-white">Evite Spam:</strong> Não envie o mesmo post repetidamente ou faça propagandas não autorizadas.
              </li>
              <li>
                <strong className="text-white">Punição:</strong> O descumprimento das regras resultará em remoção permanente do post e exclusão do ranking.
              </li>
            </ul>
          </div>

          {/* Connected Members Activity Feed widget */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-5 text-left space-y-4">
            <h4 className="font-sans font-black text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Insígnias Sociais 🏆</span>
            </h4>
            <p className="text-[11px] text-gray-400 leading-normal font-sans">
              Interaja no Mural e suba de nível para desbloquear insígnias exclusivas que serão exibidas em seu perfil público!
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/25 border border-white/5">
                <span className="text-xl">🌟</span>
                <div>
                  <h5 className="text-[10.5px] font-bold text-yellow-300 leading-tight">Fã Conectado</h5>
                  <p className="text-[9.5px] text-gray-400">Logou com conta registrada no site.</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/25 border border-white/5">
                <span className="text-xl">🔮</span>
                <div>
                  <h5 className="text-[10.5px] font-bold text-pink-400 leading-tight">Veterano da Central</h5>
                  <p className="text-[9.5px] text-gray-400">Alcançou o Nível de Fã 5+.</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/25 border border-white/5">
                <span className="text-xl">🚀</span>
                <div>
                  <h5 className="text-[10.5px] font-bold text-cyan-400 leading-tight">Mestre dos Spoilers</h5>
                  <p className="text-[9.5px] text-gray-400">Alcançou o Nível de Fã 10+.</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/25 border border-white/5">
                <span className="text-xl">🔥</span>
                <div>
                  <h5 className="text-[10.5px] font-bold text-orange-400 leading-tight">Estrela Cósmica</h5>
                  <p className="text-[9.5px] text-gray-400">Alcançou 10+ Fogos conquistados.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN PUBLIC PROFILE MODAL */}
      <AnimatePresence>
        {selectedProfileId && selectedProfileData && (
          <div 
            onClick={() => setSelectedProfileId(null)}
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in cursor-zoom-out"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 w-full max-w-xl relative shadow-[0_0_40px_rgba(139,92,246,0.3)] my-auto text-left cursor-default overflow-hidden"
            >
              {/* Cosmic profile top glow */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-400" />
              
              <button
                onClick={() => setSelectedProfileId(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-all text-xl cursor-pointer"
                title="Fechar Perfil"
              >
                ✕
              </button>

              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-4">
                {/* Huge animated avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 via-purple-600 to-cyan-400 p-1 flex items-center justify-center shadow-lg relative select-none text-4xl">
                  <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
                    {getAvatarFallback(selectedProfileData.name)}
                  </div>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h3 className="font-mono text-xl sm:text-2xl font-black text-white flex items-center gap-2 justify-center sm:justify-start">
                    <span>{selectedProfileData.name}</span>
                    {selectedProfileData.level >= 10 && <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">Mestre</span>}
                  </h3>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-4 flex-wrap">
                    <span className="text-[11px] font-bold text-orange-400 font-mono bg-orange-950/40 border border-orange-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      🔥 {selectedProfileData.flames || 1} FOGOS
                    </span>
                    <span className="text-[11px] font-bold text-yellow-300 font-mono bg-yellow-950/40 border border-yellow-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      ⭐ NÍVEL {selectedProfileData.level || 1}
                    </span>
                  </div>

                  {selectedProfileData.instagram && selectedProfileData.instagramPublic !== false && (
                    <a
                      href={selectedProfileData.instagram.startsWith('http') ? selectedProfileData.instagram : `https://instagram.com/${selectedProfileData.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 hover:underline font-mono"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>{selectedProfileData.instagram.startsWith('@') ? selectedProfileData.instagram : `@${selectedProfileData.instagram.split('/').pop()}`}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Bio Block */}
              <div className="mt-6 p-4 rounded-2xl bg-zinc-950 border border-white/5 space-y-1.5">
                <h4 className="text-[10.5px] text-gray-400 uppercase tracking-widest font-bold">Biografia do Fã</h4>
                <p className="font-sans text-xs text-gray-200 leading-relaxed italic">
                  {selectedProfileData.bio || '“Sou um fã apaixonado por PK XD e sempre acompanho as teorias e códigos oficiais da Central!”'}
                </p>
              </div>

              {/* Earned Badges block */}
              <div className="mt-6 space-y-3">
                <h4 className="text-[10.5px] text-gray-400 uppercase tracking-widest font-bold">Conquistas & Badges</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border flex items-center gap-2.5 bg-black/20 ${selectedProfileData.id.startsWith('u_') ? 'border-zinc-800 opacity-40' : 'border-yellow-500/30'}`}>
                    <span className="text-2xl">🌟</span>
                    <div>
                      <h5 className="text-[10px] font-black text-white leading-none">FÃ REGISTRADO</h5>
                      <span className="text-[8px] text-gray-400 uppercase">{selectedProfileData.id.startsWith('u_') ? 'Bloqueado' : 'Desbloqueado'}</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center gap-2.5 bg-black/20 ${selectedProfileData.level < 5 ? 'border-zinc-800 opacity-40' : 'border-pink-500/30'}`}>
                    <span className="text-2xl">🔮</span>
                    <div>
                      <h5 className="text-[10px] font-black text-white leading-none">FÃ VETERANO</h5>
                      <span className="text-[8px] text-gray-400 uppercase">{selectedProfileData.level < 5 ? 'Nível 5+' : 'Desbloqueado'}</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center gap-2.5 bg-black/20 ${selectedProfileData.level < 10 ? 'border-zinc-800 opacity-40' : 'border-cyan-500/30'}`}>
                    <span className="text-2xl">🚀</span>
                    <div>
                      <h5 className="text-[10px] font-black text-white leading-none">MESTRE SPOILER</h5>
                      <span className="text-[8px] text-gray-400 uppercase">{selectedProfileData.level < 10 ? 'Nível 10+' : 'Desbloqueado'}</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center gap-2.5 bg-black/20 ${selectedProfileData.flames < 10 ? 'border-zinc-800 opacity-40' : 'border-orange-500/30'}`}>
                    <span className="text-2xl">🔥</span>
                    <div>
                      <h5 className="text-[10px] font-black text-white leading-none">ESTRELA DE FOGO</h5>
                      <span className="text-[8px] text-gray-400 uppercase">{selectedProfileData.flames < 10 ? '10+ Fogos' : 'Desbloqueado'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent posts by user */}
              <div className="mt-6 space-y-3">
                <h4 className="text-[10.5px] text-gray-400 uppercase tracking-widest font-bold">Publicações Recentes ({profilePosts.length})</h4>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {profilePosts.length === 0 ? (
                    <p className="text-[11px] text-gray-500 font-sans italic">Nenhum post publicado recentemente no mural.</p>
                  ) : (
                    profilePosts.map((pp) => (
                      <div key={pp.id} className="p-3 bg-zinc-950/75 border border-white/5 rounded-xl space-y-1">
                        <p className="text-xs text-gray-200 line-clamp-2 leading-relaxed">{pp.content}</p>
                        <span className="block text-[9px] text-gray-500 font-mono">{pp.createdAt && !isNaN(new Date(pp.createdAt).getTime())
                          ? new Date(pp.createdAt).toLocaleDateString('pt-BR')
                          : 'Sem Data'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <button
                  onClick={() => setSelectedProfileId(null)}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer text-center"
                >
                  Fechar Perfil
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
