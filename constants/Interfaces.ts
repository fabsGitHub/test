export enum PostStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  PUBLISHED = "published",
}
export type Categories =
  | "generalInformation"
  | "myPersonalStory"
  | "holisticApproaches"
  | "focusHealing";
export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string | null;
  authorId: string;
  status: PostStatus;
  publishDate: string;
  createdAt: string;
  updatedAt: string;
  categories: Categories;
  tags: string[];
  featuredImage?: string;
  likes: number;
  likedBy: string[];
  savedCount: number;
  savedBy: string[];
}

export interface PostInput {
  title: string;
  content: string;
  excerpt?: string;
  status: PostStatus;
  categories: Categories;
  tags: string[];
  publishDate?: Date;
}

export interface GetPostsOptions {
  status?: PostStatus;
  authorId?: string;
  category?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  favorites: string[];
  language: string;
  theme: "light" | "dark";
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  replies: Comment[];
}
