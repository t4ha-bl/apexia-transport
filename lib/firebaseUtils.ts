import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';

// Live feed of a whole collection: `onData` runs now and again on every change
// made anywhere (e.g. in the admin dashboard).
export const subscribeCollection = (
  collectionName: string,
  onData: (rows: any[]) => void,
  onError?: (err: Error) => void
) =>
  onSnapshot(
    collection(db, collectionName),
    snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => onError?.(err)
  );

// Live feed of a single document (null when it doesn't exist)
export const subscribeDocument = (
  collectionName: string,
  docId: string,
  onData: (row: any | null) => void,
  onError?: (err: Error) => void
) =>
  onSnapshot(
    doc(db, collectionName, docId),
    snap => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    err => onError?.(err)
  );

// Generic fetch all
export const fetchCollection = async (collectionName: string, sortField?: string) => {
  const colRef = collection(db, collectionName);
  const q = sortField ? query(colRef, orderBy(sortField, 'desc')) : colRef;
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Live reservations feed. `id` is always the real Firestore document ID;
// the customer-facing reference (APEX-xxxx) lives in `ref`. Older documents
// stored that reference in an `id` field, which is handled here.
export const subscribeReservations = (
  onData: (rows: any[]) => void,
  onError?: (err: Error) => void
) => {
  const q = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snap => onData(snap.docs.map(d => {
      const data = d.data();
      return { ...data, id: d.id, ref: data.ref || data.id || d.id };
    })),
    err => onError?.(err)
  );
};

export const fetchDocument =async (collectionName: string, docId: string) => {
  const docRef = doc(db, collectionName, docId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }
  return null;
};

// Insert a new document with an auto-generated ID
export const addDocument = async (collectionName: string, data: any) => {
  const colRef = collection(db, collectionName);
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: new Date().toISOString()
  });
  return { id: docRef.id, ...data };
};

// Insert or overwrite a document with a SPECIFIC ID
export const setDocument = async (collectionName: string, docId: string, data: any) => {
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  return { id: docId, ...data };
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
};

export const removeDocument = async (collectionName: string, docId: string) => {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
};
