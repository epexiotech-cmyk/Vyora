import { User, Session } from '@vyora/database';
import type { UserDto, SessionDto } from '@vyora/types';

export class UserMapper {
  public static toDto(user: User): UserDto {
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      pinLength: user.pinLength,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public static toSessionDto(session: Session): SessionDto {
    return {
      id: session.id,
      userId: session.userId,
      deviceName: session.deviceName,
      expiresAt: session.expiresAt,
      lastAccessedAt: session.lastAccessedAt,
      createdAt: session.createdAt,
    };
  }
}
