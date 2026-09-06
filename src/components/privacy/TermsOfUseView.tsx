import React from 'react';
import { 
  FileText, 
  ArrowLeft, 
  ShieldAlert, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Users, 
  MessageSquare,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface TermsOfUseViewProps {
  onBack: () => void;
  triggerAudio?: (sound: 'tap') => void;
}

export default function TermsOfUseView({ onBack, triggerAudio }: TermsOfUseViewProps) {
  const handleBack = () => {
    if (triggerAudio) triggerAudio('tap');
    onBack();
  };

  return (
    <div id="terms-of-use-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-white">
      {/* Header Back Button */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-zinc-800">
        <button
          onClick={handleBack}
          className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Portal</span>
        </button>

        <span className="text-[11px] text-zinc-500 font-mono">
          Versão 1.0 • [DATA DE ATUALIZAÇÃO]
        </span>
      </div>

      {/* Main Title */}
      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Regras e Condições</span>
        </div>
        <h1 className="font-sans font-black text-2xl sm:text-3xl text-white tracking-tight">
          Termos de Uso
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Leia atentamente os termos e condições para a utilização do portal PKXD Central.
        </p>
      </div>

      {/* Structured Sections */}
      <div className="space-y-8 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
        
        {/* 1. Aceitação dos Termos */}
        <section className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
          <h2 className="font-bold text-base text-white">
            1. Aceitação e Objeto do Site
          </h2>
          <p>
            Ao acessar e utilizar o portal <strong>PKXD Central</strong>, você declara ter lido, compreendido e concordado com estes Termos de Uso e com nossa Política de Privacidade. Caso discorde de qualquer disposição, solicitamos que não continue a utilizar o site.
          </p>
          <p>
            O PKXD Central é um portal gratuito criado de forma independente por fãs do jogo PK XD, com o propósito de fornecer notícias da comunidade, contadores regressivos de atualizações, guias de eventos, rankings de fãs e ferramentas de análise de requisitos públicos para criadores de conteúdo.
          </p>
        </section>

        {/* 2. Responsabilidades do Usuário */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white">
            2. Responsabilidades do Usuário
          </h2>
          <p>Ao navegar ou interagir no portal, o usuário compromete-se a:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-300">
            <li>Fornecer informações verdadeiras e legítimas em formulários e cadastros opcionais;</li>
            <li>Manter a segurança e confidencialidade de suas credenciais de acesso, quando houver criação de conta;</li>
            <li>Respeitar os demais membros da comunidade, mantendo um ambiente saudável, amigável e inclusivo;</li>
            <li>Não praticar atos que possam comprometer o funcionamento técnico ou a segurança do site;</li>
            <li>Utilizar o portal em conformidade com as leis aplicáveis e as diretrizes do jogo PK XD.</li>
          </ul>
        </section>

        {/* 3. Responsabilidades da Plataforma */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white">
            3. Responsabilidades da Plataforma
          </h2>
          <p>
            O portal empenha seus melhores esforços para manter suas funcionalidades ativas, seguras e atualizadas. Entretanto, por se tratar de um serviço gratuito e mantido por comunidade:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-400">
            <li>Não garantimos que o acesso ao site será ininterrupto, isento de falhas temporárias ou imune a indisponibilidades técnicas de servidores;</li>
            <li>Reservamo-nos o direito de aprimorar, modificar ou descontinuar temporariamente funcionalidades sem aviso prévio.</li>
          </ul>
        </section>

        {/* 4. Conteúdo Enviado pelos Usuários */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white">
            4. Conteúdo Enviado pelos Usuários (Comentários, Teorias e Artes)
          </h2>
          <p>
            Nas áreas interativas em que é permitida a postagem de comentários, teorias, enquetes ou artes de fãs:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-300">
            <li>O usuário é o único responsável pelo conteúdo que publica;</li>
            <li>Ao publicar conteúdo no portal, o usuário concede licença não exclusiva, gratuita e de âmbito mundial para exibição desse conteúdo no site;</li>
            <li>A moderação do portal reserva-se o direito de remover qualquer conteúdo que viole a lei, direitos autorais de terceiros ou as regras de conduta estabelecidas.</li>
          </ul>
        </section>

        {/* 5. Propriedade Intelectual e Isenção de Vínculo Oficial */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white">
            5. Propriedade Intelectual e Relação com a Marca PK XD
          </h2>
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200/90 space-y-2">
            <strong className="block font-bold text-white text-xs uppercase tracking-wider">
              Aviso Importante sobre Direitos Autorais
            </strong>
            <p className="text-xs leading-relaxed">
              <strong>PK XD</strong> é uma marca registrada de seus legítimos titulares (incluindo a Afterverse / PlayKids). O portal PKXD Central é um portal não oficial criado por fãs e não possui vínculo formal, afiliação, patrocínio ou endosso por parte da desenvolvedora oficial do jogo. Todos os logotipos, ilustrações originais e elementos de marca do jogo pertencem a seus respectivos detentores de direitos.
            </p>
          </div>
          <p>
            O código-fonte, layout visual e elementos gráficos próprios desenvolvidos para o portal PKXD Central são protegidos pela legislação de propriedade intelectual e direitos autorais.
          </p>
        </section>

        {/* 6. Comportamento Proibido */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white">
            6. Comportamento Proibido
          </h2>
          <p>É estritamente vedado ao usuário:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-300">
            <li>Publicar mensagens ofensivas, discursos de ódio, ameaças, assédio ou conteúdo difamatório;</li>
            <li>Veicular spam, links maliciosos, golpes ou propagandas não autorizadas;</li>
            <li>Tentar violar mecanismos de segurança, autenticação ou explorar vulnerabilidades técnicas;</li>
            <li>Utilizar bots, scrapers automatizados abusivos ou scripts para sobrecarregar a infraestrutura;</li>
            <li>Passar-se por administradores do site, criadores oficiais ou representantes da desenvolvedora do jogo.</li>
          </ul>
        </section>

        {/* 7. Suspensão ou Encerramento */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white">
            7. Suspensão ou Encerramento de Contas e Acessos
          </h2>
          <p>
            O PKXD Central poderá suspender ou desativar o acesso de qualquer usuário que descumprir as regras aqui previstas, violar leis aplicáveis ou praticar atos danosos à comunidade, mediante critério fundamentado e proporcional.
          </p>
        </section>

        {/* 8. Limitação de Responsabilidade */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white">
            8. Limitação de Responsabilidade
          </h2>
          <p>
            Na extensão máxima permitida pela lei aplicável, o portal não se responsabiliza por danos indiretos, lucros cessantes ou prejuízos decorrentes do uso ou da impossibilidade de uso do site, de condutas de terceiros na plataforma ou de links externos indicados pela comunidade.
          </p>
        </section>

        {/* 9. Alterações dos Termos */}
        <section className="space-y-3">
          <h2 className="font-bold text-base text-white">
            9. Alterações destes Termos
          </h2>
          <p>
            Estes Termos de Uso podem ser revisados periodicamente para refletir mudanças legislativas ou melhorias no portal. Sempre que houver alterações significativas, a data de atualização no topo desta página será revisada. O uso continuado após as atualizações presume a ciência e concordância dos novos termos.
          </p>
        </section>

        {/* 10. Contato */}
        <section className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
          <h2 className="font-bold text-base text-white">
            10. Contato e Esclarecimentos
          </h2>
          <p>
            Em caso de dúvidas, reclamações ou sugestões relativas aos Termos de Uso, entre em contato com os administradores através do e-mail:
          </p>
          <div className="bg-black/50 p-4 rounded-xl border border-zinc-800 space-y-1 font-mono text-xs">
            <div className="text-zinc-400">Responsável: <span className="text-white font-bold">[NOME DO RESPONSÁVEL]</span></div>
            <div className="text-zinc-400">Canal de Atendimento: <span className="text-indigo-300 font-bold">[E-MAIL DE CONTATO]</span></div>
          </div>
        </section>

      </div>
    </div>
  );
}
