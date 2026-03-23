import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "student@university.edu" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toString();
        const password = credentials.password.toString();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Fail login if the user doesn't exist (no more auto-registering)
        if (!user) {
          return null;
        }

        // Securely check password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "calorie_smart_university_project_secret_key",
});
