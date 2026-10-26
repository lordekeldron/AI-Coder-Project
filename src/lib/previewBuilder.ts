import type { CodeBlock } from './supabase';

/**
 * Compila blocos de código (HTML, JS, CSS, TS, React) em um documento HTML
 * totalmente funcional e interativo para rodar dentro de um iframe sandboxed.
 */
export function generateRunnableHtml(codeBlocks: CodeBlock[], appTitle = 'Aplicativo do Agente'): string {
  if (!codeBlocks || codeBlocks.length === 0) {
    return createEmptyStateHtml('Nenhum código disponível para execução.');
  }

  // 1. Verifica se há um arquivo HTML completo
  const htmlBlock = codeBlocks.find(
    (b) =>
      b.filename.endsWith('.html') ||
      b.language === 'html' ||
      b.content.includes('<!DOCTYPE') ||
      b.content.includes('<html')
  );

  const cssBlocks = codeBlocks.filter((b) => b.filename.endsWith('.css') || b.language === 'css');
  const jsBlocks = codeBlocks.filter(
    (b) =>
      b !== htmlBlock &&
      (b.filename.endsWith('.js') ||
        b.filename.endsWith('.ts') ||
        b.filename.endsWith('.jsx') ||
        b.filename.endsWith('.tsx') ||
        b.language === 'javascript' ||
        b.language === 'typescript' ||
        b.language === 'jsx' ||
        b.language === 'tsx')
  );

  const combinedCss = cssBlocks.map((b) => b.content).join('\n\n');
  const combinedJs = jsBlocks.map((b) => b.content).join('\n\n');

  if (htmlBlock && (htmlBlock.content.includes('<!DOCTYPE') || htmlBlock.content.includes('<html'))) {
    // Insere console logger e CSS adicional se houver
    return injectConsoleLogger(htmlBlock.content, combinedCss, combinedJs);
  }

  // 2. Se for código React / TSX
  const isReact =
    codeBlocks.some(
      (b) =>
        b.content.includes('useState') ||
        b.content.includes('React.') ||
        b.content.includes('import React') ||
        b.filename.endsWith('.jsx') ||
        b.filename.endsWith('.tsx')
    ) || combinedJs.includes('useState');

  if (isReact) {
    return buildReactHtml(appTitle, combinedJs, combinedCss, htmlBlock?.content);
  }

  // 3. Se for HTML parcial + JS + CSS
  return buildVanillaHtml(appTitle, htmlBlock?.content || '', combinedCss, combinedJs);
}

function injectConsoleLogger(fullHtml: string, extraCss = '', extraJs = ''): string {
  const loggerScript = `
  <script>
    (function() {
      const origLog = console.log;
      const origError = console.error;
      const origWarn = console.warn;
      function send(type, args) {
        try {
          const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          window.parent.postMessage({ type: 'preview-console', level: type, message: msg }, '*');
        } catch(e) {}
      }
      console.log = function(...args) { origLog.apply(console, args); send('log', args); };
      console.error = function(...args) { origError.apply(console, args); send('error', args); };
      console.warn = function(...args) { origWarn.apply(console, args); send('warn', args); };
      window.addEventListener('error', function(e) {
        send('error', [e.message || 'Erro na execução']);
      });
    })();
  </script>
  `;

  let result = fullHtml;

  if (extraCss) {
    result = result.replace('</head>', `<style>${extraCss}</style></head>`);
  }
  if (extraJs) {
    result = result.replace('</body>', `<script>${extraJs}</script></body>`);
  }

  if (result.includes('<head>')) {
    result = result.replace('<head>', `<head>${loggerScript}`);
  } else {
    result = loggerScript + result;
  }

  return result;
}

function buildReactHtml(title: string, rawJs: string, css: string, rawHtml?: string): string {
  // Limpa imports ES modules que não rodam nativamente no Babel standalone simples
  const cleanedCode = cleanReactImports(rawJs);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      min-height: 100vh;
    }
    ${css}
  </style>
  <script>
    (function() {
      function send(type, args) {
        try {
          const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          window.parent.postMessage({ type: 'preview-console', level: type, message: msg }, '*');
        } catch(e) {}
      }
      const _log = console.log, _err = console.error, _warn = console.warn;
      console.log = (...args) => { _log.apply(console, args); send('log', args); };
      console.error = (...args) => { _err.apply(console, args); send('error', args); };
      console.warn = (...args) => { _warn.apply(console, args); send('warn', args); };
      window.addEventListener('error', (e) => send('error', [e.message]));
    })();
  </script>
</head>
<body class="bg-slate-950 text-slate-100 antialiased">
  <div id="root">
    ${rawHtml || ''}
  </div>

  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;

    ${cleanedCode}

    // Tenta montar o componente principal
    try {
      const rootEl = document.getElementById('root');
      if (typeof App !== 'undefined') {
        ReactDOM.createRoot(rootEl).render(<App />);
      } else if (typeof Main !== 'undefined') {
        ReactDOM.createRoot(rootEl).render(<Main />);
      } else if (typeof Demo !== 'undefined') {
        ReactDOM.createRoot(rootEl).render(<Demo />);
      } else if (typeof Component !== 'undefined') {
        ReactDOM.createRoot(rootEl).render(<Component />);
      }
    } catch (err) {
      console.error('Erro ao montar componente React:', err);
    }
  </script>
</body>
</html>`;
}

function buildVanillaHtml(title: string, bodyContent: string, css: string, js: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      min-height: 100vh;
    }
    ${css}
  </style>
  <script>
    (function() {
      function send(type, args) {
        try {
          const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          window.parent.postMessage({ type: 'preview-console', level: type, message: msg }, '*');
        } catch(e) {}
      }
      const _log = console.log, _err = console.error, _warn = console.warn;
      console.log = (...args) => { _log.apply(console, args); send('log', args); };
      console.error = (...args) => { _err.apply(console, args); send('error', args); };
      console.warn = (...args) => { _warn.apply(console, args); send('warn', args); };
      window.addEventListener('error', (e) => send('error', [e.message]));
    })();
  </script>
</head>
<body class="bg-slate-950 text-slate-100 antialiased p-4 sm:p-6 min-h-screen">
  ${
    bodyContent ||
    `<div class="max-w-md mx-auto text-center py-12">
      <h1 class="text-xl font-bold text-slate-100">${escapeHtml(title)}</h1>
      <p class="text-slate-400 text-sm mt-2">Aplicativo pronto para testes.</p>
    </div>`
  }

  <script>
    try {
      ${js}
    } catch (err) {
      console.error('Erro na execução do script:', err);
    }
  </script>
</body>
</html>`;
}

function cleanReactImports(code: string): string {
  // Remove `import ... from '...'` e `export default ...`
  return code
    .replace(/^import\s+.*?;?$/gm, '')
    .replace(/^export\s+default\s+function\s+/gm, 'function ')
    .replace(/^export\s+default\s+/gm, 'const App = ')
    .replace(/^export\s+function\s+/gm, 'function ')
    .replace(/^export\s+const\s+/gm, 'const ');
}

function createEmptyStateHtml(message: string): string {
  return `<!doctype html>
<html>
<body style="background:#090d16;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>${escapeHtml(message)}</p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
