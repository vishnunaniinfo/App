import { User, Builder, STORAGE_KEYS } from '../types';
import { storage } from '../utils';

// Storage utilities with type safety
export const localStorage = {
  // Get item with type checking
  get<T = any>(key: string): T | null {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return null;

      // Try to parse JSON
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as T;
      }
    } catch (error) {
      console.error(`Failed to get item from localStorage: ${key}`, error);
      return null;
    }
  },

  // Set item with optional TTL
  set<T = any>(key: string, value: T, ttl?: number): void {
    try {
      const item = ttl
        ? JSON.stringify({ value, expires: Date.now() + ttl * 1000 })
        : JSON.stringify(value);
      window.localStorage.setItem(key, item);
    } catch (error) {
      console.error(`Failed to set item in localStorage: ${key}`, error);

      // If localStorage is full, try to clear old items
      if (error.name === 'QuotaExceededError') {
        try {
          localStorage.clear();
          const item = ttl
            ? JSON.stringify({ value, expires: Date.now() + ttl * 1000 })
            : JSON.stringify(value);
          window.localStorage.setItem(key, item);
        } catch (clearError) {
          console.error('Failed to clear localStorage and retry:', clearError);
        }
      }
    }
  },

  // Remove item
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item from localStorage: ${key}`, error);
    }
  },

  // Clear all items
  clear(): void {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },

  // Check if item exists and is not expired
  has<T = any>(key: string): boolean {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return false;

      const parsed = JSON.parse(item);
      if (parsed && typeof parsed === 'object' && 'expires' in parsed) {
        return Date.now() < parsed.expires;
      }
      return true;
    } catch {
      return false;
    }
  },

  // Get all keys
  keys(): string[] {
    try {
      return Object.keys(window.localStorage);
    } catch (error) {
      console.error('Failed to get localStorage keys:', error);
      return [];
    }
  },

  // Get storage usage
  getUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0;
      for (let key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          used += window.localStorage[key].length + key.length;
        }
      }

      // Most browsers have ~5-10MB limit
      const total = 5 * 1024 * 1024; // 5MB
      const percentage = (used / total) * 100;

      return { used, total, percentage: Math.round(percentage) };
    } catch (error) {
      console.error('Failed to calculate localStorage usage:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  },
};

// Session storage (cleared when browser tab is closed)
export const sessionStorage = {
  get<T = any>(key: string): T | null {
    try {
      const item = window.sessionStorage.getItem(key);
      if (item === null) return null;

      try {
        return JSON.parse(item) as T;
      } catch {
        return item as T;
      }
    } catch (error) {
      console.error(`Failed to get item from sessionStorage: ${key}`, error);
      return null;
    }
  },

  set<T = any>(key: string, value: T): void {
    try {
      const item = JSON.stringify(value);
      window.sessionStorage.setItem(key, item);
    } catch (error) {
      console.error(`Failed to set item in sessionStorage: ${key}`, error);
    }
  },

  remove(key: string): void {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item from sessionStorage: ${key}`, error);
    }
  },

  clear(): void {
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error);
    }
  },

  has(key: string): boolean {
    try {
      return window.sessionStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
};

// Encrypted storage (for sensitive data)
export const secureStorage = {
  // Simple XOR encryption (not for production use)
  encrypt: (text: string, key: string): string => {
    if (!text || !key) return text;

    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  },

  decrypt: (encryptedText: string, key: string): string => {
    if (!encryptedText || !key) return encryptedText;

    try {
      const text = atob(encryptedText);
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch {
      return encryptedText;
    }
  },

  set: (key: string, value: string, encryptionKey: string): void => {
    try {
      const encrypted = secureStorage.encrypt(value, encryptionKey);
      localStorage.set(key, encrypted);
    } catch (error) {
      console.error(`Failed to set encrypted item: ${key}`, error);
    }
  },

  get: (key: string, encryptionKey: string): string | null => {
    try {
      const encrypted = localStorage.get<string>(key);
      if (!encrypted) return null;

      return secureStorage.decrypt(encrypted, encryptionKey);
    } catch (error) {
      console.error(`Failed to get encrypted item: ${key}`, error);
      return null;
    }
  },

  remove: (key: string): void => {
    localStorage.remove(key);
  },
};

// Application-specific storage utilities
export const storage = {
  // Authentication
  getAccessToken: (): string | null => {
    return localStorage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setAccessToken: (token: string): void => {
    localStorage.set(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  getRefreshToken: (): string | null => {
    return localStorage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken: (token: string): void => {
    localStorage.set(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  getUser: (): User | null => {
    return localStorage.get<User>(STORAGE_KEYS.USER);
  },

  setUser: (user: User): void => {
    localStorage.set(STORAGE_KEYS.USER, user);
  },

  updateUser: (updates: Partial<User>): void => {
    const currentUser = storage.getUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      localStorage.set(STORAGE_KEYS.USER, updatedUser);
    }
  },

  getBuilder: (): Builder | null => {
    return localStorage.get<Builder>(STORAGE_KEYS.BUILDER);
  },

  setBuilder: (builder: Builder): void => {
    localStorage.set(STORAGE_KEYS.BUILDER, builder);
  },

  // Theme
  getTheme: (): 'light' | 'dark' | null => {
    const theme = localStorage.get<string>(STORAGE_KEYS.THEME);
    return theme === 'light' || theme === 'dark' ? theme : null;
  },

  setTheme: (theme: 'light' | 'dark'): void => {
    localStorage.set(STORAGE_KEYS.THEME, theme);
    // Also update document class for immediate effect
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  },

  // User preferences
  getPreferences: (): Record<string, any> | null => {
    return localStorage.get<Record<string, any>>(STORAGE_KEYS.PREFERENCES);
  },

  setPreferences: (preferences: Record<string, any>): void => {
    const currentPreferences = storage.getPreferences() || {};
    const updatedPreferences = { ...currentPreferences, ...preferences };
    localStorage.set(STORAGE_KEYS.PREFERENCES, updatedPreferences);
  },

  getPreference: (key: string, defaultValue?: any): any => {
    const preferences = storage.getPreferences();
    return preferences?.[key] ?? defaultValue;
  },

  setPreference: (key: string, value: any): void => {
    storage.setPreferences({ [key]: value });
  },

  removePreference: (key: string): void => {
    const preferences = storage.getPreferences();
    if (preferences && preferences[key] !== undefined) {
      delete preferences[key];
      localStorage.set(STORAGE_KEYS.PREFERENCES, preferences);
    }
  },

  // Application state
  getLastVisit: (): string | null => {
    return localStorage.get<string>(STORAGE_KEYS.LAST_VISIT);
  },

  setLastVisit: (): void => {
    localStorage.set(STORAGE_KEYS.LAST_VISIT, new Date().toISOString());
  },

  isOnboardingCompleted: (): boolean => {
    return localStorage.get<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED) || false;
  },

  setOnboardingCompleted: (): void => {
    localStorage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
  },

  // Clear all authentication data
  clearAuth: (): void => {
    localStorage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.remove(STORAGE_KEYS.USER);
    localStorage.remove(STORAGE_KEYS.BUILDER);
  },

  // Clear all application data
  clearAll: (): void => {
    localStorage.clear();
    sessionStorage.clear();
  },

  // Export user data (for data export functionality)
  exportUserData: (): string | null => {
    const userData = {
      user: storage.getUser(),
      builder: storage.getBuilder(),
      preferences: storage.getPreferences(),
      theme: storage.getTheme(),
      lastVisit: storage.getLastVisit(),
    };

    try {
      return JSON.stringify(userData);
    } catch (error) {
      console.error('Failed to export user data:', error);
      return null;
    }
  },

  // Import user data (for data import functionality)
  importUserData: (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);

      if (data.user) {
        storage.setUser(data.user);
      }
      if (data.builder) {
        storage.setBuilder(data.builder);
      }
      if (data.preferences) {
        storage.setPreferences(data.preferences);
      }
      if (data.theme) {
        storage.setTheme(data.theme);
      }
      if (data.lastVisit) {
        localStorage.set(STORAGE_KEYS.LAST_VISIT, data.lastVisit);
      }

      return true;
    } catch (error) {
      console.error('Failed to import user data:', error);
      return false;
    }
  },

  // Storage migration (for updating storage structure)
  migrate: (migrations: { version: string; migrate: () => void }[]): void => {
    const currentVersion = localStorage.get<string>('storage_version') || '0.0.0';

    for (const migration of migrations) {
      if (this.compareVersions(currentVersion, migration.version) < 0) {
        console.log(`Running storage migration: ${migration.version}`);
        try {
          migration.migrate();
        } catch (error) {
          console.error(`Storage migration failed: ${migration.version}`, error);
        }
      }
    }

    // Update version to latest
    if (migrations.length > 0) {
      const latestVersion = migrations[migrations.length - 1].version;
      localStorage.set('storage_version', latestVersion);
    }
  },

  // Simple version comparison
  compareVersions: (version1: string, version2: string): number => {
    const parts1 = version1.split('.').map(Number);
    const parts2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  },
};

// Storage monitoring and cleanup
export const storageMonitor = {
  // Clean up expired items
  cleanup: (): void => {
    const keys = localStorage.keys();
    let cleaned = 0;

    keys.forEach(key => {
      if (!localStorage.has(key)) {
        localStorage.remove(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired localStorage items`);
    }
  },

  // Get storage statistics
  getStats: () => {
    const usage = localStorage.getUsage();
    const keys = localStorage.keys();

    return {
      usage,
      totalKeys: keys.length,
      keys: keys.slice(0, 10), // Return first 10 keys for debugging
      isFull: usage.percentage > 90,
    };
  },

  // Optimize storage by removing old data
  optimize: (): void => {
    const keys = localStorage.keys();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    keys.forEach(key => {
      // Keep authentication and preference keys
      const keepKeys = Object.values(STORAGE_KEYS);
      if (keepKeys.includes(key)) return;

      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed && parsed.expires && parsed.expires < thirtyDaysAgo) {
            localStorage.remove(key);
          }
        }
      } catch (error) {
        // If we can't parse, remove the item
        localStorage.remove(key);
      }
    });
  },
};

// Auto-cleanup on page load
if (typeof window !== 'undefined') {
  // Run cleanup on load
  setTimeout(() => {
    storageMonitor.cleanup();
    storageMonitor.optimize();
  }, 1000);

  // Monitor storage events
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('xavira_')) {
      console.log('Storage changed:', e.key, e.oldValue, e.newValue);
    }
  });

  // Handle storage quota exceeded
  window.addEventListener('storage', (e) => {
    if (e.key === null && e.newValue === null) {
      console.warn('Storage quota exceeded, some data may be lost');
      storageMonitor.optimize();
    }
  });
}

export default storage;