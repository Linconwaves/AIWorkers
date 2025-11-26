import { MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';
import { getConfig } from '../config';
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

const getDbName = (uri: string) => {
  try {
    const parsed = new URL(uri);
    const path = parsed.pathname?.replace('/', '');
    return path || 'storecanvas';
  } catch {
    return 'storecanvas';
  }
};

class MongoUserRepo implements UserRepository {
  constructor(private client: MongoClient, private dbName: string) {}

  private col() {
    return this.client.db(this.dbName).collection<User>('users');
  }

  async create(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const record: User = {
      ...user,
      id: user.id ?? randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await this.col().insertOne({ ...record });
    return record;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.col().findOne({ email });
    return doc ? { ...doc } : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.col().findOne({ id });
    return doc ? { ...doc } : null;
  }
}

class MongoProjectRepo implements ProjectRepository {
  constructor(private client: MongoClient, private dbName: string) {}

  private col() {
    return this.client.db(this.dbName).collection<Project>('projects');
  }

  async create(project: Omit<Project, 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date();
    const record: Project = {
      ...project,
      id: project.id ?? randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await this.col().insertOne({ ...record });
    return record;
  }

  async listByUser(userId: string): Promise<Project[]> {
    return this.col().find({ userId }).toArray();
  }

  async findById(id: string): Promise<Project | null> {
    const doc = await this.col().findOne({ id });
    return doc ? { ...doc } : null;
  }

  async update(id: string, updates: Partial<Project>): Promise<Project | null> {
    const updateData = { ...updates, updatedAt: new Date() };
    const result = await this.col().findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    return result ? ({ ...result } as Project) : null;
  }

  async delete(id: string): Promise<void> {
    await this.col().deleteOne({ id });
  }
}

class MongoDesignRepo implements DesignRepository {
  constructor(private client: MongoClient, private dbName: string) {}

  private col() {
    return this.client.db(this.dbName).collection<Design>('designs');
  }

  async create(design: Omit<Design, 'createdAt' | 'updatedAt'>): Promise<Design> {
    const now = new Date();
    const record: Design = { ...design, id: design.id ?? randomUUID(), createdAt: now, updatedAt: now };
    await this.col().insertOne({ ...record });
    return record;
  }

  async listByProject(projectId: string): Promise<Design[]> {
    return this.col().find({ projectId }).toArray();
  }

  async findById(id: string): Promise<Design | null> {
    const doc = await this.col().findOne({ id });
    return doc ? { ...doc } : null;
  }

  async update(id: string, updates: Partial<Design>): Promise<Design | null> {
    const updateData = { ...updates, updatedAt: new Date() };
    const result = await this.col().findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    return result ? ({ ...result } as Design) : null;
  }

  async delete(id: string): Promise<void> {
    await this.col().deleteOne({ id });
  }
}

class MongoExportRepo implements AssetExportRepository {
  constructor(private client: MongoClient, private dbName: string) {}

  private col() {
    return this.client.db(this.dbName).collection<AssetExport>('exports');
  }

  async create(exportRecord: Omit<AssetExport, 'createdAt'>): Promise<AssetExport> {
    const record: AssetExport = { ...exportRecord, id: exportRecord.id ?? randomUUID(), createdAt: new Date() };
    await this.col().insertOne({ ...record });
    return record;
  }

  async listByDesign(designId: string): Promise<AssetExport[]> {
    return this.col().find({ designId }).toArray();
  }
}

class MongoUploadRepo implements UploadRepository {
  constructor(private client: MongoClient, private dbName: string) {}

  private col() {
    return this.client.db(this.dbName).collection<Upload>('uploads');
  }

  async create(upload: Upload): Promise<Upload> {
    await this.col().insertOne({ ...upload });
    return upload;
  }

  async listByUser(userId: string): Promise<Upload[]> {
    return this.col().find({ userId }).toArray();
  }

  async findById(id: string): Promise<Upload | null> {
    const doc = await this.col().findOne({ id });
    return doc ? { ...doc } : null;
  }

  async delete(id: string): Promise<void> {
    await this.col().deleteOne({ id });
  }
}

export const buildMongoRepositories = async (): Promise<RepositoryProvider> => {
  const config = getConfig();
  const uri = config.MONGODB_URI!;
  const dbName = getDbName(uri);
  const client = await MongoClient.connect(uri);

  return {
    users: new MongoUserRepo(client, dbName),
    projects: new MongoProjectRepo(client, dbName),
    designs: new MongoDesignRepo(client, dbName),
    exports: new MongoExportRepo(client, dbName),
    uploads: new MongoUploadRepo(client, dbName)
  };
};
