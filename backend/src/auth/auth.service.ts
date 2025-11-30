import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, UserRole } from '@prisma/client';
import { config } from '../config/config';
import { logger, logSecurityEvent } from '../config/logger';
import { AuthenticationError, ConflictError, ValidationError, NotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  builderName?: string;
  subdomain?: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
}

export class AuthService {
  // Password validation
  private validatePassword(password: string): void {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors: string[] = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUppercase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowercase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumber) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecial) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.jwt.saltRounds);
  }

  // Verify password
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate access token
  private generateAccessToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        builderId: user.builderId,
        type: 'access',
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
        issuer: 'xavira-lead-engine',
        audience: 'xavira-users',
      }
    );
  }

  // Generate refresh token
  private generateRefreshToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        builderId: user.builderId,
        type: 'refresh',
      },
      config.jwt.refreshSecret,
      {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: 'xavira-lead-engine',
        audience: 'xavira-users',
      }
    );
  }

  // Store refresh token
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = await this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Revoke existing tokens for this user
    await prisma.user.update({
      where: { id: userId },
      data: {
        // We'll use a simple approach for now - in production, use a dedicated refreshTokens table
        lastLoginAt: new Date(),
      },
    });

    // Store token in Redis for production use
    // For now, we'll just log it
    logger.debug('Stored refresh token for user:', userId);
  }

  // Hash token for storage
  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  // Verify refresh token
  private async verifyRefreshToken(refreshToken: string): Promise<{ userId: string; email: string; builderId: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid refresh token');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        builderId: decoded.builderId,
      };
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  // Register new user (and optionally builder)
  async register(data: RegisterData): Promise<AuthResponse> {
    const { name, email, password, builderName, subdomain } = data;

    // Validate password
    this.validatePassword(password);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    let builderId: string;

    if (builderName && subdomain) {
      // Create new builder
      const existingBuilder = await prisma.builder.findUnique({
        where: { subdomain },
      });

      if (existingBuilder) {
        throw new ConflictError('Subdomain already exists');
      }

      const newBuilder = await prisma.builder.create({
        data: {
          name: builderName,
          subdomain,
        },
      });

      builderId = newBuilder.id;
    } else {
      // Find existing builder or throw error
      const builder = await prisma.builder.findFirst();
      if (!builder) {
        throw new ValidationError('Builder information required for first user');
      }
      builderId = builder.id;
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        builderId,
        role: builderName ? 'ADMIN' : 'AGENT', // First user in builder is admin
      },
      include: {
        builder: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    // Log security event
    logSecurityEvent({
      type: 'register',
      userId: user.id,
      email: user.email,
      ip: '', // Will be set in controller
      userAgent: '', // Will be set in controller
      details: { builderId: user.builderId, role: user.role },
    });

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = user;

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  // Login user
  async login(data: LoginData, context: { ip: string; userAgent: string }): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user with builder
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        builder: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      logSecurityEvent({
        type: 'unauthorized',
        email,
        ip: context.ip,
        userAgent: context.userAgent,
        details: { reason: 'User not found or inactive' },
      });
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      logSecurityEvent({
        type: 'unauthorized',
        userId: user.id,
        email: user.email,
        ip: context.ip,
        userAgent: context.userAgent,
        details: { reason: 'Invalid password' },
      });
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log security event
    logSecurityEvent({
      type: 'login',
      userId: user.id,
      email: user.email,
      ip: context.ip,
      userAgent: context.userAgent,
      details: { builderId: user.builderId, role: user.role },
    });

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = user;

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  // Refresh access token
  async refresh(refreshToken: string, context: { ip: string; userAgent: string }): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    const tokenData = await this.verifyRefreshToken(refreshToken);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      include: {
        builder: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // Store new refresh token (revoke old one)
    await this.storeRefreshToken(user.id, newRefreshToken);

    // Log security event
    logSecurityEvent({
      type: 'login', // Treat as login event for monitoring
      userId: user.id,
      email: user.email,
      ip: context.ip,
      userAgent: context.userAgent,
      details: { type: 'token_refresh', builderId: user.builderId },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // Logout user
  async logout(userId: string, context: { ip: string; userAgent: string }): Promise<void> {
    // In production, revoke the refresh token
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: null, // Clear last login to invalidate tokens
      },
    });

    // Log security event
    logSecurityEvent({
      type: 'logout',
      userId,
      ip: context.ip,
      userAgent: context.userAgent,
      details: { reason: 'user_logout' },
    });

    logger.info('User logged out:', { userId, ip: context.ip });
  }

  // Get user by ID
  async getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        builder: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const { passwordHash: _, ...userResponse } = user;
    return userResponse;
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Validate new password
    this.validatePassword(newPassword);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    logger.info('Password changed successfully:', { userId });
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      // Don't reveal if user exists or not
      return;
    }

    // Generate reset token (24 hour expiry)
    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'password_reset',
      },
      config.jwt.secret,
      {
        expiresIn: '24h',
        issuer: 'xavira-lead-engine',
        audience: 'xavira-users',
      }
    );

    // Store reset token in Redis or database
    // For now, just log it (in production, send email)
    logger.info('Password reset requested:', {
      userId: user.id,
      email: user.email,
      resetToken: resetToken.substring(0, 10) + '...', // Log partial token
    });

    // TODO: Send password reset email
    // await emailService.sendPasswordReset(user.email, resetToken);
  }

  // Reset password
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(resetToken, config.jwt.secret) as any;

      if (decoded.type !== 'password_reset') {
        throw new AuthenticationError('Invalid reset token');
      }

      // Validate new password
      this.validatePassword(newPassword);

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        },
      });

      logger.info('Password reset successful:', { userId: decoded.userId });

      // Log security event
      logSecurityEvent({
        type: 'password_reset',
        userId: decoded.userId,
        email: decoded.email,
        ip: '',
        userAgent: '',
        details: { reason: 'password_reset_completed' },
      });

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid or expired reset token');
      }
      throw error;
    }
  }

  // Validate token
  async validateToken(token: string): Promise<Omit<User, 'passwordHash'> | null> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;

      if (decoded.type !== 'access') {
        return null;
      }

      return await this.getUserById(decoded.userId);
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();