import { PrismaClient, Project } from '@prisma/client';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface CreateProjectData {
  name: string;
  city: string;
  description?: string;
  builderId: string;
}

export interface UpdateProjectData {
  name?: string;
  city?: string;
  description?: string;
  isActive?: boolean;
}

export interface ProjectFilters {
  isActive?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedProjects {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProjectStats {
  total: number;
  new: number;
  booked: number;
}

export class ProjectsService {
  // Get projects with filters and pagination
  async getProjects(builderId: string, filters: ProjectFilters): Promise<PaginatedProjects> {
    const {
      isActive,
      page = 1,
      limit = 20,
      search,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = { builderId };

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isActive: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          name: true,
          city: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // Include lead counts for each project
          _count: {
            select: {
              where: {
                projectId: true,
              },
            },
          },
        },
      },
      }),
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      projects,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // Get project by ID with lead stats
  async getProjectById(projectId: string, builderId: string): Promise<(Project & { leadStats?: ProjectStats }) | null> {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        builderId,
      },
      include: {
        _count: {
          select: {
            where: {
              projectId: true,
            },
          },
        },
      },
    });

    if (!project) {
      return null;
    }

    // Calculate lead statistics
    const leadStats: ProjectStats = {
      total: project._count || 0,
      new: 0, // TODO: Implement based on date range
      booked: 0, // TODO: Count leads with BOOKED stage
    };

    const { _count, ...projectData } = project;
    return {
      ...projectData,
      leadStats,
    };
  }

  // Create new project
  async createProject(data: CreateProjectData): Promise<Project> {
    const { name, city, description, builderId } = data;

    // Check if project name already exists for this builder
    const existingProject = await prisma.project.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        builderId,
      },
    });

    if (existingProject) {
      throw new ConflictError(`Project with name "${name}" already exists in this organization`);
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        city: city.trim(),
        description: description?.trim(),
        builderId,
      },
    });

    return project;
  }

  // Update project
  async updateProject(
    projectId: string,
    builderId: string,
    data: UpdateProjectData
  ): Promise<Project> {
    // Check if project exists and belongs to builder
    const existingProject = await prisma.project.findUnique({
      where: {
        id: projectId,
        builderId,
      },
    });

    if (!existingProject) {
      throw new NotFoundError('Project');
    }

    const updateData: any = {};
    if (data.name !== undefined) {
      // Check if new name conflicts with other projects
      const nameConflict = await prisma.project.findFirst({
        where: {
          name: { equals: data.name, mode: 'insensitive' },
          builderId,
          id: { not: projectId },
        },
      });

      if (nameConflict) {
        throw new ConflictError(`Project with name "${data.name}" already exists`);
      }

      updateData.name = data.name.trim();
    }

    if (data.city !== undefined) {
      updateData.city = data.city.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim();
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    updateData.updatedAt = new Date();

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    return project;
  }

  // Delete project (soft delete if leads exist)
  async deleteProject(projectId: string, builderId: string): Promise<void> {
    // Check if project exists and belongs to builder
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        builderId,
      },
      include: {
        _count: true,
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const leadCount = project._count || 0;

    if (leadCount > 0) {
      // Soft delete if project has leads
      await prisma.project.update({
        where: { id: projectId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    } else {
      // Hard delete if no leads
      await prisma.project.delete({
        where: { id: projectId },
      });
    }
  }

  // Get project statistics
  async getProjectStats(projectId: string, builderId: string): Promise<ProjectStats> {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        builderId,
      },
      include: {
        leads: {
          select: {
            id: true,
            stage: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const leads = project.leads || [];

    // Calculate statistics
    const totalLeads = leads.length;
    const newLeads = leads.filter(lead => lead.stage === 'NEW').length;
    const bookedLeads = leads.filter(lead => lead.stage === 'BOOKED').length;

    // Calculate new leads in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newLeads7Days = leads.filter(
      lead => new Date(lead.createdAt) >= sevenDaysAgo
    ).length;

    return {
      total: totalLeads,
      new: newLeads7Days,
      booked: bookedLeads,
    };
  }

  // Get projects for dropdown/select
  async getProjectOptions(builderId: string): Promise<Array<{ id: string; name: string; city: string; isActive: boolean }>> {
    const projects = await prisma.project.findMany({
      where: {
        builderId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        city: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return projects;
  }

  // Archive/reactivate project
  async toggleProjectStatus(projectId: string, builderId: string): Promise<Project> {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        builderId,
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        isActive: !project.isActive,
        updatedAt: new Date(),
      },
    });

    return updatedProject;
  }

  // Bulk operations
  async bulkUpdateStatus(
    projectIds: string[],
    builderId: string,
    isActive: boolean
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    for (const projectId of projectIds) {
      try {
        await this.toggleProjectStatus(projectId, builderId);
        updated++;
      } catch (error) {
        failed.push(projectId);
      }
    }

    return { updated, failed };
  }

  async bulkDelete(
    projectIds: string[],
    builderId: string
  ): Promise<{ deleted: number; failed: string[] }> {
    const failed: string[] = [];
    let deleted = 0;

    for (const projectId of projectIds) {
      try {
        await this.deleteProject(projectId, builderId);
        deleted++;
      } catch (error) {
        failed.push(projectId);
      }
    }

    return { deleted, failed };
  }

  // Search projects
  async searchProjects(
    builderId: string,
    query: string,
    limit: number = 10
  ): Promise<Project[]> {
    const projects = await prisma.project.findMany({
      where: {
        builderId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        city: true,
        description: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: limit,
    });

    return projects;
  }

  // Get project activity
  async getProjectActivity(
    projectId: string,
    builderId: string,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    type: string;
    note: string;
    createdAt: Date;
    user: { name: string; email: string };
  }>> {
    const activities = await prisma.activity.findMany({
      where: {
        lead: {
          projectId: projectId,
          builderId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      note: activity.note,
      createdAt: activity.createdAt,
      user: activity.user,
    }));
  }

  // Get projects performance metrics
  async getProjectsPerformance(builderId: string): Promise<Array<{
    project: Project;
    stats: ProjectStats;
    conversionRate: number;
  }>> {
    const projects = await prisma.project.findMany({
      where: {
        builderId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            where: {
              projectId: true,
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const performance = await Promise.all(
      projects.map(async project => {
        const stats = await this.getProjectStats(project.id, builderId);
        const conversionRate = stats.total > 0 ? (stats.booked / stats.total) * 100 : 0;

        return {
          project,
          stats,
          conversionRate: Math.round(conversionRate * 100) / 100,
        };
      })
    );

    return performance;
  }

  // Validate project access
  async validateProjectAccess(projectId: string, builderId: string, userId?: string): Promise<boolean> {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        builderId,
      },
    });

    return !!project;
  }
}

export const projectsService = new ProjectsService();