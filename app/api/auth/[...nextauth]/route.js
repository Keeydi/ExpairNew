import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        // Call your Django login endpoint
        const res = await fetch("http://localhost:8000/api/accounts/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || "Login failed");

        // ⚡️ IMPORTANT: return tokens under the right field names
        return {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          image: data.user.image,
          accessToken: data.access,           // ✅ rename here
          refreshToken: data.refresh,         // ✅ rename here
          accessTokenExpires: Date.parse(data.expires),
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // First time: store values from authorize()
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = user.accessTokenExpires;
        token.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          image: user.image,
        };
      }
      return token;
    },

    async session({ session, token }) {
      session.user = token.user;
      session.accessToken = token.accessToken;   // ✅ what authFetch expects
      session.refreshToken = token.refreshToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
