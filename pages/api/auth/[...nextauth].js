// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

// Helper: decode JWT exp (ms) without verifying (for refresh timing)
function decodeJwtExp(token) {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    if (json && typeof json.exp === "number") return json.exp * 1000; // ms
  } catch {}
  return null;
}

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
  ],

  pages: {
    signIn: "/register", // adjust if you have a different sign-in page
    error: "/signin",
  },

  callbacks: {
    /**
     * After OAuth sign-in, call your Django endpoint to upsert the user.
     * If your backend returns { access, refresh }, we stash them.
     * If it returns just user info (no tokens), sign-in still succeeds (backward compatible).
     */
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      try {
        const res = await fetch(`${BACKEND_URL}/api/accounts/google-login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            image: user.image,
            provider: "google",
          }),
        });

        const ct = res.headers.get("content-type") || "";
        const data = ct.includes("application/json") ? await res.json() : null;
        if (!res.ok || !data) return false;

        // Map whatever your backend returns
        if (data.user_id) user.id = data.user_id;
        if (data.first_Name) user.first_Name = data.first_Name;
        user.isNewUser = !!data.is_new;

        // NEW: Pick up tokens if backend returns them now/soon
        if (data.access) user.access = data.access;
        if (data.refresh) user.refresh = data.refresh;

        return true;
      } catch (e) {
        console.error("google-login failed:", e);
        return false;
      }
    },

    /**
     * Store tokens in the NextAuth JWT and refresh as needed.
     */
    async jwt({ token, user }) {
      // Initial sign-in: copy identifiers + tokens from `user` to `token`
      if (user) {
        if (user.id) token.id = user.id;
        token.isNewUser = !!user.isNewUser;
        if (user.first_Name) token.first_Name = user.first_Name;

        if (user.access) {
          token.access = user.access;
          token.accessExp = decodeJwtExp(user.access);
        }
        if (user.refresh) token.refresh = user.refresh;
      }

      // If we have a refresh token and access has (almost) expired, refresh it
      const now = Date.now();
      const needsRefresh =
        token.refresh && token.accessExp && now > token.accessExp - 30_000; // 30s skew

      if (needsRefresh) {
        try {
          const r = await fetch(`${BACKEND_URL}/api/accounts/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: token.refresh }),
          });
          if (r.ok) {
            const data = await r.json();
            if (data.access) {
              token.access = data.access;
              token.accessExp = decodeJwtExp(data.access);
            }
          } else {
            // refresh failed -> drop tokens so protected calls fail gracefully
            delete token.access;
            delete token.accessExp;
            delete token.refresh;
          }
        } catch (e) {
          console.error("token refresh failed:", e);
          delete token.access;
          delete token.accessExp;
          delete token.refresh;
        }
      }

      return token;
    },

    /**
     * Expose access token to the client (e.g., for Authorization: Bearer ...)
     */
    async session({ session, token }) {
      session.user = session.user || {};
      if (token?.id) session.user.id = token.id;
      session.user.is_new = !!token.isNewUser;
      if (token.first_Name) session.user.first_Name = token.first_Name;

      session.accessToken = token.access || null;
      return session;
    },
  },
});
