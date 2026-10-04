// email bhejne ka ek hi jagah — baaki code sirf sendMail() call karta hai, SMTP ki details nahi jaanta
import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { logger } from "../logger.js";

const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

// transporter = SMTP server se connection (Gmail ka "post office")
const transporter = isConfigured
    ? nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465, // 465 = shuru se encrypted, 587 = pehle plain phir STARTTLS se encrypted
          auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
    : null;

if (!isConfigured) {
    logger.warn("SMTP not configured — emails will be printed in this terminal instead of being sent");
}

export const sendMail = async ({ to, subject, text, html }) => {
    // local dev bina SMTP: email ka text terminal me dikha do (link copy karke browser me kholo)
    if (!transporter) {
        logger.info(`📧 [DEV EMAIL] To: ${to}\n   Subject: ${subject}\n   ${text.replace(/\n/g, "\n   ")}`);
        return;
    }
    await transporter.sendMail({ from: env.MAIL_FROM || env.SMTP_USER, to, subject, text, html });
};
