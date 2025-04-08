import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cacheExpiryTime: number = 30 * 24 * 60 * 60 * 1000; // 30 days default

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async setItem<T>(key: string, data: T, expiresIn: number = this.cacheExpiryTime): Promise<void> {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
    };
    try {
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error setting cache item:', error);
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await AsyncStorage.getItem(key);
      if (!cachedData) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cachedData);
      const isExpired = Date.now() - cacheItem.timestamp > cacheItem.expiresIn;

      if (isExpired) {
        await this.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Error getting cache item:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing cache item:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export default CacheManager.getInstance(); 