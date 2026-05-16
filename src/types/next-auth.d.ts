import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      daysLeft?: number | null;
      expiresAt?: Date | string | null;
      createdAt?: Date | string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: string;
    accountExpiresAt?: Date | string | null;
    createdAt?: Date | string | null;
  }
}
