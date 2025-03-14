// Split into admin (server-side) and client parts

// This part is for server-side only (API routes)
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (server-side only)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Export the Firestore instance for server-side use
export const db = getFirestore();

// Export the taxonomy functions (server-side only)
export async function fetchTaxonomyOptions() {
  try {
    const taxonomyDoc = await db.collection('system').doc('taxonomy').get();
    
    if (!taxonomyDoc.exists) {
      // Initialize with default values if document doesn't exist
      const defaultTaxonomy = {
        instruments: [],
        aspects: [],
        genres: []
      };
      
      await db.collection('system').doc('taxonomy').set(defaultTaxonomy);
      return defaultTaxonomy;
    }
    
    return taxonomyDoc.data() as {
      instruments: string[];
      aspects: string[];
      genres: string[];
    };
  } catch (error) {
    console.error("Error fetching taxonomy:", error);
    // Fall back to default values if there's an error
    return {
      instruments: [],
      aspects: [],
      genres: []
    };
  }
}

export async function updateTaxonomyOptions(
  category: 'instruments' | 'aspects' | 'genres',
  newValues: string[]
) {
  try {
    const taxonomyRef = db.collection('system').doc('taxonomy');
    
    // Use a transaction to safely update the array
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(taxonomyRef);
      
      if (!doc.exists) {
        // Create document with initial values if it doesn't exist
        const initialData: Record<string, string[]> = {};
        initialData[category] = newValues;
        transaction.set(taxonomyRef, initialData);
        return;
      }
      
      // Get current values
      const currentValues = doc.data()?.[category] || [];
      
      // Find values that aren't already in the array
      const valuesToAdd = newValues.filter(
        value => !currentValues.includes(value)
      );
      
      if (valuesToAdd.length === 0) return;
      
      // Update with combined array (keeping existing values)
      const updatedValues = [...currentValues, ...valuesToAdd];
      
      // Update just the specific category
      transaction.update(taxonomyRef, {
        [category]: updatedValues
      });
    });
    
    return true;
  } catch (error) {
    console.error(`Error updating ${category} taxonomy:`, error);
    return false;
  }
}
