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
  } catch (e) {
    console.error("Error decoding JWT:", e);
  }
  return null;
}

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,  // 7 days
    updateAge: 60 * 60 * 2,    // Update session every 2 hours
  },
  
  jwt: {
    maxAge: 60 * 60 * 24 * 7,  // 7 days
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
        
        if (!credentials?.identifier || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
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
          
          if (!res.ok) {
            console.log("Login failed with status:", res.status);
            return null;
          }

          const data = await res.json();
          console.log("Response data keys:", Object.keys(data));

          if (data && data.access && data.refresh) {
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

            console.log("User object created successfully");
            return user;
          } else {
            console.error("Missing access or refresh token in response");
            return null;
          }
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
          
          if (data?.is_new) {
            console.log("New user detected, blocking signin for onboarding");
            return false;
          } else {
            // Store tokens for JWT callback
            user.access = data.access;
            user.refresh = data.refresh;
            user.id = data.user_id;
            user.username = data.username;
            user.first_name = data.first_name;
            user.last_name = data.last_name;
            user.email = data.email;
            if (data.image) user.image = data.image;
            
            console.log("Google user data prepared for JWT callback");
            return true;
          }
        } catch (e) {
          console.error("Google login request failed:", e);
          return false;
        }
      }

      return true; // Allow other providers
    },

    async jwt({ token, user, account, trigger, session }) {
      console.log("=== JWT CALLBACK START ===");
      console.log("Trigger:", trigger);
      console.log("Has user object:", !!user);
      console.log("Has account:", !!account);
      console.log("Has session:", !!session);
      console.log("Current token keys:", token ? Object.keys(token) : "no token");

      // Initial sign in or update
      if (user && (account || trigger === 'update')) {
        console.log("=== INITIAL SIGN IN OR UPDATE ===");
        
        // Basic user info
        token.id = user.id;
        token.username = user.username;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.email = user.email;
        if (user.image) token.image = user.image;
        if (user.isNewUser !== undefined) token.isNewUser = user.isNewUser;

        // Store JWT tokens
        if (user.access && user.refresh) {
          token.access = user.access;
          token.refresh = user.refresh;
          token.tokenTimestamp = Date.now(); // Track when token was stored
          console.log("Stored JWT tokens successfully");
        } else {
          console.error("Missing JWT tokens from user object");
          console.log("User object:", user);
          return null; // Force re-auth if tokens missing
        }

        return token;
      }

      // Subsequent requests - check token validity
      console.log("=== TOKEN VALIDATION/REFRESH ===");
      
      if (!token.access || !token.refresh) {
        console.error("Missing stored tokens, forcing re-auth");
        return null;
      }

      // Check if access token needs refresh
      const accessExpiry = decodeJwtExp(token.access);
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000; // Increased from 5 to 10 minutes

      if (accessExpiry) {
        const timeToExpiry = accessExpiry - now;
        console.log(`Token expires in: ${Math.round(timeToExpiry / 1000 / 60)} minutes`);

        // Refresh if expiring in 10 minutes
        if (timeToExpiry < tenMinutes) {
          console.log("=== REFRESHING TOKEN ===");
          
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
              console.log("New tokens received:", {
                access: !!data.access,
                refresh: !!data.refresh,
                accessLength: data.access?.length,
                refreshLength: data.refresh?.length
              });
              
              token.access = data.access;
              token.tokenTimestamp = Date.now(); // Update timestamp
              
              // CRITICAL: Always update refresh token when rotated
              if (data.refresh && data.refresh !== token.refresh) {
                console.log("Refresh token rotated - updating stored token");
                token.refresh = data.refresh;
              }
              
              console.log("Token refresh successful");
              // Clear refresh attempt flag after successful refresh
              delete token.refreshAttempted;
            } else {
              console.error("Token refresh failed:", res.status);
              // Try to get response body for debugging
              try {
                const errorData = await res.text();
                console.error("Refresh error response:", errorData);
              } catch (e) {
                console.error("Could not read error response");
              }
              
              // Don't immediately force re-auth, try once more on next request
              if (!token.refreshAttempted) {
                token.refreshAttempted = true;
                token.refreshFailedAt = Date.now();
                console.log("Marking for retry on next request");
                return token;
              } else {
                console.log("Previous refresh attempt failed, forcing re-auth");
                return null;
              }
            }
          } catch (error) {
            console.error("Token refresh network error:", error);
            
            // Don't immediately force re-auth on network errors
            if (!token.refreshAttempted) {
              token.refreshAttempted = true;
              token.refreshFailedAt = Date.now();
              console.log("Network error, marking for retry on next request");
              return token;
            } else {
              console.log("Previous refresh attempt failed, forcing re-auth");
              return null;
            }
          }
        } else {
          // Reset refresh attempt flag if we're not trying to refresh
          if (token.refreshAttempted) {
            // Only reset if it's been more than 5 minutes since failure
            const timeSinceFailure = token.refreshFailedAt ? now - token.refreshFailedAt : Infinity;
            if (timeSinceFailure > 5 * 60 * 1000) {
              delete token.refreshAttempted;
              delete token.refreshFailedAt;
            }
          }
        }
      } else {
        console.error("Could not decode access token expiry");
        // Don't immediately force re-auth, the token might still be valid
        console.log("Continuing with existing token despite decode failure");
      }

      console.log("=== JWT CALLBACK END - SUCCESS ===");
      return token;
    },

    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");
      console.log("Token available:", !!token);
      console.log("Token has access:", !!token?.access);

      if (token) {
        // Copy all token data to session
        session.access = token.access;
        session.refresh = token.refresh;
        
        if (session.user) {
          session.user.id = token.id;
          session.user.username = token.username;
          session.user.first_name = token.first_name;
          session.user.last_name = token.last_name;
          session.user.email = token.email;
          if (token.image) session.user.image = token.image;
        }
        
        if (token.isNewUser !== undefined) {
          session.isNewUser = token.isNewUser;
        }
      }

      console.log("Session prepared with access token:", !!session.access);
      return session;
    }
  },

  pages: {
    error: '/auth/error', // Add custom error page
  },

  events: {
    async signIn(message) {
      console.log("✅ Sign in event:", message.user?.email);
    },
    async signOut(message) {
      console.log("❌ Sign out event:", message.token?.email);
    },
    async session(message) {
      console.log("🔄 Session event:", !!message.session?.access);
    },
  },
});