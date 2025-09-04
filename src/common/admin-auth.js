import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

class AdminAuth {
  constructor() {
    this.configPath = 'data/admin-config.json';
    this.config = null;
  }

  /**
   * Initialisiert die Admin-Authentifizierung
   * Lädt die Konfiguration falls vorhanden
   */
  initialize() {
    try {
      this.loadConfig();
    } catch (error) {
      console.log('🔐 Keine Admin-Konfiguration gefunden.');
      console.log('📝 Beim ersten Zugriff auf /admin/setup wird das Setup gestartet.');
    }
  }

  /**
   * Prüft ob Admin-Setup erforderlich ist
   */
  needsSetup() {
    return this.config === null;
  }

  /**
   * Lädt die bestehende Admin-Konfiguration
   */
  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error('Config file not found');
    }

    const data = fs.readFileSync(this.configPath, 'utf8');
    this.config = JSON.parse(data);
    console.log('🔐 Admin-Konfiguration geladen');
  }

  /**
   * Erstellt eine neue Admin-Konfiguration mit gegebenen Parametern
   */
  async createAdminConfig(username, password) {
    console.log('\n=== Admin-Setup für cryAMS ===');
    console.log(`Erstelle Admin-Zugang für: ${username}`);

    if (password.length < 6) {
      throw new Error('Passwort muss mindestens 6 Zeichen lang sein!');
    }

    // Passwort verschlüsseln
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Konfiguration erstellen
    this.config = {
      username: username,
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    // Sicherstellen, dass das data Verzeichnis existiert
    const dataDir = path.dirname(this.configPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Konfiguration speichern
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    console.log('✅ Admin-Konfiguration erstellt und gespeichert!');
    console.log(`👤 Benutzername: ${this.config.username}`);
    console.log('🔒 Passwort wurde verschlüsselt gespeichert\n');
  }

  /**
   * Hilfsfunktion für Konsolen-Eingaben
   */
  askQuestion(rl, question, hideInput = false) {
    return new Promise((resolve) => {
      if (hideInput) {
        // Verstecke Passwort-Eingabe
        const stdin = process.stdin;
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        process.stdout.write(question);
        let password = '';

        const onData = (char) => {
          switch (char) {
            case '\n':
            case '\r':
            case '\u0004': // Ctrl+D
              stdin.setRawMode(false);
              stdin.pause();
              stdin.off('data', onData);
              process.stdout.write('\n');
              resolve(password);
              break;
            case '\u0003': // Ctrl+C
              process.exit();
              break;
            case '\u007f': // Backspace
              if (password.length > 0) {
                password = password.slice(0, -1);
                process.stdout.write('\b \b');
              }
              break;
            default:
              password += char;
              process.stdout.write('*');
              break;
          }
        };

        stdin.on('data', onData);
      } else {
        rl.question(question, resolve);
      }
    });
  }

  /**
   * Überprüft die Login-Daten
   */
  async verifyLogin(username, password) {
    if (!this.config) {
      return false;
    }

    if (username !== this.config.username) {
      return false;
    }

    const isValid = await bcrypt.compare(password, this.config.passwordHash);
    
    if (isValid) {
      // Letzten Login aktualisieren
      this.config.lastLogin = new Date().toISOString();
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    }

    return isValid;
  }

  /**
   * Gibt die Konfiguration zurück (ohne Passwort-Hash)
   */
  getConfig() {
    if (!this.config) {
      return null;
    }

    return {
      username: this.config.username,
      createdAt: this.config.createdAt,
      lastLogin: this.config.lastLogin
    };
  }

  /**
   * Ändert das Admin-Passwort
   */
  async changePassword(oldPassword, newPassword) {
    const isValidOld = await bcrypt.compare(oldPassword, this.config.passwordHash);
    
    if (!isValidOld) {
      return false;
    }

    if (newPassword.length < 6) {
      throw new Error('Neues Passwort muss mindestens 6 Zeichen lang sein');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    this.config.passwordHash = hashedPassword;
    this.config.lastPasswordChange = new Date().toISOString();

    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    return true;
  }
}

export default AdminAuth;
