const { contextBridge } = require('electron');

// Minimal preload — the app talks to Supabase directly from the renderer,
// so we don't need to expose Node APIs. Kept for future native bridges.
contextBridge.exposeInMainWorld('agentDesktop', {
  platform: process.platform,
  isElectron: true,
});
