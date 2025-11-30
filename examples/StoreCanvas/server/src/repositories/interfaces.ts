import { AssetExport, Design, Project, Upload, User } from './types';

export interface UserRepository {
  create(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}

export interface ProjectRepository {
  create(project: Omit<Project, 'createdAt' | 'updatedAt'>): Promise<Project>;
  listByUser(userId: string): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  update(id: string, updates: Partial<Project>): Promise<Project | null>;
  delete(id: string): Promise<void>;
}

export interface DesignRepository {
  create(design: Omit<Design, 'createdAt' | 'updatedAt'>): Promise<Design>;
  listByProject(projectId: string): Promise<Design[]>;
  findById(id: string): Promise<Design | null>;
  update(id: string, updates: Partial<Design>): Promise<Design | null>;
  delete(id: string): Promise<void>;
}

export interface AssetExportRepository {
  create(exportRecord: Omit<AssetExport, 'createdAt'>): Promise<AssetExport>;
  listByDesign(designId: string): Promise<AssetExport[]>;
}

export interface UploadRepository {
  create(upload: Upload): Promise<Upload>;
  listByUser(userId: string): Promise<Upload[]>;
  findById(id: string): Promise<Upload | null>;
  update(id: string, updates: Partial<Upload>): Promise<Upload | null>;
  delete(id: string): Promise<void>;
}

export interface RepositoryProvider {
  users: UserRepository;
  projects: ProjectRepository;
  designs: DesignRepository;
  exports: AssetExportRepository;
  uploads: UploadRepository;
}
