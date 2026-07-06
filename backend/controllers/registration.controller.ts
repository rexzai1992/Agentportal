import {
  createRegistration,
  getRegistrationDetail,
  getRegistrationStatus,
  listRegistrations,
  verifyRegistration
} from "@backend/services/registration.service";

export const registrationController = {
  create: createRegistration,
  status: getRegistrationStatus,
  list: listRegistrations,
  detail: getRegistrationDetail,
  verify: verifyRegistration
};
