import express from 'express';
import multer from 'multer';
import Jimp from 'jimp';
import QrCode from 'qrcode-reader';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { formatQRCodeContent } from '../common/qr-utils.js';
import { DataStore } from '../common/data-store.js';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('src/frontend'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'src/frontend' });
});app.post('/upload', upload.single('qrcode'), async (req, res) => {
  if (!req.file) {
    return res.send('<h2>Fehler:</h2><p>Keine Datei hochgeladen.</p><a href="/">Zurück</a>');
  }
  try {
    const image = await Jimp.read(req.file.path);
    const qr = new QrCode();
    qr.callback = (err, value) => {
      if (err || !value) {
        return res.send('<h2>Fehler:</h2><p>QR-Code konnte nicht dekodiert werden.</p><a href="/">Zurück</a>');
      }
      const formattedContent = formatQRCodeContent(value.result);
      res.send(`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>QR-Code Ergebnis</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .result { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .back-btn { display: inline-block; margin-top: 20px; padding: 10px 15px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h2>QR-Code Inhalt:</h2>
          <div class="result">${formattedContent}</div>
          <a href="/" class="back-btn">Zurück</a>
        </body>
        </html>
      `);
    };
    qr.decode(image.bitmap);
  } catch (e) {
    res.send('<h2>Fehler:</h2><p>Fehler beim Verarbeiten des Bildes.</p><a href="/">Zurück</a>');
  }
});

const PORT = process.env.PORT || 3000;

// Admin route to create new QR code profiles
app.get('/admin', (req, res) => {
  const profiles = DataStore.getAllProfiles();
  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Admin - QR Profile Verwaltung</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .form-group { margin: 15px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #0056b3; }
        .profile-card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .qr-code { max-width: 200px; }
        .messages { background: #f8f9fa; padding: 10px; margin-top: 10px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h1>QR Profile Verwaltung</h1>
      
      <h2>Neues Profil erstellen</h2>
      <form action="/admin/create-profile" method="post">
        <div class="form-group">
          <label>Name:</label>
          <input type="text" name="name" required>
        </div>
        <div class="form-group">
          <label>E-Mail:</label>
          <input type="email" name="email" required>
        </div>
        <div class="form-group">
          <label>Beschreibung:</label>
          <textarea name="description" rows="3"></textarea>
        </div>
        <button type="submit" class="btn">Profil erstellen & QR-Code generieren</button>
      </form>

      <h2>Bestehende Profile</h2>
      ${profiles.map(profile => `
        <div class="profile-card">
          <h3>${profile.name} (${profile.email})</h3>
          <p><strong>UUID:</strong> ${profile.uuid}</p>
          <p><strong>URL:</strong> <a href="/${profile.uuid}" target="_blank">http://localhost:${PORT}/${profile.uuid}</a></p>
          <p><strong>Beschreibung:</strong> ${profile.description || 'Keine Beschreibung'}</p>
          <p><strong>Erstellt:</strong> ${new Date(profile.createdAt).toLocaleString('de-DE')}</p>
          
          <h4>QR-Code:</h4>
          <img src="/qr/${profile.uuid}" alt="QR Code" class="qr-code">
          
          <h4>Nachrichten (${profile.messages.length}):</h4>
          <div class="messages">
            ${profile.messages.length === 0 ? 'Keine Nachrichten' : 
              profile.messages.map(msg => `
                <div style="border-bottom: 1px solid #dee2e6; padding: 10px 0;">
                  <strong>${msg.senderName}</strong> - ${new Date(msg.timestamp).toLocaleString('de-DE')}<br>
                  ${msg.content}
                </div>
              `).join('')
            }
          </div>
        </div>
      `).join('')}
    </body>
    </html>
  `);
});

// Create new profile
app.post('/admin/create-profile', (req, res) => {
  const { name, email, description } = req.body;
  const uuid = uuidv4();
  
  DataStore.createProfile({ uuid, name, email, description });
  
  res.redirect('/admin');
});

// Generate QR code for profile
app.get('/qr/:uuid', async (req, res) => {
  const { uuid } = req.params;
  const profile = DataStore.getProfile(uuid);
  
  if (!profile) {
    return res.status(404).send('Profil nicht gefunden');
  }
  
  try {
    const url = `http://localhost:${PORT}/${uuid}`;
    const qrCodeDataURL = await QRCode.toDataURL(url);
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (error) {
    res.status(500).send('Fehler beim Generieren des QR-Codes');
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
      <title>Nachricht an ${profile.name}</title>
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
        <h2>${profile.name}</h2>
        <p>${profile.description || 'Sende eine anonyme Nachricht'}</p>
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
app.post('/:uuid/message', (req, res) => {
  const { uuid } = req.params;
  const { content, senderName } = req.body;
  
  const success = DataStore.addMessage(uuid, { content, senderName });
  
  if (!success) {
    return res.status(404).send('Profil nicht gefunden');
  }
  
  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Nachricht gesendet</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
        .success { background: #d4edda; color: #155724; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="success">
        <h2>✅ Nachricht erfolgreich gesendet!</h2>
        <p>Deine Nachricht wurde anonym übermittelt.</p>
      </div>
      <a href="/${uuid}" class="btn">Weitere Nachricht senden</a>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin interface: http://localhost:${PORT}/admin`);
});