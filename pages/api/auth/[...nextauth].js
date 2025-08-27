import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // optional: force account chooser
      authorization: { params: { prompt: "select_account" } },
    }),
  ],

  pages: {
    // If your real sign-in screen is /signin, point here:
    // signIn: "/signin",
    signIn: "/register",
    error: "/signin",
  },

  callbacks: {
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

        // ❗ Block OAuth if backend failed. No zombie sessions.
        if (!res.ok || !data) return false;

        // Existing user → backend returns user_id
        if (data.user_id) user.id = data.user_id;

        // New user → backend returns is_new: true
        user.isNewUser = !!data.is_new;
        return true;
      } catch (e) {
        // Block on error so session won't be created
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.id = user.id;
        token.isNewUser = !!user.isNewUser;  // always boolean
      }
      return token;
    },

    async session({ session, token }) {
      // always set a boolean flag (never undefined)
      session.user = session.user || {};
      if (token?.id) session.user.id = token.id;
      session.user.is_new = !!token.isNewUser;
      return session;
    },
  },
});
