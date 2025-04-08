import { db, auth } from '@/config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { updateEmail } from 'firebase/auth';
import { UserProfile } from '@/constants/Interfaces';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() as UserProfile : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
  try {
    const userRef = doc(db, 'users', userId);
    
    // If email is being updated, update auth email first
    if (data.email && auth.currentUser) {
      await updateEmail(auth.currentUser, data.email);
    }

    await updateDoc(userRef, data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function getFavorites(userId: string): Promise<string[]> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? (userDoc.data().favorites || []) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    throw error;
  }
}

export async function addToFavorites(userId: string, postId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favorites: arrayUnion(postId)
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

export async function removeFromFavorites(userId: string, postId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favorites: arrayRemove(postId)
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
} 