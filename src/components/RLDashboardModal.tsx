import { useState } from 'react';
import {
  X,
  Brain,
  Sparkles,
  TrendingUp,
  Cpu,
  RotateCcw,
  Activity,
  CheckCircle2,
  Sliders,
  Award,
  Layers,
} from 'lucide-react';
import { rlEngine } from '@/lib/rlEngine';

type RLDashboardModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function RLDashboardModal({ isOpen, onClose }: RLDashboardModalProps) {
  if (!isOpen) return null;

  const [telemetry, setTelemetry] = useState(() => rlEngine.getTelemetry());
  const [resetConfirm, setResetConfirm] = useState(false);

  function handleRefresh() {
    setTelemetry(rlEngine.getTelemetry());
  }

  function handleReset() {
    rlEngine.resetPolicy();
    setTelemetry(rlEngine.getTelemetry());
    setResetConfirm(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 text-white shadow-md">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Painel de Reinforcement Learning</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ativo & Aprendendo
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Modelo: Gemini 3.8 Flash · MDP Q-Learning & RLHF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Overview Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 border border-emerald-500/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Mecanismo de Aprendizado por Reforço Contínuo</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            O agente utiliza formulação MDP (Processo de Decisão de Markov) com vetor de estado, seleção de ação por política <span className="font-mono text-emerald-400">ε-greedy</span> e avaliação de recompensa multi-fator: integridade sintática, validação de execução, alinhamento ao prompt e feedback humano (RLHF).
          </p>
        </div>

        {/* Metricas Principais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-amber-400" /> Recompensa Média
            </span>
            <span className="text-xl font-bold text-emerald-400 mt-1">
              +{telemetry.averageReward.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">escala de -1.0 a +1.5</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-sky-400" /> Total Episódios
            </span>
            <span className="text-xl font-bold text-sky-300 mt-1">
              {telemetry.totalEpisodes}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">gerações otimizadas</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="h-3.5 w-3.5 text-purple-400" /> Exploração (ε)
            </span>
            <span className="text-xl font-bold text-purple-300 mt-1">
              {(telemetry.epsilon * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">com decaimento 0.985</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Perda Recente
            </span>
            <span className="text-xl font-bold text-slate-200 mt-1">
              {telemetry.recentLoss.toFixed(4)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">TD Error médio</span>
          </div>
        </div>

        {/* Decomposição da Função de Recompensa */}
        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-400" />
              Pesos da Função de Recompensa Multi-Fator
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">R = ∑ wᵢ · Rᵢ + w_rlhf</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">Sintaxe & Integridade (R_syntax)</p>
                <p className="text-[11px] text-slate-400">Parênteses, chaves balanceadas, sem stubs</p>
              </div>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">30%</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">Prontidão de Execução (R_exec)</p>
                <p className="text-[11px] text-slate-400">Interatividade, eventos e DOM renderizável</p>
              </div>
              <span className="font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">30%</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">Coerência com Prompt (R_coherence)</p>
                <p className="text-[11px] text-slate-400">Aderência às palavras-chave e requisitos</p>
              </div>
              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">25%</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">Concisão Funcional (R_concise)</p>
                <p className="text-[11px] text-slate-400">Densidade de código sem repetição estéril</p>
              </div>
              <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">15%</span>
            </div>
          </div>
        </div>

        {/* Histórico Recente de Episódios */}
        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-sky-400" />
              Replay Buffer (Últimos Episódios Aprendidos)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {telemetry.episodes.length} gravados
            </span>
          </div>

          {telemetry.episodes.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              Nenhum episódio gravado ainda. Inicie um pedido de código para calibrar a política de RL.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {telemetry.episodes.map((ep) => (
                <div
                  key={ep.id}
                  className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 truncate">{ep.task}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        {ep.state.domain}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ação: <span className="text-slate-300">{ep.action.name}</span> (T={ep.action.temperature})
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-bold ${
                        ep.reward.totalReward >= 0.8
                          ? 'text-emerald-400'
                          : ep.reward.totalReward >= 0.5
                          ? 'text-sky-400'
                          : 'text-amber-400'
                      }`}
                    >
                      +{ep.reward.totalReward.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono">loss: {ep.policyLoss.toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé e Ações */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs">
          <div className="flex items-center gap-2">
            {!resetConfirm ? (
              <button
                onClick={() => setResetConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Redefinir Pesos</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors"
                >
                  Confirmar Reset
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            )}
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Atualizar
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium transition-colors"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
