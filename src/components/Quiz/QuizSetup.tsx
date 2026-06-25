import React, { useState } from 'react';
import type { DifficultyLevel, RagFile, RagImage } from '../../types/quiz.types';
import { Button } from '../Common/Button';
import { AlertTriangle, Settings, Loader, UploadCloud, FileText, Trash2, CheckCircle, FileSpreadsheet, File } from 'lucide-react';
import { useMultiSourceTrivia } from '../../hooks/useMultiSourceTrivia';
import { 
  parseTxt, 
  readImageAsBase64, 
  parseDocx, 
  parsePptx, 
  parseXlsx, 
  loadPdfJS, 
  parsePdf 
} from '../../utils/fileParser';

// ─── Constantes de domínio ────────────────────────────────────────────────────
const DIFFICULTY_MIN = 1;
const DIFFICULTY_MAX = 10;
const COUNT_OPTIONS = [5, 10, 20] as const;
const COUNT_CUSTOM_MIN = 1;
const COUNT_CUSTOM_MAX = 50;

const getDifficultyLabel = (val: number): string => {
  if (val >= 10) return 'Muito Difícil';
  if (val >= 7) return 'Difícil';
  if (val >= 5) return 'Médio';
  if (val >= 3) return 'Fácil';
  return 'Muito Fácil';
};

const getDifficultyMultiplier = (val: number): string =>
  (1 + val / 10).toFixed(1);

/**
 * Retorna a classe de cor Tailwind de acordo com o nível de dificuldade:
 * verde (1-4 Fácil/Muito Fácil), amarelo (5-6 Médio), vermelho (7-10 Difícil).
 */
const getDifficultyColor = (val: number): string => {
  if (val >= 7) return 'text-rose-400';
  if (val >= 5) return 'text-yellow-400';
  return 'text-emerald-400';
};

/**
 * Cor hexadecimal para o track do slider — acompanha o nível de dificuldade.
 * Evita depender de variáveis CSS dinâmicas adicionais.
 */
const getDifficultyHex = (val: number): string => {
  if (val >= 7) return '#f43f5e'; // rose-500
  if (val >= 5) return '#facc15'; // yellow-400
  return '#34d399';               // emerald-400
};

// Calcula a % para preencher o track do slider
const sliderPercent = (val: number): string =>
  `${((val - DIFFICULTY_MIN) / (DIFFICULTY_MAX - DIFFICULTY_MIN)) * 100}%`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuizSetupProps {
  onStartQuiz: (
    topic: string, 
    difficulty: DifficultyLevel, 
    count: number, 
    popularExamOnly?: boolean,
    ragFiles?: RagFile[]
  ) => void;
  isLoading: boolean;
  isTriviaMode?: boolean;
  onNavigateToApiSetup?: () => void;
}

// ─── Sub-componentes locais ───────────────────────────────────────────────────

interface NumberStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  label: string;
}

/** Input numérico com botões − e + no design do site */
const NumberStepper: React.FC<NumberStepperProps> = ({ value, min, max, onChange, label }) => {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  return (
    <div className="flex items-center gap-0 bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500 transition-all">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        className="px-3.5 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors font-bold text-base select-none"
        aria-label={`Diminuir ${label}`}
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(parseInt(e.target.value) || min))}
        className="quiz-number-input flex-1 bg-transparent text-white font-bold font-mono text-center outline-none py-3 text-sm"
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        className="px-3.5 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-25 disabled:cursor-not-allowed transition-colors font-bold text-base select-none"
        aria-label={`Aumentar ${label}`}
      >
        +
      </button>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
export const QuizSetup: React.FC<QuizSetupProps> = ({
  onStartQuiz,
  isLoading,
  isTriviaMode = false,
  onNavigateToApiSetup,
}) => {
  const triviaData = useMultiSourceTrivia();
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('5');
  const [count, setCount] = useState<number>(5);
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);
  const [popularExamOnly, setPopularExamOnly] = useState<boolean>(false);

  // RAG States
  const [isRagActive, setIsRagActive] = useState<boolean>(false);
  const [ragFiles, setRagFiles] = useState<RagFile[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const diffVal = parseInt(difficulty) || DIFFICULTY_MIN;

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
      return <svg className="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>;
    }
    if (ext === 'xlsx' || ext === 'xls') {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (ext === 'pdf') {
      return <svg className="w-4 h-4 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2z" /></svg>;
    }
    if (ext === 'docx') {
      return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
    }
    if (ext === 'pptx') {
      return <svg className="w-4 h-4 text-orange-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18V12M16 15H8" /></svg>;
    }
    return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const updateFileStatus = (
    id: string,
    status: 'success' | 'error',
    errorMessage?: string,
    text: string = '',
    images: RagImage[] = []
  ) => {
    setRagFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status, errorMessage, text, images } : f
      )
    );
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files) return;

    const currentCount = ragFiles.length;
    const incomingFiles = Array.from(files);

    if (currentCount + incomingFiles.length > 5) {
      alert('Você pode carregar no máximo 5 arquivos.');
      return;
    }

    const newFiles: RagFile[] = incomingFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'loading',
      text: '',
      images: [],
    }));

    setRagFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach(async (ragFile, index) => {
      const file = incomingFiles[index];

      if (file.size > 10 * 1024 * 1024) {
        updateFileStatus(ragFile.id, 'error', 'O arquivo excede o limite de 10MB.');
        return;
      }

      try {
        const ext = file.name.split('.').pop()?.toLowerCase();
        let text = '';
        let images: RagImage[] = [];

        if (ext === 'txt' || ext === 'md') {
          text = await parseTxt(file);
        } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
          const base64 = await readImageAsBase64(file);
          images.push({
            mimeType: file.type || `image/${ext}`,
            base64Data: base64,
          });
          text = `[Imagem Anexa: ${file.name}]`;
        } else if (ext === 'docx') {
          const parsed = await parseDocx(file);
          text = parsed.text;
          images = parsed.images;
        } else if (ext === 'pptx') {
          const parsed = await parsePptx(file);
          text = parsed.text;
          images = parsed.images;
        } else if (ext === 'xlsx' || ext === 'xls') {
          text = await parseXlsx(file);
        } else if (ext === 'pdf') {
          const pdfjs = await loadPdfJS();
          text = await parsePdf(file, pdfjs);
        } else {
          throw new Error('Formato de arquivo não suportado.');
        }

        updateFileStatus(ragFile.id, 'success', undefined, text, images);
      } catch (err: any) {
        updateFileStatus(ragFile.id, 'error', err.message || 'Erro ao processar arquivo.');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTriviaMode) {
      const finalTopic = topic.trim();
      if (!finalTopic && !isRagActive) return;

      if (isRagActive) {
        const parsingFiles = ragFiles.filter((f) => f.status === 'loading');
        if (parsingFiles.length > 0) {
          alert('Aguarde a leitura de todos os arquivos ser concluída.');
          return;
        }
        const successfulFiles = ragFiles.filter((f) => f.status === 'success');
        if (successfulFiles.length === 0) {
          alert('Por favor, faça o upload de pelo menos um arquivo com sucesso para usar o RAG.');
          return;
        }
      }

      onStartQuiz(
        isRagActive && !finalTopic ? 'Material de Conteúdo' : finalTopic,
        difficulty,
        count,
        popularExamOnly,
        isRagActive ? ragFiles : undefined
      );
      return;
    }

    if (!triviaData.selectedCategory) {
      return;
    }

    const categoryAndAreas = triviaData.selectedAreaIds.length > 0
      ? `${triviaData.selectedCategory.id}|${triviaData.selectedAreaIds.join(',')}`
      : triviaData.selectedCategory.id;

    onStartQuiz(categoryAndAreas, difficulty, count);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDifficulty(e.target.value);
  };

  const handleDifficultyStep = (newVal: number) => {
    const clamped = Math.max(DIFFICULTY_MIN, Math.min(DIFFICULTY_MAX, newVal));
    setDifficulty(clamped.toString());
  };

  const handleCategorySelect = (categoryId: string) => {
    triviaData.selectCategory(categoryId);
    setTopic(categoryId);
  };

  const handleAreaToggle = (areaId: string) => {
    const isSelected = triviaData.selectedAreaIds.includes(areaId);
    triviaData.selectArea(areaId, !isSelected);
  };

  return (
    <div className="glass-card w-full max-w-lg p-8 rounded-2xl mx-auto my-6 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <h2 className="text-2xl font-extrabold text-white text-center mb-6">Iniciar Novo Quiz</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner de aviso — só aparece no modo trivia */}
        {isTriviaMode && (
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-300 leading-relaxed">
              <strong className="text-amber-200">Modo Multi-Banco Ativo.</strong>{' '}
              Questões de múltiplas fontes (Open Trivia, jService, Bongo, The Trivia API e mais).
              {onNavigateToApiSetup && (
                <>
                  {' '}Para questões personalizadas,{' '}
                  <button
                    type="button"
                    onClick={onNavigateToApiSetup}
                    className="inline-flex items-center gap-1 underline text-amber-200 hover:text-white transition-colors"
                  >
                    <Settings size={11} />
                    configure uma API key
                  </button>
                  .
                </>
              )}
            </div>
          </div>
        )}

        {/* Tópico (LLM) ou Categoria (Trivia) */}
        {isTriviaMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                CATEGORIA
              </label>
              {triviaData.isLoadingCategories ? (
                <div className="flex items-center justify-center py-6 text-slate-400">
                  <Loader size={16} className="animate-spin mr-2" />
                  Carregando categorias...
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="trivia-category"
                    value={topic}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="w-full appearance-none px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all pr-10"
                  >
                    <option value="" className="bg-slate-900">
                      Selecione uma categoria...
                    </option>
                    {triviaData.categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900">
                        {cat.name} ({cat.providers.length} fonte{cat.providers.length !== 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Áreas/Subcategorias — aparece apenas se selecionou uma categoria com áreas */}
            {triviaData.selectedCategory && triviaData.selectedCategory.areasAvailable && triviaData.availableAreas.length > 0 && (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    ÁREAS (Opcional - Selecione múltiplas)
                  </label>
                  {triviaData.selectedAreaIds.length > 0 && (
                    <button
                      type="button"
                      onClick={triviaData.clearSelectedAreas}
                      className="text-xs text-rose-400 hover:text-rose-300 transition-colors underline"
                    >
                      Limpar seleção
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-slate-950/20 border border-slate-800 rounded-lg p-3">
                  {triviaData.availableAreas.map((area) => (
                    <label
                      key={area.id}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-900/40 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={triviaData.selectedAreaIds.includes(area.id)}
                        onChange={() => handleAreaToggle(area.id)}
                        className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                      />
                      <span className="text-xs text-slate-300 flex-1">{area.name}</span>
                    </label>
                  ))}
                </div>
                {triviaData.selectedAreaIds.length > 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    {triviaData.selectedAreaIds.length} área(s) selecionada(s)
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Toggle RAG */}
            <div className={`p-4 rounded-xl border transition-all duration-300 ${
              isRagActive 
                ? 'bg-rose-950/10 border-rose-500/30' 
                : 'bg-slate-950/25 border-slate-800/60'
            }`}>
              <div className="flex gap-3 items-center justify-between">
                <div className="flex gap-3 items-start">
                  <div className={`p-2 border rounded-xl shrink-0 mt-0.5 transition-colors ${
                    isRagActive
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700/50'
                  }`}>
                    <UploadCloud size={18} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-200">
                      Estudar com Conteúdo Próprio (RAG)
                    </label>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Gere questões com base em arquivos PDF, Word, Excel, PowerPoint, Imagens ou Textos enviados por você.
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsRagActive(!isRagActive)}
                  className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                    isRagActive ? 'bg-rose-500' : 'bg-slate-800'
                  }`}
                  role="switch"
                  aria-checked={isRagActive}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-all duration-300 absolute top-1 ${
                      isRagActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {isRagActive && (
                <div className="mt-4 space-y-4 border-t border-slate-800/60 pt-4 animate-fade-in">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); }}
                    onClick={() => document.getElementById('rag-file-input')?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-rose-500 bg-rose-500/5' 
                        : 'border-slate-800 hover:border-rose-500/50 hover:bg-slate-950/45'
                    }`}
                  >
                    <input
                      id="rag-file-input"
                      type="file"
                      multiple
                      className="hidden"
                      accept=".txt,.md,.pdf,.docx,.xlsx,.xls,.pptx,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => handleFileChange(e.target.files)}
                    />
                    <UploadCloud size={32} className="mx-auto text-slate-500 mb-2 transition-colors" />
                    <p className="text-xs font-bold text-slate-300">Arraste seus arquivos aqui ou clique para buscar</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Suporta PDF, Word (.docx), Excel (.xlsx/.xls), PowerPoint (.pptx), Imagens (PNG/JPG) e TXT/MD (Máx: 10MB)
                    </p>
                  </div>
                  
                  {ragFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Arquivos Carregados ({ragFiles.length}/5)</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {ragFiles.map(file => (
                          <div key={file.id} className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-900 rounded-lg">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              {getFileIcon(file.name)}
                              <div className="overflow-hidden">
                                <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  {(file.size / 1024).toFixed(1)} KB 
                                  {file.status === 'success' && file.text && ` • ${file.text.length} chars`}
                                  {file.status === 'success' && file.images.length > 0 && ` • ${file.images.length} imgs`}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              {file.status === 'loading' && <Loader size={14} className="animate-spin text-rose-500" />}
                              {file.status === 'success' && <CheckCircle size={14} className="text-emerald-400" />}
                              {file.status === 'error' && (
                                <span className="text-[10px] text-rose-400 font-semibold max-w-[120px] truncate" title={file.errorMessage}>
                                  {file.errorMessage}
                                </span>
                              )}
                              
                              <button
                                type="button"
                                onClick={() => setRagFiles(prev => prev.filter(f => f.id !== file.id))}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {isRagActive ? 'Foco do Tema (Opcional)' : 'TEMA DESEJADO DO QUIZ'}
              </label>
              <input
                type="text"
                required={!isRagActive}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={isRagActive 
                  ? "Ex: Focar em fórmulas específicas, focar na introdução..." 
                  : "Ex: Astrofísica, Marvel, Mitologia Nórdica, Cinema..."
                }
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white outline-none placeholder-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Dificuldade */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            NÍVEL DE DIFICULDADE DAS QUESTÕES
          </label>
          <div className="space-y-4 bg-slate-950/20 border border-slate-800/60 p-4 rounded-xl transition-all duration-300">
            {/* Slider com gradiente dinâmico — cor do track muda com o nível */}
            <input
              type="range"
              min={DIFFICULTY_MIN}
              max={DIFFICULTY_MAX}
              step="1"
              value={difficulty}
              onChange={handleSliderChange}
              className="quiz-slider"
              style={{
                '--slider-pct': sliderPercent(diffVal),
                '--slider-color': getDifficultyHex(diffVal),
              } as React.CSSProperties}
              aria-label="Nível de dificuldade"
            />

            {/* Stepper numérico para dificuldade */}
            <NumberStepper
              value={diffVal}
              min={DIFFICULTY_MIN}
              max={DIFFICULTY_MAX}
              onChange={handleDifficultyStep}
              label="Nível de dificuldade"
            />

            {/* Label de texto descritivo com cor dinâmica */}
            <div className="text-center text-xs font-semibold pt-1">
              <span className="text-slate-300">Nível {diffVal}: </span>
              <span className={`font-bold transition-colors duration-300 ${getDifficultyColor(diffVal)}`}>
                {getDifficultyLabel(diffVal)}
              </span>
              <span className="text-slate-500 font-medium">
                {' '}(Multiplicador x{getDifficultyMultiplier(diffVal)})
              </span>
            </div>
          </div>
        </div>

        {/* Quantidade de Perguntas */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Perguntas
          </label>
          <div className="grid grid-cols-4 gap-2">
            {COUNT_OPTIONS.map((qCount) => (
              <button
                key={qCount}
                type="button"
                onClick={() => { setCount(qCount); setIsCustomCount(false); }}
                className={`py-3 rounded-xl border font-bold text-xs transition-all ${!isCustomCount && count === qCount
                  ? 'border-rose-500 bg-rose-500/10 text-white shadow-lg shadow-rose-500/10'
                  : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-rose-500/40 hover:text-slate-200'
                  }`}
              >
                {qCount}
              </button>
            ))}
            {/* Opção "Outro" oculta no trivia mode (Open Trivia DB tem limite de 50, mas categorias
                  menores podem não ter questões suficientes — melhor limitar ao preset). */}
            {!isTriviaMode && (
              <button
                type="button"
                onClick={() => { setIsCustomCount(true); setCount(COUNT_CUSTOM_MIN); }}
                className={`py-3 rounded-xl border font-bold text-xs transition-all ${isCustomCount
                  ? 'border-rose-500 bg-rose-500/10 text-white shadow-lg shadow-rose-500/10'
                  : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-rose-500/40 hover:text-slate-200'
                  }`}
              >
                Outro
              </button>
            )}
          </div>

          {isCustomCount && (
            <div className="mt-3 bg-slate-950/20 border border-slate-800/60 p-4 rounded-xl animate-fade-in space-y-2">
              {/* Stepper customizado (1 a 50) */}
              <NumberStepper
                value={count}
                min={COUNT_CUSTOM_MIN}
                max={COUNT_CUSTOM_MAX}
                onChange={setCount}
                label="Número de questões personalizado"
              />
              <span className="block text-[10px] text-slate-500 text-center font-medium">
                Tolerado no minimo {COUNT_CUSTOM_MIN} e no máximo {COUNT_CUSTOM_MAX} questões!
              </span>
            </div>
          )}
        </div>

        {/* Questões populares em provas */}
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${
          isTriviaMode 
            ? 'bg-slate-950/10 border-slate-900/40 opacity-50 cursor-not-allowed' 
            : 'bg-slate-950/25 border-slate-800/60'
        }`}>
          <div className="flex gap-3 items-start">
            <div className={`p-2 border rounded-xl shrink-0 mt-0.5 transition-colors ${
              isTriviaMode
                ? 'bg-slate-900/30 text-slate-600 border-slate-800/40'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
            </div>
            <div className="space-y-1">
              <label className={`block text-xs font-bold uppercase tracking-wider ${
                isTriviaMode ? 'text-slate-500' : 'text-slate-200'
              }`}>
                Questões populares em provas {isTriviaMode && <span className="text-[9px] text-rose-400 font-semibold tracking-normal lowercase ml-1">(requer chave de IA)</span>}
              </label>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Gera 50% de questões recorrentes de vestibulares/concursos e 50% de fatos e curiosidades relevantes.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isTriviaMode}
            onClick={() => setPopularExamOnly(!popularExamOnly)}
            className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 focus:outline-none focus:ring-1 focus:ring-rose-500 ${
              isTriviaMode
                ? 'bg-slate-900 cursor-not-allowed'
                : popularExamOnly 
                  ? 'bg-rose-500' 
                  : 'bg-slate-800'
            }`}
            role="switch"
            aria-checked={popularExamOnly}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-all duration-300 absolute top-1 ${
                popularExamOnly && !isTriviaMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full mt-4">
          Iniciar Quiz
        </Button>
      </form>
    </div>
  );
};
export default QuizSetup;
