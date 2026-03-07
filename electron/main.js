/* global process */
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import nodemailer from 'nodemailer';

const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain } = require('electron');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;
const STATE_PATH = join(app.getPath('userData'), 'window-state.json');

// Suppress Electron's noisy CSP warning in development runtime only.
// Production builds should still rely on a proper CSP policy.
if (isDev) {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

let mainWindow;

function getSavedState() {
    try {
        if (existsSync(STATE_PATH)) {
            return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
        }
    } catch (e) {
        console.error('Failed to read window state', e);
    }
    return { width: 1400, height: 900, x: undefined, y: undefined, isMaximized: false };
}

function saveState() {
    if (!mainWindow) return;
    try {
        const bounds = mainWindow.getBounds();
        const state = {
            ...bounds,
            isMaximized: mainWindow.isMaximized()
        };
        writeFileSync(STATE_PATH, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save window state', e);
    }
}

function createWindow() {
    const state = getSavedState();

    mainWindow = new BrowserWindow({
        width: state.width,
        height: state.height,
        x: state.x,
        y: state.y,
        minWidth: 1024,
        minHeight: 768,
        frame: false,
        icon: join(__dirname, isDev ? '../public/appIcon.ico' : '../dist/appIcon.ico'),
        backgroundColor: '#00000000', // Support transparency for glass feel
        webPreferences: {
            preload: join(__dirname, 'preload.mjs'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    if (state.isMaximized) {
        mainWindow.maximize();
    }

    if (isDev) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(join(__dirname, '../dist/index.html'));
    }

    // Save state on close/resize/move
    mainWindow.on('close', saveState);
    mainWindow.on('resize', saveState);
    mainWindow.on('move', saveState);

    // Handle Window Controls
    ipcMain.on('window-minimize', () => mainWindow.minimize());
    ipcMain.on('window-maximize', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.restore();
        } else {
            mainWindow.maximize();
        }
    });
    ipcMain.on('window-close', () => mainWindow.close());

    ipcMain.removeHandler('mail-send');
    ipcMain.handle('mail-send', async (_event, payload) => {
        try {
            const smtp = payload?.smtp || {};
            const message = payload?.message || {};
            const to = Array.isArray(message.to) ? message.to : [message.to].filter(Boolean);
            if (!smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
                return { ok: false, error: 'SMTP configuration is incomplete.' };
            }
            if (!to.length) {
                return { ok: false, error: 'Recipient email is required.' };
            }

            const transporter = nodemailer.createTransport({
                host: String(smtp.host),
                port: Number(smtp.port),
                secure: Number(smtp.port) === 465,
                auth: {
                    user: String(smtp.user),
                    pass: String(smtp.pass),
                },
            });

            const smtpUser = String(smtp.user || '').trim();
            const preferredFromEmail = String(smtp.fromEmail || '').trim();
            const fromName = String(smtp.fromName || '').trim();
            const replyToEmail = String(smtp.replyTo || preferredFromEmail || '').trim();

            // Use authenticated mailbox as sender to satisfy providers that reject non-owned From addresses.
            const fromAddress = smtpUser;
            const fromHeader = fromName ? `"${fromName}" <${fromAddress}>` : fromAddress;

            await transporter.sendMail({
                from: fromHeader,
                replyTo: replyToEmail || undefined,
                to,
                subject: String(message.subject || ''),
                html: String(message.html || ''),
                text: String(message.text || ''),
            });

            return { ok: true };
        } catch (error) {
            const rawMessage = String(error?.message || 'Failed to send email.');
            if (rawMessage.includes('550') && rawMessage.toLowerCase().includes('from address')) {
                return {
                    ok: false,
                    error: 'SMTP rejected sender address. Use SMTP User as sender mailbox, or authorize the From address at your mail provider.'
                };
            }
            return { ok: false, error: rawMessage };
        }
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
