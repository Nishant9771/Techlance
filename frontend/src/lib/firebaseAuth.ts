import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';

export type AppRole = 'user' | 'actor' | 'supplier';
export type SerializableProfileValue =
  | string
  | number
  | boolean
  | null
  | SerializableProfileValue[]
  | { [key: string]: SerializableProfileValue };

export type ProfileDetails = Record<string, SerializableProfileValue>;

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: AppRole;
  phone: string;
  location: string;
  profileDetails?: ProfileDetails;
  createdAt?: unknown;
  lastLoginAt?: unknown;
  updatedAt?: unknown;
  [key: string]: unknown;
};

export type RegistrationFileUpload = {
  field: string;
  file: File;
};

type AuthEvent = 'login' | 'register' | 'logout' | 'onboarding_completed';

type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
  role: AppRole;
  phone?: string;
  location?: string;
  profileDetails?: ProfileDetails;
  fileUploads?: RegistrationFileUpload[];
};

export function normalizeRole(value: unknown): AppRole {
  if (value === 'actor' || value === 'supplier') {
    return value;
  }
  return 'user';
}

function removeUndefined(value: unknown): SerializableProfileValue {
  if (Array.isArray(value)) {
    return value.map(removeUndefined);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, SerializableProfileValue>>(
      (acc, [key, item]) => {
        if (item !== undefined) {
          acc[key] = removeUndefined(item);
        }

        return acc;
      },
      {},
    );
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return null;
}

function cleanProfileDetails(details?: ProfileDetails): ProfileDetails {
  return removeUndefined(details ?? {}) as ProfileDetails;
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'upload';
}

function appendUploadedFile(details: ProfileDetails, field: string, value: SerializableProfileValue) {
  const currentValue = details[field];

  if (currentValue === undefined) {
    details[field] = value;
    return;
  }

  details[field] = Array.isArray(currentValue) ? [...currentValue, value] : [currentValue, value];
}

async function uploadRegistrationFiles(uid: string, uploads: RegistrationFileUpload[] = []) {
  const uploadedFiles: ProfileDetails = {};

  for (const upload of uploads) {
    if (!upload.file.name) {
      continue;
    }

    const filePath = `users/${uid}/registration/${upload.field}/${Date.now()}-${safeFileName(upload.file.name)}`;
    const fileRef = ref(storage, filePath);
    const metadata = upload.file.type
      ? { contentType: upload.file.type, customMetadata: { field: upload.field } }
      : { customMetadata: { field: upload.field } };
    const snapshot = await uploadBytes(fileRef, upload.file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    appendUploadedFile(uploadedFiles, upload.field, {
      name: upload.file.name,
      size: upload.file.size,
      type: upload.file.type || 'unknown',
      path: filePath,
      downloadURL,
      uploadedAt: new Date().toISOString(),
    });
  }

  return uploadedFiles;
}

export function normalizeUserProfile(uid: string, data: Record<string, unknown> = {}): UserProfile {
  const profile: UserProfile = {
    ...data,
    uid,
    email: typeof data.email === 'string' ? data.email : '',
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    role: normalizeRole(data.role),
    phone: typeof data.phone === 'string' ? data.phone : '',
    location: typeof data.location === 'string' ? data.location : '',
  };

  if (data.profileDetails && typeof data.profileDetails === 'object') {
    profile.profileDetails = data.profileDetails as ProfileDetails;
  }

  return profile;
}

export function mapRoleLabelToAppRole(value: string): AppRole {
  if (value === 'Actor') return 'actor';
  if (value === 'Supplier') return 'supplier';
  return 'user';
}

export async function getUserRole(uid: string): Promise<AppRole | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return normalizeRole(data.role);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeUserProfile(uid, snapshot.data());
}

export async function upsertUserProfile(
  user: User,
  data: {
    role?: AppRole;
    displayName?: string;
    phone?: string;
    location?: string;
    profileDetails?: ProfileDetails;
  },
) {
  const payload: Record<string, unknown> = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: data.displayName ?? user.displayName ?? '',
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (data.role) {
    payload.role = data.role;
  }

  if (data.phone !== undefined) {
    payload.phone = data.phone;
  }

  if (data.location !== undefined) {
    payload.location = data.location;
  }

  if (data.profileDetails) {
    payload.profileDetails = cleanProfileDetails(data.profileDetails);
  }

  await setDoc(
    doc(db, 'users', user.uid),
    payload,
    { merge: true },
  );
}

export async function recordAuthEvent(
  event: AuthEvent,
  user: User | null,
  metadata: Record<string, unknown> = {},
) {
  await addDoc(collection(db, 'authLogs'), {
    event,
    uid: user?.uid ?? null,
    email: user?.email ?? null,
    userAgent: typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent,
    createdAt: serverTimestamp(),
    ...metadata,
  });
}

export async function registerWithEmail(input: RegisterInput) {
  const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);

  if (input.displayName.trim()) {
    await updateProfile(credential.user, { displayName: input.displayName.trim() });
  }

  let uploadedFiles: ProfileDetails = {};
  let fileUploadError = '';

  if (input.fileUploads?.length) {
    try {
      uploadedFiles = await uploadRegistrationFiles(credential.user.uid, input.fileUploads);
    } catch (error) {
      fileUploadError = error instanceof Error ? error.message : 'Registration file upload failed.';
    }
  }

  const profileDetails = cleanProfileDetails({
    ...(input.profileDetails ?? {}),
    registrationFiles: uploadedFiles,
    ...(fileUploadError ? { registrationFileUploadError: fileUploadError } : {}),
  });

  await setDoc(
    doc(db, 'users', credential.user.uid),
    {
      uid: credential.user.uid,
      email: input.email,
      displayName: input.displayName.trim(),
      role: input.role,
      phone: input.phone ?? '',
      location: input.location ?? '',
      profileDetails,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await recordAuthEvent('register', credential.user, { role: input.role });

  return {
    user: credential.user,
    role: input.role,
  };
}

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const role = (await getUserRole(credential.user.uid)) ?? 'user';

  await upsertUserProfile(credential.user, { role });
  await recordAuthEvent('login', credential.user, { role });

  return {
    user: credential.user,
    role,
  };
}

export async function logoutCurrentUser() {
  const currentUser = auth.currentUser;

  if (currentUser) {
    await recordAuthEvent('logout', currentUser);
  }

  await signOut(auth);
}

export function getFirebaseAuthErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return 'Something went wrong. Please try again.';
  }

  const code = String((error as { code: string }).code);

  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    default:
      return 'Authentication failed. Please try again.';
  }
}
