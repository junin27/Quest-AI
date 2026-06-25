import React from 'react';
import type { RoomMember } from '../../types/quiz.types';
import { Shield, Star, Ban, Moon, Sun, Award } from 'lucide-react';

interface RoomMembersListProps {
  members: RoomMember[];
  currentUserId: string;
  myRole: 'owner' | 'leader' | 'member';
  onKick: (targetId: string) => void;
  onToggleAbsent: (targetId: string, currentStatus: 'active' | 'absent') => void;
  onToggleRole: (targetId: string, currentRole: 'owner' | 'leader' | 'member') => void;
}

export const RoomMembersList: React.FC<RoomMembersListProps> = ({
  members,
  currentUserId,
  myRole,
  onKick,
  onToggleAbsent,
  onToggleRole
}) => {
  
  // Ordenar lista de membros: Dono primeiro, depois Líderes, depois Membros Normais
  const sortedMembers = [...members].sort((a, b) => {
    const roleWeight = { owner: 0, leader: 1, member: 2 };
    const weightA = roleWeight[a.role] ?? 2;
    const weightB = roleWeight[b.role] ?? 2;
    return weightA - weightB;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          Participantes na Sala
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 font-semibold font-mono">
            {members.length} / 51
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {sortedMembers.map((member) => {
          const isMe = member.userId === currentUserId;
          const isTargetOwner = member.role === 'owner';
          const isTargetLeader = member.role === 'leader';
          const isTargetAbsent = member.status === 'absent';

          // Regras de renderização de ações baseadas na Hierarquia:
          // 1. Dono (owner) pode gerenciar qualquer um (menos ele mesmo)
          // 2. Líder (leader) pode gerenciar membros (role='member'), mas não o dono ou outros líderes
          // 3. Membros normais não gerenciam ninguém
          const canManageThisUser = !isMe && (
            (myRole === 'owner') ||
            (myRole === 'leader' && member.role === 'member')
          );

          return (
            <div
              key={member.userId}
              className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-300 ${
                isTargetAbsent
                  ? 'bg-slate-950/20 border-slate-900/60 opacity-60'
                  : isMe
                    ? 'bg-rose-500/[0.03] border-rose-500/20 shadow-md shadow-rose-500/[0.02]'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/60'
              }`}
            >
              {/* Informações do Membro */}
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isTargetOwner
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : isTargetLeader
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-800 text-slate-350'
                  }`}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  {isTargetAbsent && (
                    <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-slate-950 rounded-full flex items-center justify-center border border-slate-800">
                      <Moon size={9} className="text-slate-500" />
                    </div>
                  )}
                </div>

                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold truncate ${isMe ? 'text-white font-bold' : 'text-slate-200'}`}>
                      {member.name} {isMe && <span className="text-[10px] text-slate-500 font-medium">(Você)</span>}
                    </span>
                    
                    {/* Crachás de Função */}
                    {isTargetOwner && (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-[9px] font-extrabold flex items-center gap-0.5 tracking-wider uppercase">
                        <Shield size={9} />
                        Dono
                      </span>
                    )}
                    {isTargetLeader && (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md text-[9px] font-extrabold flex items-center gap-0.5 tracking-wider uppercase">
                        <Star size={9} />
                        Líder
                      </span>
                    )}
                    {isTargetAbsent && (
                      <span className="bg-slate-900 text-slate-500 border border-slate-800 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase">
                        Ausente
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{member.email}</p>
                </div>
              </div>

              {/* Botões Administrativos */}
              {canManageThisUser && (
                <div className="flex items-center gap-2 shrink-0 animate-fade-in">
                  {/* Promover/Rebaixar (Apenas Dono pode fazer) */}
                  {myRole === 'owner' && (
                    <button
                      onClick={() => onToggleRole(member.userId, member.role)}
                      title={isTargetLeader ? 'Rebaixar para Membro' : 'Promover a Líder'}
                      className={`p-2 rounded-lg border transition-all ${
                        isTargetLeader
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-slate-800 hover:text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-rose-500/40 hover:text-rose-400'
                      }`}
                    >
                      <Award size={14} />
                    </button>
                  )}

                  {/* Marcar Ausente/Ativo */}
                  <button
                    onClick={() => onToggleAbsent(member.userId, member.status)}
                    title={isTargetAbsent ? 'Marcar como Ativo' : 'Marcar como Ausente'}
                    className={`p-2 rounded-lg border transition-all ${
                      isTargetAbsent
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-slate-800'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {isTargetAbsent ? <Sun size={14} /> : <Moon size={14} />}
                  </button>

                  {/* Expulsar (Kick) */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Remover ${member.name} da sala?`)) {
                        onKick(member.userId);
                      }
                    }}
                    title="Remover participante"
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-500/35 rounded-lg text-rose-400 transition-all"
                  >
                    <Ban size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default RoomMembersList;
