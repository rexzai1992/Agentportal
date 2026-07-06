export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

const FOOTER = "\n\n******Please do not reply to this auto-generated email.\nThank you.";

export const templates = {
  registrationSubmitted: (params: { applicationId: string }): Omit<EmailMessage, "to"> => ({
    subject: "Registration",
    body: `Dear Agent/Partner,\n\nYour application has been successfully registered with us.\nThis is your reference Id: ${params.applicationId}.${FOOTER}`
  }),

  registrationApproved: (params: {
    username: string;
    temporaryPassword: string;
  }): Omit<EmailMessage, "to"> => ({
    subject: "Approval",
    body: `Dear Agent/Partner,\n\nYour application has been approved.\nYour login account: ${params.username}, and temporary password: ${params.temporaryPassword}.\nThe temporary password will expire in 24 hours. Please log in and update your password within this time frame.${FOOTER}`
  }),

  registrationRevision: (params: {
    applicationId: string;
    remarks: string;
  }): Omit<EmailMessage, "to"> => ({
    subject: "Revision",
    body: `Dear Agent/Partner,\n\nYour application id ${params.applicationId} has been updated as Revision.\nRemarks: ${params.remarks}\nYou may update your application on Check Application Status by searching your application ID.${FOOTER}`
  }),

  registrationRejected: (): Omit<EmailMessage, "to"> => ({
    subject: "Rejected",
    body: `Dear Agent/Partner,\n\nYour application has been rejected.${FOOTER}`
  }),

  renewalApproved: (params: {
    companyName: string;
    accountCode: string;
    newExpiry: string;
  }): Omit<EmailMessage, "to"> => ({
    subject: "Account Renewal Request Approved",
    body: `Dear Agent,\n\nThe account renewal request for Company ${params.companyName} with Account No ${params.accountCode} was approved.\nThe account expiry date for the account was renewed to ${params.newExpiry}.${FOOTER}`
  }),

  renewalRevision: (params: { remarks: string }): Omit<EmailMessage, "to"> => ({
    subject: "Account Renewal Request Revision",
    body: `Dear Agent,\n\nYour account renewal request requires revision.\nRemarks: ${params.remarks}${FOOTER}`
  }),

  renewalRejected: (): Omit<EmailMessage, "to"> => ({
    subject: "Account Renewal Request Rejected",
    body: `Dear Agent,\n\nYour account renewal request has been rejected.${FOOTER}`
  }),

  renewalReminder: (params: {
    companyName: string;
    accountCode: string;
    expiry: string;
  }): Omit<EmailMessage, "to"> => ({
    subject: "Agent Portal Account Expiry",
    body: `Dear Agent,\n\nThis is a reminder regarding the account for your Company ${params.companyName} with Account No ${params.accountCode} would be expired on ${params.expiry}.\nAccount renewal could be done by click on profile and upload necessary information in section "Account Renewal".${FOOTER}`
  }),

  offlinePaymentConfirmed: (params: {
    reference: string;
  }): Omit<EmailMessage, "to"> => ({
    subject: "Offline Payment Confirmed",
    body: `Dear Agent/Partner,\n\nYour offline payment for transaction ${params.reference} has been confirmed and your vouchers have been generated.${FOOTER}`
  }),

  offlinePaymentRevision: (params: {
    reference: string;
    remarks: string;
  }): Omit<EmailMessage, "to"> => ({
    subject: "Offline Payment Revision",
    body: `Dear Agent/Partner,\n\nYour offline payment for transaction ${params.reference} requires revision.\nRemarks: ${params.remarks}${FOOTER}`
  }),

  offlinePaymentRejected: (params: {
    reference: string;
    remarks: string;
  }): Omit<EmailMessage, "to"> => ({
    subject: "Offline Payment Rejected",
    body: `Dear Agent/Partner,\n\nYour offline payment for transaction ${params.reference} has been rejected.\nRemarks: ${params.remarks}${FOOTER}`
  }),

  temporaryPassword: (params: {
    temporaryPassword: string;
  }): Omit<EmailMessage, "to"> => ({
    subject: "Reset Password",
    body: `Dear Agent/Partner,\n\nYour password has been reset to a temporary password ${params.temporaryPassword}.${FOOTER}`
  }),

  passwordChanged: (): Omit<EmailMessage, "to"> => ({
    subject: "Password Changed",
    body: `Dear Agent/Partner,\n\nYour password has been changed successfully.${FOOTER}`
  })
};
