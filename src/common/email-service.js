import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.setupTransporter();
  }

  setupTransporter() {
    const emailService = process.env.EMAIL_SERVICE;
    
    // Prüfe ob Custom SMTP-Konfiguration verwendet werden soll
    if (emailService === 'custom' || process.env.EMAIL_HOST) {
      this.setupCustomSMTP();
    } else if (process.env.EMAIL_USER && emailService) {
      this.setupServiceProvider();
    } else {
      this.setupEtherealAccount();
    }
  }

  setupCustomSMTP() {
    try {
      const config = {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true' || parseInt(process.env.EMAIL_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };

      // Optionale TLS-Konfiguration
      if (process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === 'false') {
        config.tls = {
          rejectUnauthorized: false
        };
      }

      this.transporter = nodemailer.createTransport(config);
      
      console.log('📧 Custom SMTP-Server konfiguriert:');
      console.log(`   Host: ${config.host}:${config.port}`);
      console.log(`   Secure: ${config.secure}`);
      console.log(`   User: ${config.auth.user}`);
    } catch (error) {
      console.error('❌ Fehler bei Custom SMTP-Konfiguration:', error);
      this.setupEtherealAccount();
    }
  }

  setupServiceProvider() {
    try {
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      console.log('📧 Email-Service konfiguriert:');
      console.log(`   Service: ${process.env.EMAIL_SERVICE}`);
      console.log(`   User: ${process.env.EMAIL_USER}`);
    } catch (error) {
      console.error('❌ Fehler bei Service-Provider-Konfiguration:', error);
      this.setupEtherealAccount();
    }
  }

  async setupEtherealAccount() {
    try {
      // Erstelle einen Test-Account bei Ethereal Email
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      console.log('📧 Ethereal Email Test Account erstellt:');
      console.log('   User:', testAccount.user);
      console.log('   Pass:', testAccount.pass);
      console.log('   Preview URLs: https://ethereal.email/');
    } catch (error) {
      console.error('Fehler beim Erstellen des Test-Accounts:', error);
    }
  }

  async sendAnonymousMessage(recipientEmail, recipientName, messageData) {
    const { content, senderName, timestamp } = messageData;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"cryAMS Notification" <noreply@cryams.local>`,
      to: recipientEmail,
      subject: `📩 Neue anonyme Nachricht für ${recipientName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #007bff; margin-bottom: 10px; }
            .message-box { background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .message-content { font-size: 16px; color: #333; white-space: pre-wrap; word-wrap: break-word; }
            .meta { color: #666; font-size: 14px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
            .privacy-note { background: #e8f4f8; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin-top: 20px; font-size: 14px; color: #0c5460; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐 cryAMS</div>
              <p style="color: #666; margin: 0;">Anonymous Message System</p>
            </div>
            
            <h2 style="color: #333;">📩 Sie haben eine neue anonyme Nachricht erhalten!</h2>
            
            <div class="message-box">
              <div class="message-content">${content}</div>
            </div>
            
            <div class="meta">
              <p><strong>👤 Absender:</strong> ${senderName || 'Anonym'}</p>
              <p><strong>📅 Gesendet am:</strong> ${new Date(timestamp).toLocaleString('de-DE')}</p>
              <p><strong>📧 Empfänger:</strong> ${recipientName}</p>
            </div>
            
            <div class="privacy-note">
              <strong>🔒 Datenschutz-Hinweis:</strong><br>
              Diese Nachricht wurde über das cryAMS-System weitergeleitet und wird nicht dauerhaft gespeichert. 
              Der ursprüngliche Absender bleibt anonym, es sei denn, er hat sich in der Nachricht zu erkennen gegeben.
            </div>
            
            <div class="footer">
              <p>Diese E-Mail wurde automatisch generiert durch cryAMS - Anonymous Message System</p>
              <p>Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 E-Mail gesendet:', info.messageId);
      
      // Preview URL für Ethereal
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('❌ E-Mail-Versand fehlgeschlagen:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Teste die E-Mail-Verbindung
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ E-Mail-Server-Verbindung erfolgreich');
      return true;
    } catch (error) {
      console.error('❌ E-Mail-Server-Verbindung fehlgeschlagen:', error);
      return false;
    }
  }
}

export default new EmailService();
