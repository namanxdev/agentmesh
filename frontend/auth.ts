import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in, profile contains the Google user info
      if (account && profile) {
        token.sub = profile.sub;          // Google user ID → our user_id
        token.picture = profile.picture ?? token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose user ID to server-side components and API routes
      session.user.id = token.sub as string;
      return session;
    },
  },
});
