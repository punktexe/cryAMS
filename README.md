# 🔒 CryHidden - QR Code Reader & Anonymous Message System

Eine moderne Node.js 24 Anwendung mit ES Modules und Express, die QR-Codes liest und ein anonymes Nachrichtensystem bereitstellt.

## ✨ Features

### QR-Code Reader
- 📷 Upload von QR-Code Bildern
- 🔍 Automatische Dekodierung und Anzeige der Inhalte
- 🎯 Intelligente Formatierung für verschiedene QR-Code-Typen (URLs, E-Mails, WIFI, vCards)

### Anonymous Message System
- 👤 Profilerstellung mit UUID-basierten URLs
- 💬 Anonyme Nachrichtenübermittlung
- 🔗 Automatische QR-Code-Generierung für Profile
- 📊 Admin-Interface zur Verwaltung von Profilen und Nachrichten

## 🚀 Installation und Start

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Server starten:**
   ```bash
   npm start
   ```

3. **Anwendung öffnen:**
   - Hauptseite: `http://localhost:3000`
   - Admin-Bereich: `http://localhost:3000/admin`

## 📁 Projektstruktur

```
cryHidden/
├── src/
│   ├── backend/
│   │   └── main.js              # Express Server
│   ├── frontend/
│   │   └── index.html           # Frontend Interface
│   └── common/
│       ├── qr-utils.js          # QR-Code Utilities
│       └── data-store.js        # Datenmanagement
├── package.json
└── README.md
```

## 🎯 Verwendung

### QR-Code Reader
1. Gehe zu `http://localhost:3000`
2. Lade ein Bild mit einem QR-Code hoch
3. Das System dekodiert automatisch den Inhalt und zeigt ihn formatiert an

### Anonymous Message System

#### Als Administrator:
1. Öffne den Admin-Bereich: `http://localhost:3000/admin`
2. Erstelle ein neues Profil mit:
   - Name
   - E-Mail-Adresse
   - Beschreibung (optional)
3. Das System generiert automatisch:
   - Eine eindeutige UUID
   - Eine URL: `http://localhost:3000/[uuid]`
   - Einen QR-Code für diese URL
4. Teile den QR-Code mit anderen
5. Empfangene Nachrichten werden im Admin-Bereich angezeigt

#### Als Benutzer:
1. Scanne einen QR-Code oder öffne eine UUID-URL
2. Fülle das Nachrichtenformular aus:
   - Nachrichteninhalt (erforderlich)
   - Name (optional, sonst "Anonym")
3. Sende die Nachricht anonym ab

## 🛠️ Technische Details

- **Runtime:** Node.js 24+
- **Framework:** Express.js
- **Module System:** ES Modules
- **QR-Code Processing:** qrcode-reader, jimp
- **QR-Code Generation:** qrcode
- **UUID Generation:** uuid v4
- **File Upload:** multer

## 📝 API Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/` | GET | Hauptseite mit QR-Code Reader |
| `/upload` | POST | QR-Code Bild Upload und Dekodierung |
| `/admin` | GET | Admin-Interface |
| `/admin/create-profile` | POST | Neues Profil erstellen |
| `/:uuid` | GET | Anonyme Nachrichtenseite |
| `/:uuid/message` | POST | Nachricht senden |
| `/qr/:uuid` | GET | QR-Code Bild für Profil |

## 🔒 Datenschutz

- Alle Nachrichten werden nur lokal im Serverarbeitsspeicher gespeichert
- Keine persistente Datenbankverbindung
- Anonyme Nachrichtenübermittlung ohne IP-Tracking
- Keine Cookies oder Session-Tracking

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature Branch
3. Commit deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz.
