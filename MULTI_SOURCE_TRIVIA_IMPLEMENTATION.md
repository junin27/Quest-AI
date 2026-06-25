# Implementação Multi-Fonte de Trivia

## 📋 Resumo Executivo

Implementação de uma arquitetura unificada que suporta **9 bancos de API de trivia gratuitos** simultaneamente, consolidando categorias, oferecendo seleção de áreas/subcategorias e buscando questões de múltiplas fontes com aleatoriedade.

---

## 🏗️ Arquitetura

### Camadas

1. **Providers** (Adaptadores)
   - Base abstrata: `BaseTriviaBankProvider`
   - 9 implementações concretas, uma para cada API
   - Cada provider: extrai categorias, busca questões, normaliza respostas

2. **Serviço Orquestrador**
   - `multiSourceTriviaService.ts`
   - Consolida categorias de todos os providers
   - Mapeia qual provider oferece cada categoria
   - Identifica áreas/subcategorias disponíveis
   - Busca inteligente com balanceamento entre providers

3. **Hook Customizado**
   - `useMultiSourceTrivia.ts`
   - Interface React para componentes
   - Gerencia estado de categorias, seleção, áreas
   - Carregamento assíncrono com cache

4. **Componentes UI**
   - `QuizSetup.tsx` - Refatorado para suportar seleção de áreas
   - `App.tsx` - Integração com novo serviço

---

## 📦 Estrutura de Arquivos

```
src/
├── types/
│   └── triviaBanks.types.ts          # Tipos unificados
├── services/
│   ├── multiSourceTriviaService.ts   # Orquestrador principal
│   └── providers/
│       ├── baseProvider.ts            # Classe abstrata
│       ├── openTriviaBankProvider.ts  # Open Trivia DB (24 cats)
│       ├── jServiceProvider.ts        # jService (18.3k cats)
│       ├── bongoTriviaProvider.ts     # Bongo (9 cats)
│       ├── triviousProvider.ts        # Trivious (18.3k cats)
│       ├── theTriviaApiProvider.ts    # The Trivia API (10 + tags)
│       ├── numbersApiProvider.ts      # Numbers API (4 tipos)
│       ├── dadJokesApiProvider.ts     # Dad Jokes
│       ├── peterApiProvider.ts        # Peter API
│       └── officialJokeApiProvider.ts # Official Jokes
├── hooks/
│   └── useMultiSourceTrivia.ts       # Hook React
└── components/
    └── Quiz/
        └── QuizSetup.tsx             # UI atualizada
```

---

## 🔄 Fluxo de Dados

```
QuizSetup.tsx
    ↓
useMultiSourceTrivia() [hook]
    ↓
multiSourceTriviaService.getConsolidatedCategories()
    ↓
Promise.all(providers[].getCategories())
    ↓
Consolidação + Mapeamento
    ↓
CategoryWithProviders[] retornado
    ↓
UI renderiza seletor + áreas (se houver)
    ↓
Usuário seleciona categoria + área (opcional)
    ↓
handleSubmit() → App.tsx
    ↓
multiSourceTriviaService.fetchQuestionsForCategory()
    ↓
Promise.all(providersSelecionados.fetchQuestions())
    ↓
Shuffle + balanceamento
    ↓
QuizQuestion[] convertido e renderizado
```

---

## 🎯 Funcionalidades Principais

### 1. Consolidação de Categorias
- Normaliza nomes de categorias de diferentes APIs
- Agrupa categorias semelhantes
- Rastreia qual provider oferece cada categoria
- Mostra número de fontes por categoria no UI

**Exemplo:**
```
Open Trivia "História" + jService "History" + Trivious "History"
    ↓
Categoria consolidada "História" (3 fontes)
```

### 2. Seleção de Áreas/Subcategorias
- Detecta quando uma API oferece subcategorias
- Mostra opções de área apenas quando disponível
- Permite "Todas as áreas" ou área específica
- Dá preferência à API que tem a área selecionada

**Exemplo:**
- The Trivia API oferece tags (áreas)
- Se usuário seleciona área "Segunda Guerra", busca com preferência dessa API

### 3. Busca Inteligente Multi-Fonte
```javascript
fetchQuestionsForCategory(categoryId, areaId, difficulty, count)
    ↓
Identifica providers que oferecem a categoria
    ↓
Se área selecionada, prioriza provider com essa área
    ↓
Busca paralela (Promise.all) em todos os providers
    ↓
Embaralha para evitar repetição
    ↓
Retorna mix de questões de diferentes fontes
```

### 4. Balanceamento Entre Providers
- Distribui `count` equitativamente entre providers
- Ex: 10 questões + 3 providers = 4 + 3 + 3 questões
- Embaralhamento final garante aleatoriedade

### 5. Tratamento de Falhas
- Cada provider é chamado em `Promise.allSettled()`
- Se uma API falha, outras continuam funcionando
- Fallback automático sem interrupção

---

## 🔌 As 9 APIs Implementadas

| # | API | Questões | Categorias | Áreas | Status |
|---|---|---|---|---|---|
| 1 | Open Trivia DB | 4.000+ | 24 | ❌ | ✅ Ativo |
| 2 | jService | 221.510+ | 18.300+ | ✅ (categorias granulares) | ✅ Ativo |
| 3 | Bongo Trivia | 5.200+ | 9 | ❌ | ✅ Ativo |
| 4 | Trivious | 96.221+ | 18.300+ | ✅ (via jService) | ✅ Ativo |
| 5 | The Trivia API | 14.400+ | 10 | ✅ Tags | ✅ Ativo |
| 6 | Numbers API | ~ | 4 tipos | ❌ | ✅ Ativo |
| 7 | Dad Jokes | ~ | 1 | ❌ | ✅ Ativo |
| 8 | Peter API | ~ | 5 | ❌ | ✅ Ativo |
| 9 | Official Jokes | 30.000+ | 3 tipos | ❌ | ✅ Ativo |

**Total:** 400k+ questões consolidadas

---

## ⚙️ Configuração e Cache

### Cache de Categorias
- Duração: 1 hora (3.600.000 ms)
- Reduz chamadas desnecessárias às APIs
- Timestamp rastreado para invalidação

### Timeout das Requisições
- Provider remoto: 5 segundos
- Numbers API: 3 segundos (serviço mais lento)
- Falha silenciosa sem travamento da UI

### Normalização de Categorias
```javascript
"World War II" → "world war ii" (lowercase)
"Sci-Fi & Fantasy" → "scifi fantasy" (remove símbolos)
```

---

## 🎨 Mudanças na UI

### QuizSetup.tsx
**Antes:**
- Dropdown simples com 24 categorias (Open Trivia apenas)
- Sem opções de subcategorias

**Depois:**
- Dropdown com categorias consolidadas de todas as APIs
- Mostra número de fontes por categoria
- **Novo:** Seletor de áreas quando disponível
- Área mostra opções de filtro refinado
- Loading states para carregamento assíncrono

### Exemplo de Renderização
```
CATEGORIA: [▼ História (3 fontes)]
                ├─ Open Trivia DB
                ├─ jService
                └─ Trivious

ÁREA (Optional - Refina a busca):
    [✓ Todas as áreas]
    [ Guerra Fria ]
    [ Segunda Guerra ]
    [ História Antiga ]
    [ Revolução Francesa ]
```

---

## 🔍 Detalhes Técnicos

### Conversão de Tipos
`TriviaBankQuestion` → `QuizQuestion`
```typescript
{
  id: "openTrivia-9-0-1234",
  text: "Qual é a capital do Brasil?" 
} 
  ↓
{
  id: "openTrivia-9-0-1234",
  questionText: "Qual é a capital do Brasil?",
  options: [...],
  correctOptionIndex: 0,
  explanation: "..."
}
```

### Passagem de Categoria + Área
```typescript
// Apenas categoria
"openTrivia_9"

// Categoria + área
"openTrivia_9|theTriviaApi_area_history_5"
```

### Mapeamento Provider → Categoria ID Original
```typescript
categoryIdMap: Map<
  string (normalized name),
  Map<provider, originalId>
>
```

---

## ✅ Testes Recomendados

### 1. Consolidação de Categorias
- [ ] Categorias carregam sem erro
- [ ] Número de categorias > 50
- [ ] Cada categoria mostra múltiplos providers

### 2. Seleção de Áreas
- [ ] Áreas aparecem apenas quando existem
- [ ] Seleção de área é persistida
- [ ] "Todas as áreas" limpa seleção

### 3. Busca de Questões
- [ ] Questões retornam de múltiplos providers
- [ ] Respostas não se repetem
- [ ] Dificuldade é respeitada

### 4. Tratamento de Falhas
- [ ] Se uma API falha, outras funcionam
- [ ] Mensagem amigável se nenhuma funciona
- [ ] Timeout não trava a UI

### 5. Performance
- [ ] Categorias carregam em < 2s (primeira vez)
- [ ] Questões carregam em < 5s
- [ ] Cache funciona (segunda carga é rápida)

---

## 🚀 Próximos Passos (Opcional)

1. **Persistência de Preferências**
   - Salvar última categoria/área selecionada
   - LocalStorage para histórico

2. **Filtros Avançados**
   - Escolher quais providers usar
   - Preferência de distribuição (ex: 80% jService, 20% outros)

3. **Métricas**
   - Rastrear qual provider contribuiu mais questões
   - Stats por source na tela de resultados

4. **Sincronização**
   - Refresh de categorias em background
   - Notificação quando novas categorias adicionadas

5. **Modo Offline**
   - Cache persistente de categorias
   - Fallback para dados armazenados

---

## 📚 Referências

- **Types:** `src/types/triviaBanks.types.ts`
- **Serviço:** `src/services/multiSourceTriviaService.ts`
- **Hook:** `src/hooks/useMultiSourceTrivia.ts`
- **Componente:** `src/components/Quiz/QuizSetup.tsx`
- **App:** `src/App.tsx` (handleStartQuiz)

---

## 🐛 Troubleshooting

**Problema:** "Nenhuma questão encontrada para esta categoria"
**Solução:** Essa categoria pode não estar disponível em nenhum provider. Tente outra.

**Problema:** Categorias levam muito tempo para carregar
**Solução:** jService tem 18.3k categorias. Primeira carga é lenta. Não recarregue antes de 1 hora.

**Problema:** Áreas não aparecem
**Solução:** Nem todas as APIs têm áreas. The Trivia API e jService têm. Verifique a consolidação.

---

Implementado em: 2026-06-22
Versão: 1.0.0
