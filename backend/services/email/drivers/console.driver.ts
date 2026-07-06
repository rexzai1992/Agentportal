import type { EmailMessage } from "@backend/services/email/templates";

/**
 * Default no-op email driver: logs the message instead of sending.
 * Swap for a real provider (Resend/SES/SMTP) by adding a driver and selecting it
 * via EMAIL_DRIVER in email.service.ts.
 */
export const consoleDriver = {
  send: async (message: EmailMessage): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log(
      `\n[email] to=${message.to}\n[email] subject=${message.subject}\n${message.body}\n`
    );
  }
};
