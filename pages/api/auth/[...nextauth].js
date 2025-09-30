import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

function decodeJwtExp(token) {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    if (json && typeof json.exp === "number") return json.exp * 1000;
  } catch (e) {
    console.error("Error decoding JWT:", e);
  }
  return null;
}

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 2,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 7,
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
        rememberMe: { label: "Remember Me", type: "checkbox" }
      },
      async authorize(credentials) {
        console.log("=== NEXTAUTH AUTHORIZE DEBUG ===");

        if (!credentials?.identifier || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          const requestBody = {
            identifier: credentials.identifier,
            password: credentials.password,
          };

          const res = await fetch(`${BACKEND_URL}/api/accounts/login/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          if (!res.ok) {
            console.log("Login failed with status:", res.status);
            return null;
          }

          const data = await res.json();

          if (data && data.access && data.refresh) {
            return {
              id: String(data.user_id || data.id),
              access: data.access,
              refresh: data.refresh,
              username: data.username,
              email: data.email,
              first_name: data.first_name,
              last_name: data.last_name,
              image: data.image
            };
          }
          return null;
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      }
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("=== SIGNIN CALLBACK ===");
      console.log("Account provider:", account?.provider);

      if (account?.provider === "google") {
        try {
          console.log("Processing Google sign in...");

          const res = await fetch(`${BACKEND_URL}/api/accounts/google-login/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              email: profile?.email,
              name: profile?.name,
              image: profile?.picture,
            }),
          });

          if (!res.ok) {
            console.error("Google login failed:", res.status);
            return false;
          }

          const data = await res.json();
          console.log("Backend response:", data);

          if (data?.is_new) {
            // NEW USER - Store data for registration
            user.isNewUser = true;
            user.googleData = {
              email: data.email,
              name: data.name,
              first_name: data.first_name,
              last_name: data.last_name,
              image: data.image,
            };
            // No JWT tokens for new users
            user.access = null;
            user.refresh = null;
            
            console.log("New Google user - storing registration data");
            return true;

          } else {
            // EXISTING USER - Store tokens
            user.access = data.access;
            user.refresh = data.refresh;
            user.id = String(data.user_id || data.id);
            user.username = data.username;
            user.first_name = data.first_name;
            user.last_name = data.last_name;
            user.email = data.email;
            user.isNewUser = false;
            if (data.image) user.image = data.image;

            console.log("Existing Google user - storing tokens");
            return true;
          }
        } catch (e) {
          console.error("Google login request failed:", e);
          return false;
        }
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      console.log("=== REDIRECT CALLBACK ===");
      console.log("URL:", url);
      console.log("Base URL:", baseUrl);
      
      // For OAuth redirects, go to our handler page
      return `${baseUrl}/auth/callback`;
    },

    async jwt({ token, user, account, trigger }) {
      console.log("=== JWT CALLBACK START ===");
      console.log("Trigger:", trigger);
      console.log("Current token keys:", token ? Object.keys(token) : "no token");

      // Initial sign in
      if (user && account) {
        console.log("=== INITIAL SIGN IN ===");
        
        token.id = user.id;
        token.username = user.username;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.email = user.email;
        if (user.image) token.image = user.image;

        // Handle new user flag and Google data
        if (user.isNewUser !== undefined) {
          token.isNewUser = user.isNewUser;
          if (user.isNewUser && user.googleData) {
            token.googleData = user.googleData;
            console.log("Stored Google data for new user");
          }
        }

        // Store JWT tokens (only for existing users)
        if (user.access && user.refresh) {
          token.access = user.access;
          token.refresh = user.refresh;
          token.tokenTimestamp = Date.now();
          console.log("Stored JWT tokens");
        }

        return token;
      }

      // Skip token refresh for new users
      if (token.isNewUser) {
        console.log("Skipping token validation for new user");
        return token;
      }

      // Token refresh logic for existing users (your existing logic)
      if (!token.access || !token.refresh) {
        console.error("Missing stored tokens");
        return null;
      }

      const accessExpiry = decodeJwtExp(token.access);
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;

      if (accessExpiry) {
        const timeToExpiry = accessExpiry - now;
        console.log(`Token expires in: ${Math.round(timeToExpiry / 1000 / 60)} minutes`);
        
        if (timeToExpiry < tenMinutes) {
          console.log("=== REFRESHING TOKEN ===");

          try {
            const res = await fetch(`${BACKEND_URL}/api/accounts/token/refresh/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh: token.refresh }),
            });

            if (res.ok) {
              const data = await res.json();
              token.access = data.access;
              token.tokenTimestamp = Date.now();
              if (data.refresh && data.refresh !== token.refresh) {
                token.refresh = data.refresh;
              }
              console.log("Token refresh successful");
              delete token.refreshAttempted;
            } else {
              if (!token.refreshAttempted) {
                token.refreshAttempted = true;
                return token;
              } else {
                console.log("Refresh failed, forcing re-auth");
                return null;
              }
            }
          } catch (error) {
            console.error("Token refresh error:", error);
            if (!token.refreshAttempted) {
              token.refreshAttempted = true;
              return token;
            } else {
              return null;
            }
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");
      console.log("Token available:", !!token);
      console.log("Token has access:", !!token?.access);

      if (token) {
        // Only set access/refresh for existing users
        if (!token.isNewUser) {
          session.access = token.access;
          session.refresh = token.refresh;
        }

        if (session.user) {
          session.user.id = token.id;
          session.user.username = token.username;
          session.user.first_name = token.first_name;
          session.user.last_name = token.last_name;
          session.user.email = token.email;
          if (token.image) session.user.image = token.image;

          // Pass new user flag and Google data
          if (token.isNewUser !== undefined) {
            session.user.isNewUser = token.isNewUser;
            if (token.googleData) {
              session.user.googleData = token.googleData;
            }
          }
        }
      }
      console.log("Session prepared with access token:", !!session.access);
      return session;
    }
  },

  pages: {
    error: '/auth/error',
  },
});