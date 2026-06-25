import React from 'react';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Carregando...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-rose-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-slate-400 font-medium text-sm animate-pulse tracking-wide">{message}</p>
    </div>
  );
};
export default Loading;
