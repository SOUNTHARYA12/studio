'use server';

// This file is deprecated. All Firestore operations are now performed client-side 
// per project guidelines. GenAI flows should still be called as server actions.

export async function deprecatedAction() {
  return { error: 'Moved to client-side' };
}
