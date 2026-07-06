import { consoleDriver } from "@backend/services/email/drivers/console.driver";
import { templates, type EmailMessage } from "@backend/services/email/templates";

interface EmailDriver {
  send: (message: EmailMessage) => Promise<void>;
}

const resolveDriver = (): EmailDriver => {
  switch (process.env.EMAIL_DRIVER) {
    // Add real drivers here (e.g. "resend", "smtp") and select by env.
    case "console":
    default:
      return consoleDriver;
  }
};

const driver = resolveDriver();

export const sendEmail = async (message: EmailMessage): Promise<void> => {
  try {
    await driver.send(message);
  } catch (error) {
    // Never let a notification failure break the primary flow.
    // eslint-disable-next-line no-console
    console.error("[email] failed to send", error);
  }
};

/** Typed helpers — one per trigger, so real provider wiring has a single call site. */
export const emails = {
  registrationSubmitted: (to: string, applicationId: string) =>
    sendEmail({ to, ...templates.registrationSubmitted({ applicationId }) }),

  registrationApproved: (to: string, username: string, temporaryPassword: string) =>
    sendEmail({ to, ...templates.registrationApproved({ username, temporaryPassword }) }),

  registrationRevision: (to: string, applicationId: string, remarks: string) =>
    sendEmail({ to, ...templates.registrationRevision({ applicationId, remarks }) }),

  registrationRejected: (to: string) =>
    sendEmail({ to, ...templates.registrationRejected() }),

  renewalApproved: (to: string, companyName: string, accountCode: string, newExpiry: string) =>
    sendEmail({ to, ...templates.renewalApproved({ companyName, accountCode, newExpiry }) }),

  renewalRevision: (to: string, remarks: string) =>
    sendEmail({ to, ...templates.renewalRevision({ remarks }) }),

  renewalRejected: (to: string) => sendEmail({ to, ...templates.renewalRejected() }),

  renewalReminder: (to: string, companyName: string, accountCode: string, expiry: string) =>
    sendEmail({ to, ...templates.renewalReminder({ companyName, accountCode, expiry }) }),

  offlinePaymentConfirmed: (to: string, reference: string) =>
    sendEmail({ to, ...templates.offlinePaymentConfirmed({ reference }) }),

  offlinePaymentRevision: (to: string, reference: string, remarks: string) =>
    sendEmail({ to, ...templates.offlinePaymentRevision({ reference, remarks }) }),

  offlinePaymentRejected: (to: string, reference: string, remarks: string) =>
    sendEmail({ to, ...templates.offlinePaymentRejected({ reference, remarks }) }),

  temporaryPassword: (to: string, temporaryPassword: string) =>
    sendEmail({ to, ...templates.temporaryPassword({ temporaryPassword }) }),

  passwordChanged: (to: string) => sendEmail({ to, ...templates.passwordChanged() })
};
