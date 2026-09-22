import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // First check if this is a team member/admin login
        const teamMember = await prisma.teamMember.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (teamMember) {
          const isValid = await compare(credentials.password, teamMember.hashedPassword);
          if (!isValid) return null;

          return {
            id: teamMember.id,
            name: teamMember.name,
            email: teamMember.email,
            role: teamMember.role,
            isTeamMember: true,
          };
        }

        // Otherwise check regular user login
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isValid = await compare(credentials.password, user.hashedPassword);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isTeamMember: false,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isTeamMember = token.isTeamMember as boolean;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.isTeamMember = (user as any).isTeamMember;
      }
      return token;
    },
  },
}; 