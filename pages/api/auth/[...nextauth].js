import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || "Login failed");

        return {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          image: data.user.image,
          accessToken: data.access,
          refreshToken: data.refresh,
          accessTokenExpires: Date.parse(data.expires),
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
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
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },
});
