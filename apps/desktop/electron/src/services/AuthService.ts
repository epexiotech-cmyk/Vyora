import * as crypto from 'crypto';

import { User } from '@vyora/database';
import type { UserDto } from '@vyora/types';
import * as argon2 from 'argon2';

import { UserMapper } from '../mappers/UserMapper';
import { AuthRepository } from '../repositories/AuthRepository';
import { UserRepository } from '../repositories/UserRepository';

import { loggerService } from './logger/LoggerService';
import { sessionService } from './SessionService';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 mins

export class AuthService {
  private authRepo = new AuthRepository();
  private userRepo = new UserRepository();
  private currentUser: User | null = null;
  private isLocked: boolean = false;

  private async hashArgon(password: string): Promise<string> {
    return argon2.hash(password);
  }

  private async verifyArgon(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  public async getAdminCount(): Promise<number> {
    return this.userRepo.getAdminCount();
  }

  public async createAdmin(payload: Record<string, unknown>): Promise<void> {
    const count = await this.getAdminCount();
    if (count > 0) {
      throw new Error('Admin user already exists');
    }

    const data = payload as {
      fullName: string;
      username: string;
      password: string;
      email?: string;
      pin?: string;
    };
    const passwordHash = await this.hashArgon(data.password);
    const pinHash = data.pin ? await this.hashArgon(data.pin) : null;

    const id = crypto.randomUUID();
    await this.userRepo.create({
      id,
      fullName: data.fullName,
      username: data.username,
      email: data.email || null,
      passwordHash,
      pinHash,
      pinLength: data.pin ? data.pin.length : null,
      role: 'admin',
      isActive: true,
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public async login(username: string, password: string, rememberMe: boolean): Promise<UserDto> {
    const user = await this.userRepo.getByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    if (!user.isActive) {
      throw new Error('User account is disabled');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account is locked due to too many failed attempts. Try again later.');
    }

    const isValid = await this.verifyArgon(user.passwordHash, password);
    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      const updates: { failedLoginAttempts: number; updatedAt: Date; lockedUntil?: Date } = {
        failedLoginAttempts: attempts,
        updatedAt: new Date(),
      };

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }

      await this.userRepo.update(user.id, updates);
      throw new Error('Invalid username or password');
    }

    // Success
    await this.userRepo.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    });

    this.currentUser = user;
    this.isLocked = false;

    if (rememberMe) {
      const token = sessionService.generateToken();
      const tokenHash = sessionService.hashToken(token);

      await this.authRepo.createSession({
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash,
        deviceName: 'Desktop App',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
      });

      await sessionService.saveSessionToken(token);
    } else {
      sessionService.clearSessionToken();
    }

    return UserMapper.toDto(user);
  }

  public async verifyPersistentSession(): Promise<UserDto | null> {
    try {
      const token = await sessionService.loadSessionToken();
      if (!token) return null;

      const tokenHash = sessionService.hashToken(token);
      const session = await this.authRepo.getSessionByHash(tokenHash);

      if (!session) {
        sessionService.clearSessionToken();
        return null;
      }

      if (session.revokedAt || session.expiresAt < new Date()) {
        sessionService.clearSessionToken();
        return null;
      }

      const user = await this.userRepo.getById(session.userId);
      if (!user || !user.isActive) {
        sessionService.clearSessionToken();
        return null;
      }

      await this.authRepo.updateSession(session.id, { lastAccessedAt: new Date() });
      this.currentUser = user;
      this.isLocked = true;
      return UserMapper.toDto(user);
    } catch (error) {
      loggerService.error('Session verification failed', error);
      sessionService.clearSessionToken();
      return null;
    }
  }

  public async logout(): Promise<void> {
    if (this.currentUser) {
      const token = await sessionService.loadSessionToken();
      if (token) {
        const tokenHash = sessionService.hashToken(token);
        const session = await this.authRepo.getSessionByHash(tokenHash);
        if (session) {
          await this.authRepo.deleteSession(session.id);
        }
      }
    }

    this.currentUser = null;
    this.isLocked = false;
    sessionService.clearSessionToken();
  }

  public lockSession(): void {
    if (this.currentUser) {
      this.isLocked = true;
    }
  }

  public async verifyActionPin(pin: string): Promise<boolean> {
    if (!this.currentUser || !this.currentUser.pinHash) return false;
    return this.verifyArgon(this.currentUser.pinHash, pin);
  }

  public async unlockSession(pinOrPassword: string): Promise<boolean> {
    if (!this.currentUser) return false;

    if (this.currentUser.lockedUntil && this.currentUser.lockedUntil > new Date()) {
      throw new Error('Account is locked due to too many failed attempts. Try again later.');
    }

    // Try PIN first if available
    let isValid = false;
    if (this.currentUser.pinHash) {
      isValid = await this.verifyArgon(this.currentUser.pinHash, pinOrPassword);
    }

    // Try Password fallback if PIN failed or doesn't exist
    if (!isValid) {
      isValid = await this.verifyArgon(this.currentUser.passwordHash, pinOrPassword);
    }

    if (isValid) {
      this.isLocked = false;
      // Reset failed attempts
      await this.userRepo.update(this.currentUser.id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      this.currentUser.failedLoginAttempts = 0;
      this.currentUser.lockedUntil = null;
      return true;
    }

    // Increment failed attempts
    const attempts = (this.currentUser.failedLoginAttempts || 0) + 1;
    const updates: { failedLoginAttempts: number; updatedAt: Date; lockedUntil?: Date } = {
      failedLoginAttempts: attempts,
      updatedAt: new Date(),
    };

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      // Optional: Auto-logout user if they get locked out? We'll just keep them locked.
    }

    await this.userRepo.update(this.currentUser.id, updates);
    this.currentUser.failedLoginAttempts = attempts;
    if (updates.lockedUntil) this.currentUser.lockedUntil = updates.lockedUntil;

    return false;
  }

  public getCurrentUser(): UserDto | null {
    return this.currentUser ? UserMapper.toDto(this.currentUser) : null;
  }

  public isSessionLocked(): boolean {
    return this.isLocked;
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.currentUser) throw new Error('Not logged in');

    const isValid = await this.verifyArgon(this.currentUser.passwordHash, currentPassword);
    if (!isValid) {
      throw new Error('Invalid current password');
    }

    const newHash = await this.hashArgon(newPassword);
    await this.userRepo.update(this.currentUser.id, {
      passwordHash: newHash,
      updatedAt: new Date(),
    });
    this.currentUser.passwordHash = newHash;
  }

  public async changePin(oldPin: string | undefined, newPin: string): Promise<void> {
    if (!this.currentUser) throw new Error('Not logged in');

    if (this.currentUser.pinHash && oldPin) {
      const isValid = await this.verifyArgon(this.currentUser.pinHash, oldPin);
      if (!isValid) {
        throw new Error('Invalid old PIN');
      }
    } else if (this.currentUser.pinHash && !oldPin) {
      throw new Error('Old PIN is required to set a new PIN');
    }

    const newHash = await this.hashArgon(newPin);
    await this.userRepo.update(this.currentUser.id, {
      pinHash: newHash,
      pinLength: newPin.length,
      updatedAt: new Date(),
    });

    this.currentUser.pinHash = newHash;
    this.currentUser.pinLength = newPin.length;
  }
}

export const authService = new AuthService();
