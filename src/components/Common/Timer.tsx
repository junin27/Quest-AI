import React from 'react';

interface TimerProps {
  duration: number;
  timeLeft: number;
}

export const Timer: React.FC<TimerProps> = ({
  duration,
  timeLeft,
}) => {
  const percentage = (timeLeft / duration) * 100;
  
  const getColorClass = () => {
    if (timeLeft > 15) {
      return 'bg-rose-500 shadow-rose-500/20';
    }
    if (timeLeft > 5) {
      return 'bg-amber-500 shadow-amber-500/20';
    }
    return 'bg-red-600 animate-pulse shadow-red-600/30';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tempo Restante</span>
        <span className={`text-base font-extrabold font-mono ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-200'}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="w-full bg-slate-950/60 rounded-full h-2 border border-slate-800/40">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full shadow-lg ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
export default Timer;
