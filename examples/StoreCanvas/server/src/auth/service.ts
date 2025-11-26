import { randomUUID, createHash } from 'crypto';
import { getRepositoryProvider } from '../repositories';
import { User } from '../repositories/types';
import { AuthError, ValidationError } from '../common/errors';

interface Credentials {
  userId: string;
  passwordHash: string;
}

interface ResetRequest {
  code: string;
  expiresAt: number;
}

// TODO: Replace with Better Auth backed by persistent storage.
export class AuthService {
  private credentials = new Map<string, Credentials>();
  private resets = new Map<string, ResetRequest>();
  private repo = getRepositoryProvider();

  async signup(email: string, password: string, name?: string): Promise<User> {
    const existing = await this.repo.users.findByEmail(email);
    if (existing) {
      throw new ValidationError('Email already registered');
    }
    const id = randomUUID();
    const user = await this.repo.users.create({
      id,
      email,
      name,
      role: 'user'
    });
    this.credentials.set(email, { userId: user.id, passwordHash: this.hashPassword(password) });
    return user;
  }

  async login(email: string, password: string): Promise<User> {
    const creds = this.credentials.get(email);
    if (!creds) {
      throw new AuthError('Invalid credentials');
    }
    if (creds.passwordHash !== this.hashPassword(password)) {
      throw new AuthError('Invalid credentials');
    }
    const user = await this.repo.users.findById(creds.userId);
    if (!user) throw new AuthError('User not found');
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.repo.users.findById(id);
  }

  async requestPasswordReset(email: string): Promise<{ code: string | null; shouldSend: boolean }> {
    const user = await this.repo.users.findByEmail(email);
    if (!user) {
      // Do not leak user existence.
      return { code: null, shouldSend: false };
    }
    const code = this.generateCode();
    const expiresAt = Date.now() + 15 * 60_000;
    this.resets.set(email, { code, expiresAt });
    return { code, shouldSend: true };
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const existing = this.resets.get(email);
    if (!existing || existing.code !== code || existing.expiresAt < Date.now()) {
      throw new ValidationError('Invalid or expired code');
    }
    const user = await this.repo.users.findByEmail(email);
    if (!user) {
      throw new ValidationError('User not found');
    }
    const creds = this.credentials.get(email);
    this.credentials.set(email, {
      userId: creds?.userId ?? user.id,
      passwordHash: this.hashPassword(newPassword)
    });
    this.resets.delete(email);
  }

  private hashPassword(password: string) {
    return createHash('sha256').update(password).digest('hex');
  }

  private generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
