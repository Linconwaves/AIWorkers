import { getRepositoryProvider } from '../repositories';
import { Project } from '../repositories/types';
import { NotFoundError, ValidationError } from '../common/errors';

export class ProjectService {
  private repo = getRepositoryProvider();

  async list(userId: string): Promise<Project[]> {
    return this.repo.projects.listByUser(userId);
  }

  async create(userId: string, payload: { name: string; platforms: string[]; brandKit?: any }): Promise<Project> {
    if (!payload.name) throw new ValidationError('Project name required');
    return this.repo.projects.create({
      id: undefined as any,
      userId,
      name: payload.name,
      platforms: payload.platforms ?? [],
      brandKit: payload.brandKit ?? {},
      defaultScreenshotBackgroundStyle: undefined
    });
  }

  async update(userId: string, id: string, payload: Partial<Project>): Promise<Project> {
    const existing = await this.repo.projects.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Project not found');
    }
    const updated = await this.repo.projects.update(id, {
      ...payload,
      updatedAt: new Date()
    });
    if (!updated) throw new NotFoundError('Project not found');
    return updated;
  }

  async delete(userId: string, id: string) {
    const existing = await this.repo.projects.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Project not found');
    }
    await this.repo.projects.delete(id);
  }

  async get(userId: string, id: string): Promise<Project> {
    const project = await this.repo.projects.findById(id);
    if (!project || project.userId !== userId) {
      throw new NotFoundError('Project not found');
    }
    return project;
  }
}
