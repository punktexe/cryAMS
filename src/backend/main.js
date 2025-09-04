import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import session from 'express-session';
import PDFDocument from 'pdfkit';
import { DataStore } from '../common/data-store.js';
import EmailService from '../common/email-service.js';
import AdminAuth from '../common/admin-auth.js';

// Lade .env Datei
dotenv.config();

// Hilfsfunktion für Ländernamen
function getCountryName(countryCode) {
  const countries = {
    'DE': 'Deutschland',
    'AT': 'Österreich', 
    'CH': 'Schweiz',
    'OTHER': 'Anderes Land'
  };
  return countries[countryCode] || countryCode;
}

// PDF-Generierung für Aufkleber
async function generateStickerPDF(profile, layout) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const pageWidth = 595.28 - 100; // A4 width minus margins
      const pageHeight = 841.89 - 100; // A4 height minus margins
      
      const { rows, cols } = layout;
      const stickerWidth = pageWidth / cols;
      const stickerHeight = pageHeight / rows;
      
      // QR-Code als SVG erstellen
      QRCode.toString(profile.url, { type: 'svg', width: 200 }, (err, qrSvg) => {
        if (err) {
          reject(err);
          return;
        }

        // Header
        doc.fontSize(20).fillColor('#333').text('cryAMS - QR-Code Aufkleber', 50, 30);
        doc.fontSize(12).text(`Profil: ${profile.name} | Layout: ${rows}x${cols}`, 50, 55);
        
        let stickerCount = 0;
        const maxStickers = rows * cols;
        
        for (let row = 0; row < rows && stickerCount < maxStickers; row++) {
          for (let col = 0; col < cols && stickerCount < maxStickers; col++) {
            const x = 50 + col * stickerWidth;
            const y = 80 + row * stickerHeight;
            
            // Aufkleber-Rahmen
            doc.rect(x + 5, y + 5, stickerWidth - 10, stickerHeight - 10)
               .stroke('#ddd');
            
            // Header des Aufklebers
            doc.fontSize(12).fillColor('#007bff').text('🔒 cryAMS', x + 15, y + 15);
            doc.fontSize(8).fillColor('#666').text('Anonymous Message', x + 15, y + 30);
            
            // QR-Code Platzhalter (vereinfacht, da SVG-Integration komplex ist)
            const qrSize = Math.min(stickerWidth - 30, stickerHeight - 80);
            const qrX = x + (stickerWidth - qrSize) / 2;
            const qrY = y + 45;
            
            doc.rect(qrX, qrY, qrSize, qrSize).stroke('#333');
            doc.fontSize(8).fillColor('#333').text('QR-Code', qrX + qrSize/2 - 15, qrY + qrSize/2 - 4);
            
            // Footer des Aufklebers
            doc.fontSize(8).fillColor('#333')
               .text('Scanne für anonyme', x + 15, y + stickerHeight - 35)
               .text('Nachrichten', x + 15, y + stickerHeight - 25)
               .fontSize(6).fillColor('#666')
               .text(profile.url.replace('http://', '').replace('https://', ''), x + 15, y + stickerHeight - 15);
            
            stickerCount++;
          }
        }
        
        // Footer
        doc.fontSize(8).fillColor('#666')
           .text(`Generiert am: ${new Date().toLocaleDateString('de-DE')} für ${profile.name}`, 50, pageHeight + 70)
           .text('Druckempfehlung: 600 DPI auf Aufkleber-Papier', 50, pageHeight + 85);
        
        doc.end();
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

// E-Mail mit PDF-Anhang senden
async function sendPDFByEmail(profile, pdfBuffer) {
  try {
    const filename = `cryAMS-Aufkleber-${profile.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const layoutInfo = profile.stickerPDF ? ` (${profile.stickerPDF.count} Aufkleber im ${profile.stickerPDF.layout}-Layout)` : '';
    
    const mailOptions = {
      to: profile.email,
      subject: `🎉 Dein cryAMS QR-Code ist bereit${layoutInfo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🔒 cryAMS</h1>
            <h2 style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Dein QR-Code ist bereit!</h2>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p>Hallo <strong>${profile.name}</strong>,</p>
            
            <p>dein QR-Code wurde erfolgreich erstellt und genehmigt! 🎉</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #007bff; margin-top: 0;">📱 Dein QR-Code Details:</h3>
              <p><strong>🔗 URL:</strong> <a href="${profile.url}" style="color: #007bff;">${profile.url}</a></p>
              <p><strong>📝 Beschreibung:</strong> ${profile.description || 'Keine Beschreibung'}</p>
              <p><strong>📅 Erstellt am:</strong> ${new Date(profile.createdAt).toLocaleDateString('de-DE')}</p>
            </div>
            
            ${profile.stickerPDF ? `
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                <h3 style="color: #0277bd; margin-top: 0;">📄 PDF-Aufkleber angehängt!</h3>
                <p><strong>Layout:</strong> ${profile.stickerPDF.count} Aufkleber (${profile.stickerPDF.layout})</p>
                <p><strong>Datei:</strong> ${filename}</p>
                <p style="font-size: 14px; color: #666;">
                  💡 <strong>Drucktipps:</strong><br>
                  • Drucke in höchster Qualität (600+ DPI)<br>
                  • Verwende wasserfeste Aufkleber-Bögen<br>
                  • Teste erst mit normalem Papier<br>
                  • QR-Code vor dem Aufkleben testen
                </p>
              </div>
            ` : ''}
            
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #155724; margin-top: 0;">💬 Wie es funktioniert:</h3>
              <ol style="color: #155724; padding-left: 20px;">
                <li>Teile deinen QR-Code mit anderen</li>
                <li>Personen scannen den Code mit ihrem Smartphone</li>
                <li>Sie können dir anonyme Nachrichten schreiben</li>
                <li>Du erhältst die Nachrichten direkt per E-Mail</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${profile.url}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                🔗 QR-Code-Seite besuchen
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666; text-align: center;">
              <strong>🔒 Datenschutz:</strong> Alle Nachrichten werden anonym versendet und nicht gespeichert.<br>
              <strong>📧 Support:</strong> Bei Fragen antworte einfach auf diese E-Mail.
            </p>
          </div>
        </div>
      `,
      attachments: profile.stickerPDF ? [{
        filename: filename,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }] : []
    };

    const result = await EmailService.sendEmail(mailOptions);
    console.log(`📧 QR-Code E-Mail mit${profile.stickerPDF ? ' PDF-Anhang' : ''} gesendet an: ${profile.email}`);
    if (result.preview) {
      console.log(`📧 Preview URL: ${result.preview}`);
    }
    return result;
    
  } catch (error) {
    console.error('Fehler beim Senden der PDF-E-Mail:', error);
    throw error;
  }
}

const app = express();
const adminAuth = new AdminAuth();

// Initialisiere DataStore und Admin-Auth
DataStore.initialize();
adminAuth.initialize();

// Session-Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'cryAMS-session-secret-' + Math.random(),
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Für HTTPS auf true setzen
    maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
  }
}));

app.use(express.static('src/frontend'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'src/frontend' });
});

const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;
const ADMIN_PATH = process.env.ADMIN_PATH || '/admin';

// Middleware für Admin-Authentifizierung
function requireAuth(req, res, next) {
  if (adminAuth.needsSetup()) {
    return res.redirect(`${ADMIN_PATH}/setup`);
  }
  if (req.session.adminLoggedIn) {
    return next();
  }
  res.redirect(`${ADMIN_PATH}/login`);
}

// Admin Setup Route (nur wenn kein Admin konfiguriert ist)
app.get(`${ADMIN_PATH}/setup`, (req, res) => {
  if (!adminAuth.needsSetup()) {
    return res.redirect(`${ADMIN_PATH}/login`);
  }
  
  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Admin Setup - cryAMS</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
        }
        .setup-container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 500px;
        }
        .setup-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .setup-header h1 {
          color: #333;
          margin: 0;
          font-size: 28px;
        }
        .setup-header p {
          color: #666;
          margin: 10px 0 0 0;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
          color: #333;
        }
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e1e5e9;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.3s;
          box-sizing: border-box;
        }
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }
        .btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn:hover {
          transform: translateY(-1px);
        }
        .error {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
        }
        .info {
          background: #d4edda;
          color: #155724;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
          border: 1px solid #c3e6cb;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="setup-container">
        <div class="setup-header">
          <h1>🔐 Admin Setup</h1>
          <p>Erstelle deinen Admin-Zugang für cryAMS</p>
        </div>
        
        <div class="info">
          📋 <strong>Wichtige Hinweise:</strong><br>
          • Wähle einen sicheren Benutzernamen<br>
          • Passwort muss mindestens 6 Zeichen haben<br>
          • Daten werden verschlüsselt gespeichert<br>
          • Diese Konfiguration erfolgt nur einmal
        </div>
        
        ${req.session.setupError ? `<div class="error">❌ ${req.session.setupError}</div>` : ''}
        
        <form method="post" action="${ADMIN_PATH}/setup">
          <div class="form-group">
            <label>👤 Admin Benutzername:</label>
            <input type="text" name="username" required autocomplete="username" 
                   placeholder="z.B. admin oder dein Name" value="${req.body?.username || ''}">
          </div>
          <div class="form-group">
            <label>🔒 Admin Passwort:</label>
            <input type="password" name="password" required autocomplete="new-password"
                   placeholder="Mindestens 6 Zeichen">
          </div>
          <div class="form-group">
            <label>🔒 Passwort bestätigen:</label>
            <input type="password" name="confirmPassword" required autocomplete="new-password"
                   placeholder="Passwort erneut eingeben">
          </div>
          <button type="submit" class="btn">🚀 Admin-Zugang erstellen</button>
        </form>
        
        <div class="footer">
          <p>cryAMS - Anonymous Message System</p>
        </div>
      </div>
    </body>
    </html>
  `);
  
  // Lösche Setup-Error nach dem Anzeigen
  delete req.session.setupError;
});

// Admin Setup POST Route
app.post(`${ADMIN_PATH}/setup`, async (req, res) => {
  if (!adminAuth.needsSetup()) {
    return res.redirect(`${ADMIN_PATH}/login`);
  }
  
  const { username, password, confirmPassword } = req.body;
  
  try {
    // Validierung
    if (!username || username.trim().length < 3) {
      req.session.setupError = 'Benutzername muss mindestens 3 Zeichen haben';
      return res.redirect(`${ADMIN_PATH}/setup`);
    }
    
    if (!password || password.length < 6) {
      req.session.setupError = 'Passwort muss mindestens 6 Zeichen haben';
      return res.redirect(`${ADMIN_PATH}/setup`);
    }
    
    if (password !== confirmPassword) {
      req.session.setupError = 'Passwörter stimmen nicht überein';
      return res.redirect(`${ADMIN_PATH}/setup`);
    }
    
    // Admin-Konfiguration erstellen
    await adminAuth.createAdminConfig(username.trim(), password);
    
    console.log(`🔐 Admin-Setup abgeschlossen für: ${username.trim()}`);
    
    // Automatisch einloggen
    req.session.adminLoggedIn = true;
    req.session.adminUsername = username.trim();
    
    res.redirect(ADMIN_PATH);
    
  } catch (error) {
    console.error('Setup-Fehler:', error);
    req.session.setupError = 'Ein Fehler ist aufgetreten: ' + error.message;
    res.redirect(`${ADMIN_PATH}/setup`);
  }
});

// Admin Login Route
app.get(`${ADMIN_PATH}/login`, (req, res) => {
  if (adminAuth.needsSetup()) {
    return res.redirect(`${ADMIN_PATH}/setup`);
  }
  
  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Admin Login - cryAMS</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
        }
        .login-container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 400px;
        }
        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .login-header h1 {
          color: #333;
          margin: 0;
          font-size: 28px;
        }
        .login-header p {
          color: #666;
          margin: 10px 0 0 0;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
          color: #333;
        }
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e1e5e9;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.3s;
          box-sizing: border-box;
        }
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }
        .btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn:hover {
          transform: translateY(-1px);
        }
        .error {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <div class="login-header">
          <h1>🔐 Admin Login</h1>
          <p>cryAMS Verwaltung</p>
        </div>
        
        ${req.session.loginError ? `<div class="error">❌ ${req.session.loginError}</div>` : ''}
        
        <form method="post" action="${ADMIN_PATH}/login">
          <div class="form-group">
            <label>👤 Benutzername:</label>
            <input type="text" name="username" required autocomplete="username">
          </div>
          <div class="form-group">
            <label>🔒 Passwort:</label>
            <input type="password" name="password" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn">🚀 Anmelden</button>
        </form>
        
        <div class="footer">
          <p>cryAMS - Anonymous Message System</p>
        </div>
      </div>
    </body>
    </html>
  `);
  
  // Lösche Login-Error nach dem Anzeigen
  delete req.session.loginError;
});

// Admin Login POST Route
app.post(`${ADMIN_PATH}/login`, async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const isValid = await adminAuth.verifyLogin(username, password);
    
    if (isValid) {
      req.session.adminLoggedIn = true;
      req.session.adminUsername = username;
      console.log(`🔐 Admin-Login erfolgreich: ${username}`);
      res.redirect(ADMIN_PATH);
    } else {
      req.session.loginError = 'Ungültiger Benutzername oder Passwort';
      res.redirect(`${ADMIN_PATH}/login`);
    }
  } catch (error) {
    console.error('Login-Fehler:', error);
    req.session.loginError = 'Ein Fehler ist aufgetreten';
    res.redirect(`${ADMIN_PATH}/login`);
  }
});

// Admin Logout Route
app.post(`${ADMIN_PATH}/logout`, (req, res) => {
  const username = req.session.adminUsername;
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout-Fehler:', err);
    } else {
      console.log(`🔐 Admin-Logout: ${username}`);
    }
    res.redirect(`${ADMIN_PATH}/login`);
  });
});

// Admin route to create new QR code profiles (jetzt mit Auth)
app.get(ADMIN_PATH, requireAuth, (req, res) => {
  const profiles = DataStore.getAllProfiles();
  const pendingRequests = DataStore.getAllPendingRequests();
  
  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Admin - cryAMS Profile Verwaltung</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 20px; 
          background: #f8f9fa; 
        }
        
        .header {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .tabs {
          display: flex;
          background: white;
          border-radius: 8px 8px 0 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .tab {
          flex: 1;
          padding: 15px 20px;
          background: #e9ecef;
          border: none;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s;
          position: relative;
        }
        
        .tab:hover {
          background: #dee2e6;
        }
        
        .tab.active {
          background: white;
          color: #007bff;
          font-weight: bold;
        }
        
        .tab-badge {
          background: #dc3545;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          margin-left: 8px;
        }
        
        .tab-content {
          background: white;
          padding: 30px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          min-height: 400px;
        }
        
        .tab-panel {
          display: none;
        }
        
        .tab-panel.active {
          display: block;
        }
        
        .form-group { 
          margin: 15px 0; 
        }
        
        .form-group label { 
          display: block; 
          margin-bottom: 5px; 
          font-weight: bold; 
          color: #495057;
        }
        
        .form-group input, .form-group textarea { 
          width: 100%; 
          padding: 12px; 
          border: 1px solid #ddd; 
          border-radius: 6px; 
          font-size: 14px;
          box-sizing: border-box;
        }
        
        .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }
        
        .btn { 
          background: #007bff; 
          color: white; 
          padding: 12px 24px; 
          border: none; 
          border-radius: 6px; 
          cursor: pointer; 
          text-decoration: none; 
          display: inline-block; 
          margin: 5px; 
          font-size: 14px;
          transition: all 0.3s;
        }
        
        .btn:hover { 
          background: #0056b3; 
          transform: translateY(-1px);
        }
        
        .btn-success { 
          background: #28a745; 
        }
        
        .btn-success:hover { 
          background: #218838; 
        }
        
        .btn-danger { 
          background: #dc3545; 
        }
        
        .btn-danger:hover { 
          background: #c82333; 
        }
        
        .profile-card, .request-card { 
          border: 1px solid #e9ecef; 
          padding: 20px; 
          margin: 15px 0; 
          border-radius: 8px; 
          background: #f8f9fa;
        }
        
        .request-card { 
          background: #fff3cd; 
          border-color: #ffeaa7; 
        }
        
        .qr-code { 
          max-width: 200px; 
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        
        .stat-number {
          font-size: 2.5em;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 0.9em;
          opacity: 0.9;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6c757d;
        }
        
        .empty-state-icon {
          font-size: 4em;
          margin-bottom: 20px;
        }
      </style>
      <script>
        function showTab(tabId) {
          // Hide all tab panels
          document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
          });
          
          // Remove active class from all tabs
          document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
          });
          
          // Show selected tab panel
          document.getElementById(tabId).classList.add('active');
          
          // Add active class to clicked tab
          event.target.classList.add('active');
        }
        
        // Show first tab by default
        window.onload = function() {
          document.querySelector('.tab').click();
        }
      </script>
    </head>
    <body>
      <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1>🔐 cryAMS - Profile Verwaltung</h1>
            <p>Verwalte anonyme Profile und QR-Codes für das verschlüsselte Nachrichtensystem</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; color: #666; font-size: 14px;">👤 Angemeldet als: <strong>${req.session.adminUsername}</strong></p>
            <form method="post" action="${ADMIN_PATH}/logout" style="margin-top: 10px;">
              <button type="submit" class="btn btn-danger" style="font-size: 14px; padding: 8px 16px;">🚪 Abmelden</button>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Erfolgs- und Fehlermeldungen -->
      ${(function() {
        const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
        const success = urlParams.get('success');
        const error = urlParams.get('error');
        
        if (success === 'pdf-sent') {
          return `<div style="background: #d4edda; color: #155724; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #28a745;">
            📧 <strong>PDF erfolgreich versendet!</strong> Die Aufkleber-PDF wurde per E-Mail zugestellt.
          </div>`;
        } else if (error === 'profile-not-found') {
          return `<div style="background: #f8d7da; color: #721c24; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3545;">
            ❌ <strong>Fehler:</strong> Profil nicht gefunden.
          </div>`;
        } else if (error === 'no-pdf-available') {
          return `<div style="background: #fff3cd; color: #856404; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
            ⚠️ <strong>Hinweis:</strong> Für dieses Profil ist kein PDF-Download verfügbar.
          </div>`;
        } else if (error === 'pdf-send-failed') {
          return `<div style="background: #f8d7da; color: #721c24; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3545;">
            ❌ <strong>Fehler:</strong> PDF konnte nicht per E-Mail versendet werden.
          </div>`;
        }
        return '';
      })()}
      
      <div class="tabs">
        <button class="tab" onclick="showTab('tab-create')">
          ➕ Neues Profil erstellen
        </button>
        <button class="tab" onclick="showTab('tab-overview')">
          📊 Aktive Profile (${profiles.length})
        </button>
        <button class="tab" onclick="showTab('tab-profiles')">
          👥 Bestehende Profile
        </button>
        <button class="tab" onclick="showTab('tab-pending')">
          ⏳ Zu prüfende Profile
          ${pendingRequests.length > 0 ? `<span class="tab-badge">${pendingRequests.length}</span>` : ''}
        </button>
      </div>
      
      <div class="tab-content">
        <!-- Tab: Neues Profil erstellen -->
        <div id="tab-create" class="tab-panel">
          <h2>➕ Neues Profil direkt erstellen</h2>
          <p>Erstelle sofort ein neues Profil mit QR-Code, ohne Genehmigungsverfahren.</p>
          
          <form action="${ADMIN_PATH}/create-profile" method="post">
            <div class="form-group">
              <label>👤 Name:</label>
              <input type="text" name="name" required placeholder="z.B. Max Mustermann">
            </div>
            <div class="form-group">
              <label>📧 E-Mail:</label>
              <input type="email" name="email" required placeholder="max@example.com">
            </div>
            <div class="form-group">
              <label>📝 Beschreibung (optional):</label>
              <textarea name="description" rows="3" placeholder="Optionale Beschreibung für das Profil..."></textarea>
            </div>
            <button type="submit" class="btn">🚀 Profil erstellen & QR-Code generieren</button>
          </form>
        </div>
        
        <!-- Tab: Übersicht/Statistiken -->
        <div id="tab-overview" class="tab-panel">
          <h2>📊 System Übersicht</h2>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${profiles.length}</div>
              <div class="stat-label">Aktive Profile</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${pendingRequests.length}</div>
              <div class="stat-label">Ausstehende Anfragen</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${profiles.length + pendingRequests.length}</div>
              <div class="stat-label">Gesamt Anfragen</div>
            </div>
          </div>
          
          <h3>🎯 Schnellaktionen</h3>
          <div style="display: flex; gap: 15px; flex-wrap: wrap;">
            <button class="btn" onclick="showTab('tab-create')">➕ Neues Profil erstellen</button>
            <button class="btn btn-success" onclick="showTab('tab-profiles')">👥 Profile verwalten</button>
            ${pendingRequests.length > 0 ? `<button class="btn btn-danger" onclick="showTab('tab-pending')">⏳ Anfragen bearbeiten (${pendingRequests.length})</button>` : ''}
          </div>
          
          ${profiles.length > 0 ? `
          <h3>📈 Letzte Aktivitäten</h3>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            ${profiles.slice(-3).reverse().map(profile => `
              <div style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                <strong>${profile.name}</strong> (${profile.email}) - 
                Erstellt: ${new Date(profile.createdAt).toLocaleDateString('de-DE')}
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
        
        <!-- Tab: Bestehende Profile -->
        <div id="tab-profiles" class="tab-panel">
          <h2>👥 Bestehende Profile (${profiles.length})</h2>
          
          ${profiles.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <h3>Noch keine Profile vorhanden</h3>
            <p>Erstelle dein erstes Profil über den Tab "Neues Profil erstellen"</p>
            <button class="btn" onclick="showTab('tab-create')">➕ Jetzt Profil erstellen</button>
          </div>
          ` : profiles.map(profile => `
            <div class="profile-card">
              <h3>👤 ${profile.name}</h3>
              <div style="display: grid; grid-template-columns: 1fr 200px; gap: 20px;">
                <div>
                  <p><strong>📧 E-Mail:</strong> ${profile.email}</p>
                  <p><strong>🆔 UUID:</strong> <code>${profile.uuid}</code></p>
                  <p><strong>🔗 URL:</strong> <a href="/${profile.uuid}" target="_blank">${DOMAIN}/${profile.uuid}</a></p>
                  <p><strong>📝 Beschreibung:</strong> ${profile.description || 'Keine Beschreibung'}</p>
                  <p><strong>📅 Erstellt:</strong> ${new Date(profile.createdAt).toLocaleDateString('de-DE')}</p>
                  
                  <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <h4 style="margin-top: 0; color: #0066cc;">📧 E-Mail Weiterleitung</h4>
                    <p style="margin-bottom: 0; color: #333;">
                      Alle Nachrichten werden direkt an <strong>${profile.email}</strong> weitergeleitet.
                    </p>
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <h4>📱 QR-Code:</h4>
                  <img src="/qr/${profile.uuid}" alt="QR Code" class="qr-code">
                </div>
              </div>
              
              <div style="margin-top: 20px; text-align: right;">
                ${profile.stickerPDF ? `
                  <a href="/pdf/${profile.uuid}" class="btn btn-success" style="margin-right: 10px;" target="_blank">
                    📄 PDF herunterladen
                  </a>
                  <form action="${ADMIN_PATH}/send-pdf/${profile.uuid}" method="post" style="display: inline; margin-right: 10px;">
                    <button type="submit" class="btn btn-primary">📧 PDF per E-Mail senden</button>
                  </form>
                ` : ''}
                <form action="${ADMIN_PATH}/delete-profile/${profile.uuid}" method="post" style="display: inline;" 
                      onsubmit="return confirm('Profil wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')">
                  <button type="submit" class="btn btn-danger">
                    🗑️ Profil löschen
                  </button>
                </form>
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Tab: Ausstehende Anfragen -->
        <div id="tab-pending" class="tab-panel">
          <h2>⏳ Zu prüfende Profile ${pendingRequests.length > 0 ? `<span class="tab-badge">${pendingRequests.length}</span>` : ''}</h2>
          
          ${pendingRequests.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">✅</div>
            <h3>Keine ausstehenden Anfragen</h3>
            <p>Alle Anfragen wurden bearbeitet. Super Arbeit! 🎉</p>
          </div>
          ` : `
          <p>Hier findest du alle Anfragen von Benutzern, die einen QR-Code beantragt haben und auf Genehmigung warten.</p>
          ${pendingRequests.map(request => `
            <div class="request-card">
              <h3>📋 Anfrage von: ${request.name}</h3>
              <p><strong>📧 E-Mail:</strong> ${request.email}</p>
              <p><strong>📝 Beschreibung:</strong> ${request.description || 'Keine Beschreibung angegeben'}</p>
              <p><strong>📅 Eingereicht am:</strong> ${new Date(request.createdAt).toLocaleDateString('de-DE')} um ${new Date(request.createdAt).toLocaleTimeString('de-DE')}</p>
              <p><strong>🆔 Anfrage-ID:</strong> <code>${request.uuid}</code></p>
              
              ${request.stickerPDF ? `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2196f3;">
                  <h4 style="margin: 0 0 10px 0; color: #0277bd;">� PDF-Download gewünscht</h4>
                  <p style="margin: 5px 0;"><strong>Layout:</strong> ${request.stickerPDF.count} Aufkleber (${request.stickerPDF.layout})</p>
                  <p style="margin: 5px 0;"><strong>Anordnung:</strong> ${request.stickerPDF.rows} Zeilen × ${request.stickerPDF.cols} Spalten</p>
                  <p style="margin: 5px 0; font-size: 12px; color: #666;">PDF wird nach Genehmigung automatisch generiert und per E-Mail versendet.</p>
                </div>
              ` : ''}
              
              <div style="margin-top: 20px;">
                <form action="${ADMIN_PATH}/approve-request/${request.uuid}" method="post" style="display: inline;">
                  <button type="submit" class="btn btn-success">✅ Genehmigen & Profil erstellen</button>
                </form>
                <form action="${ADMIN_PATH}/reject-request/${request.uuid}" method="post" style="display: inline;">
                  <button type="submit" class="btn btn-danger" onclick="return confirm('Anfrage wirklich ablehnen?')">❌ Ablehnen</button>
                </form>
              </div>
            </div>
          `).join('')}
          `}
        </div>
      </div>
    </body>
    </html>
  `);
});

// Create new profile
app.post(`${ADMIN_PATH}/create-profile`, requireAuth, (req, res) => {
  const { name, email, description } = req.body;
  const uuid = uuidv4();
  
  DataStore.createProfile({ uuid, name, email, description });
  
  res.redirect(ADMIN_PATH);
});

// Request QR code from main page (creates pending request)
app.post('/request-qr', (req, res) => {
  const { 
    name, 
    email, 
    description, 
    downloadStickers,
    stickerLayout
  } = req.body;
  
  const uuid = uuidv4();
  
  // Basis-Request-Daten
  const requestData = { uuid, name, email, description };
  
  // PDF-Download hinzufügen, falls gewünscht
  if (downloadStickers === 'on') {
    const layoutInfo = {
      '4x2': { rows: 2, cols: 4, count: 8 },
      '3x3': { rows: 3, cols: 3, count: 9 },
      '4x3': { rows: 3, cols: 4, count: 12 },
      '5x4': { rows: 4, cols: 5, count: 20 }
    };
    
    requestData.stickerPDF = {
      layout: stickerLayout || '3x3',
      ...layoutInfo[stickerLayout || '3x3']
    };
  }
  
  DataStore.createPendingRequest(requestData);
  
  const hasPDFDownload = downloadStickers === 'on';
  const pdfText = hasPDFDownload ? 
    `<p><strong>� PDF-Download:</strong> ${requestData.stickerPDF.count} Aufkleber (${requestData.stickerPDF.layout})</p>` : '';
  
  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Anfrage gesendet - cryAMS</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .success { background: #d4edda; color: #155724; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
        .download-info { background: #e3f2fd; color: #0277bd; padding: 15px; border-radius: 5px; margin: 10px 0; text-align: left; }
      </style>
    </head>
    <body>
      <h1>✅ Anfrage gesendet</h1>
      <div class="success">
        <h3>Deine ${hasPDFDownload ? 'QR-Code-Anfrage mit PDF-Download' : 'QR-Code-Anfrage'} wurde erfolgreich übermittelt!</h3>
        <p>Ein Administrator wird deine Anfrage prüfen und freischalten.</p>
        ${pdfText}
        ${hasPDFDownload ? '<div class="download-info"><strong>📄 PDF-Download:</strong><br>' +
          `Nach der Genehmigung erhältst du einen Download-Link für eine druckfertige PDF-Datei mit ${requestData.stickerPDF.count} Aufklebern im ${requestData.stickerPDF.layout}-Layout.</div>` : ''}
        <p>Du erhältst eine Benachrichtigung per E-Mail, sobald dein QR-Code verfügbar ist.</p>
        ${hasPDFDownload ? '<p><small>Die PDF-Datei wird sofort nach Freischaltung des QR-Codes verfügbar sein.</small></p>' : ''}
      </div>
      <a href="/" class="btn">Zurück zur Hauptseite</a>
    </body>
    </html>
  `);
});

// Delete profile
app.post(`${ADMIN_PATH}/delete-profile/:uuid`, requireAuth, (req, res) => {
  const { uuid } = req.params;
  const deleted = DataStore.deleteProfile(uuid);
  
  if (deleted) {
    console.log(`🗑️ Profil ${uuid} gelöscht`);
  }
  
  res.redirect(ADMIN_PATH);
});

// Approve pending request
app.post(`${ADMIN_PATH}/approve-request/:uuid`, requireAuth, async (req, res) => {
  const { uuid } = req.params;
  const request = DataStore.getPendingRequest(uuid);
  
  if (request) {
    // Profil-Daten vorbereiten
    const profileData = {
      uuid: request.uuid,
      name: request.name,
      email: request.email,
      description: request.description
    };
    
    // PDF-Layout-Daten hinzufügen, falls vorhanden
    if (request.stickerPDF) {
      profileData.stickerPDF = request.stickerPDF;
    }
    
    const approved = DataStore.approvePendingRequest(uuid, profileData);
    
    if (approved) {
      console.log(`✅ Anfrage ${uuid} genehmigt und Profil erstellt`);
      
      // Profil für E-Mail-Versand abrufen
      const profile = DataStore.getProfile(uuid);
      if (profile) {
        profile.url = `${DOMAIN}/${profile.uuid}`;
        
        try {
          // PDF generieren und per E-Mail senden, falls gewünscht
          if (profile.stickerPDF) {
            console.log(`📄 Generiere PDF für ${profile.name}...`);
            const pdfBuffer = await generateStickerPDF(profile, profile.stickerPDF);
            await sendPDFByEmail(profile, pdfBuffer);
            console.log(`📧 PDF per E-Mail gesendet an: ${profile.email}`);
          } else {
            // Normale Bestätigungs-E-Mail ohne PDF
            await sendPDFByEmail(profile, null);
            console.log(`📧 Bestätigungs-E-Mail gesendet an: ${profile.email}`);
          }
        } catch (error) {
          console.error(`❌ Fehler beim E-Mail-Versand für ${profile.email}:`, error);
        }
      }
    }
  }
  
  res.redirect(ADMIN_PATH);
});

// Send PDF by email manually
app.post(`${ADMIN_PATH}/send-pdf/:uuid`, requireAuth, async (req, res) => {
  const { uuid } = req.params;
  const profile = DataStore.getProfile(uuid);
  
  if (!profile) {
    return res.redirect(ADMIN_PATH + '?error=profile-not-found');
  }
  
  if (!profile.stickerPDF) {
    return res.redirect(ADMIN_PATH + '?error=no-pdf-available');
  }
  
  try {
    profile.url = `${DOMAIN}/${profile.uuid}`;
    
    console.log(`📄 Generiere PDF für manuellen Versand an ${profile.name}...`);
    const pdfBuffer = await generateStickerPDF(profile, profile.stickerPDF);
    await sendPDFByEmail(profile, pdfBuffer);
    console.log(`📧 PDF manuell per E-Mail gesendet an: ${profile.email}`);
    
    res.redirect(ADMIN_PATH + '?success=pdf-sent');
  } catch (error) {
    console.error(`❌ Fehler beim manuellen PDF-Versand für ${profile.email}:`, error);
    res.redirect(ADMIN_PATH + '?error=pdf-send-failed');
  }
});

// Reject pending request
app.post(`${ADMIN_PATH}/reject-request/:uuid`, requireAuth, (req, res) => {
  const { uuid } = req.params;
  const rejected = DataStore.rejectPendingRequest(uuid);
  
  if (rejected) {
    console.log(`❌ Anfrage ${uuid} abgelehnt`);
  }
  
  res.redirect(ADMIN_PATH);
});

// Generate QR code for profile
app.get('/qr/:uuid', async (req, res) => {
  const { uuid } = req.params;
  const profile = DataStore.getProfile(uuid);
  
  if (!profile) {
    return res.status(404).send('Profil nicht gefunden');
  }
  
  try {
    const url = `${DOMAIN}/${uuid}`;
    const qrCodeDataURL = await QRCode.toDataURL(url);
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (error) {
    res.status(500).send('Fehler beim Generieren des QR-Codes');
  }
});

// Demo QR code for preview
app.get('/qr-demo', async (req, res) => {
  try {
    const url = 'https://crymg.de';
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (error) {
    res.status(500).send('Fehler beim Generieren des Demo QR-Codes');
  }
});

// PDF download for stickers
app.get('/pdf/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const profile = DataStore.getProfile(uuid);
    
    if (!profile) {
      return res.status(404).send('Profil nicht gefunden');
    }
    
    // Standard-Layout falls nicht spezifiziert
    const layout = profile.stickerPDF || { rows: 3, cols: 3, count: 9, layout: '3x3' };
    
    const pdfBuffer = await generateStickerPDF(profile, layout);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cryAMS-Aufkleber-${profile.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).send('Fehler beim Generieren der PDF-Datei');
  }
});

// Public profile page where people can send messages
app.get('/:uuid', (req, res) => {
  const { uuid } = req.params;
  const profile = DataStore.getProfile(uuid);
  
  if (!profile) {
    return res.status(404).send(`
      <html>
      <head><meta charset="UTF-8"><title>Profil nicht gefunden</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1>😔 Profil nicht gefunden</h1>
        <p>Das angeforderte Profil existiert nicht.</p>
      </body>
      </html>
    `);
  }
  
  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Nachricht senden</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .profile-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
        .form-group { margin: 15px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
        .btn { background: #28a745; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; }
        .btn:hover { background: #218838; }
        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="profile-info">
        <h1>📩 Nachricht senden</h1>
        <p>${profile.description || 'Sende eine anonyme Nachricht'}</p>
        <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px;">
          <small style="color: #856404;">
            🔒 Diese Nachricht wird anonym per E-Mail weitergeleitet und nicht gespeichert.
          </small>
        </div>
      </div>
      
      <form action="/${uuid}/message" method="post">
        <div class="form-group">
          <label>Dein Name (optional):</label>
          <input type="text" name="senderName" placeholder="Anonym">
        </div>
        <div class="form-group">
          <label>Nachricht:</label>
          <textarea name="content" rows="5" placeholder="Schreibe deine Nachricht..." required></textarea>
        </div>
        <button type="submit" class="btn">Nachricht senden</button>
      </form>
    </body>
    </html>
  `);
});

// Handle message submission
app.post('/:uuid/message', async (req, res) => {
  const { uuid } = req.params;
  const { content, senderName } = req.body;
  
  const profile = DataStore.getProfile(uuid);
  
  if (!profile) {
    return res.status(404).send(`
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Profil nicht gefunden</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
          .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>❌ Profil nicht gefunden</h2>
          <p>Das angeforderte Profil existiert nicht.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Nachricht per E-Mail weiterleiten
  const messageData = {
    content,
    senderName: senderName || 'Anonym',
    timestamp: new Date().toISOString()
  };

  try {
    const emailResult = await EmailService.sendAnonymousMessage(
      profile.email,
      profile.name,
      messageData
    );

    if (emailResult.success) {
      res.send(`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Nachricht gesendet</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
            .success { background: #d4edda; color: #155724; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info { background: #e7f3ff; color: #0066cc; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .final { background: #f8f9fa; color: #495057; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="success">
            <h2>✅ Nachricht erfolgreich gesendet!</h2>
            <p>Deine anonyme Nachricht wurde per E-Mail weitergeleitet.</p>
          </div>
          
          <div class="info">
            <h3>🔒 Datenschutz</h3>
            <p>
              Die Nachricht wurde sofort weitergeleitet und wird nicht in unserem System gespeichert.<br>
              Deine Anonymität bleibt vollständig gewahrt.
            </p>
          </div>
          
          <div class="final">
            <p>Diese Seite kann jetzt geschlossen werden.</p>
          </div>
        </body>
        </html>
      `);
    } else {
      throw new Error(emailResult.error);
    }
  } catch (error) {
    console.error('Fehler beim E-Mail-Versand:', error);
    
    res.status(500).send(`
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Fehler beim Senden</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
          .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>❌ Fehler beim Senden</h2>
          <p>Die Nachricht konnte nicht weitergeleitet werden. Bitte versuche es später erneut.</p>
          <small>Technischer Fehler: E-Mail-Service nicht verfügbar</small>
          <p style="margin-top: 20px;">Diese Seite kann jetzt geschlossen werden.</p>
        </div>
      </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at ${DOMAIN}`);
  console.log(`Admin interface: ${DOMAIN}${ADMIN_PATH}`);
});