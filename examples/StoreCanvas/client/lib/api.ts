import { User, Project, Design, Export, Upload, SizePreset } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const baseHeaders: HeadersInit = {};
    if (options.body !== undefined) {
      baseHeaders['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...baseHeaders,
        ...options.headers,
      },
      credentials: 'include',
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      const message = error.message || error.error || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<{ user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(email: string, password: string, name?: string): Promise<{ user: User }> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async logout(): Promise<void> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getMe(): Promise<User> {
    return this.request('/auth/me');
  }

  async requestPasswordReset(email: string): Promise<{ sent: boolean }> {
    return this.request('/auth/reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async completePasswordReset(params: { email: string; code: string; newPassword: string }): Promise<{ reset: boolean }> {
    return this.request('/auth/reset/complete', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async listProjects(): Promise<Project[]> {
    return this.request('/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.request(`/projects/${id}`);
  }

  async createProject(data: {
    name: string;
    platforms: string[];
    brandKit: {
      primaryColor: string;
      secondaryColor: string;
      gradientPreset?: string;
      logoUrl?: string;
      fontFamily?: string;
    };
  }): Promise<Project> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async listProjectDesigns(projectId: string): Promise<Design[]> {
    return this.request(`/projects/${projectId}/designs`);
  }

  async getDesign(id: string): Promise<Design> {
    return this.request(`/designs/${id}`);
  }

  async createDesign(projectId: string, data: {
    name: string;
    type: string;
    baseWidth: number;
    baseHeight: number;
    layers?: any[];
    aiMetadata?: Record<string, unknown>;
    status?: 'draft' | 'ready' | 'archived';
  }): Promise<Design> {
    return this.request(`/projects/${projectId}/designs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDesign(id: string, data: Partial<Design>): Promise<Design> {
    return this.request(`/designs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDesign(id: string): Promise<void> {
    return this.request(`/designs/${id}`, {
      method: 'DELETE',
    });
  }

  async exportDesign(designId: string, data: {
    presets?: string[];
    sizePresetCodes: string[];
    format: 'png' | 'jpeg';
  }): Promise<{ exports: Export[] }> {
    return this.request(`/designs/${designId}/export`, {
      method: 'POST',
      body: JSON.stringify({
        sizePresetCodes: data.sizePresetCodes ?? data.presets ?? [],
        format: data.format,
      }),
    });
  }

  async listExports(designId: string): Promise<Export[]> {
    return this.request(`/designs/${designId}/exports`);
  }

  async listSizePresets(): Promise<SizePreset[]> {
    return this.request('/size-presets');
  }

  async generateBackground(designId: string, data: {
    prompt: string;
    matchBrandColors?: boolean;
  }): Promise<Design> {
    return this.request(`/designs/${designId}/generate-background`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async suggestCopy(designId: string, data: {
    goal: string;
  }): Promise<{ options: string[] }> {
    return this.request(`/designs/${designId}/suggest-copy`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async applyImg2Img(designId: string, data: {
    prompt: string;
    base64Image: string;
  }): Promise<Design> {
    return this.request(`/designs/${designId}/apply-img2img`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createUpload(file: File, type: 'logo' | 'screenshot' | 'image', projectId?: string): Promise<Upload> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (projectId) {
      formData.append('projectId', projectId);
    }

    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteUpload(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/uploads/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Delete failed' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
  }

  async listUploads(projectId?: string): Promise<Upload[]> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return this.request(`/uploads${query}`);
  }

  async renameUpload(id: string, name: string): Promise<Upload> {
    return this.request(`/uploads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  }

  async transformUpload(data: {
    uploadId: string;
    mode: 'upscale' | 'downscale' | 'resize';
    scaleFactor?: number;
    width?: number;
    height?: number;
  }): Promise<{ upload: Upload }> {
    return this.request('/editing/transform', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async applyFilter(data: {
    uploadId: string;
    action: 'blur' | 'brightness' | 'remove_background';
    value?: number;
  }): Promise<{ upload: Upload }> {
    return this.request('/editing/filter', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async convertUpload(data: { uploadId: string; format: 'png' | 'jpeg' | 'webp' | 'avif' }): Promise<{ upload: Upload }> {
    return this.request('/editing/convert', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async aiCreate(data: { mode: 'art' | 'power_editor' | 'characters' | 'logos' | 'stock' | 'backgrounds' | 'anime'; prompt?: string }): Promise<{ upload: Upload }> {
    return this.request('/ai/create', { method: 'POST', body: JSON.stringify(data) });
  }

  async aiPortrait(data: { mode: 'general' | 'corporate' | 'lunar_new_year' | 'avatar' | 'cosplay' | 'real_estate' | 'medical' | 'xmas' | 'profile_editor' }): Promise<{ upload: Upload }> {
    return this.request('/ai/portraits', { method: 'POST', body: JSON.stringify(data) });
  }

  async aiEnhance(data: { action: 'upscale' | 'remove_object' | 'remove_background' | 'restyle' | 'colorize' | 'restore' | 'face_enhance' | 'auto_crop' | 'color_palette'; uploadId: string }): Promise<{ upload: Upload }> {
    return this.request('/ai/enhance', { method: 'POST', body: JSON.stringify(data) });
  }

  async aiGame(data: { mode: 'tools' | 'characters' | 'background' | 'copywriter' | 'logo' | 'dnd'; uploadId?: string }): Promise<{ upload: Upload }> {
    return this.request('/ai/game', { method: 'POST', body: JSON.stringify(data) });
  }
}

export const apiClient = new ApiClient();
