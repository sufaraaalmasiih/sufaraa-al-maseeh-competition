import {
  onSnapshot,
  type DocumentReference,
  type DocumentSnapshot,
  type FirestoreError,
  type Query,
  type QuerySnapshot,
} from "firebase/firestore";

function logFirestoreListenerError(path: string, error: FirestoreError): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.warn(`[Firestore listener] ${path}: ${error.code} — ${error.message}`);
}

export function subscribeFirestoreDoc<T extends DocumentReference>(
  ref: T,
  onNext: (snapshot: DocumentSnapshot) => void,
  onError?: (error: FirestoreError) => void,
): () => void {
  return onSnapshot(
    ref,
    onNext,
    (error) => {
      logFirestoreListenerError(ref.path, error);
      onError?.(error);
    },
  );
}

export function subscribeFirestoreQuery<T extends Query>(
  queryRef: T,
  onNext: (snapshot: QuerySnapshot) => void,
  onError?: (error: FirestoreError) => void,
): () => void {
  return onSnapshot(
    queryRef,
    onNext,
    (error) => {
      logFirestoreListenerError("(query)", error);
      onError?.(error);
    },
  );
}
