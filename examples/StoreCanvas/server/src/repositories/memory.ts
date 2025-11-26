import { randomUUID } from 'crypto';
import {
  AssetExport,
  Design,
  Project,
  Upload,
  User
} from './types';
import {
  AssetExportRepository,
  DesignRepository,
  ProjectRepository,
  RepositoryProvider,
  UploadRepository,
  UserRepository
} from './interfaces';

class InMemoryUserRepo implements UserRepository {
  private users = new Map<string, User>();

  async create(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const record: User = { ...user, id: user.id ?? randomUUID(), createdAt: now, updatedAt: now };
    this.users.set(record.id, record);
    return record;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
}

class InMemoryProjectRepo implements ProjectRepository {
  private projects = new Map<string, Project>();

  async create(project: Omit<Project, 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date();
    const record: Project = { ...project, id: project.id ?? randomUUID(), createdAt: now, updatedAt: now };
    this.projects.set(record.id, record);
    return record;
  }

  async listByUser(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter((p) => p.userId === userId);
  }

  async findById(id: string): Promise<Project | null> {
    return this.projects.get(id) ?? null;
  }

  async update(id: string, updates: Partial<Project>): Promise<Project | null> {
    const existing = this.projects.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.projects.delete(id);
  }
}

class InMemoryDesignRepo implements DesignRepository {
  private designs = new Map<string, Design>();

  async create(design: Omit<Design, 'createdAt' | 'updatedAt'>): Promise<Design> {
    const now = new Date();
    const record: Design = { ...design, id: design.id ?? randomUUID(), createdAt: now, updatedAt: now };
    this.designs.set(record.id, record);
    return record;
  }

  async listByProject(projectId: string): Promise<Design[]> {
    return Array.from(this.designs.values()).filter((d) => d.projectId === projectId);
  }

  async findById(id: string): Promise<Design | null> {
    return this.designs.get(id) ?? null;
  }

  async update(id: string, updates: Partial<Design>): Promise<Design | null> {
    const existing = this.designs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.designs.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.designs.delete(id);
  }
}

class InMemoryExportRepo implements AssetExportRepository {
  private exports = new Map<string, AssetExport>();

  async create(exportRecord: Omit<AssetExport, 'createdAt'>): Promise<AssetExport> {
    const record: AssetExport = { ...exportRecord, id: exportRecord.id ?? randomUUID(), createdAt: new Date() };
    this.exports.set(record.id, record);
    return record;
  }

  async listByDesign(designId: string): Promise<AssetExport[]> {
    return Array.from(this.exports.values()).filter((e) => e.designId === designId);
  }
}

class InMemoryUploadRepo implements UploadRepository {
  private uploads = new Map<string, Upload>();

  async create(upload: Upload): Promise<Upload> {
    this.uploads.set(upload.id, upload);
    return upload;
  }

  async listByUser(userId: string): Promise<Upload[]> {
    return Array.from(this.uploads.values()).filter((u) => u.userId === userId);
  }

  async findById(id: string): Promise<Upload | null> {
    return this.uploads.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.uploads.delete(id);
  }
}

export const buildInMemoryRepositories = (): RepositoryProvider => ({
  users: new InMemoryUserRepo(),
  projects: new InMemoryProjectRepo(),
  designs: new InMemoryDesignRepo(),
  exports: new InMemoryExportRepo(),
  uploads: new InMemoryUploadRepo()
});
