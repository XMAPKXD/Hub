import React from 'react';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  Cookie, 
  Database, 
  FileText, 
  Mail, 
  ExternalLink,
  Users,
  Eye,
  Sliders,
  Trash2
} from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack: () => void;
  onOpenCookiePreferences: () => void;
  onOpenDataRequest: () => void;
  triggerAudio?: (sound: 'tap') => void;
}

export default function PrivacyPolicyView({
  onBack,
  onOpenCookiePreferences,
  onOpenDataRequest,
  triggerAudio,
}: PrivacyPolicyViewProps) {
  const handleBack = () => {
    if (triggerAudio) triggerAudio('tap');
    onBack();
  };

  return (
    <div id="privacy-policy-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-white">
      {/* Header & Back Action */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-zinc-800">
        <button
          onClick={handleBack}
          className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Portal</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              onOpenCookiePreferences();
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Gerenciar Cookies</span>
          </button>

          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              onOpenDataRequest();
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Seus Direitos</span>
          </button>
        </div>
      </div>

      {/* Main Title */}
      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Transparência e LGPD</span>
        </div>
        <h1 className="font-sans font-black text-2xl sm:text-3xl text-white tracking-tight">
          Política de Privacidade
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Última atualização: <strong className="text-zinc-300">[DATA DE ATUALIZAÇÃO]</strong> • Versão 1.0
        </p>
      </div>

      {/* Structured Content Sections */}
      <div className="space-y-8 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
        
        {/* Intro */}
        <section className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <span>1. Informações Gerais e Compromisso com a Privacidade</span>
          </h2>
          <p>
            Esta Política de Privacidade descreve de forma transparente e acessível como o <strong>PKXD Central</strong> lida com as informações geradas, armazenadas ou compartilhadas quando você utiliza nosso portal.
          </p>
          <p>
            O portal é um projeto independente mantido por fãs, destinado à comunidade de jogadores de PK XD. Respeitamos a privacidade de todos os visitantes e usuários e cumprimos a legislação aplicável de proteção de dados pessoais, em especial a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
          </p>
        </section>

        {/* 2. Dados Coletados */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <span>2. Quais Dados Podem Ser Coletados</span>
          </h2>
          <p>
            Coletamos apenas as informações estritamente necessárias para as funcionalidades disponibilizadas no portal:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-300">
            <li>
              <strong className="text-white">Dados de Identificação Básica de Conta (Opcional):</strong> Nome de exibição, endereço de e-mail e foto de perfil quando você opta por autenticar-se (via Firebase Auth / Login Google ou E-mail e Senha).
            </li>
            <li>
              <strong className="text-white">Tag e Identificador PK XD (Opcional):</strong> Nickname e número da tag (ex: NICK#123) informados voluntariamente para identificação em enquetes, eventos da comunidade ou passporte de fã.
            </li>
            <li>
              <strong className="text-white">Interações e Conteúdo Gerado pelo Usuário:</strong> Votos em enquetes, comentários enviados na comunidade, sugestões de teorias, artes de fãs e curtidas.
            </li>
            <li>
              <strong className="text-white">Dados Públicos de Canal do YouTube (Módulo Creator):</strong> Informações estritamente públicas do canal (nome, foto, número de inscritos, contagem de visualizações públicas e lista de vídeos públicos) obtidas mediante autorização explícita via OAuth para análise de elegibilidade de requisitos Creator.
            </li>
            <li>
              <strong className="text-white">Dados Técnicos e de Navegação:</strong> Informações de dispositivo, resolução de tela, navegador, preferências salvas (áudio ligado/desligado) e registros de consentimento de cookies.
            </li>
          </ul>
        </section>

        {/* 3. Finalidade */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <span>3. Para Que os Dados São Utilizados</span>
          </h2>
          <p>Os dados tratados têm as seguintes finalidades legítimas:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <strong className="text-white block text-xs font-bold">Operação do Portal</strong>
              <p className="text-xs text-zinc-400">Permitir a navegação, login, emissão de passaporte de fã e carregamento de notícias e eventos.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <strong className="text-white block text-xs font-bold">Análise de Requisitos Creator</strong>
              <p className="text-xs text-zinc-400">Calcular o progresso de canais do YouTube em relação aos requisitos públicos do programa de criadores.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <strong className="text-white block text-xs font-bold">Interação Social e Comunidade</strong>
              <p className="text-xs text-zinc-400">Exibir comentários, rankings de fãs, missões concluídas e artes submetidas pelos membros.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <strong className="text-white block text-xs font-bold">Segurança e Integridade</strong>
              <p className="text-xs text-zinc-400">Prevenir fraudes, spams, tentativas de invasão e garantir conformidade com os Termos de Uso.</p>
            </div>
          </div>
        </section>

        {/* 4. Dados Necessários */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <span>4. Dados Necessários para Determinadas Funcionalidades</span>
          </h2>
          <p>
            A navegação geral no portal (leitura de notícias, contagens regressivas, spoilers públicos) <strong>não exige</strong> nenhum cadastro ou dado pessoal. O fornecimento de dados só é requerido quando você decide utilizar funcionalidades específicas:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
            <li>Para comentar ou votar em missões: requer identificação de sessão ou apelido de fã.</li>
            <li>Para vincular tag in-game: requer informar voluntariamente seu Nick e número (#) no jogo.</li>
            <li>Para análise automática do canal: requer consentimento de leitura da API do YouTube.</li>
          </ul>
        </section>

        {/* 5. Armazenamento e Segurança */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <span>5. Como os Dados São Armazenados e Protegidos</span>
          </h2>
          <p>
            Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra acessos não autorizados, perda, destruição ou alteração:
          </p>
          <div className="space-y-2 text-zinc-300">
            <p>
              • <strong className="text-white">Armazenamento Local (Dispositivo do Usuário):</strong> Preferências de tema, som, tag PK XD e progresso de missões offline são salvas diretamente no <em>localStorage</em> do seu navegador, mantendo o controle sob seu próprio dispositivo.
            </p>
            <p>
              • <strong className="text-white">Nuvem e Banco de Dados Seguro:</strong> Quando autenticado, credenciais e registros de comentários são protegidos pela infraestrutura do Firebase (Google Cloud), com tráfego 100% criptografado sob protocolo HTTPS/TLS e regras estritas de segurança em banco de dados.
            </p>
          </div>
        </section>

        {/* 6. Compartilhamento e Terceiros */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <span>6. Quando os Dados Podem Ser Compartilhados e Serviços de Terceiros</span>
          </h2>
          <p>
            <strong>Nós nunca vendemos, alugamos ou comercializamos dados pessoais de usuários.</strong>
          </p>
          <p>
            O compartilhamento de dados ocorre unicamente quando estritamente necessário para o funcionamento das ferramentas integradas ao portal:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-400">
            <li>
              <strong className="text-zinc-200">Google / YouTube API Services:</strong> Para autenticação segura e consulta de métricas públicas de canais autorizados. O uso de dados recebidos das APIs do Google respeita rigorosamente a <em>Google API Services User Data Policy</em>.
            </li>
            <li>
              <strong className="text-zinc-200">Google Firebase:</strong> Provedor de infraestrutura para gerenciamento seguro de sessões autenticadas e banco de dados em tempo real.
            </li>
            <li>
              <strong className="text-zinc-200">Cumprimento de Dever Legal:</strong> Em situações onde houver determinação judicial expressa ou requisição formal de autoridades competentes.
            </li>
          </ul>
        </section>

        {/* 7. Cookies */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <span>7. Cookies e Tecnologias Semelhantes</span>
          </h2>
          <p>
            Utilizamos cookies e armazenamento local para assegurar o funcionamento do site e respeitar suas preferências. Classificamos essas tecnologias em quatro categorias:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <strong className="text-emerald-400 block font-bold mb-1">Cookies Necessários (Sempre Ativos)</strong>
              <span>Garantem segurança, autenticação de sessão e integridade técnica do portal.</span>
            </div>
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <strong className="text-indigo-400 block font-bold mb-1">Cookies de Preferência (Opcionais)</strong>
              <span>Lembram suas configurações personalizadas (como áudio, tema e idioma).</span>
            </div>
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <strong className="text-cyan-400 block font-bold mb-1">Cookies de Análise (Opcionais)</strong>
              <span>Permitem avaliar métricas agregadas de audiência e navegação sem identificação direta.</span>
            </div>
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
              <strong className="text-pink-400 block font-bold mb-1">Cookies de Marketing (Opcionais)</strong>
              <span>Aplicáveis somente em eventuais integrações publicitárias ou promocionais.</span>
            </div>
          </div>
          <p className="pt-2">
            Você pode alterar suas preferências de cookies a qualquer momento utilizando o botão abaixo:
          </p>
          <button
            onClick={() => {
              if (triggerAudio) triggerAudio('tap');
              onOpenCookiePreferences();
            }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-purple-300 font-bold text-xs border border-zinc-700 cursor-pointer transition-colors inline-flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Abrir Central de Preferências de Cookies</span>
          </button>
        </section>

        {/* 8. Retenção */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <span>8. Período de Retenção dos Dados</span>
          </h2>
          <p>
            Os dados pessoais tratados são mantidos apenas pelo tempo necessário para cumprir as finalidades para as quais foram coletados ou para cumprimento de obrigações legais e regulatórias. Dados locais mantidos no seu navegador podem ser eliminados por você a qualquer momento limpando o cache e armazenamento do seu navegador.
          </p>
        </section>

        {/* 9. Direitos do Usuário */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <span>9. Seus Direitos como Titular (LGPD)</span>
          </h2>
          <p>
            Nos termos do Art. 18 da LGPD, você possui os seguintes direitos em relação aos seus dados pessoais:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-300">
            <li>Confirmação da existência de tratamento e acesso aos dados;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
            <li>Eliminação dos dados pessoais tratados com base no seu consentimento, quando aplicável;</li>
            <li>Informação sobre entidades públicas e privadas com as quais houve compartilhamento;</li>
            <li>Revogação do consentimento concedido anteriormente.</li>
          </ul>
          <div className="pt-2">
            <button
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                onOpenDataRequest();
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Exercer Meus Direitos de Privacidade</span>
            </button>
          </div>
        </section>

        {/* 10. Contato e Encarregado */}
        <section className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <span>10. Contato e Encarregado de Proteção de Dados (DPO)</span>
          </h2>
          <p>
            Caso você tenha qualquer dúvida sobre esta Política de Privacidade ou deseje fazer uma solicitação formal sobre seus dados, entre em contato diretamente com o responsável pelo site:
          </p>
          <div className="bg-black/50 p-4 rounded-xl border border-zinc-800 space-y-2 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-zinc-300">
              <span className="text-zinc-500 font-sans">Responsável pelo Portal:</span>
              <span className="text-white font-bold">[NOME DO RESPONSÁVEL]</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-zinc-300">
              <span className="text-zinc-500 font-sans">E-mail para Questões de Privacidade:</span>
              <span className="text-purple-300 font-bold">[E-MAIL DE PRIVACIDADE]</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
