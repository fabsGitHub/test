import { auth } from "../config/firebase";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Categories, Post, PostStatus } from "@/constants/Interfaces";
import * as blogService from "@/services/blogService";
import * as userService from "@/services/userService";
import { UserProfile } from "@/constants/Interfaces";
import i18n from "@/app/i18n";

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class DataManager {
  private static instance: DataManager;
  private cache: Map<string, CacheItem<any>>;
  private cacheTimeout: number = 30 * 24 * 60 * 60 * 1000; // 30 days

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  private getCacheKey(type: string, params?: any): string {
    return `${type}_${JSON.stringify(params || "")}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  // User Profile Management
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = this.getCacheKey("user", userId);
    const cachedData = this.cache.get(cacheKey);

    if (cachedData && this.isValidCache(cachedData.timestamp)) {
      return cachedData.data;
    }

    try {
      const profile = await userService.getUserProfile(userId);
      if (profile) {
        this.cache.set(cacheKey, {
          data: profile,
          timestamp: Date.now(),
        });
      }
      return profile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>) {
    try {
      await userService.updateUserProfile(userId, data);
      this.cache.delete(this.getCacheKey("user", userId));
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  // Posts Management
  async getPosts(
    options: {
      status?: PostStatus;
      category?: Categories;
      tag?: string;
      searchQuery?: string;
      limit?: number;
    } = {}
  ): Promise<Post[]> {
    const cacheKey = this.getCacheKey("posts", options);
    const cachedData = this.cache.get(cacheKey);

    if (cachedData && this.isValidCache(cachedData.timestamp)) {
      return cachedData.data as Post[];
    }

    try {
      const posts = await blogService.getPosts(options);
      const formattedPosts = posts.map((post) => ({
        ...post,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        publishDate: post.publishDate ? post.publishDate : null,
      })) as Post[];

      this.cache.set(cacheKey, {
        data: formattedPosts,
        timestamp: Date.now(),
      });
      console.log("formattedPosts", JSON.stringify(formattedPosts, null, 2));
      return formattedPosts;
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }

  async getPost(postId: string): Promise<Post | null> {
    const cacheKey = this.getCacheKey("post", postId);
    const cachedData = this.cache.get(cacheKey);

    if (cachedData && this.isValidCache(cachedData.timestamp)) {
      return cachedData.data;
    }

    try {
      const post = await blogService.getPost(postId);
      if (!post) return null;

      const formattedPost = {
        ...post,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        publishDate: post.publishDate,
      };

      this.cache.set(cacheKey, {
        data: formattedPost,
        timestamp: Date.now(),
      });

      return formattedPost;
    } catch (error) {
      console.error("Error fetching post:", error);
      throw error;
    }
  }

  async updatePost(postId: string, postData: Post) {
    try {
      // Update in Firestore
      await blogService.updatePost(postId, postData);

      // Set updated post in cache
      const cacheKey = this.getCacheKey("post", postId);
      this.cache.set(cacheKey, {
        data: postData,
        timestamp: Date.now(),
      });

      // Invalidate general post list cache
      this.invalidatePostsCache();
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  }

  // Post Interactions
  async likePostDataManager(postId: string, userId: string) {
    try {
      const post = await this.getPost(postId);
      if (!post) throw new Error(i18n.t("postNotFound"));

      const updatedPost = {
        ...post,
        likes: (post.likes || 0) + 1,
        likedBy: [...(post.likedBy || []), userId],
      };

      // Optimistisch zuerst updaten
      await this.updatePost(postId, updatedPost);

      // Im Hintergrund die DB schreiben
      blogService.likePostBlogService(post, userId).catch((err) => {
        console.warn("Like backend failed", err);
      });

      return updatedPost;
    } catch (error) {
      console.error(i18n.t("errorLikingPost"), error);
      throw error;
    }
  }

  async unlikePostDataManager(postId: string, userId: string) {
    try {
      const post = await this.getPost(postId);
      if (!post) throw new Error(i18n.t("postNotFound"));

      const updatedPost = {
        ...post,
        likes: Math.max((post.likes || 0) - 1, 0),
        likedBy: (post.likedBy || []).filter((id: string) => id !== userId),
      };
      // Optimistisch zuerst updaten
      await this.updatePost(postId, updatedPost);

      // Im Hintergrund die DB schreiben
      blogService.unlikePostBlogService(post, userId).catch((err) => {
        console.warn("Like backend failed", err);
      });

      return updatedPost;
    } catch (error) {
      console.error(i18n.t("errorUnlikingPost"), error);
      throw error;
    }
  }

  // Favorites Management
  async getFavorites(userId: string) {
    try {
      console.log("getFavorites", userId);
      const cacheKey = this.getCacheKey("favorites", userId);
      console.log("cacheKey", cacheKey);
      const cachedData = this.cache.get(cacheKey);
      console.log("cachedData", JSON.stringify(cachedData, null, 2));
      if (cachedData && this.isValidCache(cachedData.timestamp)) {
        return cachedData.data;
      }
      const favorites = await blogService.getSavedPosts(userId);
      console.log("favorites: ", JSON.stringify(favorites, null, 2));
      const formattedFavorites = favorites.map((post) => ({
        ...post,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        publishDate: post.publishDate ? post.publishDate : null,
      })) as Post[];

      this.cache.set(cacheKey, {
        data: formattedFavorites,
        timestamp: Date.now(),
      });
      return formattedFavorites;
    } catch (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    }
  }

  async savePostDataManager(parentPost: Post, userId: string) {
    try {
      const post = await this.getPost(parentPost.id);
      if (!post) throw new Error(i18n.t("postNotFound"));

      // Update post saved count
      const updatedPost = {
        ...post,
        savedCount: (post.savedCount || 0) + 1,
        savedBy: [...(post.savedBy || []), userId],
      };

      // Optimistisch zuerst updaten
      await this.updatePost(parentPost.id, updatedPost);

      // Im Hintergrund die DB schreiben
      blogService.savePostBlogService(post, userId).catch((err) => {
        console.warn("Like backend failed", err);
      });

      // Invalidate caches
      this.cache.delete(this.getCacheKey("favorites", userId));
      this.cache.delete(this.getCacheKey("user", userId));

      return updatedPost;
    } catch (error) {
      console.error(i18n.t("errorAddingToFavorites"), error);
      throw error;
    }
  }

  async unSavePostDataManager(parentPost: Post, userId: string) {
    try {
      const post = await this.getPost(parentPost.id);
      if (!post) throw new Error(i18n.t("postNotFound"));

      // Update post saved count
      const updatedPost = {
        ...post,
        savedCount: Math.max((post.savedCount || 0) - 1, 0),
        savedBy: (post.savedBy || []).filter((id: string) => id !== userId),
      };

      // Optimistisch zuerst updaten
      await this.updatePost(parentPost.id, updatedPost);

      // Im Hintergrund die DB schreiben
      blogService.unsavePostBlogService(post, userId).catch((err) => {
        console.warn("Like backend failed", err);
      });

      // Invalidate caches
      this.cache.delete(this.getCacheKey("favorites", userId));
      this.cache.delete(this.getCacheKey("user", userId));

      return updatedPost;
    } catch (error) {
      console.error(i18n.t("errorRemovingFromFavorites"), error);
      throw error;
    }
  }

  // Cache Management
  private invalidatePostsCache() {
    for (const key of this.cache.keys()) {
      if (key.startsWith("posts_")) {
        this.cache.delete(key);
      }
    }
  }

  clearCache() {
    this.cache.clear();
  }

  setCacheTimeout(timeout: number) {
    this.cacheTimeout = timeout;
  }

  // Auth State Management
  async persistAuthState(user: any) {
    try {
      const authState = {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem("auth_state", JSON.stringify(authState));
    } catch (error) {
      console.error("Error persisting auth state:", error);
    }
  }

  async clearPersistedAuthState() {
    try {
      await AsyncStorage.removeItem("auth_state");
    } catch (error) {
      console.error("Error clearing persisted auth state:", error);
    }
  }

  async getPersistedAuthState() {
    try {
      const persistedAuth = await AsyncStorage.getItem("auth_state");
      if (!persistedAuth) return null;

      const { user, timestamp } = JSON.parse(persistedAuth);
      if (!user || !timestamp) return null;

      // Check if the persisted state is still valid (less than 1 hour old)
      const isExpired = Date.now() - timestamp > 60 * 60 * 1000;
      if (isExpired) {
        await this.clearPersistedAuthState();
        return null;
      }

      return user;
    } catch (error) {
      console.error("Error getting persisted auth state:", error);
      return null;
    }
  }
}

export default DataManager.getInstance();
