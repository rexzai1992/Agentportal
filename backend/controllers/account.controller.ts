import { getAccountDetail, listAccounts, updateAccount } from "@backend/services/account.service";

export const accountController = {
  list: listAccounts,
  detail: getAccountDetail,
  update: updateAccount
};
