import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

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
  session: {
  strategy: "jwt",
  maxAge: 60 * 60 * 24,  // 24 hours, adjust as needed
  },
  
  debug: process.env.NODE_ENV === "development",

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: "select_account" } },
    }),
    
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Email/Username", type: "text" },
        password: { label: "Password", type: "password" }
      },

      async authorize(credentials) {
  console.log("=== NEXTAUTH AUTHORIZE DEBUG ===");
  console.log("Credentials received:", {
    identifier: credentials?.identifier,
    hasPassword: !!credentials?.password
  });

  const requestBody = {
    identifier: credentials.identifier,
    password: credentials.password,
  };

  const loginUrl = `${BACKEND_URL}/api/accounts/login/`;
  console.log("Making request to:", loginUrl);

  const res = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  console.log("Response status:", res.status);
  const data = await res.json();
  console.log("Response data:", data);

  if (res.ok && data) {
    const user = {
      id: String(data.user_id || data.id),
      access: data.access, 
      refresh: data.refresh,
      username: data.username,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      image: data.image
    };

    console.log("User object being returned:", JSON.stringify(user, null, 2));

    return user;
  }
}

    }),
  ],

  callbacks: {
  async signIn({ user, account, profile }) {
  console.log("=== SIGNIN CALLBACK ===");
  console.log("Account provider:", account?.provider);
  console.log("Profile data:", profile);

  if (account?.provider === "google") {
    try {
      console.log("Making request to Django google-login endpoint...");
      
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

      console.log("Response status:", res.status);
      console.log("Response headers:", Object.fromEntries(res.headers.entries()));

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await res.text();
        console.error("Non-JSON response:", textResponse.substring(0, 500));
        return false;
      }

      const data = await res.json();
      console.log("Response data:", data);

      if (!res.ok) {
        console.error("Google login failed:", res.status, data);
        return false;
      }

      if (data?.is_new) {
        // New user: redirect to onboarding
        console.log("New user detected, blocking signin for onboarding");
        return false;
      } else {
        // Existing user: store tokens in user object for JWT callback
        user.access = data.access;
        user.refresh = data.refresh;
        user.id = data.user_id;
        user.username = data.username;
        user.first_name = data.first_name;
        user.last_name = data.last_name;
        user.email = data.email;
        if (data.image) user.image = data.image;
        
        console.log("Existing user, proceeding with signin");
        return true;
      }
    } catch (e) {
      console.error("Google login request failed:", e);
      return false;
    }
  }

  return true; // Default for other login methods
},

async jwt({ token, user, account }) {
  console.log("=== JWT CALLBACK DETAILED ===");
  console.log("Has user:", !!user);
  console.log("Account provider:", account?.provider);
  console.log("User keys:", user ? Object.keys(user) : "no user");
  console.log("User.access:", !!user?.access);

  // Initial sign in - user object is available
  if (user && account) {
    console.log("Processing initial sign in");

    token.id = user.id;
    token.isNewUser = user.isNewUser;

    // Consolidated logic for both credentials and google providers
    if (account.provider === "google" || account.provider === "credentials") {
      token.access = user.access; // From your backend (for both credentials and google)
      token.refresh = user.refresh; // From your backend (for both credentials and google)
      token.username = user.username;
      token.first_name = user.first_name;
      token.last_name = user.last_name;
      token.email = user.email;
      if (user.image) token.image = user.image;
    }

    console.log("JWT token after initial sign in - has access token:", !!token.access);
  }

  // Token refresh logic (for both Google and credentials login)
  if (token.access) {
    const accessExpiry = decodeJwtExp(token.access);
    const now = Date.now();

    if (accessExpiry && accessExpiry < now + 300000) {
      console.log("Access token expired, attempting refresh...");

      try {
        const res = await fetch(`${BACKEND_URL}/api/accounts/token/refresh/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: token.refresh }),
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Token refresh successful");
          token.access = data.access;
          
          // Django rotates refresh tokens, so update it
          if (data.refresh) {
            token.refresh = data.refresh;
          }
        } else {
          console.error("Token refresh failed:", res.status);
          // Clear tokens to force re-authentication
          delete token.access;
          delete token.refresh;
          return null; // This will end the session
        }
      } catch (error) {
        console.error("Refresh request failed:", error);
        delete token.access;
        delete token.refresh;
        return null;
      }
    }
  }

  return token; // Return the updated token with the new values
},

    async session({ session, token }) {
      console.log("=== SESSION CALLBACK DETAILED ===");
      console.log("Token keys:", token ? Object.keys(token) : "no token");
      console.log("Token.access:", !!token?.access);
      console.log("Full token object:", token);
          
      if (token?.access) {
      session.access = token.access; // Store access token in session
      console.log("Access token set in session:", session.access);
    }
      
      if (token?.refresh) {
        session.refresh = token.refresh;   
      }
      
      if (token?.id) {
        session.user.id = token.id;
      }
      
      if (token?.first_name) {
        session.user.first_name = token.first_name;
      }
      
      if (token?.last_name) {
        session.user.last_name = token.last_name;
      }
      
      if (token?.username) {
        session.user.username = token.username;
      }
      
      if (token?.email) {
        session.user.email = token.email;
      }
      
      if (token?.image) {
        session.user.image = token.image;
      }
      
      if (token?.isNewUser !== undefined) {
        session.isNewUser = token.isNewUser;
      }

      return session;
    }
  },

  events: {
    async signIn(message) {
      console.log("Sign in event:", message);
    },
    async signOut(message) {
      console.log("Sign out event:", message);
    },
  },
});