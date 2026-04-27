import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppRole, UserProfile } from '@/lib/firebaseAuth';
import type { User } from 'firebase/auth';

export type LiveProjectPostInput = {
  title: string;
  description: string;
  fullDetails: string;
  category: string;
  budget: string;
  timeline: string;
  whoNeeded: string;
  skills: string[];
  requireNda: boolean;
  files: string[];
  aiAnalysis?: {
    risk?: unknown;
    progress?: unknown;
    nda?: unknown;
  };
};

export type LiveProjectPost = LiveProjectPostInput & {
  id: string;
  type: 'Look-In';
  status: 'Open' | 'Active' | 'Completed';
  progress: number;
  createdBy: string;
  authorName: string;
  authorEmail: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type LiveOfferInput = {
  mode: 'actor' | 'supplier';
  contextId?: string;
  contextTitle: string;
  contextOwnerId?: string;
  title: string;
  amount: string;
  timeline: string;
  quantity?: string;
  deliveryMode?: string;
  message: string;
  workPlan?: string;
  notes?: string;
};

export type LiveOffer = LiveOfferInput & {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  senderId: string;
  senderName: string;
  senderEmail: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type LiveProductInput = {
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
};

export type LiveProduct = LiveProductInput & {
  id: string;
  supplierId: string;
  supplierName: string;
  image: string;
  rating: number;
  location: string;
  badge: string;
  specs: string[];
  reviews: Array<{ user: string; text: string; rating: number }>;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function actorName(user: User, profile: UserProfile | null) {
  return profile?.displayName || user.displayName || user.email || 'TechLance User';
}

function sortNewest<T extends { createdAt?: unknown; id: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = Number((a.createdAt as { seconds?: number } | undefined)?.seconds ?? 0);
    const bTime = Number((b.createdAt as { seconds?: number } | undefined)?.seconds ?? 0);
    return bTime - aTime || b.id.localeCompare(a.id);
  });
}

export async function createProjectPost(
  input: LiveProjectPostInput,
  user: User,
  profile: UserProfile | null,
) {
  try {
    const ref = await addDoc(collection(db, 'projectPosts'), {
      ...input,
      type: 'Look-In',
      status: 'Open',
      progress: 0,
      createdBy: user.uid,
      authorName: actorName(user, profile),
      authorEmail: user.email ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const budgetValue = Number(String(input.budget).replace(/[^\d.]/g, '')) || 0;
    const timelineValue = Number(input.timeline) || 0;
    const requiredSkills = input.skills.map((skill) => skill.trim().toLowerCase()).filter(Boolean);

    await setDoc(
      doc(db, 'projects', ref.id),
      {
        ownerId: user.uid,
        ownerRole: profile?.role || 'user',
        title: input.title,
        problemStatement: input.description,
        description: input.description,
        fullDetails: input.fullDetails,
        category: input.category || 'General',
        budget: {
          min: budgetValue,
          max: budgetValue,
          currency: 'USD',
        },
        timelineDays: timelineValue,
        teamSize: input.whoNeeded === 'Team' ? 4 : 2,
        status: 'open',
        requiredSkills,
        actorNeeded: input.whoNeeded === 'Engineer' || input.whoNeeded === 'Team',
        supplierNeeded: input.whoNeeded === 'Supplier',
        innovationScore: 0,
        noveltyScore: 0,
        successProbability: 0,
        fraudRisk: 0,
        scopeRisk: 0,
        trustScore: 0,
        pricingEstimate: null,
        applicationCount: 0,
        milestoneCount: 0,
        ndaRequired: input.requireNda,
        createdBy: user.uid,
        authorName: actorName(user, profile),
        authorEmail: user.email ?? '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return ref.id;
  } catch (error) {
    console.error("Firestore write failed:", error);
    return "fallback_" + Date.now();
  }
}

export async function getProjectPost(id: string) {
  const snapshot = await getDoc(doc(db, 'projectPosts', id));

  if (!snapshot.exists()) {
    return null;
  }

  return { id: snapshot.id, ...snapshot.data() } as LiveProjectPost;
}

export function subscribeProjectPosts(
  onChange: (posts: LiveProjectPost[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'projectPosts'),
    (snapshot) => {
      const posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as LiveProjectPost);
      onChange(sortNewest(posts));
    },
    (error) => onError?.(error),
  );
}

export function subscribeMyProjects(
  uid: string,
  onChange: (posts: LiveProjectPost[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'projectPosts'), where('createdBy', '==', uid)),
    (snapshot) => {
      const posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as LiveProjectPost);
      onChange(sortNewest(posts));
    },
    (error) => onError?.(error),
  );
}

export async function updateProjectProgress(projectId: string, progress: number) {
  await updateDoc(doc(db, 'projectPosts', projectId), {
    progress,
    status: progress >= 100 ? 'Completed' : 'Active',
    updatedAt: serverTimestamp(),
  });
}

export async function createOffer(input: LiveOfferInput, user: User, profile: UserProfile | null) {
  await addDoc(collection(db, 'offers'), {
    ...input,
    status: 'pending',
    senderId: user.uid,
    senderName: actorName(user, profile),
    senderEmail: user.email ?? '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeOffers(
  user: User,
  role: AppRole,
  onChange: (offers: LiveOffer[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const offersQuery =
    role === 'actor' || role === 'supplier'
      ? query(collection(db, 'offers'), where('senderId', '==', user.uid))
      : collection(db, 'offers');

  return onSnapshot(
    offersQuery,
    (snapshot) => {
      const offers = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as LiveOffer);
      onChange(sortNewest(offers));
    },
    (error) => onError?.(error),
  );
}

export async function setOfferStatus(offerId: string, status: 'accepted' | 'rejected') {
  await updateDoc(doc(db, 'offers', offerId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function createProduct(input: LiveProductInput, user: User, profile: UserProfile | null) {
  await addDoc(collection(db, 'products'), {
    ...input,
    supplierId: user.uid,
    supplierName: actorName(user, profile),
    image: `https://picsum.photos/seed/${encodeURIComponent(input.name)}/400/300`,
    rating: 0,
    location: profile?.location || 'Global',
    badge: '',
    specs: [],
    reviews: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeProducts(
  onChange: (products: LiveProduct[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'products'),
    (snapshot) => {
      const products = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as LiveProduct);
      onChange(sortNewest(products));
    },
    (error) => onError?.(error),
  );
}

export async function deleteProduct(productId: string) {
  await deleteDoc(doc(db, 'products', productId));
}

export async function upsertLiveReaction(
  collectionName: 'savedPosts',
  id: string,
  data: Record<string, unknown>,
) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    return;
  }

  await setDoc(doc(db, collectionName, `${uid}_${id}`), {
    ...data,
    uid,
    updatedAt: serverTimestamp(),
  });
}
