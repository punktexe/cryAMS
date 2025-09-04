import { body, validationResult } from 'express-validator';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import crypto from 'crypto';

// DOM Purify Setup für Server-side
const window = new JSDOM('').window;
const purify = DOMPurify(window);

export class SecurityUtils {
  
  /**
   * HTML Content escapen um XSS zu verhindern
   */
  static escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * HTML Content sanitizen mit DOMPurify
   */
  static sanitizeHtml(dirty) {
    if (typeof dirty !== 'string') return dirty;
    
    return purify.sanitize(dirty, {
      ALLOWED_TAGS: [], // Keine HTML-Tags erlaubt
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  /**
   * Validierung für Profile-Namen
   */
  static validateProfileName() {
    return [
      body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name muss zwischen 2 und 50 Zeichen lang sein')
        .matches(/^[a-zA-ZäöüÄÖÜß\s\-\.]+$/)
        .withMessage('Name darf nur Buchstaben, Leerzeichen, Bindestriche und Punkte enthalten')
        .customSanitizer(value => SecurityUtils.sanitizeHtml(value))
    ];
  }

  /**
   * Validierung für E-Mail Adressen
   */
  static validateEmail() {
    return [
      body('email')
        .trim()
        .isEmail()
        .withMessage('Gültige E-Mail-Adresse erforderlich')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('E-Mail-Adresse zu lang (max. 100 Zeichen)')
    ];
  }

  /**
   * Validierung für Beschreibungen
   */
  static validateDescription() {
    return [
      body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Beschreibung darf maximal 500 Zeichen lang sein')
        .customSanitizer(value => SecurityUtils.sanitizeHtml(value))
    ];
  }

  /**
   * Validierung für Nachrichten-Content
   */
  static validateMessageContent() {
    return [
      body('content')
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage('Nachricht muss zwischen 1 und 2000 Zeichen lang sein')
        .customSanitizer(value => SecurityUtils.sanitizeHtml(value)),
      body('senderName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Absender-Name darf maximal 50 Zeichen lang sein')
        .customSanitizer(value => SecurityUtils.sanitizeHtml(value))
    ];
  }

  /**
   * Starke Passwort-Validierung
   */
  static validatePassword() {
    return [
      body('password')
        .isLength({ min: 12 })
        .withMessage('Passwort muss mindestens 12 Zeichen lang sein')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Passwort muss Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen enthalten')
    ];
  }

  /**
   * Admin-Login Validierung
   */
  static validateAdminLogin() {
    return [
      body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Benutzername muss zwischen 3 und 30 Zeichen lang sein')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Benutzername darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten')
        .customSanitizer(value => SecurityUtils.sanitizeHtml(value)),
      body('password')
        .isLength({ min: 1 })
        .withMessage('Passwort erforderlich')
    ];
  }

  /**
   * Validierungsfehler prüfen und formatieren
   */
  static checkValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      console.log('❌ Validierungsfehler:', errorMessages);
      
      // Je nach Request-Type unterschiedlich antworten
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({
          success: false,
          errors: errorMessages
        });
      } else {
        // HTML-Antwort für Form-Submissions
        return res.status(400).send(`
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Eingabefehler - cryAMS</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .btn { background: #007575; color: white; padding: 10px 20px; border: none; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>❌ Eingabefehler</h1>
            <div class="error">
              <h3>Die folgenden Probleme müssen behoben werden:</h3>
              <ul>
                ${errorMessages.map(msg => `<li>${SecurityUtils.escapeHtml(msg)}</li>`).join('')}
              </ul>
            </div>
            <a href="javascript:history.back()" class="btn">← Zurück und korrigieren</a>
          </body>
          </html>
        `);
      }
    }
    
    next();
  }

  /**
   * Request-Logging für verdächtige Aktivitäten
   */
  static logSuspiciousActivity(req, message) {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    console.log(`🚨 VERDÄCHTIGE AKTIVITÄT [${timestamp}]:`);
    console.log(`   IP: ${ip}`);
    console.log(`   User-Agent: ${userAgent}`);
    console.log(`   URL: ${req.method} ${req.originalUrl}`);
    console.log(`   Message: ${message}`);
    console.log(`   Session: ${req.session.id || 'None'}`);
  }

  /**
   * CSRF-Token generieren (Alternative zu csurf)
   */
  static generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * CSRF-Token validieren
   */
  static validateCSRFToken(req, res, next) {
    if (req.method === 'GET') {
      return next();
    }

    const token = req.body._csrf || req.headers['x-csrf-token'];
    const sessionToken = req.session.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      SecurityUtils.logSuspiciousActivity(req, 'Invalid CSRF token');
      return res.status(403).send(`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Sicherheitsfehler - cryAMS</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>🔒 Sicherheitsfehler</h1>
            <p>Ihre Anfrage konnte aus Sicherheitsgründen nicht verarbeitet werden.</p>
            <p><small>CSRF-Token ungültig oder fehlend</small></p>
          </div>
        </body>
        </html>
      `);
    }

    next();
  }
}
