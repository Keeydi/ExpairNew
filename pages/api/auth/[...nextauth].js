import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

// Helper: decode JWT exp (ms) without verifying
function decodeJwtExp(token) {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    if (json && typeof json.exp === "number") return json.exp * 1000;
  } catch {}
  return null;
}

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // Set a long maxAge by default. The `session` callback below
    // will override this for non-remember-me logins.
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username/Email", type: "text" },
        password: { label: "Password", type: "password" },
        // Add a new credential for the remember me flag
        rememberMe: { label: "Remember Me", type: "checkbox" }
      },
      async authorize(credentials) {
        const res = await fetch(`${BACKEND_URL}/api/accounts/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: credentials.identifier,
            password: credentials.password,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");

        // Return the user data along with the `rememberMe` flag
        return {
          id: String(data.user_id || data.id),
          access: data.access,
          refresh: data.refresh,
          username: data.username,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          image: data.image,
          rememberMe: credentials.rememberMe, // Pass the flag from the request
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Pass the rememberMe flag to the token
      if (user?.rememberMe !== undefined) {
        token.rememberMe = user.rememberMe;
      }

      if (user && account) {
        token.id = user.id;
        token.access = user.access;
        token.refresh = user.refresh;
        token.username = user.username;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.email = user.email;
        if (user.image) token.image = user.image;
      }
      return token;
    },

    async session({ session, token }) {
      // Define a standard session expiration (e.g., 2 hours)
      const DEFAULT_SESSION_MAX_AGE = 2 * 60 * 60;

      // Use the rememberMe flag from the token to set a longer expiry
      if (token.rememberMe) {
        const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
        session.expires = new Date(Date.now() + THIRTY_DAYS_IN_SECONDS * 1000).toISOString();
      } else {
        session.expires = new Date(Date.now() + DEFAULT_SESSION_MAX_AGE * 1000).toISOString();
      }
      
      if (token) {
        session.access = token.access;
        session.refresh = token.refresh;
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.first_name = token.first_name;
        session.user.last_name = token.last_name;
        session.user.email = token.email;
        session.user.image = token.image;
      }
      return session;
    },
  },
});