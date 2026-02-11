/**
 * Service d'envoi d'emails pour PILOTYS
 * Utilise Resend si RESEND_API_KEY est configuré, sinon utilise nodemailer (SMTP)
 */

import nodemailer from "nodemailer";
import { Resend } from "resend";

// Vérifier si Resend est configuré
function isResendConfigured(): boolean {
  const hasResendKey = !!process.env.RESEND_API_KEY;
  if (hasResendKey) {
    console.log("[email] ✅ Resend détecté (RESEND_API_KEY configuré)");
  } else {
    console.log("[email] ⚠️ Resend non configuré (RESEND_API_KEY manquant)");
  }
  return hasResendKey;
}

// Obtenir l'adresse email "from" selon la configuration
// Priorité : EMAIL_FROM > RESEND_FROM_EMAIL > SMTP_FROM > SMTP_USER > fallback
function getFromEmail(): string {
  // EMAIL_FROM est la variable standardisée demandée par l'utilisateur
  if (process.env.EMAIL_FROM) {
    const email = process.env.EMAIL_FROM.trim();
    // Validation basique de l'adresse email
    if (!email.includes("@") || email.split("@").length !== 2) {
      console.error(`[email] ❌ EMAIL_FROM invalide: "${email}" (doit être au format: user@domain.com)`);
      throw new Error(`EMAIL_FROM invalide: "${email}". Format attendu: user@domain.com`);
    }
    return email;
  }
  
  if (isResendConfigured()) {
    const fallback = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || "noreply@pilotys.io";
    if (!fallback.includes("@") || fallback.split("@").length !== 2) {
      console.error(`[email] ❌ Adresse "from" fallback invalide: "${fallback}"`);
      throw new Error(`Adresse email "from" invalide: "${fallback}". Configurez EMAIL_FROM avec une adresse valide (ex: no-reply@pilotys.io)`);
    }
    return fallback;
  }
  const smtpFallback = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@pilotys.io";
  if (!smtpFallback.includes("@") || smtpFallback.split("@").length !== 2) {
    console.error(`[email] ❌ Adresse SMTP "from" invalide: "${smtpFallback}"`);
    throw new Error(`Adresse email SMTP "from" invalide: "${smtpFallback}". Configurez EMAIL_FROM avec une adresse valide`);
  }
  return smtpFallback;
}

// Configuration du transport email (SMTP fallback)
function getEmailTransporter() {
  // En production, utiliser les variables d'environnement
  // En développement, utiliser un service de test comme Ethereal ou Mailtrap
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = getFromEmail();
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
    // Note: En production, cela échouera - il faut configurer SMTP ou Resend
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

// Fonction générique pour envoyer un email (utilise Resend ou SMTP)
async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const fromEmail = getFromEmail();

  // Utiliser Resend si configuré
  if (isResendConfigured()) {
    console.log("[email] 📧 Utilisation de Resend pour l'envoi");
    console.log(`[email] From: ${fromEmail}`);
    console.log(`[email] To: ${options.to}`);
    
    // Validation stricte de l'adresse "from"
    if (!fromEmail || !fromEmail.includes("@")) {
      const errorMsg = `[email] ❌ Adresse "from" invalide: "${fromEmail}". Format attendu: user@domain.com`;
      console.error(errorMsg);
      throw new Error(`Adresse email "from" invalide. Configurez EMAIL_FROM avec une adresse valide (ex: no-reply@pilotys.io)`);
    }
    
    const [localPart, domain] = fromEmail.split("@");
    if (!localPart || !domain || domain.length < 3) {
      const errorMsg = `[email] ❌ Adresse "from" invalide: "${fromEmail}". Format attendu: user@domain.com`;
      console.error(errorMsg);
      throw new Error(`Adresse email "from" invalide. Configurez EMAIL_FROM avec une adresse valide (ex: no-reply@pilotys.io)`);
    }
    
    console.log(`[email] 🔍 Validation de l'adresse "from": ${fromEmail} (domaine: ${domain})`);
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    try {
      // Vérifier que la clé API est valide avant d'envoyer
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey || !apiKey.startsWith("re_")) {
        console.error("[email] ❌ Clé API Resend invalide ou manquante");
        console.error("[email] ❌ La clé doit commencer par 're_'");
        throw new Error("Clé API Resend invalide. Vérifiez que RESEND_API_KEY commence par 're_'");
      }

      console.log("[email] 📤 Envoi de l'email via Resend API...");
      console.log(`[email] 🔑 Clé API: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
      
      const result = await resend.emails.send({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      // Vérifier si l'envoi a réussi
      if (result.error) {
        console.error("[email] ❌ Erreur Resend détectée:", JSON.stringify(result.error, null, 2));
        console.error("[email] ❌ Type d'erreur:", result.error.name || "Unknown");
        console.error("[email] ❌ Message d'erreur:", result.error.message || "No message");
        console.error("[email] ❌ Status Code:", result.error.statusCode || "Unknown");
        
        // Message d'erreur spécifique pour les clés restreintes
        if (result.error.name === "restricted_api_key" || result.error.message?.includes("restricted")) {
          console.error("[email] ⚠️ PROBLÈME: Clé API Resend restreinte");
          console.error("[email] 💡 SOLUTION:");
          console.error("[email]    1. Allez sur https://resend.com/api-keys");
          console.error("[email]    2. Vérifiez que votre clé API a les permissions 'Send Emails'");
          console.error("[email]    3. Si la clé est restreinte, créez une nouvelle clé avec toutes les permissions");
          console.error("[email]    4. OU utilisez une clé API complète (non restreinte)");
          throw new Error("Clé API Resend restreinte. La clé doit avoir la permission 'Send Emails'. Vérifiez dans Resend Dashboard → API Keys et créez une nouvelle clé si nécessaire.");
        }
        
        throw new Error(`Erreur Resend: ${result.error.message || JSON.stringify(result.error)}`);
      }

      if (!result.data || !result.data.id) {
        console.error("[email] ❌ Réponse Resend invalide: pas de message ID");
        console.error("[email] ❌ Réponse complète:", JSON.stringify(result, null, 2));
        throw new Error("Réponse Resend invalide: pas de message ID retourné");
      }

      console.log("[email] ✅ Email envoyé avec succès via Resend!");
      console.log(`[email] Message ID: ${result.data.id}`);
      console.log(`[email] 📧 Email visible dans Resend Dashboard: https://resend.com/emails/${result.data.id}`);
      
      // Avertissement si le domaine "from" n'est peut-être pas vérifié
      if (domain !== "resend.dev" && domain !== "pilotys.io") {
        console.warn(`[email] ⚠️ Attention: Le domaine "${domain}" n'est peut-être pas vérifié dans Resend`);
        console.warn("[email] ⚠️ Les emails peuvent être bloqués ou aller dans les spams");
        console.warn("[email] 💡 Vérifiez que le domaine est vérifié dans Resend Dashboard → Domains");
      }
      
      // Note importante pour le diagnostic
      console.log("[email] 💡 Si l'email n'est pas reçu:");
      console.log(`[email]    1. Vérifiez le statut dans Resend Dashboard: https://resend.com/emails/${result.data.id}`);
      console.log("[email]    2. Vérifiez le dossier spam");
      console.log(`[email]    3. Vérifiez que le domaine "${domain}" est vérifié dans Resend`);
      
      return;
    } catch (error: any) {
      console.error("[email] ❌ Erreur lors de l'envoi via Resend:");
      console.error("[email] ❌ Type:", error.constructor?.name || typeof error);
      console.error("[email] ❌ Message:", error.message);
      console.error("[email] ❌ Stack:", error.stack?.substring(0, 500));
      
      // Si c'est une erreur Resend avec des détails supplémentaires
      if (error.response) {
        console.error("[email] ❌ Réponse HTTP:", JSON.stringify(error.response, null, 2));
      }
      
      // Message d'erreur plus détaillé
      let errorMessage = `Impossible d'envoyer l'email via Resend: ${error.message}`;
      if (error.message?.includes("domain") || error.message?.includes("from")) {
        errorMessage += `. Vérifiez que l'adresse "from" (${fromEmail}) utilise un domaine vérifié dans Resend.`;
      }
      
      throw new Error(errorMessage);
    }
  }

  // Fallback sur SMTP
  console.log("[email] 📧 Utilisation de SMTP pour l'envoi");
  const transporter = getEmailTransporter();
  
  try {
    const mailOptions = {
      from: `PILOTYS <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log("[email] ✅ Email envoyé avec succès via SMTP!");
    console.log(`[email] Message ID: ${info.messageId}`);
    console.log(`[email] Response: ${info.response}`);
    
    // Si c'est un transport de test (Ethereal), afficher l'URL de prévisualisation
    if (info.messageId && info.messageId.includes("ethereal")) {
      console.warn("[email] ⚠️ Mode test - Email non réellement envoyé");
      console.warn(`[email] Prévisualisation: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error: any) {
    console.error("[email] ❌ Erreur lors de l'envoi via SMTP:", error);
    console.error("[email] Détails de l'erreur:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    throw new Error(`Impossible d'envoyer l'email via SMTP: ${error.message}`);
  }
}

/**
 * Teste la connexion email (Resend ou SMTP)
 */
export async function testSMTPConnection(): Promise<{ success: boolean; error?: string; info?: any }> {
  if (isResendConfigured()) {
    try {
      console.log("[email] Test de connexion Resend...");
      const resend = new Resend(process.env.RESEND_API_KEY);
      // Resend n'a pas de méthode verify(), on teste en envoyant un email de test
      // Pour l'instant, on vérifie juste que la clé API est présente
      console.log("[email] ✅ Configuration Resend détectée");
      return { success: true, info: { provider: "resend" } };
    } catch (error: any) {
      console.error("[email] ❌ Erreur de configuration Resend:", error);
      return {
        success: false,
        error: error.message || "Erreur de configuration Resend",
        info: error,
      };
    }
  }

  try {
    console.log("[email] Test de connexion SMTP...");
    const transporter = getEmailTransporter();
    await transporter.verify();
    console.log("[email] ✅ Connexion SMTP réussie");
    return { success: true, info: { provider: "smtp" } };
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
  // Priorité: APP_URL > NEXT_PUBLIC_APP_URL > VERCEL_URL > localhost
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
    ? (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`)
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
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">${t.button}</a>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">${t.warning}</p>
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
    await sendEmail({
      to: email,
      subject: t.subject,
      text: textContent,
      html: htmlContent,
    });
  } catch (error: any) {
    console.error("[email] ❌ Erreur lors de l'envoi de l'email:", error);
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
  const translations = {
    fr: {
      subject: "Votre mot de passe PILOTYS a été réinitialisé",
      greeting: "Bonjour,",
      message:
        "Votre mot de passe a été réinitialisé avec succès. Si vous n'êtes pas à l'origine de cette action, contactez immédiatement le support.",
      footer: "L'équipe PILOTYS",
    },
    en: {
      subject: "Your PILOTYS password has been reset",
      greeting: "Hello,",
      message:
        "Your password has been successfully reset. If you did not perform this action, please contact support immediately.",
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
    await sendEmail({
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

/**
 * Envoie un email d'invitation à rejoindre une entreprise
 */
export async function sendCompanyInvitationEmail(
  email: string,
  companyName: string,
  inviterEmail: string,
  invitationToken: string,
  locale: string = "fr"
): Promise<void> {
  // Priorité: APP_URL > NEXT_PUBLIC_APP_URL > VERCEL_URL > localhost
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
    ? (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`)
    : "http://localhost:3000";
  const invitationUrl = `${appUrl}/accept-company-invitation?token=${invitationToken}`;

  console.log("[email] 📧 Préparation de l'email d'invitation entreprise:");
  console.log(`  Destinataire: ${email}`);
  console.log(`  Entreprise: ${companyName}`);
  console.log(`  Invité par: ${inviterEmail}`);
  console.log(`  URL d'invitation: ${invitationUrl}`);
  console.log(`  Locale: ${locale}`);

  const translations = {
    fr: {
      subject: `Invitation à rejoindre ${companyName} sur PILOTYS`,
      greeting: "Bonjour,",
      message: `${inviterEmail} vous invite à rejoindre l'entreprise <strong>${companyName}</strong> sur PILOTYS.`,
      description: "En acceptant cette invitation, vous pourrez collaborer avec votre équipe sur les projets, décisions et actions partagés.",
      button: "Accepter l'invitation",
      warning: "Ce lien est valide pendant 7 jours. Si vous ne souhaitez pas rejoindre cette entreprise, ignorez cet email.",
      footer: "L'équipe PILOTYS",
    },
    en: {
      subject: `Invitation to join ${companyName} on PILOTYS`,
      greeting: "Hello,",
      message: `${inviterEmail} invites you to join the company <strong>${companyName}</strong> on PILOTYS.`,
      description: "By accepting this invitation, you will be able to collaborate with your team on shared projects, decisions, and actions.",
      button: "Accept invitation",
      warning: "This link is valid for 7 days. If you do not wish to join this company, please ignore this email.",
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
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 30px;">${t.description}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">${t.button}</a>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">${t.warning}</p>
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

${t.message.replace(/<strong>|<\/strong>/g, "")}

${t.description}

${invitationUrl}

${t.warning}

${t.footer}
  `;

  try {
    await sendEmail({
      to: email,
      subject: t.subject,
      text: textContent,
      html: htmlContent,
    });
  } catch (error: any) {
    console.error("[email] ❌ Erreur lors de l'envoi de l'email d'invitation:", error);
    throw new Error(`Impossible d'envoyer l'email d'invitation: ${error.message}`);
  }
}
