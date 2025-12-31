export interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  attachment?: {
    name: string;
    type: string;
    data: string; // Base64
  };
  timestamp: number;
}

export enum AppPlatform {
  WEB = 'HTML5',
  ANDROID = 'APK',
  IOS = 'IPA',
  WINDOWS = 'EXE'
}

export interface BuildStatus {
  isBuilding: boolean;
  progress: number;
  stage: string;
  platform?: AppPlatform;
  completed: boolean;
  error?: string;
}

export interface GeneratedApp {
  html: string;
  version: number;
  lastModified: number;
}

export interface AppVersion {
  id: string;
  timestamp: number;
  code: string;
  prompt: string;
}