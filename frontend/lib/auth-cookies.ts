import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE
} from "@backend/services/constants";

const secure = process.env.NODE_ENV === "production";

export const setAuthCookies = (
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string }
): void => {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE
  });

  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE
  });
};

export const clearAuthCookies = (response: NextResponse): void => {
  response.cookies.set(ACCESS_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0
  });

  response.cookies.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0
  });
};
