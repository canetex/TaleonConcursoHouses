import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePhase } from '../hooks/usePhase'
import { TaleonSanLink, TheCrustyLink } from '../lib/links'

type RulesTabId =
  | 'cronograma'
  | 'mandatorias'
  | 'inscricao'
  | 'pontuacao'
  | 'premiacao'
  | 'validacao'

const RULE_TABS: Array<{ id: RulesTabId; icon: string; label: string }> = [
  { id: 'cronograma', icon: '📅', label: 'Cronograma' },
  { id: 'mandatorias', icon: '📜', label: 'Mandatórias' },
  { id: 'inscricao', icon: '📝', label: 'Inscrição' },
  { id: 'pontuacao', icon: '📊', label: 'Pontuação' },
  { id: 'premiacao', icon: '💰', label: 'Premiação' },
  { id: 'validacao', icon: '🔐', label: 'Validação' },
]

function TabPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      className="rounded-xl bg-tibia-panel border border-amber-900/30 p-5 sm:p-6"
      role="tabpanel"
    >
      <h3 className="text-lg font-semibold text-tibia-gold mb-4">{title}</h3>
      {children}
    </section>
  )
}

export function RulesPage() {
  const { dates } = usePhase()
  const [active_tab, set_active_tab] = useState<RulesTabId>('cronograma')

  const format_date = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })

  const format_datetime_utc = (iso: string) =>
    `${new Date(iso).toISOString().slice(0, 16).replace('T', ' ')} UTC`

  const tab_panels: Record<RulesTabId, ReactNode> = {
    cronograma: (
      <TabPanel title="Cronograma Geral">
        <p className="text-xs text-amber-200/50 mb-4">
          Todas as datas abaixo são interpretadas pelo servidor em{' '}
          <strong className="text-amber-200/70">UTC</strong>.
        </p>
        <ul className="space-y-3 text-sm text-amber-200/80">
          <li className="flex gap-2">
            <span className="text-tibia-gold shrink-0">•</span>
            <span>
              <strong className="text-amber-100">Período de Inscrições:</strong> 15 dias
              {dates && (
                <>
                  {' '}
                  ({format_datetime_utc(dates.registration_start)} —{' '}
                  {format_datetime_utc(dates.registration_end)})
                </>
              )}
              . Abertura e fecho automáticos no portal.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-tibia-gold shrink-0">•</span>
            <span>
              <strong className="text-amber-100">Período de Validação:</strong> 2 dias
              {dates && <> (até {format_date(dates.validation_end)})</>}. Pausa entre o fim
              das inscrições e o início da votação para validação do pagamento das taxas.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-tibia-gold shrink-0">•</span>
            <span>
              <strong className="text-amber-100">Período de Votação:</strong> 15 dias
              {dates && <> (até {format_date(dates.voting_end)})</>}. Inicia{' '}
              <em>exclusivamente</em> após os 2 dias de validação.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-tibia-gold shrink-0">•</span>
            <span>
              <strong className="text-amber-100">Divulgação dos Vencedores:</strong> em tempo
              real através do{' '}
              <Link to="/ranking" className="text-tibia-gold hover:underline">
                ranking gamificado
              </Link>{' '}
              do portal.
            </span>
          </li>
        </ul>
      </TabPanel>
    ),
    mandatorias: (
      <TabPanel title="Regras Mandatórias">
        <ol className="space-y-4 text-sm text-amber-200/80 list-decimal list-inside marker:text-tibia-gold marker:font-semibold">
          <li>
            <strong className="text-amber-100">Acesso Público Total (Aleta Sio):</strong> A casa
            inscrita deve estar obrigatoriamente aberta ao público durante todo o período de
            votação. O proprietário deve lançar a magia{' '}
            <code className="px-1.5 py-0.5 rounded bg-tibia-dark text-amber-200 text-xs">
              aleta sio
            </code>{' '}
            e adicionar o caractere asterisco (
            <code className="px-1.5 py-0.5 rounded bg-tibia-dark text-amber-200 text-xs">*</code>)
            para permitir que qualquer jogador entre e vistorie a decoração. Casas fechadas serão
            desclassificadas.
          </li>
          <li>
            <strong className="text-amber-100">Avaliação de Andar Único:</strong> Se a casa
            possuir múltiplos andares, apenas um andar será avaliado. Deve especificar
            estritamente qual andar no momento da inscrição através do portal.
          </li>
          <li>
            <strong className="text-amber-100">Inscrição Única por Personagem:</strong> Cada
            personagem do servidor apenas poderá inscrever uma única casa no concurso.
          </li>
          <li>
            <strong className="text-amber-100">Taxa de Inscrição:</strong> Para validar a
            participação, é cobrada uma taxa de{' '}
            <strong className="text-tibia-gold">10 TC (Tibia Coins)</strong>, transferida para o
            organizador (<TheCrustyLink className="text-amber-100 font-semibold" />). A inscrição
            ficará pendente até confirmação do recebimento durante os 2 dias de validação. Todo o
            montante arrecadado será adicionado à premiação final!
          </li>
        </ol>
      </TabPanel>
    ),
    inscricao: (
      <TabPanel title="Como Inscrever a sua Casa">
        <p className="text-sm text-amber-200/80 mb-4">
          O processo de inscrição é feito inteiramente pelo portal. No formulário, além dos dados
          da casa (cidade, andar, etc.), deverá obrigatoriamente preencher:
        </p>
        <ul className="space-y-2 text-sm text-amber-200/80 mb-4">
          <li className="flex gap-2">
            <span className="text-tibia-gold">•</span>
            <span>
              <strong className="text-amber-100">Nome da Casa:</strong> Batize a sua obra!
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-tibia-gold">•</span>
            <span>
              <strong className="text-amber-100">Tema da Decoração:</strong> Qual a história por
              trás do design?
            </span>
          </li>
        </ul>
        <div className="rounded-lg bg-tibia-accent/20 border border-amber-800/30 p-4 text-sm text-amber-200/80">
          <p>
            💡 <strong className="text-amber-100">Dica da Organização:</strong> Usem a criatividade!
            Um nome cativante e um tema bem amarrado com a decoração (ex:{' '}
            <em>Covil dos Piratas de Liberty Bay</em>, <em>Santuário Proibido de Zathroth</em>)
            chamam a atenção da comunidade na hora de deslizar para o &quot;Match&quot; e são
            essenciais para disputar a Menção Honrosa!
          </p>
        </div>
        <div className="mt-4">
          <Link
            to="/inscrever"
            className="inline-block text-sm px-4 py-2 rounded-lg bg-tibia-gold text-tibia-dark font-semibold hover:bg-amber-400 transition-colors"
          >
            Inscrever Casa
          </Link>
        </div>
      </TabPanel>
    ),
    pontuacao: (
      <TabPanel title="Sistema de Pontuação e Critérios">
        <p className="text-sm text-amber-200/80 mb-5">
          O vencedor será determinado por um sistema de pontuação acumulativa gerido em tempo real
          pelo portal, dividido em três pilares:
        </p>
        <div className="space-y-5">
          <div>
            <h4 className="text-amber-100 font-semibold mb-2">
              1. Voto Popular (Dinâmica &quot;Tinder&quot;)
            </h4>
            <ul className="space-y-2 text-sm text-amber-200/80">
              <li className="flex gap-2">
                <span className="text-tibia-gold">•</span>
                <span>
                  <strong className="text-amber-100">Gratuidade:</strong> A votação é{' '}
                  <strong>100% gratuita</strong>. Não é necessário pagar nenhuma taxa para votar!
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-tibia-gold">•</span>
                <span>A votação só abre após o fim do período de validação de pagamentos.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-tibia-gold">•</span>
                <span>
                  <strong className="text-amber-100">Como Votar:</strong> Sistema interativo no
                  portal — &quot;Match&quot; (Gostei) ou &quot;Deslike&quot; (Não Gostei),
                  deslizando ou clicando nos botões.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-tibia-gold">•</span>
                <span>
                  <strong className="text-amber-100">Regras de Voto:</strong> Cada utilizador pode
                  votar em <strong>todas</strong> as casas inscritas, com apenas uma avaliação por
                  casa. O voto pode ser alterado enquanto o período de votação estiver aberto.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-tibia-gold">•</span>
                <span>
                  <strong className="text-amber-100">Métrica:</strong> Cada{' '}
                  <strong>5 &quot;Matches&quot;</strong> válidos convertem-se em{' '}
                  <strong>1 ponto</strong> na nota final.
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-amber-100 font-semibold mb-2">2. Voto dos Organizadores (Peso Direto)</h4>
            <ul className="space-y-2 text-sm text-amber-200/80">
              <li className="flex gap-2">
                <span className="text-tibia-gold">•</span>
                <span>
                  A comissão organizadora (liderada por{' '}
                  <TheCrustyLink className="text-amber-100 font-semibold" />) avalia harmonia,
                  criatividade e arranjo de itens.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-tibia-gold">•</span>
                <span>
                  <strong className="text-amber-100">Métrica:</strong> Cada voto dos organizadores
                  garante <strong>2 pontos</strong> diretos na nota final.
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-amber-100 font-semibold mb-2">
              3. Bónus de Utilidade Pública (Dummies e NPCs)
            </h4>
            <p className="text-sm text-amber-200/80 mb-2">
              Casas com <em>Exercise Dummies</em> e <em>Hirelings</em> (NPCs) de livre acesso para
              o público pontuam extra:
            </p>
            <ul className="space-y-2 text-sm text-amber-200/80">
              <li className="flex gap-2">
                <span>🥇</span>
                <span>
                  <strong className="text-amber-100">1º Lugar</strong> (mais Dummies e Hirelings
                  acessíveis): <strong>+2 pontos</strong>.
                </span>
              </li>
              <li className="flex gap-2">
                <span>🥈</span>
                <span>
                  <strong className="text-amber-100">2º Lugar</strong> (segunda casa com mais
                  Dummies e Hirelings): <strong>+1 ponto</strong>.
                </span>
              </li>
            </ul>
          </div>
          <div className="rounded-lg bg-tibia-accent/20 border border-amber-800/30 p-4">
            <h4 className="text-amber-100 font-semibold mb-1">🎖️ Menção Honrosa (Temática)</h4>
            <p className="text-sm text-amber-200/80">
              O portal destacará casas com linha temática bem definida. Os organizadores atribuirão
              um selo de <strong>Menção Honrosa</strong> à decoração mais criativa e imersiva.
            </p>
          </div>
        </div>
      </TabPanel>
    ),
    premiacao: (
      <TabPanel title="Premiação (Prémio Base + Fundo de Inscrições)">
        <p className="text-sm text-amber-200/80 mb-4">
          O prémio base é de <strong className="text-tibia-gold">60.000.000 GPs (60KK)</strong>.
          Além disso, <strong>100%</strong> da verba arrecadada com as taxas de inscrição de{' '}
          <strong>10 TC</strong> será diluída de forma adicional entre os vencedores:
        </p>
        <ul className="space-y-3 text-sm">
          <li className="flex gap-3 items-start p-3 rounded-lg bg-tibia-dark/50 border border-amber-900/20">
            <span className="text-xl">🥇</span>
            <span className="text-amber-200/80">
              <strong className="text-amber-100">1º Classificado:</strong> 30.000.000 GP (30 KK) +{' '}
              <strong>50%</strong> do valor total das inscrições.
            </span>
          </li>
          <li className="flex gap-3 items-start p-3 rounded-lg bg-tibia-dark/50 border border-amber-900/20">
            <span className="text-xl">🥈</span>
            <span className="text-amber-200/80">
              <strong className="text-amber-100">2º Classificado:</strong> 20.000.000 GP (20 KK) +{' '}
              <strong>35%</strong> do valor total das inscrições.
            </span>
          </li>
          <li className="flex gap-3 items-start p-3 rounded-lg bg-tibia-dark/50 border border-amber-900/20">
            <span className="text-xl">🥉</span>
            <span className="text-amber-200/80">
              <strong className="text-amber-100">3º Classificado:</strong> 10.000.000 GP (10 KK) +{' '}
              <strong>15%</strong> do valor total das inscrições.
            </span>
          </li>
        </ul>
        <div className="mt-4">
          <Link
            to="/ranking"
            className="inline-block text-sm px-4 py-2 rounded-lg bg-tibia-green/80 text-amber-50 hover:bg-tibia-green transition-colors"
          >
            Ver Ranking & Calculadora
          </Link>
        </div>
      </TabPanel>
    ),
    validacao: (
      <TabPanel title="Requisitos de Validação">
        <ul className="space-y-3 text-sm text-amber-200/80">
          <li className="flex gap-2">
            <span className="text-tibia-gold">•</span>
            <span>
              <strong className="text-amber-100">Autenticação:</strong> É obrigatório fazer login
              via <strong>Discord OAuth</strong>.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-tibia-gold">•</span>
            <span>
              <strong className="text-amber-100">Validação de Personagem:</strong> Tanto para
              inscrever uma casa quanto para votar, o utilizador deve introduzir o nome de um
              personagem ativo. O sistema validará automaticamente se o personagem existe na base
              de dados oficial do <TaleonSanLink className="text-amber-200/80" />.
            </span>
          </li>
        </ul>
      </TabPanel>
    ),
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h2 className="text-3xl font-bold text-tibia-gold mb-3">Regras do Concurso</h2>
        <p className="text-amber-200/70 max-w-2xl mx-auto">
          Edital oficial do Concurso de Decoração de Houses do servidor{' '}
          <TaleonSanLink className="text-amber-100 font-semibold" />, organizado por{' '}
          <TheCrustyLink className="text-tibia-gold font-semibold" />. Preparem os vossos itens
          raros, organizem as tapeçarias e mostrem a criatividade à comunidade!
        </p>
      </header>

      <div
        className="flex flex-wrap gap-2 mb-4 border-b border-amber-900/30 pb-3"
        role="tablist"
        aria-label="Secções das regras"
      >
        {RULE_TABS.map((tab) => {
          const is_active = active_tab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={is_active}
              aria-controls={`rules-panel-${tab.id}`}
              id={`rules-tab-${tab.id}`}
              onClick={() => set_active_tab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                is_active
                  ? 'bg-brand-brandy text-brand-smoke shadow-sm'
                  : 'text-brand-cream/70 hover:text-brand-smoke hover:bg-tibia-panel border border-transparent hover:border-brand-olive/30'
              }`}
            >
              <span aria-hidden>{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </div>

      <div id={`rules-panel-${active_tab}`} role="tabpanel" aria-labelledby={`rules-tab-${active_tab}`}>
        {tab_panels[active_tab]}
      </div>
    </div>
  )
}
