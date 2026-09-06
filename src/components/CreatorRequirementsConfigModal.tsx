import React, { useState } from 'react';
import { 
  X, 
  Settings2, 
  RotateCcw, 
  Save, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { CreatorRequirement, MetricType, CreatorFormat, ProgramTier } from '../types/creator';
import { resetToDefaultRequirements } from '../data/creatorRequirements';

interface CreatorRequirementsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirements: CreatorRequirement[];
  onSaveRequirements: (newReqs: CreatorRequirement[]) => void;
  soundEnabled?: boolean;
}

export default function CreatorRequirementsConfigModal({
  isOpen,
  onClose,
  requirements,
  onSaveRequirements,
}: CreatorRequirementsConfigModalProps) {
  const [draftReqs, setDraftReqs] = useState<CreatorRequirement[]>(() => JSON.parse(JSON.stringify(requirements)));
  const [selectedId, setSelectedId] = useState<string>(requirements[0]?.id || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSelected = draftReqs.find(r => r.id === selectedId) || draftReqs[0];

  const handleFieldChange = (field: keyof CreatorRequirement, value: any) => {
    setDraftReqs(prev => prev.map(r => {
      if (r.id === selectedId) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const handleSave = () => {
    onSaveRequirements(draftReqs);
    setSuccessMsg('Requisitos atualizados com sucesso!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    if (window.confirm('Deseja restaurar todos os requisitos para os padrões oficiais da Afterverse?')) {
      const defaults = resetToDefaultRequirements();
      setDraftReqs(JSON.parse(JSON.stringify(defaults)));
      onSaveRequirements(defaults);
      setSuccessMsg('Restaurado para os requisitos oficiais!');
      setTimeout(() => setSuccessMsg(null), 1500);
    }
  };

  const handleAddNew = () => {
    const newId = `custom_req_${Date.now()}`;
    const newReq: CreatorRequirement = {
      id: newId,
      name: 'Novo Requisito',
      metricType: 'subscribers',
      category: 'stardust',
      targetValue: 100,
      unit: 'unidades',
      isRequired: true,
      description: 'Descrição do requisito oficial do programa.',
      officialSourceUrl: 'https://playpkxd.com',
      lastUpdated: new Date().toISOString().split('T')[0],
      autoVerifiable: true,
      applicableFormat: 'both'
    };
    setDraftReqs(prev => [...prev, newReq]);
    setSelectedId(newId);
  };

  const handleDelete = (idToDelete: string) => {
    if (draftReqs.length <= 1) {
      alert('É necessário ter ao menos um requisito configurado no sistema.');
      return;
    }
    const updated = draftReqs.filter(r => r.id !== idToDelete);
    setDraftReqs(updated);
    if (selectedId === idToDelete) {
      setSelectedId(updated[0].id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="creator-requirements-modal"
        className="bg-zinc-950 border border-purple-500/40 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                Configuração de Requisitos
              </h2>
              <p className="text-xs text-zinc-400">
                Gerencie metas, valores mínimos e critérios do Programa Creator PK XD
              </p>
            </div>
          </div>
          <button
            id="close-config-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (Split Column) */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: List of Requirements */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-zinc-800 p-3 overflow-y-auto max-h-[35vh] md:max-h-full space-y-1.5 bg-zinc-950/50">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <span>Critérios ({draftReqs.length})</span>
              <button
                id="add-new-req-btn"
                onClick={handleAddNew}
                className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {draftReqs.map(req => {
              const isSelected = req.id === currentSelected?.id;
              return (
                <button
                  key={req.id}
                  onClick={() => setSelectedId(req.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all cursor-pointer flex flex-col gap-0.5 border ${
                    isSelected 
                      ? 'bg-purple-900/40 border-purple-500/70 text-white shadow-sm' 
                      : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold truncate">{req.name}</span>
                    {req.isRequired && (
                      <span className="text-[9px] uppercase px-1.5 py-0.5 bg-pink-500/20 border border-pink-500/30 text-pink-400 rounded-full font-black">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Meta: {req.targetValue.toLocaleString('pt-BR')} {req.unit}</span>
                    <span className="text-[10px] text-zinc-500 capitalize">{req.category}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Requirement Editor Form */}
          {currentSelected ? (
            <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto space-y-4 bg-zinc-900/20">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                    Editando Critério
                  </span>
                  <h3 className="text-base font-bold text-white">{currentSelected.name}</h3>
                </div>
                <button
                  onClick={() => handleDelete(currentSelected.id)}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Remover este requisito"
                >
                  <Trash2 className="w-4 h-4" /> Excluir
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome do Requisito */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Nome do Requisito
                  </label>
                  <input
                    type="text"
                    value={currentSelected.name}
                    onChange={e => handleFieldChange('name', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Valor Necessário (Meta) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Valor Mínimo Necessário
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentSelected.targetValue}
                    onChange={e => handleFieldChange('targetValue', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Unidade da Métrica */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Unidade de Medida
                  </label>
                  <input
                    type="text"
                    value={currentSelected.unit}
                    onChange={e => handleFieldChange('unit', e.target.value)}
                    placeholder="ex: inscritos, vídeos, visualizações"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Tipo de Métrica */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Tipo de Métrica
                  </label>
                  <select
                    value={currentSelected.metricType}
                    onChange={e => handleFieldChange('metricType', e.target.value as MetricType)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="subscribers">Inscritos (subscribers)</option>
                    <option value="views_3months">Visualizações em 3 meses (views_3months)</option>
                    <option value="pkxd_long_videos">Vídeos Longos (+5 min) (pkxd_long_videos)</option>
                    <option value="pkxd_shorts">Shorts/TikToks (pkxd_shorts)</option>
                    <option value="monthly_frequency">Frequência Mensal (monthly_frequency)</option>
                    <option value="avg_views">Média de Views por Vídeo (avg_views)</option>
                    <option value="community_compliance">Conformidade com Diretrizes (community_compliance)</option>
                    <option value="program_terms">Aceite dos Termos (program_terms)</option>
                  </select>
                </div>

                {/* Categoria / Tier */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Classificação / Tier
                  </label>
                  <select
                    value={currentSelected.category}
                    onChange={e => handleFieldChange('category', e.target.value as ProgramTier)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="admission">Critério Geral de Admissão</option>
                    <option value="stardust">Tier Stardust (Inicial)</option>
                    <option value="rising_star">Tier Rising Star</option>
                  </select>
                </div>

                {/* Formato Aplicável */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Formato de Conteúdo Aplicável
                  </label>
                  <select
                    value={currentSelected.applicableFormat || 'both'}
                    onChange={e => handleFieldChange('applicableFormat', e.target.value as CreatorFormat)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="both">Geral (Todos os Formatos)</option>
                    <option value="long_video">Apenas Criadores de Vídeo Longo</option>
                    <option value="shorts">Apenas Criadores de Shorts</option>
                  </select>
                </div>

                {/* Se é Obrigatório */}
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="is-required-check"
                    checked={currentSelected.isRequired}
                    onChange={e => handleFieldChange('isRequired', e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-zinc-950 bg-zinc-800 border-zinc-600 cursor-pointer"
                  />
                  <label htmlFor="is-required-check" className="text-xs font-bold text-zinc-300 cursor-pointer">
                    Requisito Obrigatório para Aprovação
                  </label>
                </div>

                {/* Verificação Automática */}
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="is-auto-verifiable-check"
                    checked={currentSelected.autoVerifiable}
                    onChange={e => handleFieldChange('autoVerifiable', e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-zinc-950 bg-zinc-800 border-zinc-600 cursor-pointer"
                  />
                  <label htmlFor="is-auto-verifiable-check" className="text-xs font-bold text-zinc-300 cursor-pointer">
                    Verificável via dados públicos do YouTube
                  </label>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Descrição Explicativa
                </label>
                <textarea
                  rows={2}
                  value={currentSelected.description}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* URL da Fonte Oficial & Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    URL da Fonte Oficial
                  </label>
                  <input
                    type="text"
                    value={currentSelected.officialSourceUrl}
                    onChange={e => handleFieldChange('officialSourceUrl', e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Data da Última Atualização Oficial
                  </label>
                  <input
                    type="date"
                    value={currentSelected.lastUpdated}
                    onChange={e => handleFieldChange('lastUpdated', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <button
              id="reset-requirements-btn"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrões Oficiais
            </button>
            {successMsg && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> {successMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="save-requirements-btn"
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" /> Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
