import React from 'react';
import type { RoomStats } from '../../types/quiz.types';
import { 
  Award, 
  Zap, 
  AlertTriangle, 
  BookOpen, 
  Clock, 
  TrendingUp 
} from 'lucide-react';

interface RoomStatsViewProps {
  stats: RoomStats | null;
}

export const RoomStatsView: React.FC<RoomStatsViewProps> = ({ stats }) => {
  if (!stats || stats.averageTimes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500">
        <TrendingUp size={44} className="stroke-[1.5] text-slate-700 mb-2" />
        <p className="text-sm font-semibold">Sem dados estatísticos ainda.</p>
        <p className="text-xs max-w-[280px] mt-1">Conclua pelo menos uma partida de quiz nesta sala para visualizar estatísticas agregadas de desempenho.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── BANNER DE RECORDES E DESTAQUES ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recorde de Acertos */}
        {stats.highestAccuracy && (
          <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/15 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-xl shrink-0">
              <Award size={20} />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[10px] text-emerald-500 font-extrabold uppercase tracking-wider">Maior Média de Acerto</span>
              <span className="block text-sm font-bold text-white truncate">{stats.highestAccuracy.name}</span>
              <span className="block text-[10px] text-slate-400 font-medium font-mono">{stats.highestAccuracy.averageAccuracy}% correto</span>
            </div>
          </div>
        )}

        {/* Mais Rápido */}
        {stats.fastestMember && (
          <div className="p-4 bg-rose-500/[0.02] border border-rose-500/15 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-xl shrink-0">
              <Zap size={20} />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[10px] text-rose-400 font-extrabold uppercase tracking-wider">Resposta Mais Rápida</span>
              <span className="block text-sm font-bold text-white truncate">{stats.fastestMember.name}</span>
              <span className="block text-[10px] text-slate-400 font-medium font-mono">{stats.fastestMember.averageTime}s em média / perg.</span>
            </div>
          </div>
        )}

        {/* Maior Margem de Erro */}
        {stats.highestErrorRate && (
          <div className="p-4 bg-amber-500/[0.02] border border-amber-500/15 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-xl shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div className="overflow-hidden">
              <span className="block text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">Maior Média de Erros</span>
              <span className="block text-sm font-bold text-white truncate">{stats.highestErrorRate.name}</span>
              <span className="block text-[10px] text-slate-400 font-medium font-mono">{(100 - stats.highestErrorRate.averageAccuracy).toFixed(1)}% incorreto</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* ─── TEMA MAIS JOGADO DA SALA ───────────────────────────────────────── */}
        <div className="glass-card p-5 border border-slate-800/80 rounded-2xl space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-2">
            <BookOpen size={15} className="text-rose-400" />
            Tema Mais Gerado na Sala
          </h4>
          
          <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-900 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Tema Favorito</span>
              <span className="text-base font-extrabold text-white">{stats.mostPlayedTopic}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Partidas</span>
              <span className="text-base font-extrabold text-rose-400 font-mono">{stats.mostPlayedTopicCount}</span>
            </div>
          </div>
        </div>

        {/* ─── RANKING DE TEMPO MÉDIO GASTO (Lobby Lento a Rápido) ─────────────── */}
        <div className="glass-card p-5 border border-slate-800/80 rounded-2xl space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-2">
            <Clock size={15} className="text-rose-400" />
            Tempo Médio Respondendo (em segundos)
          </h4>

          <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
            {stats.averageTimes.map((user, index) => {
              // Calcular percentual visual do tempo em relação ao mais lento (index 0)
              const maxTime = stats.averageTimes[0]?.averageTime || 30;
              const barPercent = Math.max(10, Math.min(100, (user.averageTime / maxTime) * 100));

              return (
                <div key={user.userId} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-350 truncate max-w-[180px]">
                      {index + 1}. {user.name}
                    </span>
                    <span className="text-slate-450 font-mono">{user.averageTime} segundos</span>
                  </div>
                  {/* Barra de progresso customizada */}
                  <div className="w-full h-2 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500/70 to-rose-400 rounded-full transition-all duration-500" 
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default RoomStatsView;
