import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getAuthInstance, getDB } from './config';
import type { User as AppUser } from '../Types';

const allowedRoles: AppUser['role'][] = ['patient', 'clinic', 'hospital', 'lab', 'admin'];

function normalizeRole(role: unknown): AppUser['role'] {
  return allowedRoles.includes(role as AppUser['role']) ? role as AppUser['role'] : 'clinic';
}

function fallbackProfile(firebaseUser: FirebaseUser): AppUser {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    role: 'clinic',
    organization: 'Independent',
    avatar: firebaseUser.photoURL || ''
  };
}

export async function getAppUser(firebaseUser: FirebaseUser): Promise<AppUser> {
  const profileSnapshot = await getDoc(doc(getDB(), 'users', firebaseUser.uid));
  if (!profileSnapshot.exists()) {
    const profile = fallbackProfile(firebaseUser);
    await setDoc(doc(getDB(), 'users', firebaseUser.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return profile;
  }

  const data = profileSnapshot.data();
  return {
    id: firebaseUser.uid,
    name: String(data.name || firebaseUser.displayName || 'User'),
    email: String(data.email || firebaseUser.email || ''),
    role: normalizeRole(data.role),
    organization: String(data.organization || 'Independent'),
    avatar: String(data.avatar || firebaseUser.photoURL || '')
  };
}

export async function login(email: string, password: string): Promise<{ user: AppUser }> {
  const credential = await signInWithEmailAndPassword(getAuthInstance(), email.trim(), password);
  return { user: await getAppUser(credential.user) };
}

export async function signup(
  name: string,
  email: string,
  password: string,
  role?: string,
  organization?: string
): Promise<{ user: AppUser }> {
  const safeName = name.trim();
  const safeEmail = email.trim().toLowerCase();
  const safeRole = normalizeRole(role === 'admin' ? 'clinic' : role);
  const safeOrganization = organization?.trim() || 'Independent';
  const credential = await createUserWithEmailAndPassword(getAuthInstance(), safeEmail, password);

  try {
    await updateProfile(credential.user, { displayName: safeName });
    const profile: AppUser = {
      id: credential.user.uid,
      name: safeName,
      email: safeEmail,
      role: safeRole,
      organization: safeOrganization,
      avatar: ''
    };
    await setDoc(doc(getDB(), 'users', credential.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { user: profile };
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
}

export async function logout(): Promise<void> {
  await signOut(getAuthInstance());
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(getAuthInstance(), email.trim().toLowerCase());
}

export async function updateUserProfile(data: { name?: string; email?: string; avatar?: string }): Promise<AppUser> {
  const firebaseUser = getAuthInstance().currentUser;
  if (!firebaseUser) throw new Error('You must be signed in to update your profile.');

  const updates: Record<string, unknown> = {};
  const avatarUrl = data.avatar;
  if (avatarUrl?.startsWith('data:') && avatarUrl.length > 200 * 1024) {
    throw new Error('Avatar images must be smaller than 150 KB when Storage is disabled.');
  }

  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name) throw new Error('Name cannot be empty.');
    await updateProfile(firebaseUser, { displayName: name });
    updates.name = name;
  }
  if (data.email !== undefined && data.email.trim() && data.email.trim().toLowerCase() !== (firebaseUser.email || '').toLowerCase()) {
    const email = data.email.trim().toLowerCase();
    await updateEmail(firebaseUser, email);
    updates.email = email;
  }
  if (avatarUrl !== undefined) updates.avatar = avatarUrl;

  await updateDoc(doc(getDB(), 'users', firebaseUser.uid), {
    ...updates,
    updatedAt: serverTimestamp()
  });
  return getAppUser(firebaseUser);
}

export async function refreshCurrentUser(): Promise<AppUser | null> {
  const firebaseUser = getAuthInstance().currentUser;
  return firebaseUser ? getAppUser(firebaseUser) : null;
}

export async function deleteCurrentAccount(): Promise<void> {
  const firebaseUser = getAuthInstance().currentUser;
  if (!firebaseUser) throw new Error('You must be signed in to delete your account.');
  await deleteDoc(doc(getDB(), 'users', firebaseUser.uid));
  await deleteUser(firebaseUser);
}

export function onAuthStateChange(callback: (user: AppUser | null) => void): () => void {
  return onAuthStateChanged(getAuthInstance(), (firebaseUser) => {
    void (async () => {
      try {
        callback(firebaseUser ? await getAppUser(firebaseUser) : null);
      } catch (error) {
        console.error('Could not hydrate Firebase user profile:', error);
        callback(null);
      }
    })();
  });
}
