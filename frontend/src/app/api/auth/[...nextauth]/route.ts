// frontend/src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import { JWT } from "next-auth/jwt"

const isAuthDebug = process.env.SUPERVITY_AUTH_DEBUG === 'true';

function log(message: string, data?: object) {
  if (isAuthDebug) {
    const logData = data ? JSON.stringify(data, null, 2) : '';
    console.log(`[AUTH_DEBUG | NextAuth] ${new Date().toISOString()}: ${message}\n${logData}`);
  }
}

// Helper function to get URLs at runtime - now using separate environment variables

async function refreshAccessToken(token: JWT): Promise<JWT> {
  log("Access token has expired or is about to expire. Attempting to refresh.");
  try {
    const keycloakIssuer = process.env.KEYCLOAK_ISSUER || "http://keycloak:8080/realms/supervity";
    const response = await fetch(`${keycloakIssuer}/protocol/openid-connect/token`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken!,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    log("Successfully refreshed access token.", {
      new_access_token: "...", // Masked for security
      new_refresh_token: refreshedTokens.refresh_token ? "..." : "Not Refreshed",
      expires_in: refreshedTokens.expires_in
    });

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + (Number(refreshedTokens.expires_in) || 300) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    log("🔴 ERROR refreshing access token.", { error });
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

const keycloakIssuer = process.env.KEYCLOAK_ISSUER || "http://keycloak:8080/realms/supervity";

log(`Configuring Keycloak provider with issuer: ${keycloakIssuer}`);

const authOptions: AuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: keycloakIssuer,
      wellKnown: `${keycloakIssuer}/.well-known/openid-configuration`,
      // ... other provider config
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      log("JWT callback triggered.");

      // Initial sign in
      if (account) {
        log("Initial sign-in flow. Received account object from Keycloak.", {
          provider: account.provider,
          type: account.type,
          access_token: "...", // Masked
          refresh_token: "...", // Masked
          id_token: "...", // Masked
          expires_at: account.expires_at,
        });
        token.accessToken = account.access_token;
        token.accessTokenExpires = Date.now() + (Number(account.expires_in) || 300) * 1000;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        log("Access token is still valid.");
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      log("Session callback triggered.");
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      log("Returning session object to client.", {
        user: session.user,
        accessToken: session.accessToken ? "Present" : "Absent",
        error: session.error,
      });
      return session;
    },
    async redirect({ url, baseUrl }) {
      log(`Redirect callback triggered. url: ${url}, baseUrl: ${baseUrl}`);
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async signIn({ user, account }) {
      log("✅ User signed in successfully.", {
        user: user,
        account: { provider: account?.provider, type: account?.type }
      });
    },
    async signOut() {
      log("User signing out. Invalidating Keycloak session.");
      // ... (sign out logic remains the same)
    },
  },
  pages: {
    signIn: "/api/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };