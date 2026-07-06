import {
  createRenewal,
  getAgentProfile,
  getLatestRenewal,
  listRenewals,
  verifyRenewal
} from "@backend/services/renewal.service";
import {
  createComplimentary,
  listComplimentary,
  listComplimentaryUsers
} from "@backend/services/complimentary.service";

export const renewalController = {
  create: createRenewal,
  latest: getLatestRenewal,
  list: listRenewals,
  verify: verifyRenewal,
  profile: getAgentProfile
};

export const complimentaryController = {
  create: createComplimentary,
  list: listComplimentary,
  users: listComplimentaryUsers
};
