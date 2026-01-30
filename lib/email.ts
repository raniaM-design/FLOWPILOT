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

  // Si aucune configuration SMTP, utiliser un transport de test (développement)
  if (!smtpUser || !smtpPassword) {
    console.warn("[email] ⚠️ Configuration SMTP manquante, utilisation d'un transport de test");
    // En développement, créer un compte de test Ethereal
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "ethereal.user@ethereal.email",
        pass: "ethereal.pass",
      },
    });
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true pour 465, false pour autres ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

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
    await transporter.sendMail({
      from: `PILOTYS <${process.env.SMTP_FROM || "noreply@pilotys.com"}>`,
      to: email,
      subject: t.subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[email] ✅ Email de réinitialisation envoyé à ${email}`);
  } catch (error) {
    console.error("[email] ❌ Erreur lors de l'envoi de l'email:", error);
    throw new Error("Impossible d'envoyer l'email de réinitialisation");
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

