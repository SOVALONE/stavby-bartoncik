// Windows desktop app: a window around the online admin panel.
// The panel itself lives on GitHub Pages, so the app always shows the latest version.
const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const path = require('path');

const ADMIN_URL = 'https://sovalone.github.io/stavby-bartoncik/admin/';
const ORIGIN = new URL(ADMIN_URL).origin;

function offlinePage() {
  const html = `<!doctype html><meta charset="utf-8"><title>Stavby Bartončík</title>
  <body style="margin:0;height:100vh;display:grid;place-items:center;background:#0e1013;color:#eef0f1;font:16px system-ui,Segoe UI,sans-serif;text-align:center">
  <div><div style="font-size:54px;color:#f2b705">⚠</div>
  <h2 style="margin:10px 0">Nelze se připojit k internetu</h2>
  <p style="color:#8d969d">Немає з'єднання з інтернетом. Перевірте připojení a zkuste to znovu.</p>
  <button onclick="location.href='${ADMIN_URL}'" style="margin-top:14px;padding:12px 22px;border:0;border-radius:999px;background:#f2b705;font-weight:600;cursor:pointer">Zkusit znovu / Спробувати ще</button></div></body>`;
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 880,
    minWidth: 400,
    minHeight: 500,
    backgroundColor: '#0e1013',
    title: 'Stavby Bartončík – Správa webu',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: true }
  });

  // Links to other sites (GitHub token page, the public website) open in the normal browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('data:')) return;
    if (!url.startsWith(ADMIN_URL)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  // Warn before closing with unsaved changes (the page sets beforeunload).
  win.webContents.on('will-prevent-unload', (e) => {
    const choice = dialog.showMessageBoxSync(win, {
      type: 'question',
      buttons: ['Zavřít bez uložení / Закрити без збереження', 'Zůstat / Залишитись'],
      defaultId: 1,
      cancelId: 1,
      title: 'Neuložené změny',
      message: 'Máte neuložené změny. Opravdu zavřít?\nЄ незбережені зміни. Точно закрити?'
    });
    if (choice === 0) e.preventDefault();
  });

  win.webContents.on('did-fail-load', (_e, code, _desc, url, isMainFrame) => {
    if (isMainFrame && code !== -3 && url.startsWith(ORIGIN)) win.loadURL(offlinePage());
  });

  win.loadURL(ADMIN_URL);
}

Menu.setApplicationMenu(null);
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
