// frontend/src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import { JWT } from "next-auth/jwt"

// Helper function to get URLs at runtime
function getKeycloakUrls() {
  const containerIssuer = process.env.KEYCLOAK_ISSUER || "http://keycloak:8080/realms/supervity";
  const browserIssuer = containerIssuer.replace("keycloak:8080", "localhost:8080");
  return { containerIssuer, browserIssuer };
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const { containerIssuer } = getKeycloakUrls();
    // Use container URL for server-to-server token refresh
    const response = await fetch(`${containerIssuer}/protocol/openid-connect/token`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken!,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + (Number(refreshedTokens.expires_in) || 300) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    console.error("Error refreshing access token", error)
    return { ...token, error: "RefreshAccessTokenError" }
  }
}

const authOptions: AuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      // Get URLs dynamically at runtime
      get issuer() {
        return getKeycloakUrls().browserIssuer;
      },
      // Browser redirects use localhost:8080
      authorization: {
        get url() {
          return `${getKeycloakUrls().browserIssuer}/protocol/openid-connect/auth`;
        },
        params: { scope: "openid email profile" },
      },
      // Server-to-server calls use container hostname
      get token() {
        return `${getKeycloakUrls().containerIssuer}/protocol/openid-connect/token`;
      },
      get userinfo() {
        return `${getKeycloakUrls().containerIssuer}/protocol/openid-connect/userinfo`;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token
        token.accessTokenExpires = Date.now() + (Number(account.expires_in) || 300) * 1000
        token.refreshToken = account.refresh_token
        token.idToken = account.id_token
        return token
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      return session
    },
  },
  events: {
    async signOut({ token }) {
        const { browserIssuer } = getKeycloakUrls();
        // Use browser URL for signout (since this is a redirect)
        const logOutUrl = new URL(`${browserIssuer}/protocol/openid-connect/logout`);
        // Note: For Keycloak, you often need to provide a redirect_uri to return to after logout.
        // Let's add it for robustness.
        const postLogoutRedirectUri = process.env.NEXTAUTH_URL!;
        logOutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
        logOutUrl.searchParams.set("id_token_hint", token.idToken as string);

        // This fetch is a fire-and-forget to invalidate the Keycloak server session.
        // NextAuth handles the client-side redirect.
        try {
          await fetch(logOutUrl);
        } catch (error) {
          console.error("Error during Keycloak logout fetch:", error);
        }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
