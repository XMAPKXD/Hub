import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  FileText, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Mail, 
  Send, 
  Copy, 
  Check, 
  HelpCircle,
  Database
} from 'lucide-react';
import { DataRequestType } from '../../types/privacy';

interface UserDataRequestModalProps {
  isOpen: boolean;
  initialType?: DataRequestType;
  onClose: () => void;
  triggerAudio?: (sound: 'tap' | 'success') => void;
}

export default function UserDataRequestModal({
  isOpen,
  initialType = 'access',
  onClose,
  triggerAudio,
}: UserDataRequestModalProps) {
  const [requestType, setRequestType] = useState<DataRequestType>(initialType);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [details, setDetails] = useState('');
  const [submittedProtocol, setSubmittedProtocol] = useState<string | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState(false);
  const [localDataExported, setLocalDataExported] = useState(false);
  const [localDataCleared, setLocalDataCleared] = useState(false);

  // Sync initial type when opening
  React.useEffect(() => {
    if (isOpen) {
      setRequestType(initialType);
      setSubmittedProtocol(null);
      setCopiedProtocol(false);
      setLocalDataExported(false);
      setLocalDataCleared(false);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) return;

    if (triggerAudio) triggerAudio('success');

    // Generate random formal protocol
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const protocol = `LGPD-${datePart}-${randomHex}`;

    // Store in local history
    try {
      const historyKey = 'pkxd_user_data_requests_log';
      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
      existing.unshift({
        protocol,
        type: requestType,
        fullName,
        email,
        details,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 20)));
    } catch (err) {
      console.warn('Erro ao registrar protocolo:', err);
    }

    setSubmittedProtocol(protocol);
  };

  // Export any browser local storage related to PKXD Central
  const handleExportLocalData = () => {
    try {
      const localData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('pkxd_') || key.includes('cookie') || key.includes('auth'))) {
          try {
            localData[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            localData[key] = localStorage.getItem(key);
          }
        }
      }

      const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-pkxd-central-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (triggerAudio) triggerAudio('success');
      setLocalDataExported(true);
      setTimeout(() => setLocalDataExported(false), 4000);
    } catch (e) {
      console.error('Falha ao exportar dados:', e);
    }
  };

  // Clear local storage data
  const handleClearLocalData = () => {
    if (confirm('Tem certeza de que deseja limpar todos os dados salvos localmente neste navegador (tags, progresso offline e preferências)?')) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('pkxd_') || key.includes('cookie'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        if (triggerAudio) triggerAudio('tap');
        setLocalDataCleared(true);
        setTimeout(() => setLocalDataCleared(false), 4000);
      } catch (e) {
        console.error('Falha ao limpar dados locais:', e);
      }
    }
  };

  const handleCopyProtocol = () => {
    if (!submittedProtocol) return;
    navigator.clipboard.writeText(submittedProtocol);
    setCopiedProtocol(true);
    setTimeout(() => setCopiedProtocol(false), 2500);
  };

  return (
    <AnimatePresence>
      <div 
        id="user-data-request-modal"
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      >
        <div 
          className="fixed inset-0" 
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            onClose();
          }} 
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-zinc-950 border border-purple-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-sans font-black text-base sm:text-lg text-white">
                  Seus Direitos e Solicitação de Dados
                </h2>
                <p className="text-xs text-zinc-400">
                  Transparência, controle e cumprimento à legislação de proteção de dados (LGPD)
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-5 sm:px-6 py-5 overflow-y-auto space-y-5 text-xs font-sans">
            
            {submittedProtocol ? (
              /* Success confirmation state */
              <div className="space-y-4 py-3">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-sans font-black text-base text-white">
                    Solicitação Registrada com Sucesso!
                  </h3>
                  <p className="text-xs text-emerald-200/90 max-w-md mx-auto leading-relaxed">
                    Sua solicitação relacionada aos seus dados pessoais foi formalizada. Guarde o número de protocolo abaixo:
                  </p>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <span className="font-mono font-bold text-sm bg-black/60 px-3 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-300 tracking-wider">
                      {submittedProtocol}
                    </span>
                    <button
                      onClick={handleCopyProtocol}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition-colors"
                      title="Copiar Protocolo"
                    >
                      {copiedProtocol ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-zinc-300 leading-relaxed text-xs">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>Próximas Etapas e Contato</span>
                  </h4>
                  <p>
                    Para acelerar ou complementar seu pedido com documentos comprobatórios de identidade, você também pode enviar um e-mail diretamente para nosso canal de privacidade:
                  </p>
                  <div className="p-2.5 bg-black/40 rounded-xl border border-zinc-800 font-mono text-[11px] text-purple-300 flex items-center justify-between">
                    <span>[E-MAIL DE PRIVACIDADE]</span>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Encarregado / DPO</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 pt-1">
                    Responderemos sua solicitação dentro do prazo estabelecido pela legislação aplicável após validação de titularidade.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setSubmittedProtocol(null);
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-lg active:scale-95 transition-all"
                  >
                    Concluir e Fechar
                  </button>
                </div>
              </div>
            ) : (
              /* Request Form and Self-Service Controls */
              <>
                {/* Rights explanation notice */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 leading-relaxed text-zinc-300">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Seus Direitos como Titular de Dados</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs">
                    Em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), você pode a qualquer momento solicitar a confirmação da existência de tratamento, o acesso aos dados, a correção de dados incompletos ou inexatos, a anonimização, bloqueio ou eliminação de dados desnecessários, e a revogação de consentimentos concedidos.
                  </p>
                </div>

                {/* Instant Self-Service Local Tools (Browser localStorage) */}
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-400" />
                      <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                        Ações Imediatas no seu Navegador
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-full border border-purple-500/30">
                      Autoatendimento
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    O portal armazena dados de preferências, tags de fã e histórico localmente no seu dispositivo. Você pode baixá-los ou limpá-los instantaneamente:
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExportLocalData}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Exportar Dados Locais (.json)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearLocalData}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Limpar Dados Locais deste Navegador</span>
                    </button>
                  </div>

                  {localDataExported && (
                    <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Arquivo JSON baixado com sucesso!</span>
                    </p>
                  )}

                  {localDataCleared && (
                    <p className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Dados locais removidos deste dispositivo!</span>
                    </p>
                  )}
                </div>

                {/* Form to submit formal requests */}
                <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-black text-purple-300 uppercase tracking-wider mb-1.5">
                      Tipo de Solicitação *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRequestType('access');
                          if (triggerAudio) triggerAudio('tap');
                        }}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          requestType === 'access'
                            ? 'bg-purple-900/40 border-purple-500 text-white shadow'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <FileText className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-xs">Solicitar Meus Dados</div>
                          <div className="text-[10px] text-zinc-400">Acesso a relatórios e informações cadastrais</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRequestType('deletion');
                          if (triggerAudio) triggerAudio('tap');
                        }}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          requestType === 'deletion'
                            ? 'bg-rose-950/40 border-rose-500 text-white shadow'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Trash2 className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-xs">Solicitar Exclusão</div>
                          <div className="text-[10px] text-zinc-400">Eliminação de dados ou conta quando aplicável</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRequestType('rectification');
                          if (triggerAudio) triggerAudio('tap');
                        }}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          requestType === 'rectification'
                            ? 'bg-indigo-900/40 border-indigo-500 text-white shadow'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <HelpCircle className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-xs">Correção de Informações</div>
                          <div className="text-[10px] text-zinc-400">Atualização de dados cadastrados incompletos</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRequestType('revocation');
                          if (triggerAudio) triggerAudio('tap');
                        }}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          requestType === 'revocation'
                            ? 'bg-amber-900/40 border-amber-500 text-white shadow'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-xs">Revogar Consentimento</div>
                          <div className="text-[10px] text-zinc-400">Retirada de autorizações concedidas</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                        Seu Nome ou Nickname *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Gabriel ou seu Nick"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                        E-mail de Contato *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="seuemail@exemplo.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Detalhes adicionais da solicitação (Opcional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Descreva informações complementares para identificarmos os registros pertinentes (ex: tag PK XD vinculada, comentários enviados, etc.)."
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-[10px] text-zinc-500">
                      Canal oficial do Encarregado: [E-MAIL DE PRIVACIDADE]
                    </span>

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer active:scale-95 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Registrar Solicitação</span>
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
