const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isDev = process.env.ELECTRON_IS_DEV === '1';

function showFallbackError(win, message) {
  const safeMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AI Programming Agent</title>
  <style>
    body {
      background: #0f172a;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 32px;
      max-width: 560px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      border-radius: 12px;
      background: linear-gradient(135deg, #34d399, #38bdf8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #0f172a;
      font-size: 20px;
    }
    h2 { margin: 0 0 12px 0; color: #f8fafc; font-size: 20px; }
    p { margin: 0 0 24px 0; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: left; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #34d399, #38bdf8);
      color: #0f172a;
      font-weight: 600;
      font-size: 13px;
      padding: 10px 24px;
      border-radius: 8px;
      cursor: pointer;
      border: none;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">A</div>
    <h2>AI Programming Agent</h2>
    <p>${safeMessage}</p>
    <button class="btn" onclick="location.reload()">Retry / Recarregar</button>
  </div>
</body>
</html>`;
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f172a',
    title: 'AI Programming Agent',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Enable F12 or Ctrl+Shift+I to toggle DevTools anytime for troubleshooting
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Open external links (e.g. GitHub PR links) in the system browser, not inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');

  if (isDev) {
    const devPort = process.env.VITE_PORT || process.env.PORT || 3000;
    const devUrl = `http://localhost:${devPort}`;
    win.loadURL(devUrl).catch(() => {
      if (fs.existsSync(distIndexPath)) {
        win.loadFile(distIndexPath);
      } else {
        win.loadURL('http://localhost:5173').catch(() => {
          showFallbackError(
            win,
            `Could not connect to Vite dev server at ${devUrl} or http://localhost:5173.<br/><br/>Please run <code>npm run dev</code> or <code>npm run build</code> first.`
          );
        });
      }
    });
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production or running standalone
    if (fs.existsSync(distIndexPath)) {
      win.loadFile(distIndexPath);
    } else {
      // If dist hasn't been built yet, try connecting to dev server
      const devPort = process.env.VITE_PORT || process.env.PORT || 3000;
      win.loadURL(`http://localhost:${devPort}`).catch(() => {
        win.loadURL('http://localhost:5173').catch(() => {
          showFallbackError(
            win,
            `O build da aplicação não foi encontrado em <code>dist/index.html</code> e o servidor de desenvolvimento não está ativo.<br/><br/>Para abrir a aplicação, execute no terminal:<br/><code>npm run build</code><br/>e abra novamente o programa.`
          );
        });
      });
    }
  }

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return; // Ignore aborted loads
    console.error(`Failed to load ${validatedURL}: [${errorCode}] ${errorDescription}`);
    showFallbackError(
      win,
      `Falha ao carregar a interface (${errorDescription}).<br/><br/>Se você estiver executando no computador, certifique-se de executar <code>npm run build</code> para gerar a pasta dist ou execute <code>npm run electron:dev</code>.`
    );
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
