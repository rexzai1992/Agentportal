import {
  loginUser,
  logoutUser,
  requestPasswordReset,
  requestTemporaryPassword,
  resetPassword,
  changePassword
} from "@backend/services/auth.service";

export const authController = {
  login: loginUser,
  logout: logoutUser,
  requestPasswordReset,
  requestTemporaryPassword,
  resetPassword,
  changePassword
};
