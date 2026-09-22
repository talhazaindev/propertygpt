import { DefaultSession, DefaultUser } from "next-auth";
import { TeamRole, Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role | TeamRole;
      isTeamMember: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: Role | TeamRole;
    isTeamMember: boolean;
  }
} 