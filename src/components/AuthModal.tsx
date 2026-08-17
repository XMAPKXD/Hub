import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Mail, User, Sparkles, ArrowLeft, KeyRound, 
  CheckCircle2, AlertCircle, X, Shield, Eye, EyeOff,
  UserPlus, LogIn, RefreshCw, Send, Check
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export type AuthMode = 'login' | 'register' | 'resetpassword';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess?: (user: any, mode: AuthMode) => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
  onNavigate: (path: string) => void;
  onAddXP?: (amount: number, reason: string) => void;
}

export default function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  triggerAudio,
  onNavigate,
  onAddXP
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerNickname, setRegisterNickname] = useState('');
  const [registerTagNumber, setRegisterTagNumber] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  
  // Reset password form state
  const [resetEmail, setResetEmail] = useState('');
  const [resetSentSuccess, setResetSentSuccess] = useState(false);
  
  // Verification code step for register (optional extra security verification)
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    pass: string;
    tag: string;
    code: string;
  } | null>(null);
  const [codeInputValue, setCodeInputValue] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync mode with initialMode prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setResetSentSuccess(false);
      setPendingVerification(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSwitchMode = (newMode: AuthMode) => {
    triggerAudio('tap');
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setResetSentSuccess(false);
    setPendingVerification(null);

    // Update URL path without losing state
    if (newMode === 'login') {
      onNavigate('/login');
    } else if (newMode === 'register') {
      onNavigate('/createaccount');
    } else if (newMode === 'resetpassword') {
      onNavigate('/resetpassword');
    }
  };

  const handleClose = () => {
    triggerAudio('tap');
    onClose();
    // Return to main route
    onNavigate('/');
  };

  // Google Login / Register
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      triggerAudio('success');
      setSuccessMessage(`Conectado como ${result.user.displayName || result.user.email}! 🎉`);
      
      // Auto save basic profile if needed
      if (result.user) {
        const fullTag = result.user.displayName || `Fã_${result.user.uid.slice(0, 4)}#000`;
        try {
          localStorage.setItem('pkxd_player_tag', fullTag);
          localStorage.setItem('pkxd_username_nickname', fullTag);
        } catch (e) {}
      }

      if (onAddXP) {
        onAddXP(30, 'Login realizado com sucesso');
      }

      if (onSuccess) {
        onSuccess(result.user, mode);
      }

      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (error: any) {
      console.error("Google Auth failed:", error);
      const code = error?.code || '';
      let msg = error?.message || 'Falha ao conectar com o Google.';
      if (code === 'auth/popup-closed-by-user') {
        msg = 'O login foi cancelado antes de ser concluído.';
      } else if (code === 'auth/unauthorized-domain') {
        msg = `Domínio não autorizado no Firebase. Adicione ${window.location.hostname} aos Domínios Autorizados no Firebase Console.`;
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      triggerAudio('success');
      setSuccessMessage(`Bem-vindo(a) de volta! 🚀`);

      if (onAddXP) {
        onAddXP(20, 'Login diário');
      }

      if (onSuccess) {
        onSuccess(result.user, 'login');
      }

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      console.error("Email Login error:", error);
      const code = error?.code || '';
      let msg = 'Erro ao fazer login. Verifique seus dados.';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-login-credentials' || code === 'auth/invalid-credential') {
        msg = 'Senha incorreta ou e-mail inválido!';
      } else if (code === 'auth/user-not-found') {
        msg = 'Nenhuma conta encontrada com este e-mail. Crie sua conta grátis!';
      } else if (code === 'auth/invalid-email') {
        msg = 'Formato de e-mail inválido.';
      } else if (code === 'auth/too-many-requests') {
        msg = 'Muitas tentativas sem sucesso. Tente novamente mais tarde ou redefina sua senha.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register step 1 (Initiate)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = registerNickname.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    const cleanNum = registerTagNumber.trim().replace(/[^0-9]/g, '');
    
    if (!cleanNick || cleanNick.length < 2) {
      setErrorMessage('O Nome no PK XD deve ter pelo menos 2 caracteres.');
      return;
    }
    if (!cleanNum || cleanNum.length < 1) {
      setErrorMessage('Informe a # numérico do seu PK XD (ex: 245 ou 000).');
      return;
    }
    if (!registerEmail.trim()) {
      setErrorMessage('Por favor, informe seu e-mail.');
      return;
    }
    if (registerPassword.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage('As senhas não coincidem! Verifique e digite novamente.');
      return;
    }

    const fullTag = `${cleanNick}#${cleanNum}`;
    const genCode = Math.floor(100000 + Math.random() * 900000).toString();

    setPendingVerification({
      email: registerEmail.trim(),
      pass: registerPassword,
      tag: fullTag,
      code: genCode
    });
    setCodeInputValue('');
    triggerAudio('tap');
    setSuccessMessage(`📩 Enviamos um código de 6 dígitos para confirmação! (Código de teste rápido: ${genCode})`);
  };

  // Handle Register step 2 (Confirm code & create account)
  const handleConfirmRegisterCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingVerification) return;

    if (codeInputValue.trim() !== pendingVerification.code) {
      setErrorMessage('❌ Código de confirmação incorreto! Digite o código de 6 dígitos.');
      triggerAudio('tap');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await createUserWithEmailAndPassword(
        auth, 
        pendingVerification.email, 
        pendingVerification.pass
      );

      const fullTag = pendingVerification.tag;
      const parts = fullTag.split('#');
      const nickOnly = parts[0] || 'Explorador';
      const numberOnly = parts[1] || '000';

      // Update local storage
      try {
        localStorage.setItem('pkxd_player_tag', fullTag);
        localStorage.setItem('pkxd_nickname', nickOnly);
        localStorage.setItem('pkxd_player_number', numberOnly);
        localStorage.setItem('pkxd_username_nickname', fullTag);
      } catch (e) {}

      // Update Firebase Auth profile displayName
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: fullTag
        });

        // Store public info in Firestore
        try {
          const cleanKey = encodeURIComponent(fullTag.trim().toLowerCase().replace(/[.#$/[\]]/g, '_'));
          await setDoc(doc(db, 'leaderboard', auth.currentUser.uid), {
            name: fullTag,
            level: 1,
            xp: 50,
            flames: 1,
            email: pendingVerification.email,
            createdAt: Date.now()
          }, { merge: true });
        } catch (err) {}
      }

      triggerAudio('levelUp');
      setSuccessMessage(`🎉 Conta criada com sucesso com sua Tag ${fullTag}! Bem-vindo ao PKXD Central!`);
      
      if (onAddXP) {
        onAddXP(50, 'Criou conta no PKXD Central');
      }

      if (onSuccess) {
        onSuccess(result.user, 'register');
      }

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error: any) {
      console.error("Create User error:", error);
      const code = error?.code || '';
      let msg = 'Não foi possível criar a conta.';
      if (code === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está cadastrado! Faça login ou recupere sua senha.';
      } else if (code === 'auth/weak-password') {
        msg = 'A senha é muito fraca. Digite pelo menos 6 caracteres.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Endereço de e-mail inválido.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reset Password submission
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setErrorMessage('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      triggerAudio('success');
      setResetSentSuccess(true);
      setSuccessMessage(`📧 Link de redefinição enviado com sucesso para ${resetEmail.trim()}! Verifique sua caixa de entrada e a pasta de spam.`);
    } catch (error: any) {
      console.error("Reset Password error:", error);
      const code = error?.code || '';
      let msg = 'Erro ao enviar e-mail de recuperação.';
      if (code === 'auth/user-not-found') {
        msg = 'Nenhuma conta encontrada com este e-mail.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Endereço de e-mail inválido.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="pkxd-auth-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in text-left"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-zinc-900 border-2 border-purple-500/50 rounded-3xl shadow-[0_0_50px_rgba(147,51,234,0.3)] overflow-hidden relative"
      >
        {/* Top Gradient Ribbon */}
        <div className="h-2 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-400" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white rounded-full transition-all cursor-pointer border border-white/10"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-yellow-300 font-black text-xl shadow-inner">
              ⚡
            </div>
            <div>
              <h2 className="font-sans font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
                PKXD <span className="text-yellow-300">Central</span>
              </h2>
              <p className="text-[11px] font-mono text-purple-300 uppercase tracking-widest">
                {mode === 'login' && 'Entrar na sua Conta'}
                {mode === 'register' && 'Criar Nova Conta Oficial'}
                {mode === 'resetpassword' && 'Recuperar Senha'}
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/50 rounded-2xl border border-white/10 mt-4">
            <button
              onClick={() => handleSwitchMode('login')}
              className={`py-2 px-1 text-center font-sans font-black text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>

            <button
              onClick={() => handleSwitchMode('register')}
              className={`py-2 px-1 text-center font-sans font-black text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Criar Conta</span>
            </button>

            <button
              onClick={() => handleSwitchMode('resetpassword')}
              className={`py-2 px-1 text-center font-sans font-black text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                mode === 'resetpassword'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Recuperar</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-start gap-2.5 text-xs text-red-200 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-200 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* 1. LOGIN VIEW */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-purple-300">
                  Seu E-mail *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="exemplo@gmail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-purple-300">
                    Sua Senha *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('resetpassword')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Entrar no PKXD Central</span>
                  </>
                )}
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative px-3 bg-zinc-900 text-[10px] uppercase tracking-widest text-gray-400">
                  ou continue com
                </span>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleAuth}
                className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/20 active:scale-[0.98] text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Conectar com Google</span>
              </button>

              <p className="text-center text-xs text-gray-400 pt-2">
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('register')}
                  className="text-pink-400 hover:text-pink-300 font-bold underline cursor-pointer"
                >
                  Criar conta grátis
                </button>
              </p>
            </form>
          )}

          {/* 2. REGISTER VIEW */}
          {mode === 'register' && (
            <>
              {!pendingVerification ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  
                  {/* PK XD Nick & Tag Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-pink-400">
                        Nome no PK XD *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          maxLength={16}
                          placeholder="Ex: LUNA ou GABRIEL"
                          value={registerNickname}
                          onChange={(e) => setRegisterNickname(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                          className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-pink-400">
                        Número / Tag # *
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 font-mono font-black text-xs text-pink-400">#</span>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="245 ou 000"
                          value={registerTagNumber}
                          onChange={(e) => setRegisterTagNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full bg-black/60 border border-white/15 rounded-xl pl-7 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tag preview box */}
                  <div className="p-2.5 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium text-[11px]">Sua Tag PK XD:</span>
                    <span className="font-mono font-black text-yellow-300 bg-black/60 px-2 py-0.5 rounded-lg border border-yellow-400/30 text-xs">
                      {registerNickname.trim() || 'SEUNICK'}#{registerTagNumber.trim() || '000'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-purple-300">
                      Seu E-mail *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="exemplo@gmail.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-purple-300">
                        Senha (mín. 6 dígitos) *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="••••••"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-purple-300">
                        Confirmar Senha *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="••••••"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:brightness-110 active:scale-[0.98] text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Avançar e Criar Conta (+50 XP) 🚀</span>
                  </button>

                  <div className="relative my-3 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <span className="relative px-3 bg-zinc-900 text-[10px] uppercase tracking-widest text-gray-400">
                      ou
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleGoogleAuth}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 active:scale-[0.98] text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Cadastrar com Google</span>
                  </button>

                  <p className="text-center text-xs text-gray-400 pt-1">
                    Já possui uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('login')}
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                    >
                      Fazer Login
                    </button>
                  </p>
                </form>
              ) : (
                /* Step 2: Code confirmation */
                <form onSubmit={handleConfirmRegisterCode} className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 flex items-center justify-center mx-auto">
                      <Mail className="w-6 h-6" />
                    </div>
                    <h3 className="font-sans font-black text-base text-white uppercase">
                      Confirmar E-mail
                    </h3>
                    <p className="text-xs text-gray-300 max-w-sm mx-auto">
                      Digite o código de 6 dígitos enviado para <strong className="text-yellow-300 font-mono">{pendingVerification.email}</strong>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Ex: 123456"
                      value={codeInputValue}
                      onChange={(e) => setCodeInputValue(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-black/70 border-2 border-pink-500/60 rounded-2xl py-3.5 text-center text-xl tracking-[0.5em] font-mono font-black text-yellow-300 focus:outline-none focus:border-pink-400 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || codeInputValue.length < 6}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 active:scale-[0.98] text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirmar e Finalizar Cadastro</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => setPendingVerification(null)}
                      className="text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                        setPendingVerification(prev => prev ? { ...prev, code: newCode } : null);
                        setSuccessMessage(`🔄 Novo código gerado: ${newCode}`);
                      }}
                      className="text-pink-400 hover:text-pink-300 font-bold cursor-pointer"
                    >
                      Reenviar Código
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* 3. RESET PASSWORD VIEW */}
          {mode === 'resetpassword' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="text-center space-y-1.5 pb-2">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-sans font-black text-base text-white uppercase">
                  Redefinir sua Senha
                </h3>
                <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                  Digite seu e-mail cadastrado abaixo para receber um link seguro e criar uma nova senha.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-cyan-300">
                  E-mail da sua Conta *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="seuemail@gmail.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:brightness-110 active:scale-[0.98] text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Link de Recuperação</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="text-xs text-purple-300 hover:text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para Fazer Login</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-black/60 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Autenticação Segura Firebase</span>
          </div>
          <span>PKXD Central • 2026</span>
        </div>
      </motion.div>
    </div>
  );
}
