import { z } from 'zod';

import {
  UserSchema,
  SessionSchema,
  LoginResponseSchema,
  CreateAdminRequestSchema,
  LoginRequestSchema,
  UnlockRequestSchema,
  ChangePasswordRequestSchema,
  ChangePinRequestSchema,
} from './auth.schema';

export type UserDto = z.infer<typeof UserSchema>;
export type SessionDto = z.infer<typeof SessionSchema>;
export type LoginResponseDto = z.infer<typeof LoginResponseSchema>;
export type CreateAdminRequestDto = z.infer<typeof CreateAdminRequestSchema>;
export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;
export type UnlockRequestDto = z.infer<typeof UnlockRequestSchema>;
export type ChangePasswordRequestDto = z.infer<typeof ChangePasswordRequestSchema>;
export type ChangePinRequestDto = z.infer<typeof ChangePinRequestSchema>;
