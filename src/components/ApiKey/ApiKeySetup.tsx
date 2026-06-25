import React, { useState } from 'react';
import { validateApiKey, POPULAR_MODELS } from '../../services/llmService';
import { encryptApiKey } from '../../utils/encryption';
import { sessionStore } from '../../services/sessionStore';
import type { User } from '../../types/user.types';
import type { LLMProvider } from '../../types/apiKey.types';
import { Button } from '../Common/Button';
import { CustomDropdown } from '../Common/CustomDropdown';
import { Check, WifiOff } from 'lucide-react';

interface ApiKeySetupProps {
  currentUser: User;
  currentUserPassword: string;
  onSetupSuccess: (updatedUser: User) => void;
  showToastMessage: (msg: string, type: 'success' | 'error') => void;
}

const PROVIDERS: { value: LLMProvider; label: string; placeholder: string }[] = [
  { value: 'gemini', label: 'Google Gemini', placeholder: 'Padrão: gemini-2.5-flash' },
  { value: 'openai', label: 'OpenAI', placeholder: 'Padrão: gpt-4o-mini' },
  { value: 'anthropic', label: 'Anthropic', placeholder: 'Padrão: claude-3-haiku-20240307' },
  { value: 'deepseek', label: 'DeepSeek', placeholder: 'Padrão: deepseek-chat' },
  { value: 'groq', label: 'Groq', placeholder: 'Padrão: llama3-8b-8192' },
  { value: 'mistral', label: 'Mistral AI', placeholder: 'Padrão: mistral-small-latest' },
  { value: 'openrouter', label: 'OpenRouter', placeholder: 'Padrão: openrouter/auto' },
];

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({
  currentUser,
  currentUserPassword,
  onSetupSuccess,
  showToastMessage
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [provider, setProvider] = useState<LLMProvider>('gemini');
  
  // Inicia com o primeiro modelo recomendado de Gemini
  const [selectedModelOption, setSelectedModelOption] = useState<string>('gemini-2.5-flash');
  const [customModelId, setCustomModelId] = useState<string>('');

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    const defaults = POPULAR_MODELS[newProvider];
    if (defaults && defaults.length > 0) {
      setSelectedModelOption(defaults[0].value);
    } else {
      setSelectedModelOption('outro');
    }
    setCustomModelId('');
  };

  const handleSetup = async (keyToUse: string, isMock: boolean) => {
    setIsValidating(true);
    try {
      const finalModelId = selectedModelOption === 'outro' ? customModelId.trim() : selectedModelOption;
      if (selectedModelOption === 'outro' && !finalModelId) {
        showToastMessage('Por favor, especifique o ID do modelo personalizado.', 'error');
        setIsValidating(false);
        return;
      }

      const validation = await validateApiKey(keyToUse, provider, finalModelId || undefined);
      if (!validation.valid) {
        showToastMessage(validation.error || 'Chave de API ou Modelo inválidos.', 'error');
        setIsValidating(false);
        return;
      }

      // Salva de forma global no localStorage
      localStorage.setItem('quiz_app_global_api_key', keyToUse);
      localStorage.setItem('quiz_app_global_api_provider', provider);
      if (finalModelId) {
        localStorage.setItem('quiz_app_global_api_modelId', finalModelId);
      } else {
        localStorage.removeItem('quiz_app_global_api_modelId');
      }

      // Encripta a chave usando a senha do usuário
      const encrypted = await encryptApiKey(keyToUse, currentUserPassword);
      
      const updatedUser: User = {
        ...currentUser,
        apiKey: {
          provider,
          modelId: finalModelId || undefined,
          encryptedKey: encrypted,
          lastFourChars: isMock ? 'MOCK' : keyToUse.slice(-4),
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          isActive: true
        }
      };

      sessionStore.saveUser(updatedUser);
      showToastMessage('Chave de API configurada com sucesso!', 'success');
      onSetupSuccess(updatedUser);
    } catch {
      showToastMessage('Erro ao salvar a chave de API.', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      showToastMessage('Por favor, digite a chave de API.', 'error');
      return;
    }
    handleSetup(apiKey.trim(), false);
  };

  const dropdownProvidersOptions = PROVIDERS.map(p => ({
    value: p.value,
    label: p.label
  }));

  const dropdownModelsOptions = [
    ...(POPULAR_MODELS[provider] || []).map(m => ({
      value: m.value,
      label: m.label
    })),
    { value: 'outro', label: 'Outro modelo (especificar)...' }
  ];

  return (
    <div className="glass-card w-full max-w-md p-8 rounded-2xl mx-auto my-10 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <h2 className="text-2xl font-extrabold text-white text-center mb-2">Configurar Inteligência Artificial</h2>
      <p className="text-slate-400 text-xs text-center mb-6 leading-relaxed">
        Insira sua chave de API para que a IA gere perguntas personalizadas em tempo real.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomDropdown
            label="Provedor"
            value={provider}
            onChange={(val) => handleProviderChange(val as LLMProvider)}
            options={dropdownProvidersOptions}
          />

          <CustomDropdown
            label="Modelo"
            value={selectedModelOption}
            onChange={setSelectedModelOption}
            options={dropdownModelsOptions}
          />
        </div>

        {selectedModelOption === 'outro' && (
          <div className="animate-fade-in">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">ID do Modelo Customizado</label>
            <input
              type="text"
              value={customModelId}
              onChange={(e) => setCustomModelId(e.target.value)}
              placeholder="Ex: gpt-4-32k ou claude-3-opus"
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white outline-none placeholder-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Chave de API</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Sua chave secreta da API..."
            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white outline-none placeholder-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button
            type="button"
            variant="danger"
            onClick={() => handleSetup('mock-key-for-testing', true)}
            disabled={isValidating}
            className="flex-1 text-xs font-bold uppercase gap-2"
          >
            <WifiOff size={16} strokeWidth={3.5} />
            USAR SIMULADOR OFFLINE
          </Button>
          <Button
            type="submit"
            variant="success"
            isLoading={isValidating}
            className="flex-1 text-xs font-bold uppercase gap-2"
          >
            <Check size={16} strokeWidth={3.5} />
            VALIDAR E SALVAR
          </Button>
        </div>
      </form>
    </div>
  );
};
export default ApiKeySetup;
