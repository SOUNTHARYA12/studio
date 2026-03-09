
'use server';

import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { Ticket, TicketCategory, TicketPriority, TicketStatus } from '@/lib/types';
import { summarizeTicket } from '@/ai/flows/automated-ticket-summary';
import { aiDrivenCategorySuggestion } from '@/ai/flows/ai-driven-category-suggestion';

export async function createTicketAction(formData: {
  userName: string;
  userEmail: string;
  issueCategory: TicketCategory;
  description: string;
  priority: TicketPriority;
  userId: string;
}) {
  try {
    // GenAI: Suggest Category (optional override) and Summarize
    const summaryResult = await summarizeTicket({ description: formData.description });
    const categoryResult = await aiDrivenCategorySuggestion({ ticketDescription: formData.description });

    const ticketData = {
      ...formData,
      summary: summaryResult.summary,
      // If the user didn't pick a specific category or we want to offer the AI suggestion
      // Here we just store the AI suggestion alongside if we wanted, but let's keep it simple
      status: 'Open' as TicketStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'tickets'), ticketData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating ticket:', error);
    return { success: false, error: 'Failed to create ticket' };
  }
}

export async function getTicketsAction(userId?: string, isAdmin?: boolean) {
  try {
    const ticketsRef = collection(db, 'tickets');
    let q;

    if (isAdmin) {
      q = query(ticketsRef, orderBy('createdAt', 'desc'));
    } else if (userId) {
      q = query(ticketsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    } else {
      return [];
    }

    const querySnapshot = await getDocs(q);
    const tickets = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Ticket[];

    return tickets;
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
}

export async function updateTicketStatusAction(ticketId: string, status: TicketStatus) {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, { 
      status, 
      updatedAt: new Date().toISOString() 
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating ticket:', error);
    return { success: false };
  }
}

export async function deleteTicketAction(ticketId: string) {
  try {
    await deleteDoc(doc(db, 'tickets', ticketId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return { success: false };
  }
}
