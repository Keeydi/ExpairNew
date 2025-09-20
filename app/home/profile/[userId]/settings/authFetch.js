// authFetch.js (put next to settings/page.jsx)
"use client";

import { getSession } from "next-auth/react";

/**
 * authFetch(url, options = {}, session = undefined)
 * - session param is preferred (pass session from useSession)
 * - if session is not provided, we call getSession() as a fallback
 * - logs the session/token and the headers it will send
 */
export async function authFetch(url, options = {}, session = undefined) {
  try {
    // If caller didn't pass session, try to get it
    if (!session) {
      session = await getSession();
      console.log("[authFetch] getSession() returned:", session);
    } else {
      console.log("[authFetch] session passed in:", !!session, session ? Object.keys(session) : session);
    }

    // Try a few common places for the token (be defensive)
    const token =
      session?.access ||
      session?.accessToken ||
      session?.token ||
      session?.user?.access ||
      session?.user?.accessToken ||
      undefined;

    console.log("[authFetch] resolved token preview:", token ? `${token.slice(0,8)}...` : "NONE");

    if (!token) {
      console.error("[authFetch] ⚠️ No token found in session. session value:", session);
      throw new Error("Not authenticated (no token)");
    }

    // Build headers (preserve any we already had)
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    console.log("[authFetch] will call:", url, "with headers:", headers);

    return fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    console.error("[authFetch] ERROR:", err);
    throw err;
  }
}
