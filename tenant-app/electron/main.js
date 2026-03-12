/* global process */
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import nodemailer from 'nodemailer';

const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain, shell } = require('electron');
import { OAuth2Client } from 'google-auth-library';
import http from 'http';
import { parse } from 'url';

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
            const google = payload?.google || {};
            const message = payload?.message || {};
            const to = Array.isArray(message.to) ? message.to : [message.to].filter(Boolean);

            if (!to.length) {
                return { ok: false, error: 'Recipient email is required.' };
            }

            let transporterConfig;

            if (google.clientId && google.clientSecret && google.refreshToken) {
                // Gmail OAuth2 mode
                transporterConfig = {
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user: google.userEmail,
                        clientId: google.clientId,
                        clientSecret: google.clientSecret,
                        refreshToken: google.refreshToken,
                    }
                };
            } else if (smtp.host && smtp.port && smtp.user && smtp.pass) {
                // Standard SMTP mode
                transporterConfig = {
                    host: String(smtp.host),
                    port: Number(smtp.port),
                    secure: Number(smtp.port) === 465,
                    auth: {
                        user: String(smtp.user),
                        pass: String(smtp.pass),
                    },
                };
            } else {
                return { ok: false, error: 'No valid mail configuration provided (SMTP or Gmail OAuth).' };
            }

            const transporter = nodemailer.createTransport(transporterConfig);

            const fromName = String(smtp.fromName || google.fromName || '').trim();
            const fromEmail = String(smtp.fromEmail || google.userEmail || '').trim();
            const replyToEmail = String(smtp.replyTo || google.replyTo || fromEmail || '').trim();

            const fromHeader = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

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

    // Gmail OAuth Authentication Handler
    ipcMain.handle('mail-auth-start', async (_event, { clientId, clientSecret, redirectUri }) => {
        return new Promise((resolve, reject) => {
            const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

            const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.email'],
                prompt: 'consent'
            });

            shell.openExternal(authUrl);

            // Create a temporary server to listen for the redirect
            const server = http.createServer(async (req, res) => {
                try {
                    const urlParts = parse(req.url, true);
                    const code = urlParts.query.code;

                    if (code) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<h1>Authentication Successful!</h1><p>You can close this window now.</p>');
                        
                        const { tokens } = await oauth2Client.getToken(code);
                        resolve({ ok: true, tokens });
                    } else {
                        res.writeHead(400, { 'Content-Type': 'text/html' });
                        res.end('<h1>Authentication Failed</h1><p>No code found in redirect.</p>');
                        reject(new Error('No code found in redirect'));
                    }
                } catch (err) {
                    res.writeHead(500);
                    res.end('Internal Server Error');
                    reject(err);
                } finally {
                    server.close();
                }
            }).listen(8888); // Ensure this matches the redirectUri port if possible
        });
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
