import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  username: z.string(),
  email: z.string().email().nullable().optional(),
  avatar: z.string().nullable().optional(),
  role: z.string(),
  isActive: z.boolean(),
  pinLength: z.number().nullable().optional(),
  lastLoginAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  deviceName: z.string().nullable().optional(),
  expiresAt: z.date(),
  lastAccessedAt: z.date().nullable().optional(),
  createdAt: z.date(),
});

export const LoginResponseSchema = z.object({
  user: UserSchema,
  session: SessionSchema.optional(),
});

export const CreateAdminRequestSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  email: z.string().email('Invalid email').optional(),
  pin: z.string().min(4).max(6).optional(),
});

export const LoginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

export const UnlockRequestSchema = z.object({
  pinOrPassword: z.string().min(1, 'PIN or Password is required'),
});

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const ChangePinRequestSchema = z.object({
  oldPin: z.string().min(4).max(6).optional(),
  newPin: z.string().min(4).max(6),
});
