export enum Sender {
  User = 'user',
  Bot = 'bot',
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface FileAttachment {
  name: string;
  type: string;
  data: string; // Base64
}

export interface Message {
  id: string;
  role: Sender;
  content: string;
  timestamp: number;
  image?: string; // Base64 data URL
  file?: FileAttachment;
  isStreaming?: boolean;
  isError?: boolean;
  groundingChunks?: GroundingChunk[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

export interface ChatSession {
  id: string;
  title: string;
  userId: string;
  updatedAt: number;
}

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// MediaEditState defines the parameters for image/video editing in FridayStudio
export interface MediaEditState {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: boolean;
  sepia: boolean;
  invert: boolean;
  rotate: number;
  flipX: boolean;
  flipY: boolean;
  aspectRatio: string;
}

// INITIAL_EDIT_STATE provides default values for the media editor
export const INITIAL_EDIT_STATE: MediaEditState = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: false,
  sepia: false,
  invert: false,
  rotate: 0,
  flipX: false,
  flipY: false,
  aspectRatio: 'original',
};
