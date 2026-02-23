export interface BlogPost {
  id: string;
  title: string;
  content: string; // Markdown content
  summary?: string;
  tags: string[];
  createdAt: number;
  lastModified: number;
  featuredImage?: string; // Base64 data URI
}

export interface Idea {
  title: string;
  summary: string;
  outline: string[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  IDEATION = 'IDEATION',
  EDITOR = 'EDITOR',
  IMAGE_GEN = 'IMAGE_GEN'
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}