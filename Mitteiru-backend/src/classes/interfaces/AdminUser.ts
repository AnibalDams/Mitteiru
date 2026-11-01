import type { ObjectId } from "mongodb";

export interface AdminUser {
  _id?: string | ObjectId;
  email: string;
  password: string;
  accepted: boolean;
  tokenVersion?: number;
  failedLoginAttempts?: number;
  lockedUntil?: number | null;
}
