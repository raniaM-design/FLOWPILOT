/**
 * Service d'envoi d'emails pour PILOTYS
 * Utilise nodemailer pour l'envoi d'emails
 */

import nodemailer from "nodemailer";

// Configuration du transport email
function getEmailTransporter() {
  // En production, utiliser les variables d'environnement
  // En développement, utiliser un service de test comme Ethereal ou Mailtrap
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || "noreply@pilotys.com";
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  console.log("[email] Configuration SMTP:");
  console.log(`  Host: ${smtpHost}`);
  console.log(`  Port: ${smtpPort}`);
  console.log(`  Secure: ${smtpSecure}`);
  console.log(`  User: ${smtpUser ? "✅ Configuré" : "❌ Manquant"}`);
  console.log(`  Password: ${smtpPassword ? "✅ Configuré" : "❌ Manquant"}`);
  console.log(`  From: ${smtpFrom}`);

  // Si aucune configuration SMTP, utiliser un transport de test (développement)
  if (!smtpUser || !smtpPassword) {
    console.warn("[email] ⚠️ Configuration SMTP manquante, utilisation d'un transport de test");
    console.warn("[email] ⚠️ Les emails ne seront PAS réellement envoyés en développement");
    
    // En développement, créer un compte de test Ethereal
    // Note: En production, cela échouera - il faut configurer SMTP
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "ethereal.user@ethereal.email",
        pass: "ethereal.pass",
      },
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true pour 465, false pour autres ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    // Options supplémentaires pour Gmail et autres providers
    tls: {
      rejectUnauthorized: false, // Pour les certificats auto-signés (développement)
    },
  });

  return transporter;
}

/**
 * Teste la connexion SMTP
 */
export async function testSMTPConnection(): Promise<{ success: boolean; error?: string; info?: any }> {
  try {
    const transporter = getEmailTransporter();
    await transporter.verify();
    console.log("[email] ✅ Connexion SMTP réussie");
    return { success: true };
  } catch (error: any) {
    console.error("[email] ❌ Erreur de connexion SMTP:", error);
    return {
      success: false,
      error: error.message || "Erreur de connexion SMTP",
      info: error,
    };
  }
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  locale: string = "fr"
): Promise<void> {
  const transporter = getEmailTransporter();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}`
    : "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  console.log("[email] 📧 Préparation de l'email de réinitialisation:");
  console.log(`  Destinataire: ${email}`);
  console.log(`  URL de réinitialisation: ${resetUrl}`);
  console.log(`  Locale: ${locale}`);

  const translations = {
    fr: {
      subject: "Réinitialisation de votre mot de passe PILOTYS",
      greeting: "Bonjour,",
      message:
        "Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :",
      button: "Réinitialiser mon mot de passe",
      warning:
        "Ce lien est valide pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.",
      footer: "L'équipe PILOTYS",
    },
    en: {
      subject: "Reset your PILOTYS password",
      greeting: "Hello,",
      message:
        "You have requested to reset your password. Click on the link below to create a new password:",
      button: "Reset my password",
      warning:
        "This link is valid for 1 hour. If you did not request this reset, please ignore this email.",
      footer: "The PILOTYS team",
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.fr;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">PILOTYS</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; margin-bottom: 20px;">${t.greeting}</p>
        <p style="font-size: 16px; margin-bottom: 20px;">${t.message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            ${t.button}
          </a>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          ${t.warning}
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          ${t.footer}
        </p>
        <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 10px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
${t.greeting}

${t.message}

${resetUrl}

${t.warning}

${t.footer}
  `;

  try {
    const mailOptions = {
      from: `PILOTYS <${process.env.SMTP_FROM || "noreply@pilotys.com"}>`,
      to: email,
      subject: t.subject,
      text: textContent,
      html: htmlContent,
    };

    console.log("[email] 📤 Envoi de l'email...");
    const info = await transporter.sendMail(mailOptions);
    
    console.log("[email] ✅ Email envoyé avec succès!");
    console.log(`[email] Message ID: ${info.messageId}`);
    console.log(`[email] Response: ${info.response}`);
    
    // Si c'est un transport de test (Ethereal), afficher l'URL de prévisualisation
    if (info.messageId && info.messageId.includes("ethereal")) {
      console.warn("[email] ⚠️ Mode test - Email non réellement envoyé");
      console.warn(`[email] Prévisualisation: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error: any) {
    console.error("[email] ❌ Erreur lors de l'envoi de l'email:", error);
    console.error("[email] Détails de l'erreur:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    throw new Error(`Impossible d'envoyer l'email de réinitialisation: ${error.message}`);
  }
}

/**
 * Envoie un email de confirmation de réinitialisation réussie
 */
export async function sendPasswordResetConfirmationEmail(
  email: string,
  locale: string = "fr"
): Promise<void> {
  const transporter = getEmailTransporter();

  const translations = {
    fr: {
      subject: "Votre mot de passe PILOTYS a été modifié",
      greeting: "Bonjour,",
      message:
        "Votre mot de passe a été modifié avec succès. Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement le support.",
      footer: "L'équipe PILOTYS",
    },
    en: {
      subject: "Your PILOTYS password has been changed",
      greeting: "Hello,",
      message:
        "Your password has been successfully changed. If you did not make this change, please contact support immediately.",
      footer: "The PILOTYS team",
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.fr;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${t.subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">PILOTYS</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; margin-bottom: 20px;">${t.greeting}</p>
        <p style="font-size: 16px; margin-bottom: 20px;">${t.message}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
          ${t.footer}
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `PILOTYS <${process.env.SMTP_FROM || "noreply@pilotys.com"}>`,
      to: email,
      subject: t.subject,
      html: htmlContent,
    });

    console.log(`[email] ✅ Email de confirmation envoyé à ${email}`);
  } catch (error) {
    console.error("[email] ❌ Erreur lors de l'envoi de l'email de confirmation:", error);
    // Ne pas faire échouer la réinitialisation si l'email de confirmation échoue
  }
}
