import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User,
  updateEmail,
  updatePassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Platform } from 'react-native';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(userCredential.user.uid);
    return { user: userCredential.user, profile };
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

const signUp = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, { displayName });

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName,
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    return { user, profile: userProfile };
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    let userCredential;

    if (Platform.OS === 'web') {
      // Use popup for web
      userCredential = await signInWithPopup(auth, provider);
    } else {
      // Use redirect for mobile
      await signInWithRedirect(auth, provider);
      userCredential = await getRedirectResult(auth);
    }

    if (!userCredential) {
      throw new Error('Google sign in failed');
    }

    const user = userCredential.user;
    let profile = await getUserProfile(user.uid);

    if (!profile) {
      // Create profile if it doesn't exist
      profile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      await setDoc(doc(db, 'users', user.uid), profile);
    }

    return { user, profile };
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() as UserProfile : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    const user = auth.currentUser;
    if (user && updates.displayName) {
      await updateProfile(user, { displayName: updates.displayName });
    }
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

const updateUserEmail = async (newEmail: string) => {
  try {
    const user = auth.currentUser;
    if (user) {
      await updateEmail(user, newEmail);
      await updateDoc(doc(db, 'users', user.uid), { email: newEmail });
    }
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

const updateUserPassword = async (newPassword: string) => {
  try {
    const user = auth.currentUser;
    if (user) {
      await updatePassword(user, newPassword);
    }
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

const autoSignIn = async (): Promise<User> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.debug('(autoSignIn) User signed in:', JSON.stringify(user, null, 2));
        unsubscribe(); // Unsubscribe to avoid memory leaks
        resolve(user);
      } else {
        console.debug('(autoSignIn) No user signed in');
        unsubscribe(); // Unsubscribe before rejecting
        reject(new Error('No authenticated user'));
      }
    });
  });
};

const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Diese E-Mail-Adresse wird bereits verwendet.';
    case 'auth/invalid-email':
      return 'Ungültige E-Mail-Adresse.';
    case 'auth/operation-not-allowed':
      return 'Operation nicht erlaubt.';
    case 'auth/weak-password':
      return 'Das Passwort ist zu schwach.';
    case 'auth/user-disabled':
      return 'Dieser Account wurde deaktiviert.';
    case 'auth/user-not-found':
      return 'Kein Account mit dieser E-Mail-Adresse gefunden.';
    case 'auth/wrong-password':
      return 'Falsches Passwort.';
    case 'auth/too-many-requests':
      return 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.';
    default:
      return 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
  }
};

const authService = {
  signIn,
  signUp,
  signInWithGoogle,
  logOut,
  getUserProfile,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  resetPassword,
  autoSignIn,
};

export default authService; 