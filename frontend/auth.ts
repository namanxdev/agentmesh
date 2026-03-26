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
      if (account && profile) {
        token.sub = profile.sub ?? token.sub;
        token.picture = (profile.picture as string | undefined) ?? token.picture;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub as string;
      session.user.image =
        (token.picture as string | undefined) ?? session.user.image;
      session.user.name = token.name ?? session.user.name;
      session.user.email = token.email ?? session.user.email;

      return session;
    },
  },
});
