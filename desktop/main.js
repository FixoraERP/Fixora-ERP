const { app, BrowserWindow, shell, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

function readConfig() {
  const configPath = path.join(__dirname, "config.json");
  try {
    const data = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return { appName: data.appName || "Fixora ERP", url: data.url || "https://SEU-PROJETO.vercel.app", width: Number(data.width || 1280), height: Number(data.height || 800) };
  } catch {
    return { appName: "Fixora ERP", url: "https://SEU-PROJETO.vercel.app", width: 1280, height: 800 };
  }
}
function isValidUrl(url) {
  try { const parsed = new URL(url); return parsed.protocol === "https:" || parsed.protocol === "http:"; } catch { return false; }
}
function createWindow() {
  const config = readConfig();
  const iconPath = path.join(__dirname, "icon.ico");
  Menu.setApplicationMenu(null);
  if (!config.url || config.url.includes("SEU-PROJETO") || !isValidUrl(config.url)) {
    dialog.showMessageBox({ type: "warning", title: "Configuração necessária", message: "Configure a URL real da Vercel no arquivo desktop/config.json." });
  }
  const win = new BrowserWindow({
    width: config.width, height: config.height, minWidth: 1000, minHeight: 650,
    title: config.appName, autoHideMenuBar: true, backgroundColor: "#09090b", icon: iconPath,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true }
  });
  win.loadURL(config.url);
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("did-fail-load", () => {
    dialog.showMessageBox({ type: "error", title: "Falha ao abrir o Fixora ERP", message: "Verifique internet e URL da Vercel no config.json." });
  });
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
