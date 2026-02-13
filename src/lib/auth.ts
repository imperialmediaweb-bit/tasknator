import { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

const providers: Provider[] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await db.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user || !user.passwordHash) return null;

      const valid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers,
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
        const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { isAdmin: true } });
        token.isAdmin = dbUser?.isAdmin ?? false;
      }
      return token;
    },
  },
};
