import React from 'react';

export interface PredefinedQuestion {
  topic: string;
  difficulty: number;
  icon: () => React.JSX.Element;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export const PREDEFINED_DEMO_QUESTIONS: PredefinedQuestion[] = [
  {
    topic: 'Astrofísica',
    difficulty: 8,
    icon: () => (
      <svg className="w-3.5 h-3.5 inline-block mr-1.5 text-rose-400 group-hover:text-rose-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    questionText: 'Qual o nome do horizonte de eventos a partir do qual nada, nem mesmo a luz, pode escapar de um buraco negro?',
    options: ['Raio de Schwarzschild', 'Singularidade', 'Limite de Roche'],
    correctOptionIndex: 0,
    explanation: 'O raio de Schwarzschild define a fronteira física do horizonte de eventos de um buraco negro.'
  },
  {
    topic: 'Python',
    difficulty: 5,
    icon: () => (
      <svg className="w-3.5 h-3.5 inline-block mr-1.5 text-rose-400 group-hover:text-rose-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    questionText: 'Qual das seguintes estruturas de dados em Python é mutável e não permite elementos duplicados?',
    options: ['List', 'Set', 'Tuple'],
    correctOptionIndex: 1,
    explanation: 'Sets (conjuntos) em Python são mutáveis, mas armazenam apenas elementos únicos (sem duplicatas).'
  },
  {
    topic: 'Cinema',
    difficulty: 6,
    icon: () => (
      <svg className="w-3.5 h-3.5 inline-block mr-1.5 text-rose-400 group-hover:text-rose-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    ),
    questionText: 'Qual filme de ficção científica de 2014 dirigido por Christopher Nolan aborda dilatação temporal perto de um buraco negro?',
    options: ['A Origem', 'Interestelar', 'Tenet'],
    correctOptionIndex: 1,
    explanation: 'Interestelar usa física real e buracos negros reais para narrar uma jornada de sobrevivência humana no espaço.'
  },
  {
    topic: 'História Geral',
    difficulty: 7,
    icon: () => (
      <svg className="w-3.5 h-3.5 inline-block mr-1.5 text-rose-400 group-hover:text-rose-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    questionText: 'Em que ano ocorreu a queda do Império Romano do Ocidente, marcando o fim da Antiguidade e início da Idade Média?',
    options: ['476 d.C.', '1453 d.C.', '313 d.C.'],
    correctOptionIndex: 0,
    explanation: 'A deposição do último imperador romano Rômulo Augusto em 476 d.C. marca convencionalmente o fim do Império Romano do Ocidente.'
  },
  {
    topic: 'Física Quântica',
    difficulty: 9,
    icon: () => (
      <svg className="w-3.5 h-3.5 inline-block mr-1.5 text-rose-400 group-hover:text-rose-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12a15.3 15.3 0 0 1 10-4 15.3 15.3 0 0 1 10 4 15.3 15.3 0 0 1-10 4 15.3 15.3 0 0 1-10-4z" />
      </svg>
    ),
    questionText: 'Qual princípio postula que é impossível determinar simultaneamente e com precisão absoluta a posição e o momento de uma partícula?',
    options: ['Princípio da Exclusão de Pauli', 'Princípio da Incerteza de Heisenberg', 'Efeito Fotoelétrico'],
    correctOptionIndex: 1,
    explanation: 'O princípio da incerteza de Werner Heisenberg é um pilar fundamental da mecânica quântica.'
  },
  {
    topic: 'Animes',
    difficulty: 4,
    icon: () => (
      <svg className="w-3.5 h-3.5 inline-block mr-1.5 text-rose-400 group-hover:text-rose-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l-.707.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
      </svg>
    ),
    questionText: 'Qual anime narra a história de Eren Yeager em sua busca pela liberdade contra gigantes conhecidos como Titãs?',
    options: ['Shingeki no Kyojin', 'Naruto Shippuden', 'Demon Slayer'],
    correctOptionIndex: 0,
    explanation: 'Shingeki no Kyojin (Attack on Titan) foca na luta desesperada da humanidade contra os Titãs.'
  },
  {
    topic: 'Biologia',
    difficulty: 6,
    icon: () => (
      <svg className="w-3.5 h-3.5 inline-block mr-1.5 text-rose-400 group-hover:text-rose-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 10.5C4.5 4.5 9.5 3 12 3s7.5 1.5 7.5 7.5S14.5 21 12 21s-7.5-4.5-7.5-10.5z" />
        <line x1="4.5" y1="10.5" x2="19.5" y2="10.5" />
        <line x1="8" y1="6" x2="16" y2="15" />
        <line x1="16" y1="6" x2="8" y2="15" />
      </svg>
    ),
    questionText: 'Qual organela celular é conhecida como a usina de energia da célula, responsável pela respiração celular e síntese de ATP?',
    options: ['Cloroplasto', 'Mitocôndria', 'Complexo de Golgi'],
    correctOptionIndex: 1,
    explanation: 'A mitocôndria produz a maior parte do ATP (energia química) da célula através do ciclo de Krebs e cadeia respiratória.'
  },
  {
    topic: 'Marvel',
    difficulty: 5,
    icon: () => (
      <svg className="w-3.5 h-3.5 inline-block mr-1.5 text-rose-400 group-hover:text-rose-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    questionText: 'Qual metal fictício e extremamente resistente é nativo de Wakanda e compõe o escudo do Capitão América e o traje do Pantera Negra?',
    options: ['Adamantium', 'Vibranium', 'Uru'],
    correctOptionIndex: 1,
    explanation: 'O Vibranium é um metal raro e absorvedor de energia originário de um meteoro que caiu em Wakanda.'
  }
];
