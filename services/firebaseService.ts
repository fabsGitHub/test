import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../config/firebase";
import { UserProfile } from "@/constants/Interfaces";
// User Profile Services
export const createUserProfile = async (
  userId: string,
  userData: Partial<UserProfile>
) => {
  try {
    await setDoc(doc(db, "users", userId), {
      ...userData,
      createdAt: Timestamp.now(),
      favorites: [],
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};


// Favorites Services
export const toggleFavorite = async (userId: string, postId: string) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const favorites = userDoc.data()?.favorites || [];

    if (favorites.includes(postId)) {
      await updateDoc(userRef, {
        favorites: arrayRemove(postId),
      });
      return false;
    } else {
      await updateDoc(userRef, {
        favorites: arrayUnion(postId),
      });
      return true;
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
};

export const getFavorites = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    const favorites = userDoc.data()?.favorites || [];
    const posts = [];

    for (const postId of favorites) {
      const postDoc = await getDoc(doc(db, "posts", postId));
      if (postDoc.exists()) {
        posts.push({
          id: postDoc.id,
          ...postDoc.data(),
        });
      }
    }

    return posts;
  } catch (error) {
    console.error("Error getting favorites:", error);
    throw error;
  }
};

// Image Upload Service
export const uploadImage = async (
  uri: string,
  path: string
): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

const firebaseService = {
  // User Profile Services
  createUserProfile,
  getUserProfile,

  // Favorites Services
  toggleFavorite,
  getFavorites,

  // Image Upload Service
  uploadImage,
};

export default firebaseService;
