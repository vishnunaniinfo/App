import bcrypt from 'bcrypt';
import { PrismaClient, User, UserRole } from '@prisma/client';
import { config } from '../config/config';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler';
import { authService } from '../auth/auth.service';

const prisma = new PrismaClient();

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  builderId: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedUsers {
  users: Omit<User, 'passwordHash'>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UsersService {
  // Get users with filters and pagination
  async getUsers(builderId: string, filters: UserFilters): Promise<PaginatedUsers> {
    const {
      role,
      isActive,
      page = 1,
      limit = 20,
      search,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = { builderId };

    if (role) where.role = role;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          builderId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Get user by ID
  async getUserById(userId: string, builderId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId, builderId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        builderId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        // Include relations for detailed view
        assignedLeads: {
          select: { id: true },
        },
        activities: {
          select: { id: true, type: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return user;
  }

  // Create new user
  async createUser(data: CreateUserData): Promise<Omit<User, 'passwordHash'>> {
    const { name, email, password, role, builderId } = data;

    // Validate email uniqueness within builder
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        builderId,
      },
    });

    if (existingUser) {
      throw new ConflictError(`User with email ${email} already exists in this organization`);
    }

    // Validate password
    authService.validatePassword(password);

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        passwordHash,
        role,
        builderId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        builderId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return user;
  }

  // Update user
  async updateUser(
    userId: string,
    builderId: string,
    data: UpdateUserData
  ): Promise<Omit<User, 'passwordHash'>> {
    // Check if user exists and belongs to builder
    const existingUser = await prisma.user.findUnique({
      where: { id: userId, builderId },
    });

    if (!existingUser) {
      throw new NotFoundError('User');
    }

    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.email !== undefined) {
      const normalizedEmail = data.email.toLowerCase();
      if (normalizedEmail !== existingUser.email) {
        // Check email uniqueness
        const emailExists = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            builderId,
            id: { not: userId },
          },
        });

        if (emailExists) {
          throw new ConflictError(`User with email ${data.email} already exists`);
        }
        updateData.email = normalizedEmail;
      }
    }

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    updateData.updatedAt = new Date();

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        builderId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return user;
  }

  // Delete user (soft delete)
  async deleteUser(userId: string, builderId: string): Promise<void> {
    // Check if user exists and belongs to builder
    const user = await prisma.user.findUnique({
      where: { id: userId, builderId },
      include: {
        assignedLeads: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Get admin user for reassignment
    const adminUser = await prisma.user.findFirst({
      where: {
        builderId,
        role: 'ADMIN',
        isActive: true,
      },
      select: { id: true },
    });

    // Soft delete user and reassign leads
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        updatedAt: new Date(),
        // Reassign leads to admin
        assignedLeads: {
          updateMany: {
            where: { assignedTo: userId },
            data: { assignedTo: adminUser?.id || null },
          },
        },
      },
    });
  }

  // Get user statistics
  async getUserStats(userId: string, builderId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId, builderId },
      include: {
        assignedLeads: {
          select: { id: true, stage: true, createdAt: true },
        },
        activities: {
          select: { id: true, type: true, createdAt: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const leadsByStage = user.assignedLeads.reduce((acc, lead) => {
      acc[lead.stage] = (acc[lead.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentActivities = user.activities.filter(
      activity => new Date(activity.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const totalLeads = user.assignedLeads.length;
    const recentLeads = user.assignedLeads.filter(
      lead => new Date(lead.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;

    const conversionRate = totalLeads > 0
      ? (leadsByStage['BOOKED'] || 0) / totalLeads * 100
      : 0;

    return {
      totalLeads,
      recentLeads,
      leadsByStage,
      recentActivities: recentActivities.length,
      conversionRate: Math.round(conversionRate * 100) / 100,
      lastLoginAt: user.lastLoginAt,
      memberSince: user.createdAt,
    };
  }

  // Get team performance
  async getTeamPerformance(builderId: string): Promise<any> {
    const users = await prisma.user.findMany({
      where: {
        builderId,
        isActive: true,
      },
      include: {
        assignedLeads: {
          select: { id: true, stage: true, createdAt: true, lastContactedAt: true },
        },
        activities: {
          select: { id: true, type: true, createdAt: true },
        },
      },
    });

    const performance = users.map(user => {
      const totalLeads = user.assignedLeads.length;
      const recentLeads = user.assignedLeads.filter(
        lead => new Date(lead.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length;

      const bookedLeads = user.assignedLeads.filter(
        lead => lead.stage === 'BOOKED'
      ).length;

      const conversionRate = totalLeads > 0 ? (bookedLeads / totalLeads) * 100 : 0;

      const avgResponseTime = this.calculateAverageResponseTime(user.assignedLeads, user.activities);

      const lastLoginDaysAgo = user.lastLoginAt
        ? Math.floor((Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalLeads,
        recentLeads,
        bookedLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgResponseTime,
        lastLoginDaysAgo,
        lastLoginAt: user.lastLoginAt,
      };
    });

    return performance;
  }

  // Calculate average response time in hours
  private calculateAverageResponseTime(leads: any[], activities: any[]): number {
    const responseTimes: number[] = [];

    leads.forEach(lead => {
      // Find first activity after lead creation
      const firstActivity = activities
        .filter(activity =>
          activity.type === 'NOTE' ||
          activity.type === 'CALL' ||
          activity.type === 'WHATSAPP'
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

      if (firstActivity) {
        const leadCreatedAt = new Date(lead.createdAt).getTime();
        const firstActivityAt = new Date(firstActivity.createdAt).getTime();
        const responseTimeHours = (firstActivityAt - leadCreatedAt) / (1000 * 60 * 60);
        responseTimes.push(responseTimeHours);
      }
    });

    if (responseTimes.length === 0) return 0;

    const avgTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return Math.round(avgTime * 100) / 100;
  }

  // Reset user password (admin function)
  async resetUserPassword(
    userId: string,
    builderId: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId, builderId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Validate new password
    authService.validatePassword(newPassword);

    // Hash new password
    const passwordHash = await authService.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });
  }

  // Toggle user active status
  async toggleUserStatus(userId: string, builderId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId, builderId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Prevent deactivating the last admin
    if (user.role === 'ADMIN' && user.isActive) {
      const adminCount = await prisma.user.count({
        where: {
          builderId,
          role: 'ADMIN',
          isActive: true,
        },
      });

      if (adminCount === 1) {
        throw new ValidationError('Cannot deactivate the last admin user');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: !user.isActive,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        builderId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return updatedUser;
  }

  // Bulk operations
  async bulkUpdateStatus(
    userIds: string[],
    builderId: string,
    isActive: boolean
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    for (const userId of userIds) {
      try {
        await this.toggleUserStatus(userId, builderId);
        updated++;
      } catch (error) {
        failed.push(userId);
      }
    }

    return { updated, failed };
  }

  async bulkDelete(
    userIds: string[],
    builderId: string
  ): Promise<{ deleted: number; failed: string[] }> {
    const failed: string[] = [];
    let deleted = 0;

    for (const userId of userIds) {
      try {
        await this.deleteUser(userId, builderId);
        deleted++;
      } catch (error) {
        failed.push(userId);
      }
    }

    return { deleted, failed };
  }
}

export const usersService = new UsersService();