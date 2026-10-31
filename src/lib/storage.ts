/**
 * Centralized Storage Repository for Development
 * 
 * Provides an in-memory/localStorage fallback for all major data types
 * so that interactions persist across reloads without a real backend.
 */

const isBrowser = typeof window !== "undefined";

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (!isBrowser) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage`, e);
      return defaultValue;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage`, e);
    }
  }
};

// Exam Repository
export interface Exam {
  id: string;
  name: string;
  targetDate: string;
  created: number;
}
export const examRepo = {
  getAll: (): Exam[] => storage.get("exams", []),
  add: (exam: Exam) => {
    const exams = examRepo.getAll();
    storage.set("exams", [...exams, exam]);
  },
  delete: (id: string) => {
    const exams = examRepo.getAll().filter(e => e.id !== id);
    storage.set("exams", exams);
  }
};


// Settings Repository
export interface AppSettings {
  theme: "light" | "dark" | "system";
  studyGoal: number;
  notifications: boolean;
}
export const settingsRepo = {
  get: (): AppSettings => storage.get("settings", { theme: "system", studyGoal: 120, notifications: true }),
  save: (settings: Partial<AppSettings>) => {
    const current = settingsRepo.get();
    storage.set("settings", { ...current, ...settings });
  }
};

// Chat Repository
export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isDevelopment?: boolean;
}
export const chatRepo = {
  getHistory: (): ChatMessage[] => storage.get("chat_history", []),
  addMessage: (msg: ChatMessage) => {
    const history = chatRepo.getHistory();
    storage.set("chat_history", [...history, msg]);
  },
  clear: () => storage.set("chat_history", [])
};
