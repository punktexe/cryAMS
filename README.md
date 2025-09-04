# 🔒 cryAMS Anonymous Message System
- 👤 Profilerstellung mit UUID-basierten URLs
- 💬 Anonyme Nachrichtenübermittlung per E-Mail
- 🔗 Automatische QR-Code-Generierung für Profile
- 📧 Direkte E-Mail-Weiterleitung ohne Datenspeicherung
- 📱 Mobile-optimierte Benutzeroberfläche
- 🔒 Keine Nachrichtenspeicherung im System
- 💾 Persistente Speicherung der Profile in JSON-Datei Anonymous Message System

Eine moderne Node.js 24 Anwendung mit ES Modules und Express für ein anonymes Nachrichtensystem mit QR-Code-Integration.

## ✨ Features

### Anonymous Message System
- 👤 Profilerstellung mit UUID-basierten URLs
- 💬 Anonyme Nachrichtenübermittlung per E-Mail
- 🔗 Automatische QR-Code-Generierung für Profile
- 📧 Direkte E-Mail-Weiterleitung ohne Datenspeicherung
- 📱 Mobile-optimierte Benutzeroberfläche
- 🔒 Keine Nachrichtenspeicherung im System

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

4. **E-Mail konfigurieren (optional):**
   ```bash
   cp .env.sample .env
   # .env bearbeiten und E-Mail-Zugangsdaten eintragen
   ```

5. **Domain/IP konfigurieren (optional):**
   ```bash
   # In der .env Datei die DOMAIN Variable setzen:
   DOMAIN=https://deine-domain.de
   # oder für lokales Netzwerk:
   DOMAIN=http://192.168.1.100:3000
   ```

## 📁 Projektstruktur

```
cryAMS/
├── src/
│   ├── backend/
│   │   └── main.js              # Express Server
│   ├── frontend/
│   │   └── index.html           # Frontend Interface
│   └── common/
│       ├── email-service.js     # E-Mail Service
│       └── data-store.js        # Datenmanagement
├── data/
│   └── profiles.json            # Persistente Profildaten
├── package.json
└── README.md
```

## 🎯 Verwendung

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
3. Sende die Nachricht ab
4. Die Nachricht wird sofort per E-Mail weitergeleitet und nicht gespeichert

## 🛠️ Technische Details

- **Runtime:** Node.js 24+
- **Framework:** Express.js
- **Module System:** ES Modules
- **QR-Code Generation:** qrcode
- **UUID Generation:** uuid v4
- **E-Mail Service:** nodemailer

## 📝 API Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/` | GET | Hauptseite des Anonymous Message Systems |
| `/admin` | GET | Admin-Interface |
| `/admin/create-profile` | POST | Neues Profil erstellen |
| `/admin/delete-profile/:uuid` | POST | Profil löschen |
| `/:uuid` | GET | Anonyme Nachrichtenseite |
| `/:uuid/message` | POST | Nachricht senden |
| `/qr/:uuid` | GET | QR-Code Bild für Profil |

## 🔒 Datenschutz

- Nachrichten werden sofort per E-Mail weitergeleitet und nicht im System gespeichert
- Profile werden persistent in `data/profiles.json` gespeichert (lokal, nicht im Git)
- Vollständig anonyme Nachrichtenübermittlung ohne IP-Tracking
- Keine Cookies oder Session-Tracking
- E-Mail-Weiterleitung mit vollständiger Anonymität
- Kein Logging von Nachrichten oder Absenderdaten

## 💾 Datenspeicherung

### Profile
- Werden automatisch in `data/profiles.json` gespeichert
- Bleiben nach Neustart erhalten
- Können über das Admin-Interface gelöscht werden
- `data/` Verzeichnis ist in `.gitignore` (nicht versioniert)

### Nachrichten
- Werden **nicht** gespeichert
- Direkte Weiterleitung per E-Mail
- Keine Persistierung im System

## 📧 E-Mail Konfiguration

### Entwicklung (Standard)
Ohne Konfiguration verwendet das System automatisch Ethereal Email für Tests:
- Preview-URLs werden in der Konsole angezeigt
- Alle E-Mails sind unter https://ethereal.email/ einsehbar

### Produktion
1. Erstelle eine `.env` Datei basierend auf `.env.sample`
2. Konfiguriere deine E-Mail-Zugangsdaten:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=deine-email@gmail.com
   EMAIL_PASS=dein-app-passwort
   ```

### Unterstützte E-Mail-Services
- Gmail (empfohlen mit App-Passwort)
- Outlook/Hotmail
- Yahoo Mail
- Oder jeder SMTP-Server

## ⚙️ Konfiguration

### Domain/IP-Adresse
Die Domain oder IP-Adresse für QR-Code URLs und Links kann über die `.env` Datei konfiguriert werden:

```env
# Lokale Entwicklung (Standard)
DOMAIN=http://localhost:3000

# Produktionsserver
DOMAIN=https://deine-domain.de

# Lokales Netzwerk
DOMAIN=http://192.168.1.100:3000

# Custom Port
DOMAIN=http://localhost:8080
PORT=8080
```

**Standard-Verhalten:** Ohne Konfiguration wird automatisch `http://localhost:3000` verwendet.

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature Branch
3. Commit deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz.
