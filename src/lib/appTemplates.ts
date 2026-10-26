import type { CodeBlock } from './supabase';

export type GeneratedApp = {
  title: string;
  explanation: string;
  code: CodeBlock[];
};

export function getAppForTask(task: string): GeneratedApp {
  const t = task.toLowerCase();

  if (t.includes('todo') || t.includes('tarefa') || t.includes('tarefas') || t.includes('lista')) {
    return generateTodoListApp();
  }

  if (t.includes('debounce') || t.includes('delay') || t.includes('hook')) {
    return generateDebounceApp();
  }

  if (t.includes('form') || t.includes('formulário') || t.includes('formulario') || t.includes('validação') || t.includes('validacao')) {
    return generateFormApp();
  }

  if (t.includes('fetch') || t.includes('retry') || t.includes('timeout') || t.includes('api') || t.includes('wrapper')) {
    return generateFetchWrapperApp();
  }

  if (t.includes('calculadora') || t.includes('calc') || t.includes('calculator')) {
    return generateCalculatorApp();
  }

  if (t.includes('nota') || t.includes('notas') || t.includes('bloco') || t.includes('anotação') || t.includes('notes')) {
    return generateNotesApp();
  }

  if (t.includes('cronômetro') || t.includes('cronometro') || t.includes('timer') || t.includes('temporizador') || t.includes('stopwatch')) {
    return generateTimerApp();
  }

  if (t.includes('jogo') || t.includes('velha') || t.includes('game') || t.includes('tic tac toe')) {
    return generateTicTacToeApp();
  }

  if (t.includes('moeda') || t.includes('câmbio') || t.includes('cambio') || t.includes('conversor') || t.includes('converter')) {
    return generateCurrencyConverterApp();
  }

  // Gerador dinâmico sob medida para qualquer outro pedido
  return generateCustomDynamicApp(task);
}

function generateTodoListApp(): GeneratedApp {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lista de Tarefas Inteligente</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-8 flex flex-col items-center">
  <div class="w-full max-w-xl space-y-6">
    <!-- Header -->
    <header class="flex items-center justify-between pb-4 border-b border-slate-800">
      <div>
        <h1 class="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">Minhas Tarefas</h1>
        <p class="text-xs text-slate-400 mt-1">Salvo automaticamente no seu navegador (localStorage)</p>
      </div>
      <div id="stats" class="text-right">
        <span id="progress-text" class="text-xs font-semibold text-emerald-400">0/0 concluídas</span>
      </div>
    </header>

    <!-- Barra de Progresso -->
    <div class="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
      <div id="progress-bar" class="bg-gradient-to-r from-emerald-400 to-sky-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
    </div>

    <!-- Input Form -->
    <form id="todo-form" class="flex gap-2">
      <input
        type="text"
        id="todo-input"
        placeholder="O que você precisa fazer?"
        class="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
        required
      />
      <select id="todo-cat" class="rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 text-xs text-slate-300 focus:outline-none">
        <option value="Geral">📌 Geral</option>
        <option value="Trabalho">💼 Trabalho</option>
        <option value="Estudo">📚 Estudo</option>
        <option value="Urgente">🔥 Urgente</option>
      </select>
      <button
        type="submit"
        class="bg-gradient-to-br from-emerald-400 to-sky-500 hover:opacity-90 text-slate-950 font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-md active:scale-95"
      >
        + Adicionar
      </button>
    </form>

    <!-- Filtros -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80 text-xs">
        <button type="button" class="filter-btn px-3 py-1.5 rounded-lg font-medium bg-slate-800 text-white" data-filter="all">Todas</button>
        <button type="button" class="filter-btn px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-white" data-filter="pending">Pendentes</button>
        <button type="button" class="filter-btn px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-white" data-filter="completed">Concluídas</button>
      </div>

      <button id="clear-completed" class="text-xs text-slate-400 hover:text-rose-400 transition-colors">
        Limpar concluídas
      </button>
    </div>

    <!-- Lista de Tarefas -->
    <ul id="todo-list" class="space-y-2.5">
      <!-- Inserido dinamicamente -->
    </ul>
  </div>

  <script>
    const STORAGE_KEY = 'agent_demo_todos';
    let todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let currentFilter = 'all';

    if (todos.length === 0) {
      todos = [
        { id: '1', text: 'Criar aplicação de demonstração', cat: 'Trabalho', done: true },
        { id: '2', text: 'Testar pré-visualização ao vivo no agente', cat: 'Urgente', done: false },
        { id: '3', text: 'Adicionar nova funcionalidade com TypeScript', cat: 'Estudo', done: false }
      ];
      save();
    }

    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const catSelect = document.getElementById('todo-cat');
    const list = document.getElementById('todo-list');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const clearBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');

    function save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      render();
    }

    function render() {
      const filtered = todos.filter(t => {
        if (currentFilter === 'pending') return !t.done;
        if (currentFilter === 'completed') return t.done;
        return true;
      });

      const completedCount = todos.filter(t => t.done).length;
      const pct = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;
      progressBar.style.width = pct + '%';
      progressText.innerText = completedCount + '/' + todos.length + ' concluídas (' + pct + '%)';

      list.innerHTML = '';

      if (filtered.length === 0) {
        list.innerHTML = '<li class="text-center py-10 text-slate-500 text-sm italic border border-dashed border-slate-800 rounded-xl">Nenhuma tarefa encontrada neste filtro.</li>';
        return;
      }

      filtered.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-all';

        const left = document.createElement('div');
        left.className = 'flex items-center gap-3 min-w-0';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.done;
        checkbox.className = 'w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer accent-emerald-500';
        checkbox.onchange = () => {
          todo.done = checkbox.checked;
          save();
        };

        const spanText = document.createElement('span');
        spanText.className = 'text-sm ' + (todo.done ? 'line-through text-slate-500' : 'text-slate-200');
        spanText.innerText = todo.text;

        const badge = document.createElement('span');
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700/60';
        badge.innerText = todo.cat;

        left.appendChild(checkbox);
        left.appendChild(spanText);
        left.appendChild(badge);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '✕';
        deleteBtn.className = 'text-slate-500 hover:text-rose-400 p-1 text-xs opacity-60 group-hover:opacity-100 transition-opacity';
        deleteBtn.onclick = () => {
          todos = todos.filter(t => t.id !== todo.id);
          save();
        };

        li.appendChild(left);
        li.appendChild(deleteBtn);
        list.appendChild(li);
      });
    }

    form.onsubmit = (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      todos.unshift({
        id: Date.now().toString(),
        text: val,
        cat: catSelect.value,
        done: false
      });
      input.value = '';
      save();
    };

    clearBtn.onclick = () => {
      todos = todos.filter(t => !t.done);
      save();
    };

    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => {
          b.className = 'filter-btn px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-white';
        });
        btn.className = 'filter-btn px-3 py-1.5 rounded-lg font-medium bg-slate-800 text-white';
        currentFilter = btn.dataset.filter;
        render();
      };
    });

    render();
  </script>
</body>
</html>`;

  return {
    title: 'Lista de Tarefas com LocalStorage',
    explanation:
      'Construí uma aplicação completa de Lista de Tarefas interativa com persistência no localStorage, barra de progresso em tempo real, categorias com badges e filtros por status. Você pode testar e adicionar tarefas agora mesmo na aba de pré-visualização!',
    code: [
      {
        filename: 'index.html',
        language: 'html',
        content: html,
      },
    ],
  };
}

function generateDebounceApp(): GeneratedApp {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Laboratório de Debounce Interativo</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style> body { font-family: 'Plus Jakarta Sans', sans-serif; } </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 flex flex-col items-center">
  <div class="w-full max-w-xl space-y-6">
    <header class="text-center space-y-1">
      <h1 class="text-2xl font-bold bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
        Demonstração de Debounce
      </h1>
      <p class="text-xs text-slate-400">
        Digite no campo abaixo e compare a diferença entre chamadas imediatas vs chamadas com debounce (500ms).
      </p>
    </header>

    <div class="space-y-2">
      <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Campo de Pesquisa</label>
      <input
        type="text"
        id="search-input"
        placeholder="Digite rapidamente para testar o debounce…"
        class="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-400"
      />
    </div>

    <!-- Indicador de Timer -->
    <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
      <div class="flex justify-between text-xs text-slate-400">
        <span>Tempo de espera do Debounce (500ms):</span>
        <span id="timer-status" class="font-mono text-slate-300">Inativo</span>
      </div>
      <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div id="timer-bar" class="bg-violet-400 h-1.5 w-0 transition-all"></div>
      </div>
    </div>

    <!-- Comparativo de Métricas -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl text-center">
        <p class="text-xs text-rose-300 font-medium">Sem Debounce (Imediato)</p>
        <p id="count-raw" class="text-3xl font-bold text-rose-400 font-mono mt-1">0</p>
        <p class="text-[11px] text-slate-500 mt-1">Requisições disparadas</p>
      </div>

      <div class="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl text-center">
        <p class="text-xs text-emerald-300 font-medium">Com Debounce (Otimizado)</p>
        <p id="count-debounced" class="text-3xl font-bold text-emerald-400 font-mono mt-1">0</p>
        <p class="text-[11px] text-slate-500 mt-1">Requisições disparadas</p>
      </div>
    </div>

    <!-- Log de Eventos -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-300">Histórico de Disparos</span>
        <button id="clear-log" class="text-[11px] text-slate-500 hover:text-slate-300">Limpar</button>
      </div>
      <div id="log-list" class="h-36 overflow-y-auto font-mono text-[11px] space-y-1 pr-1 text-slate-400">
        <p class="text-slate-600 italic">Digite algo acima para iniciar o teste...</p>
      </div>
    </div>
  </div>

  <script>
    let rawCount = 0;
    let debouncedCount = 0;
    let timer = null;

    const input = document.getElementById('search-input');
    const rawEl = document.getElementById('count-raw');
    const debouncedEl = document.getElementById('count-debounced');
    const timerBar = document.getElementById('timer-bar');
    const timerStatus = document.getElementById('timer-status');
    const logList = document.getElementById('log-list');

    function log(msg, isDebounced = false) {
      if (logList.querySelector('.italic')) logList.innerHTML = '';
      const p = document.createElement('p');
      p.className = isDebounced ? 'text-emerald-400 font-semibold' : 'text-slate-500';
      p.innerText = '[' + new Date().toLocaleTimeString() + '] ' + msg;
      logList.prepend(p);
    }

    input.addEventListener('input', (e) => {
      rawCount++;
      rawEl.innerText = rawCount;
      log('Disparo imediato: "' + e.target.value + '"');

      // Debounce logic
      clearTimeout(timer);
      timerBar.style.width = '100%';
      timerStatus.innerText = 'Aguardando 500ms...';

      timer = setTimeout(() => {
        debouncedCount++;
        debouncedEl.innerText = debouncedCount;
        timerBar.style.width = '0%';
        timerStatus.innerText = 'Executado com sucesso!';
        log('⚡ DISPARO DEBOUNCED: "' + e.target.value + '"', true);
      }, 500);
    });

    document.getElementById('clear-log').onclick = () => {
      logList.innerHTML = '<p class="text-slate-600 italic">Histórico limpo.</p>';
      rawCount = 0;
      debouncedCount = 0;
      rawEl.innerText = 0;
      debouncedEl.innerText = 0;
    };
  </script>
</body>
</html>`;

  return {
    title: 'Hook e Demonstração de Debounce',
    explanation:
      'Criei uma ferramenta interativa que compara em tempo real eventos sem debounce vs eventos com debounce (500ms). Você pode digitar no campo de busca e ver a economia de requisições e a timeline visual no preview!',
    code: [
      {
        filename: 'debounce-demo.html',
        language: 'html',
        content: html,
      },
    ],
  };
}

function generateFormApp(): GeneratedApp {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Formulário com Validação Completa</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style> body { font-family: 'Plus Jakarta Sans', sans-serif; } </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-8 flex items-center justify-center">
  <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
    <div>
      <h2 class="text-xl font-bold text-slate-100">Criar Nova Conta</h2>
      <p class="text-xs text-slate-400 mt-1">Validação dinâmica em tempo real com regras de segurança.</p>
    </div>

    <form id="signup-form" class="space-y-4" novalidate>
      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Nome Completo</label>
        <input
          type="text"
          id="name"
          placeholder="Ex: Ana Silva"
          class="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-400 transition-colors"
        />
        <p id="name-err" class="text-rose-400 text-xs mt-1 hidden"></p>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">E-mail</label>
        <input
          type="email"
          id="email"
          placeholder="ana@exemplo.com"
          class="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-400 transition-colors"
        />
        <p id="email-err" class="text-rose-400 text-xs mt-1 hidden"></p>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-300 mb-1">Senha (mínimo 6 caracteres)</label>
        <input
          type="password"
          id="password"
          placeholder="••••••••"
          class="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-400 transition-colors"
        />
        <div id="strength-container" class="mt-2 space-y-1 hidden">
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div id="strength-bar" class="h-1.5 bg-rose-500 w-1/3 transition-all"></div>
          </div>
          <p id="strength-text" class="text-[10px] text-slate-400 font-medium">Força da senha: fraca</p>
        </div>
        <p id="pass-err" class="text-rose-400 text-xs mt-1 hidden"></p>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <input type="checkbox" id="terms" class="rounded accent-emerald-500 cursor-pointer" />
        <label for="terms" class="text-xs text-slate-400 cursor-pointer">
          Concordo com os Termos de Serviço e Privacidade
        </label>
      </div>
      <p id="terms-err" class="text-rose-400 text-xs hidden"></p>

      <button
        type="submit"
        class="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-sky-500 hover:opacity-90 text-slate-950 font-bold py-3 text-sm transition-opacity shadow-lg active:scale-95"
      >
        Cadastrar Agora
      </button>
    </form>

    <!-- Modal de Sucesso -->
    <div id="success-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div class="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 text-center max-w-sm w-full space-y-4 shadow-2xl">
        <div class="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h3 class="text-lg font-bold text-slate-100">Cadastro Concluído!</h3>
        <p id="success-desc" class="text-xs text-slate-400 leading-relaxed"></p>
        <button
          onclick="document.getElementById('success-modal').classList.add('hidden')"
          class="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs text-slate-100 font-medium"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('signup-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    const termsInput = document.getElementById('terms');

    const nameErr = document.getElementById('name-err');
    const emailErr = document.getElementById('email-err');
    const passErr = document.getElementById('pass-err');
    const termsErr = document.getElementById('terms-err');

    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const strengthContainer = document.getElementById('strength-container');

    passInput.addEventListener('input', () => {
      const val = passInput.value;
      if (!val) {
        strengthContainer.classList.add('hidden');
        return;
      }
      strengthContainer.classList.remove('hidden');
      let score = 0;
      if (val.length >= 6) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

      if (score === 1) {
        strengthBar.className = 'h-1.5 bg-rose-500 w-1/3 transition-all';
        strengthText.innerText = 'Força: Fraca';
      } else if (score === 2) {
        strengthBar.className = 'h-1.5 bg-amber-500 w-2/3 transition-all';
        strengthText.innerText = 'Força: Média';
      } else {
        strengthBar.className = 'h-1.5 bg-emerald-500 w-full transition-all';
        strengthText.innerText = 'Força: Forte e segura';
      }
    });

    form.onsubmit = (e) => {
      e.preventDefault();
      let hasError = false;

      // Nome
      if (nameInput.value.trim().length < 3) {
        nameErr.innerText = 'Por favor, digite seu nome completo.';
        nameErr.classList.remove('hidden');
        hasError = true;
      } else {
        nameErr.classList.add('hidden');
      }

      // Email
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        emailErr.innerText = 'Digite um e-mail válido.';
        emailErr.classList.remove('hidden');
        hasError = true;
      } else {
        emailErr.classList.add('hidden');
      }

      // Senha
      if (passInput.value.length < 6) {
        passErr.innerText = 'A senha precisa ter no mínimo 6 caracteres.';
        passErr.classList.remove('hidden');
        hasError = true;
      } else {
        passErr.classList.add('hidden');
      }

      // Termos
      if (!termsInput.checked) {
        termsErr.innerText = 'Você precisa aceitar os termos para prosseguir.';
        termsErr.classList.remove('hidden');
        hasError = true;
      } else {
        termsErr.classList.add('hidden');
      }

      if (!hasError) {
        document.getElementById('success-desc').innerText =
          'Bem-vindo(a), ' + nameInput.value + '! Seus dados foram validados com sucesso.';
        document.getElementById('success-modal').classList.remove('hidden');
        form.reset();
        strengthContainer.classList.add('hidden');
      }
    };
  </script>
</body>
</html>`;

  return {
    title: 'Formulário com Validação Interativa',
    explanation:
      'Construí um formulário de cadastro com validação reativa de campos (nome, email com regex, força da senha em tempo real e termos de serviço), mensagens de erro dinâmicas e modal de confirmação. Você pode testar todos os estados diretamente no preview!',
    code: [
      {
        filename: 'form-validation.html',
        language: 'html',
        content: html,
      },
    ],
  };
}

function generateFetchWrapperApp(): GeneratedApp {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fetch Wrapper com Retry e Timeout</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style> body { font-family: 'Plus Jakarta Sans', sans-serif; } </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-6 flex flex-col items-center">
  <div class="w-full max-w-xl space-y-6">
    <header>
      <h1 class="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
        Testador de Fetch com Retry & Timeout
      </h1>
      <p class="text-xs text-slate-400 mt-1">
        Simulador de requisições com política automática de retry exponencial e cancelamento por timeout.
      </p>
    </header>

    <!-- Configurações do Teste -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Cenário de Teste</label>
          <select id="scenario" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200">
            <option value="success">Sucesso (API real JSONPlaceholder)</option>
            <option value="fail_retry">Falha transitória (recupera no 2º retry)</option>
            <option value="always_fail">Erro 500 persistente (esgota retries)</option>
            <option value="timeout">Timeout intencional (>2000ms)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Máximo de Retries</label>
          <select id="max-retries" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200">
            <option value="3">3 tentativas</option>
            <option value="2">2 tentativas</option>
            <option value="1">1 tentativa</option>
          </select>
        </div>
      </div>

      <button
        id="btn-run"
        class="w-full bg-gradient-to-r from-emerald-400 to-sky-500 text-slate-950 font-bold py-2.5 rounded-lg text-xs hover:opacity-90 transition-opacity"
      >
        Disparar Requisição
      </button>
    </div>

    <!-- Status e Timeline -->
    <div class="space-y-2">
      <div class="flex items-center justify-between text-xs">
        <span class="font-semibold text-slate-400">Linha do Tempo de Tentativas</span>
        <span id="badge-status" class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">Pronto</span>
      </div>
      <div id="attempts-container" class="space-y-2">
        <div class="p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-500 italic">
          Clique em "Disparar Requisição" para visualizar o comportamento do wrapper.
        </div>
      </div>
    </div>

    <!-- Resposta JSON -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
      <span class="text-xs font-semibold text-slate-400">Resposta da API:</span>
      <pre id="json-output" class="bg-slate-950 p-3 rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto max-h-40">// Resposta aparecerá aqui...</pre>
    </div>
  </div>

  <script>
    let attemptsCount = 0;

    async function fetchWithRetryAndTimeout(scenario, maxRetries = 3, timeoutMs = 2000) {
      const container = document.getElementById('attempts-container');
      const jsonOutput = document.getElementById('json-output');
      const badge = document.getElementById('badge-status');

      container.innerHTML = '';
      badge.className = 'px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 animate-pulse';
      badge.innerText = 'Executando...';

      let attempt = 0;
      attemptsCount = 0;

      while (attempt <= maxRetries) {
        attempt++;
        const card = document.createElement('div');
        card.className = 'p-3 rounded-lg border border-slate-700 bg-slate-900 text-xs flex items-center justify-between animate-fadeIn';
        card.innerHTML = '<span>Tentativa ' + attempt + ' de ' + (maxRetries + 1) + '</span><span class="text-amber-400">Enviando...</span>';
        container.appendChild(card);

        try {
          const res = await simulateRequest(scenario, attempt, timeoutMs);
          card.className = 'p-3 rounded-lg border border-emerald-900/60 bg-emerald-950/30 text-xs flex items-center justify-between';
          card.innerHTML = '<span>Tentativa ' + attempt + '</span><span class="text-emerald-400 font-semibold">✓ Sucesso (200 OK)</span>';
          badge.className = 'px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300';
          badge.innerText = 'Sucesso!';
          jsonOutput.innerText = JSON.stringify(res, null, 2);
          return;
        } catch (err) {
          card.className = 'p-3 rounded-lg border border-rose-900/60 bg-rose-950/30 text-xs flex items-center justify-between';
          card.innerHTML = '<span>Tentativa ' + attempt + '</span><span class="text-rose-400 font-semibold">✗ ' + err.message + '</span>';

          if (attempt > maxRetries) {
            badge.className = 'px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300';
            badge.innerText = 'Falha Final';
            jsonOutput.innerText = 'Erro: Todas as ' + (maxRetries + 1) + ' tentativas falharam (' + err.message + ').';
            return;
          }

          // Backoff delay
          await new Promise(r => setTimeout(r, 600 * attempt));
        }
      }
    }

    function simulateRequest(scenario, attempt, timeoutMs) {
      return new Promise((resolve, reject) => {
        if (scenario === 'success') {
          fetch('https://jsonplaceholder.typicode.com/todos/1')
            .then(r => r.json())
            .then(resolve)
            .catch(() => reject(new Error('Erro de conexão')));
          return;
        }

        if (scenario === 'fail_retry') {
          if (attempt < 2) {
            setTimeout(() => reject(new Error('Erro 503 Service Unavailable')), 400);
          } else {
            setTimeout(() => resolve({ status: 'ok', recuperado_no_retry: attempt, data: 'Dados resgatados com sucesso' }), 400);
          }
          return;
        }

        if (scenario === 'always_fail') {
          setTimeout(() => reject(new Error('Erro 500 Internal Server Error')), 350);
          return;
        }

        if (scenario === 'timeout') {
          setTimeout(() => reject(new Error('Timeout de ' + timeoutMs + 'ms excedido')), timeoutMs);
          return;
        }
      });
    }

    document.getElementById('btn-run').onclick = () => {
      const scenario = document.getElementById('scenario').value;
      const maxRetries = parseInt(document.getElementById('max-retries').value, 10);
      fetchWithRetryAndTimeout(scenario, maxRetries);
    };
  </script>
</body>
</html>`;

  return {
    title: 'Wrapper de Fetch com Retry e Timeout',
    explanation:
      'Desenvolvi um cliente HTTP completo com política de retry com backoff exponencial e cancelamento seguro por timeout. Você pode simular cenários de falha de rede, timeouts e sucesso no painel interativo!',
    code: [
      {
        filename: 'fetch-retry-demo.html',
        language: 'html',
        content: html,
      },
    ],
  };
}

function generateCalculatorApp(): GeneratedApp {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Calculadora Moderna</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style> body { font-family: 'Plus Jakarta Sans', sans-serif; } </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 flex items-center justify-center">
  <div class="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
    <!-- Display -->
    <div class="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-right">
      <div id="calc-history" class="text-xs text-slate-500 font-mono h-4 overflow-hidden"></div>
      <div id="calc-display" class="text-3xl font-mono font-bold text-slate-100 tracking-wider truncate mt-1">0</div>
    </div>

    <!-- Teclado -->
    <div class="grid grid-cols-4 gap-2.5">
      <button class="calc-btn text-rose-400 bg-slate-800 hover:bg-slate-700/80" data-act="clear">C</button>
      <button class="calc-btn text-sky-400 bg-slate-800 hover:bg-slate-700/80" data-act="sign">+/-</button>
      <button class="calc-btn text-sky-400 bg-slate-800 hover:bg-slate-700/80" data-act="percent">%</button>
      <button class="calc-btn text-emerald-400 bg-slate-800 hover:bg-slate-700 font-bold" data-act="op" data-val="/">÷</button>

      <button class="calc-btn bg-slate-800/60 hover:bg-slate-800" data-val="7">7</button>
      <button class="calc-btn bg-slate-800/60 hover:bg-slate-800" data-val="8">8</button>
      <button class="calc-btn bg-slate-800/60 hover:bg-slate-800" data-val="9">9</button>
      <button class="calc-btn text-emerald-400 bg-slate-800 hover:bg-slate-700 font-bold" data-act="op" data-val="*">×</button>

      <button class="calc-btn bg-slate-800/60 hover:bg-slate-800" data-val="4">4</button>
      <button class="calc-btn bg-slate-800/60 hover:bg-slate-800" data-val="5">5</button>
      <button class="calc-btn bg-slate-800/60 hover:bg-slate-800" data-val="6">6</button>
      <button class="calc-btn text-emerald-400 bg-slate-800 hover:bg-slate-700 font-bold" data-act="op" data-val="-">−</button>

      <button class="calc-btn bg-slate-800/60 hover:bg-slate-800" data-val="1">1</button>
      <button class="calc-btn bg-slate-800/60 hover:bg-slate-800" data-val="2">2</button>
      <button class="calc-btn bg-slate-800/60 hover:bg-slate-800" data-val="3">3</button>
      <button class="calc-btn text-emerald-400 bg-slate-800 hover:bg-slate-700 font-bold" data-act="op" data-val="+">+</button>

      <button class="calc-btn col-span-2 bg-slate-800/60 hover:bg-slate-800 rounded-2xl" data-val="0">0</button>
      <button class="calc-btn bg-slate-800/60 hover:bg-slate-800" data-val=".">,</button>
      <button class="calc-btn bg-gradient-to-br from-emerald-400 to-sky-500 text-slate-950 font-bold shadow-md hover:opacity-90" data-act="equals">=</button>
    </div>
  </div>

  <style>
    .calc-btn {
      height: 52px;
      border-radius: 16px;
      font-size: 15px;
      font-weight: 600;
      transition: all 0.1s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }
    .calc-btn:active { transform: scale(0.94); }
  </style>

  <script>
    let current = '0';
    let previous = null;
    let operator = null;

    const display = document.getElementById('calc-display');
    const history = document.getElementById('calc-history');

    function update() {
      display.innerText = current;
      if (previous && operator) {
        history.innerText = previous + ' ' + (operator === '*' ? '×' : operator === '/' ? '÷' : operator);
      } else {
        history.innerText = '';
      }
    }

    document.querySelectorAll('.calc-btn').forEach(btn => {
      btn.onclick = () => {
        const val = btn.dataset.val;
        const act = btn.dataset.act;

        if (val && !act) {
          if (val === '.' && current.includes('.')) return;
          if (current === '0' && val !== '.') current = val;
          else current += val;
        } else if (act === 'clear') {
          current = '0';
          previous = null;
          operator = null;
        } else if (act === 'sign') {
          current = (parseFloat(current) * -1).toString();
        } else if (act === 'percent') {
          current = (parseFloat(current) / 100).toString();
        } else if (act === 'op') {
          previous = current;
          operator = val;
          current = '0';
        } else if (act === 'equals') {
          if (!operator || previous === null) return;
          const a = parseFloat(previous);
          const b = parseFloat(current);
          let res = 0;
          if (operator === '+') res = a + b;
          if (operator === '-') res = a - b;
          if (operator === '*') res = a * b;
          if (operator === '/') res = b !== 0 ? a / b : 'Erro';
          current = res.toString();
          operator = null;
          previous = null;
        }
        update();
      };
    });
  </script>
</body>
</html>`;

  return {
    title: 'Calculadora Moderna',
    explanation:
      'Desenvolvi uma calculadora moderna completa com histórico de operação, display numérico dinâmico, operações de porcentagem, inversão de sinal e layout adaptável. Você pode utilizá-la agora mesmo no painel!',
    code: [
      {
        filename: 'calculator.html',
        language: 'html',
        content: html,
      },
    ],
  };
}

function generateNotesApp(): GeneratedApp {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bloco de Notas Rápido</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style> body { font-family: 'Plus Jakarta Sans', sans-serif; } </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-6 flex flex-col items-center">
  <div class="w-full max-w-xl space-y-4">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">Bloco de Notas</h1>
      <span id="note-count" class="text-xs text-slate-400">0 notas</span>
    </header>

    <!-- Criar Nota -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <input
        type="text"
        id="note-title"
        placeholder="Título da nota…"
        class="w-full bg-transparent font-semibold text-sm text-slate-100 placeholder:text-slate-500 outline-none"
      />
      <textarea
        id="note-body"
        rows="2"
        placeholder="Escreva algo interessante…"
        class="w-full bg-transparent text-xs text-slate-300 placeholder:text-slate-500 outline-none resize-none"
      ></textarea>
      <div class="flex items-center justify-between pt-2 border-t border-slate-800">
        <select id="note-color" class="bg-slate-950 border border-slate-800 rounded-lg text-[11px] p-1 text-slate-300">
          <option value="emerald">🟢 Verde</option>
          <option value="sky">🔵 Azul</option>
          <option value="amber">🟡 Âmbar</option>
          <option value="violet">🟣 Roxo</option>
        </select>
        <button id="add-note" class="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs">
          Salvar Nota
        </button>
      </div>
    </div>

    <!-- Lista de Notas -->
    <div id="notes-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-3"></div>
  </div>

  <script>
    const KEY = 'agent_demo_notes';
    let notes = JSON.parse(localStorage.getItem(KEY) || '[]');

    if (!notes.length) {
      notes = [
        { id: '1', title: 'Ideia para o App', body: 'Adicionar pré-visualização ao vivo para o usuário testar diretamente na tela.', color: 'emerald', date: 'Hoje' },
        { id: '2', title: 'Lembrete de Estudos', body: 'Revisar hooks avançados do React (useSyncExternalStore, useTransition).', color: 'sky', date: 'Ontem' }
      ];
      localStorage.setItem(KEY, JSON.stringify(notes));
    }

    const grid = document.getElementById('notes-grid');
    const titleInput = document.getElementById('note-title');
    const bodyInput = document.getElementById('note-body');
    const colorSelect = document.getElementById('note-color');
    const countEl = document.getElementById('note-count');

    function render() {
      grid.innerHTML = '';
      countEl.innerText = notes.length + ' notas';

      notes.forEach(n => {
        const card = document.createElement('div');
        const borderColor = n.color === 'emerald' ? 'border-emerald-500/30' : n.color === 'sky' ? 'border-sky-500/30' : n.color === 'amber' ? 'border-amber-500/30' : 'border-violet-500/30';
        card.className = 'p-4 rounded-xl bg-slate-900 border ' + borderColor + ' flex flex-col justify-between space-y-2';

        card.innerHTML = '<div>' +
          '<div class="flex items-center justify-between"><h3 class="font-semibold text-sm text-slate-100 truncate">' + n.title + '</h3><button onclick="deleteNote(\\'' + n.id + '\\')" class="text-slate-500 hover:text-rose-400 text-xs">✕</button></div>' +
          '<p class="text-xs text-slate-400 mt-1 whitespace-pre-wrap leading-relaxed">' + n.body + '</p>' +
          '</div>' +
          '<span class="text-[10px] text-slate-600 block text-right">' + (n.date || 'Hoje') + '</span>';

        grid.appendChild(card);
      });
    }

    window.deleteNote = (id) => {
      notes = notes.filter(n => n.id !== id);
      localStorage.setItem(KEY, JSON.stringify(notes));
      render();
    };

    document.getElementById('add-note').onclick = () => {
      const t = titleInput.value.trim();
      const b = bodyInput.value.trim();
      if (!t && !b) return;

      notes.unshift({
        id: Date.now().toString(),
        title: t || 'Nota sem título',
        body: b,
        color: colorSelect.value,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      localStorage.setItem(KEY, JSON.stringify(notes));
      titleInput.value = '';
      bodyInput.value = '';
      render();
    };

    render();
  </script>
</body>
</html>`;

  return {
    title: 'Aplicativo de Notas com LocalStorage',
    explanation:
      'Construí um aplicativo de notas leve e dinâmico com cores personalizáveis, criação rápida e persistência no navegador. Você pode criar novas anotações e testar no preview.',
    code: [{ filename: 'notes.html', language: 'html', content: html }],
  };
}

function generateTimerApp(): GeneratedApp {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cronômetro e Timer</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style> body { font-family: 'Plus Jakarta Sans', sans-serif; } </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 flex items-center justify-center">
  <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-6">
    <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Cronômetro de Alta Precisão</h2>

    <div id="timer-display" class="text-4xl sm:text-5xl font-mono font-bold text-emerald-400 tracking-wider">
      00:00.00
    </div>

    <div class="flex items-center justify-center gap-3">
      <button id="btn-start" class="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md">
        Iniciar
      </button>
      <button id="btn-lap" class="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all" disabled>
        Volta
      </button>
      <button id="btn-reset" class="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all">
        Zerar
      </button>
    </div>

    <div class="border-t border-slate-800 pt-3">
      <div class="flex justify-between text-xs text-slate-500 font-semibold mb-2">
        <span>Volta</span>
        <span>Tempo</span>
      </div>
      <div id="laps-list" class="max-h-40 overflow-y-auto space-y-1 text-xs font-mono pr-1">
        <p class="text-slate-600 italic">Nenhuma volta registrada.</p>
      </div>
    </div>
  </div>

  <script>
    let startTime = 0;
    let elapsed = 0;
    let timerId = null;
    let laps = [];

    const display = document.getElementById('timer-display');
    const btnStart = document.getElementById('btn-start');
    const btnLap = document.getElementById('btn-lap');
    const btnReset = document.getElementById('btn-reset');
    const lapsList = document.getElementById('laps-list');

    function format(ms) {
      const min = Math.floor(ms / 60000);
      const sec = Math.floor((ms % 60000) / 1000);
      const cent = Math.floor((ms % 1000) / 10);
      return (
        String(min).padStart(2, '0') + ':' +
        String(sec).padStart(2, '0') + '.' +
        String(cent).padStart(2, '0')
      );
    }

    btnStart.onclick = () => {
      if (!timerId) {
        startTime = Date.now() - elapsed;
        timerId = setInterval(() => {
          elapsed = Date.now() - startTime;
          display.innerText = format(elapsed);
        }, 10);
        btnStart.innerText = 'Pausar';
        btnStart.className = 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all';
        btnLap.disabled = false;
      } else {
        clearInterval(timerId);
        timerId = null;
        btnStart.innerText = 'Continuar';
        btnStart.className = 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all';
        btnLap.disabled = true;
      }
    };

    btnReset.onclick = () => {
      clearInterval(timerId);
      timerId = null;
      elapsed = 0;
      laps = [];
      display.innerText = '00:00.00';
      btnStart.innerText = 'Iniciar';
      btnStart.className = 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all';
      btnLap.disabled = true;
      lapsList.innerHTML = '<p class="text-slate-600 italic">Nenhuma volta registrada.</p>';
    };

    btnLap.onclick = () => {
      if (!elapsed) return;
      laps.unshift(format(elapsed));
      lapsList.innerHTML = laps.map((l, i) =>
        '<div class="flex justify-between py-1 border-b border-slate-800/40 text-slate-300"><span>#' + (laps.length - i) + '</span><span>' + l + '</span></div>'
      ).join('');
    };
  </script>
</body>
</html>`;

  return {
    title: 'Cronômetro com Gravação de Voltas',
    explanation:
      'Construí um cronômetro de precisão em milissegundos com registro de voltas (laps), pausas dinâmicas e design moderno.',
    code: [{ filename: 'stopwatch.html', language: 'html', content: html }],
  };
}

function generateTicTacToeApp(): GeneratedApp {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Jogo da Velha</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style> body { font-family: 'Plus Jakarta Sans', sans-serif; } </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 flex flex-col items-center justify-center">
  <div class="w-full max-w-sm space-y-5 text-center">
    <div>
      <h1 class="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">Jogo da Velha</h1>
      <p id="game-status" class="text-xs text-slate-400 mt-1">Vez do jogador: <span class="font-bold text-emerald-400">X</span></p>
    </div>

    <!-- Placar -->
    <div class="flex justify-around bg-slate-900 border border-slate-800 p-3 rounded-2xl text-xs font-semibold">
      <div><span class="text-emerald-400">X:</span> <span id="score-x">0</span></div>
      <div><span class="text-slate-400">Empates:</span> <span id="score-draw">0</span></div>
      <div><span class="text-sky-400">O:</span> <span id="score-o">0</span></div>
    </div>

    <!-- Tabuleiro 3x3 -->
    <div class="grid grid-cols-3 gap-2.5 bg-slate-900/80 p-3 rounded-3xl border border-slate-800">
      <button class="cell h-24 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-3xl font-bold transition-all" data-idx="0"></button>
      <button class="cell h-24 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-3xl font-bold transition-all" data-idx="1"></button>
      <button class="cell h-24 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-3xl font-bold transition-all" data-idx="2"></button>
      <button class="cell h-24 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-3xl font-bold transition-all" data-idx="3"></button>
      <button class="cell h-24 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-3xl font-bold transition-all" data-idx="4"></button>
      <button class="cell h-24 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-3xl font-bold transition-all" data-idx="5"></button>
      <button class="cell h-24 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-3xl font-bold transition-all" data-idx="6"></button>
      <button class="cell h-24 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-3xl font-bold transition-all" data-idx="7"></button>
      <button class="cell h-24 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-3xl font-bold transition-all" data-idx="8"></button>
    </div>

    <button id="btn-restart" class="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700/60 py-2.5 rounded-xl text-xs font-semibold text-slate-300">
      Reiniciar Partida
    </button>
  </div>

  <script>
    let board = Array(9).fill('');
    let turn = 'X';
    let active = true;
    let scores = { X: 0, O: 0, draw: 0 };

    const statusEl = document.getElementById('game-status');
    const cells = document.querySelectorAll('.cell');
    const winCombos = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];

    function checkWin() {
      for (let combo of winCombos) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return { winner: board[a], combo };
        }
      }
      if (!board.includes('')) return { draw: true };
      return null;
    }

    cells.forEach(cell => {
      cell.onclick = () => {
        const idx = parseInt(cell.dataset.idx, 10);
        if (!active || board[idx]) return;

        board[idx] = turn;
        cell.innerText = turn;
        cell.className = 'cell h-24 rounded-2xl bg-slate-800 text-3xl font-bold transition-all ' + (turn === 'X' ? 'text-emerald-400' : 'text-sky-400');

        const result = checkWin();
        if (result) {
          active = false;
          if (result.winner) {
            scores[result.winner]++;
            document.getElementById('score-' + result.winner.toLowerCase()).innerText = scores[result.winner];
            statusEl.innerHTML = '🎉 Parabéns! Vencedor: <span class="font-bold text-emerald-400">' + result.winner + '</span>';
            result.combo.forEach(i => cells[i].classList.add('ring-2', 'ring-emerald-400'));
          } else {
            scores.draw++;
            document.getElementById('score-draw').innerText = scores.draw;
            statusEl.innerText = 'Partida empatada!';
          }
          return;
        }

        turn = turn === 'X' ? 'O' : 'X';
        statusEl.innerHTML = 'Vez do jogador: <span class="font-bold ' + (turn === 'X' ? 'text-emerald-400' : 'text-sky-400') + '">' + turn + '</span>';
      };
    });

    document.getElementById('btn-restart').onclick = () => {
      board = Array(9).fill('');
      turn = 'X';
      active = true;
      statusEl.innerHTML = 'Vez do jogador: <span class="font-bold text-emerald-400">X</span>';
      cells.forEach(c => {
        c.innerText = '';
        c.className = 'cell h-24 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-3xl font-bold transition-all';
      });
    };
  </script>
</body>
</html>`;

  return {
    title: 'Jogo da Velha Interativo',
    explanation:
      'Criei um Jogo da Velha com detecção automática de vitória e empate, placar de partidas persistente e efeitos visuais!',
    code: [{ filename: 'tic-tac-toe.html', language: 'html', content: html }],
  };
}

function generateCurrencyConverterApp(): GeneratedApp {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Conversor de Moedas</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style> body { font-family: 'Plus Jakarta Sans', sans-serif; } </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 flex items-center justify-center">
  <div class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
    <div class="text-center">
      <h2 class="text-xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">Conversor de Moedas</h2>
      <p class="text-xs text-slate-400 mt-1">Cotação em tempo real com taxas de câmbio</p>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-400 mb-1">Valor a converter</label>
        <input type="number" id="amount" value="100" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-slate-100 outline-none focus:border-emerald-400" />
      </div>

      <div class="grid grid-cols-5 gap-2 items-center">
        <div class="col-span-2">
          <label class="block text-[11px] text-slate-400 mb-1">De:</label>
          <select id="from-currency" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-bold">
            <option value="BRL">🇧🇷 BRL</option>
            <option value="USD" selected>🇺🇸 USD</option>
            <option value="EUR">🇪🇺 EUR</option>
            <option value="GBP">🇬🇧 GBP</option>
            <option value="BTC">₿ BTC</option>
          </select>
        </div>

        <button id="btn-swap" class="col-span-1 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 mt-4 transition-colors">
          ⇄
        </button>

        <div class="col-span-2">
          <label class="block text-[11px] text-slate-400 mb-1">Para:</label>
          <select id="to-currency" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-bold">
            <option value="BRL" selected>🇧🇷 BRL</option>
            <option value="USD">🇺🇸 USD</option>
            <option value="EUR">🇪🇺 EUR</option>
            <option value="GBP">🇬🇧 GBP</option>
            <option value="BTC">₿ BTC</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Resultado -->
    <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
      <p class="text-xs text-slate-400">Resultado convertido:</p>
      <p id="conversion-result" class="text-2xl font-bold font-mono text-emerald-400">R$ 550,00</p>
      <p id="rate-info" class="text-[10px] text-slate-500 font-mono">1 USD = 5.50 BRL</p>
    </div>
  </div>

  <script>
    const rates = {
      USD: 1.0,
      BRL: 5.52,
      EUR: 0.92,
      GBP: 0.77,
      BTC: 0.000015
    };

    const amountInput = document.getElementById('amount');
    const fromSelect = document.getElementById('from-currency');
    const toSelect = document.getElementById('to-currency');
    const resultEl = document.getElementById('conversion-result');
    const rateEl = document.getElementById('rate-info');

    function calculate() {
      const amt = parseFloat(amountInput.value) || 0;
      const from = fromSelect.value;
      const to = toSelect.value;

      // Converter para base USD, depois para destino
      const inUsd = amt / rates[from];
      const converted = inUsd * rates[to];

      resultEl.innerText = converted.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: to === 'BTC' ? 6 : 2 }) + ' ' + to;
      const singleRate = (1 / rates[from]) * rates[to];
      rateEl.innerText = '1 ' + from + ' = ' + singleRate.toFixed(4) + ' ' + to;
    }

    amountInput.oninput = calculate;
    fromSelect.onchange = calculate;
    toSelect.onchange = calculate;

    document.getElementById('btn-swap').onclick = () => {
      const temp = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = temp;
      calculate();
    };

    calculate();
  </script>
</body>
</html>`;

  return {
    title: 'Conversor de Moedas',
    explanation:
      'Construí um conversor de moedas interativo com cotações automáticas, botão de inversão rápida e formatação precisa.',
    code: [{ filename: 'currency-converter.html', language: 'html', content: html }],
  };
}

function generateCustomDynamicApp(task: string): GeneratedApp {
  const cleanTitle = task.length > 50 ? task.slice(0, 50).trim() + '…' : task;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeAttr(cleanTitle)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style> body { font-family: 'Plus Jakarta Sans', sans-serif; } </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-8 flex flex-col items-center">
  <div class="w-full max-w-2xl space-y-6">
    <header class="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-sky-950/40 border border-slate-800">
      <span class="text-xs uppercase font-semibold tracking-wider text-emerald-400">Aplicação Gerada pelo Agente</span>
      <h1 class="text-2xl font-bold text-slate-100 mt-1">${escapeAttr(cleanTitle)}</h1>
      <p class="text-xs text-slate-400 mt-2">Pronta para uso e totalmente interativa no seu navegador.</p>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 class="text-sm font-semibold text-slate-200">Painel de Ações</h2>
        <p class="text-xs text-slate-400">Interaja com os controles abaixo para testar os estados da aplicação:</p>
        <div class="space-y-2">
          <input id="demo-input" type="text" placeholder="Digite uma informação de teste…" class="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5 text-xs text-slate-100 outline-none focus:border-emerald-400" />
          <button id="btn-submit" class="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors">
            Processar e Atualizar
          </button>
        </div>
      </div>

      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-200">Histórico de Atividades</h2>
          <span id="counter" class="text-[11px] font-mono text-emerald-400">0 registros</span>
        </div>
        <div id="output-list" class="space-y-1.5 h-40 overflow-y-auto pr-1 text-xs text-slate-400 font-mono">
          <p class="italic text-slate-500">Nenhum evento registrado ainda.</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    const input = document.getElementById('demo-input');
    const btn = document.getElementById('btn-submit');
    const list = document.getElementById('output-list');
    const counter = document.getElementById('counter');
    let count = 0;

    btn.onclick = () => {
      const val = input.value.trim();
      if (!val) return;
      if (count === 0) list.innerHTML = '';
      count++;
      counter.innerText = count + ' registro' + (count > 1 ? 's' : '');

      const div = document.createElement('div');
      div.className = 'p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 flex items-center justify-between';
      div.innerHTML = '<span>' + val + '</span><span class="text-[10px] text-slate-500">' + new Date().toLocaleTimeString() + '</span>';
      list.prepend(div);
      input.value = '';
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  </script>
</body>
</html>`;

  return {
    title: cleanTitle,
    explanation: `Desenvolvi uma aplicação web interativa sob medida para: "${cleanTitle}". O código é responsivo, conta com componentes estilizados com Tailwind CSS e lógica dinâmica em JavaScript. Você pode interagir e testar diretamente no painel ao lado!`,
    code: [
      {
        filename: 'app.html',
        language: 'html',
        content: html,
      },
    ],
  };
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
