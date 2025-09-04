# 🔒 c### - 📄 *### 🛡- 📊 **- 🔐 **Passwort-geschützter** Admin-Zugang
- ⏳ **Genehmigungsworkflow** für QR-Code-Anfragen
- 📊 **Dashboard** mit Statistiken und Übersichturity-Monitoring** mit verdächtigen Aktivitäten
- 💪 **Starke Passwort-Requirements** (12+ Zeichen)Sicherheitsfeatures (NEU!)PDF-Sticker-Generator** mit druckfertigen Layouts Anonymous Message System
- 👤 **Profilerstellung** mit UUID-basierten URLsAMS - Anonymous Message System

Eine **sichere** und **moderne** Node.js 24 Anwendung mit ES Modules und Express für ein anonymes Nachrichtensystem mit QR-Code-Integration, PDF-Generierung und umfassenden Sicherheitsfeatures.

## ✨ Features

### � Anonymous Message System
- �👤 **Profilerstellung** mit UUID-basierten URLs
- 💬 **Anonyme Nachrichtenübermittlung** per E-Mail
- 🔗 **QR-Code-Generierung** für Profile und physische Aufkleber
- � **PDF-Sticker-Generator** mit druckfertigen Layouts
- 📧 **E-Mail-Weiterleitung** ohne Datenspeicherung
- 📱 **Mobile-optimierte** Benutzeroberfläche
- 🎨 **Modernes Design** mit Teal-Farbschema (#007575)

### �️ Sicherheitsfeatures (NEU!)
- 🔒 **Session-Härtung** mit starken Cookies
- ⚡ **Rate-Limiting** gegen Brute-Force und Spam
- 🛡️ **XSS-Schutz** mit HTML-Sanitization
- 🔑 **CSRF-Schutz** mit Token-Validierung
- 🔐 **Input-Validation** auf Server- und Client-Side
- � **Security-Monitoring** mit verdächtigen Aktivitäten
- � **Starke Passwort-Requirements** (12+ Zeichen)
- 🚨 **Security Headers** mit Helmet.js

### 🎯 Admin-Interface
- 🖥️ **Tab-basierte Navigation** für bessere UX
- � **Passwort-geschützter** Admin-Zugang
- ⏳ **Genehmigungsworkflow** für QR-Code-Anfragen
- � **Dashboard** mit Statistiken und Übersicht
- 📧 **PDF-Email-Versand** für Aufkleber-Downloads

## 🚀 Installation und Start

### 1. Dependencies installieren:
```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren:
```bash
cp .env.sample .env
nano .env  # Bearbeite die Konfiguration
```

**WICHTIG:** Setze unbedingt einen starken `SESSION_SECRET`:
```bash
# Generiere einen sicheren Schlüssel:
openssl rand -base64 32
```

### 3. Server starten:
```bash
npm start
```

### 4. Anwendung öffnen:
- **Hauptseite:** `http://localhost:3000`
- **Admin-Bereich:** `http://localhost:3000/verwaltung` (oder dein `ADMIN_PATH`)

### 5. Admin-Setup (beim ersten Start):
1. Öffne den Admin-Bereich
2. Folge dem Setup-Wizard
3. Erstelle einen sicheren Admin-Account

## 📁 Projektstruktur

```
cryAMS/
├── src/
│   ├── backend/
│   │   └── main.js              # Express Server mit Sicherheit
│   ├── frontend/
│   │   └── index.html           # Sicheres Frontend Interface
│   └── common/
│       ├── email-service.js     # E-Mail Service (SMTP/Provider)
│       ├── data-store.js        # Datenmanagement
│       ├── admin-auth.js        # Admin-Authentifizierung
│       └── security-utils.js    # Sicherheits-Utilities (NEU!)
├── data/
│   ├── profiles.json            # Persistente Profildaten
│   ├── pending-requests.json    # Ausstehende Anfragen
│   └── admin-config.json        # Admin-Konfiguration
├── .env.sample                  # Konfigurationsvorlage
├── package.json
└── README.md
```

## 🎯 Verwendung

### Als Administrator:

#### 1. Admin-Zugang einrichten
- Beim ersten Besuch des Admin-Bereichs wird automatisch das Setup gestartet
- Wähle einen sicheren Benutzernamen und ein starkes Passwort (12+ Zeichen)
- Das Passwort wird mit bcrypt verschlüsselt gespeichert

#### 2. Profile verwalten
- **Dashboard:** Übersicht über alle Profile und Statistiken
- **Neues Profil:** Direkte Erstellung ohne Genehmigung
- **Anfragen:** Genehmigung/Ablehnung von Benutzeranfragen
- **PDF-Management:** Download und E-Mail-Versand von Aufklebern

#### 3. Sicherheitsüberwachung
- Monitoring von fehlgeschlagenen Login-Versuchen
- Rate-Limiting-Alerts in den Logs
- Verdächtige Aktivitäten werden automatisch protokolliert

### Als Benutzer:

#### 1. QR-Code beantragen
- Fülle das Formular mit Name, E-Mail und Beschreibung aus
- Wähle optional PDF-Sticker-Downloads
- Anfrage wird zur Admin-Genehmigung eingereicht

#### 2. Nachrichten senden
- Scanne einen QR-Code oder öffne eine UUID-URL
- Verfasse eine anonyme Nachricht (max. 2000 Zeichen)
- Nachricht wird sofort per E-Mail weitergeleitet

#### 3. PDF-Stickers (optional)
- Bei Genehmigung automatischer Download-Link per E-Mail
- Druckfertige PDF-Dateien in verschiedenen Layouts
- Optimiert für Aufkleber-Papier

## 🛠️ Technische Details

### Backend
- **Runtime:** Node.js 24+
- **Framework:** Express.js mit ES Modules
- **Sicherheit:** Helmet, Rate-Limiting, Input-Validation
- **Authentication:** bcrypt + express-session
- **E-Mail:** nodemailer (SMTP/Provider)
- **PDF:** PDFKit für Sticker-Generierung

### Frontend
- **Design:** Mobile-First, Teal-Farbschema (#007575)
- **Sicherheit:** CSRF-Token, Client-side Validation
- **UX:** Tab-Navigation, Progressive Enhancement

### Sicherheit
- **Encryption:** bcrypt (Saltround 12)
- **Sessions:** HTTP-Only, Secure, SameSite=Strict
- **Input:** DOMPurify Sanitization
- **Headers:** CSP, HSTS, X-Frame-Options
- **Monitoring:** Suspicious Activity Logging

## 📝 API Endpoints

| Endpoint | Methode | Sicherheit | Beschreibung |
|----------|---------|------------|--------------|
| `/` | GET | Rate-Limited | Hauptseite |
| `/api/csrf-token` | GET | Session | CSRF-Token abrufen |
| `/request-qr` | POST | Validated + Rate-Limited | QR-Code beantragen |
| `/:uuid` | GET | UUID-Validated | Nachrichtenseite |
| `/:uuid/message` | POST | Validated + Rate-Limited | Nachricht senden |
| `/qr/:uuid` | GET | - | QR-Code Bild |
| `/pdf/:uuid` | GET | - | PDF-Sticker Download |
| `/verwaltung/*` | * | Auth Required | Admin-Interface |

## 🔒 Sicherheitsarchitektur

### Session-Sicherheit
```javascript
{
  secure: NODE_ENV === 'production',    // HTTPS-Only in Produktion
  httpOnly: true,                       // Kein JavaScript-Zugriff
  maxAge: 2 * 60 * 60 * 1000,          // 2 Stunden TTL
  sameSite: 'strict'                    // CSRF-Schutz
}
```

### Rate-Limiting
- **Allgemein:** 100 Requests/15min pro IP
- **Nachrichten:** 5 Messages/15min pro IP
- **Login:** 5 Versuche/15min pro IP
- **Konfigurierbar** über Umgebungsvariablen

### Input-Validation
- **Server-side:** express-validator mit custom rules
- **Client-side:** Pattern-matching und Längen-Limits
- **Sanitization:** DOMPurify für HTML-Content
- **UUID-Validation:** Strenge Format-Prüfung

### Monitoring
- **Verdächtige IPs:** Automatische Protokollierung
- **Login-Versuche:** Failed attempts tracking
- **Rate-Limit-Violations:** Alert-System
- **Admin-Aktivitäten:** Vollständige Auditierung

## 💾 Datenschutz & Datenspeicherung

### Nachrichten (NICHT gespeichert)
- ✅ **Sofortige E-Mail-Weiterleitung**
- ✅ **Keine lokale Speicherung**
- ✅ **Vollständige Anonymität**
- ✅ **Kein Message-Logging**

### Profile (Lokal gespeichert)
- 📁 `data/profiles.json` - Genehmigte Profile
- 📁 `data/pending-requests.json` - Ausstehende Anfragen
- 📁 `data/admin-config.json` - Admin-Konfiguration
- 🔒 **Verschlüsselte Passwörter** (bcrypt)
- 🚫 **Nicht in Git versioniert**

### DSGVO-Konformität
- ✅ **Datenminimierung:** Nur notwendige Daten
- ✅ **Löschrecht:** Admin kann Profile löschen
- ✅ **Anonymität:** Keine IP-/User-Tracking
- ✅ **Transparenz:** Klare Datenschutzerklärung

## 📧 E-Mail Konfiguration

### Entwicklung (Ethereal Email)
```bash
# Automatische Konfiguration ohne .env
# Preview-URLs in Konsole verfügbar
# Alle E-Mails unter https://ethereal.email/
```

### Produktion (Provider)
```bash
# Gmail (empfohlen)
EMAIL_SERVICE=gmail
EMAIL_USER=deine-email@gmail.com
EMAIL_PASS=dein-app-passwort  # https://support.google.com/accounts/answer/185833

# Andere Provider
EMAIL_SERVICE=outlook        # outlook, yahoo, hotmail, icloud
```

### Custom SMTP
```bash
EMAIL_SERVICE=custom
EMAIL_HOST=mail.deine-domain.de
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@deine-domain.de
EMAIL_PASS=dein-smtp-passwort
EMAIL_FROM="cryAMS <noreply@deine-domain.de>"
```

## ⚙️ Produktions-Konfiguration

### Umgebungsvariablen (.env)
```bash
# === SICHERHEIT (KRITISCH!) ===
SESSION_SECRET=dein-starker-32-zeichen-schlüssel  # MUSS gesetzt sein!
NODE_ENV=production

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000     # 15 Minuten
RATE_LIMIT_MAX=100              # 100 Requests pro IP
RATE_LIMIT_MESSAGE_MAX=5        # 5 Nachrichten pro IP
RATE_LIMIT_LOGIN_MAX=5          # 5 Login-Versuche pro IP

# === SERVER ===
DOMAIN=https://deine-domain.de  # Mit HTTPS!
PORT=3000
ADMIN_PATH=/secure-admin         # Versteckter Admin-Pfad
```

### SSL/HTTPS Setup
```bash
# Reverse Proxy (Nginx empfohlen)
server {
    listen 443 ssl;
    server_name deine-domain.de;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Deployment-Checkliste

#### 🔐 Sicherheit
- [ ] `SESSION_SECRET` durch starken Wert ersetzt
- [ ] `NODE_ENV=production` gesetzt
- [ ] HTTPS mit gültigem SSL-Zertifikat
- [ ] Reverse Proxy (Nginx/Apache) konfiguriert
- [ ] Firewall-Regeln gesetzt (nur 80, 443, SSH)
- [ ] Admin-Passwort stark gewählt (12+ Zeichen)

#### ⚡ Performance
- [ ] Rate Limits an Traffic angepasst
- [ ] Log-Rotation konfiguriert
- [ ] PM2 oder ähnliches für Process Management
- [ ] Monitoring (Uptime, Performance, Errors)

#### 💾 Backup & Recovery
- [ ] Automatische Backups der `data/` Verzeichnisse
- [ ] Backup-Restore getestet
- [ ] Disaster Recovery Plan

## 🚨 Sicherheitsrichtlinien

### Für Administratoren
1. **Starke Passwörter:** Mindestens 12 Zeichen mit Komplexität
2. **Regelmäßige Updates:** System und Dependencies aktuell halten
3. **Monitoring:** Logs auf verdächtige Aktivitäten überwachen
4. **Backup:** Regelmäßige Datensicherung
5. **SSL:** Immer HTTPS in Produktion verwenden

### Für Entwickler
1. **Input-Validation:** Alle Eingaben validieren und sanitisieren
2. **Authentication:** Session-Management befolgen
3. **Logging:** Keine sensitiven Daten in Logs
4. **Dependencies:** Regelmäßige Security-Audits
5. **Code-Review:** Sicherheitsfokussierte Überprüfungen

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Erstelle einen Pull Request

### Development Guidelines
- Folge den bestehenden Sicherheitsstandards
- Teste alle Input-Validation-Szenarien
- Dokumentiere neue Sicherheitsfeatures
- Führe Security-Reviews durch

## 📊 System-Monitoring

### Logs überwachen
```bash
# Fehler-Logs
grep "ERROR\|FEHLER" logs/error.log

# Verdächtige Aktivitäten
grep "VERDÄCHTIGE AKTIVITÄT" logs/access.log

# Rate-Limit-Verletzungen
grep "Rate limit exceeded" logs/access.log
```

### Health-Checks
- Server-Verfügbarkeit: `curl -f http://localhost:3000/`
- Admin-Interface: Regelmäßige Login-Tests
- E-Mail-Service: Test-Nachrichten senden
- SSL-Zertifikat: Ablaufdatum überwachen

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe [LICENSE](LICENSE) für Details.

---

**🔒 cryAMS - Sichere anonyme Kommunikation für alle.**
