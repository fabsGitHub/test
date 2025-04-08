import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  limit,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { Post, Comment, Categories, PostStatus } from "@/constants/Interfaces";

// Helper function to generate URL identifier from title
const generateUrlIdentifier = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Post Management
export const createPost = async (postData: Post): Promise<string> => {
  try {
    const urlIdentifier = generateUrlIdentifier(postData.title);
    const postWithUrl = {
      ...postData,
      urlIdentifier,
    };

    const postsRef = collection(db, "posts");
    const newPostRef = doc(postsRef);
    console.log("newPostRef", newPostRef);
    const now = new Date().toISOString();

    const newPost: Post = {
      title: postWithUrl.title,
      content: postWithUrl.content,
      id: newPostRef.id,
      authorId: postWithUrl.authorId,
      status: postWithUrl.status || "draft",
      createdAt: now,
      updatedAt: now,
      categories: postWithUrl.categories || "generalInformation",
      tags: postWithUrl.tags || [],
      likes: 0,
      savedCount: 0,
      likedBy: [],

      ...(postWithUrl.featuredImage
        ? { featuredImage: postWithUrl.featuredImage }
        : {}),
      ...(postWithUrl.excerpt ? { excerpt: postWithUrl.excerpt } : {}),
      publishDate: postWithUrl.publishDate || "",
      savedBy: [],
    };

    console.log("newPost", JSON.stringify(newPost, null, 2));

    await setDoc(newPostRef, newPost);
    return newPostRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

export const updatePost = async (
  postId: string,
  updates: Partial<Post>
): Promise<void> => {
  try {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
};

export const deletePost = async (postId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "posts", postId));
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};

// Post Retrieval
export const getPost = async (postId: string): Promise<Post | null> => {
  try {
    const postDoc = await getDoc(doc(db, "posts", postId));
    return postDoc.exists() ? (postDoc.data() as Post) : null;
  } catch (error) {
    console.error("Error getting post:", error);
    throw error;
  }
};

export const getPosts = async (options: {
  status?: PostStatus | PostStatus[];
  authorId?: string;
  category?: Categories;
  tag?: string;
  searchQuery?: string;
  limit?: number;
}): Promise<Post[]> => {
  try {
    let postsQuery = query(collection(db, "posts"));

    // Status filter
    if (options.status) {
      if (Array.isArray(options.status) && options.status.length > 0) {
        postsQuery = query(postsQuery, where("status", "in", options.status));
      } else if (typeof options.status === "string") {
        postsQuery = query(postsQuery, where("status", "==", options.status));
      }
    }

    // Other filters
    if (options.authorId) {
      postsQuery = query(postsQuery, where("authorId", "==", options.authorId));
    }
    if (options.category) {
      postsQuery = query(
        postsQuery,
        where("categories", "array-contains", options.category)
      );
    }
    if (options.tag) {
      postsQuery = query(
        postsQuery,
        where("tags", "array-contains", options.tag)
      );
    }

    // Ordering (always by publishDate)
    postsQuery = query(postsQuery, orderBy("publishDate", "desc"));

    // Limit (optional)
    if (options.limit) {
      postsQuery = query(postsQuery, limit(options.limit));
    }

    const querySnapshot = await getDocs(postsQuery);
    let posts = querySnapshot.docs.map((doc) => ({
      ...(doc.data() as Post),
      id: doc.id,
    }));

    // Client-side search filter (optional)
    if (options.searchQuery) {
      const searchLower = options.searchQuery.toLowerCase();
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          post.excerpt?.toLowerCase().includes(searchLower)
      );
    }

    console.log("(getPosts) posts: ", JSON.stringify(posts, null, 2));
    return posts;
  } catch (error) {
    console.error("(getPosts) Error getting posts:", error);
    throw error;
  }
};


export const likePostBlogService = async (
  post: Post,
  userId: string
): Promise<void> => {
  const postRef = doc(db, "posts", post.id);
  await updateDoc(postRef, {
    likes: increment(1),
    likedBy: arrayUnion(userId),
  });
};

export const unlikePostBlogService = async (
  post: Post,
  userId: string
): Promise<void> => {
  const postRef = doc(db, "posts", post.id);
  await updateDoc(postRef, {
    likes: increment(-1),
    likedBy: arrayRemove(userId),
  });
};

export const savePostBlogService = async (
  post: Post,
  userId: string
): Promise<void> => {
  const postRef = doc(db, "posts", post.id);
  const userRef = doc(db, "users", userId);

  await updateDoc(postRef, {
    savedBy: arrayUnion(userId),
    savedCount: increment(1),
  });
  await updateDoc(userRef, {
    savedPosts: arrayUnion(post.id),
  });
};

export const unsavePostBlogService = async (
  post: Post,
  userId: string
): Promise<void> => {
  const postRef = doc(db, "posts", post.id);
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    savedPosts: arrayRemove(post.id),
  });
  await updateDoc(postRef, {
    savedBy: arrayRemove(userId),
    savedCount: increment(-1),
  });
};

// Category Management
export const getCategories = async (): Promise<string[]> => {
  try {
    const categoriesDoc = await getDoc(doc(db, "metadata", "categories"));
    return categoriesDoc.exists() ? categoriesDoc.data().list : [];
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
};

export const addCategory = async (category: string): Promise<void> => {
  try {
    const categoryRef = doc(db, "metadata", "categories");
    await updateDoc(categoryRef, {
      list: arrayUnion(category),
    });
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

export const deleteCategory = async (category: string): Promise<void> => {
  try {
    const categoryRef = doc(db, "metadata", "categories");
    await updateDoc(categoryRef, {
      list: arrayRemove(category),
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

// Tag Management
export const getTags = async (): Promise<string[]> => {
  try {
    const tagsDoc = await getDoc(doc(db, "metadata", "tags"));
    return tagsDoc.exists() ? tagsDoc.data().list : [];
  } catch (error) {
    console.error("Error getting tags:", error);
    throw error;
  }
};

export const addTag = async (tag: string): Promise<void> => {
  try {
    const tagRef = doc(db, "metadata", "tags");
    await updateDoc(tagRef, {
      list: arrayUnion(tag),
    });
  } catch (error) {
    console.error("Error adding tag:", error);
    throw error;
  }
};

export const deleteTag = async (tag: string): Promise<void> => {
  try {
    const tagRef = doc(db, "metadata", "tags");
    await updateDoc(tagRef, {
      list: arrayRemove(tag),
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    throw error;
  }
};

// Scheduled Post Management
export const schedulePost = async (
  postId: string,
  publishDate: Date
): Promise<void> => {
  try {
    await updatePost(postId, {
      status: PostStatus.SCHEDULED,
      publishDate: publishDate.toISOString(),
    });
  } catch (error) {
    console.error("Error scheduling post:", error);
    throw error;
  }
};

// Check and publish scheduled posts (should be run by a cron job or cloud function)
export const publishScheduledPosts = async (): Promise<void> => {
  try {
    const now = new Date();
    const scheduledPosts = await getPosts({
      status: PostStatus.SCHEDULED,
    });

    const postsToPublish = scheduledPosts.filter(
      (post) => post.publishDate && new Date(post.publishDate) <= now
    );

    for (const post of postsToPublish) {
      await updatePost(post.id!, {
        status: PostStatus.PUBLISHED,
      });
    }
  } catch (error) {
    console.error("Error publishing scheduled posts:", error);
    throw error;
  }
};

export const getSavedPosts = async (userId: string): Promise<Post[]> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }

    const savedPostIds = userDoc.data().savedPosts || [];

    if (savedPostIds.length === 0) {
      return [];
    }

    const postsRef = collection(db, "posts");
    const postsQuery = query(postsRef, where("id", "in", savedPostIds));
    const postsSnapshot = await getDocs(postsQuery);
    console.log("postsSnapshot", JSON.stringify(postsSnapshot, null, 2));
    return postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];
  } catch (error) {
    console.error("Error getting saved posts:", error);
    throw error;
  }
};

const blogService = {
  createPost,
  updatePost,
  deletePost,
  getPost,
  getPosts,
  addCategory,
  deleteCategory,
  getCategories,
  addTag,
  deleteTag,
  getTags,
  schedulePost,
  publishScheduledPosts,
  unlikePostBlogService,
  savePostBlogService,
  unsavePostBlogService,
  getSavedPosts,
};

export default blogService;
