"use client"

import { create } from 'zustand';
import { Ticket, UserProfile } from './types';

interface AppState {
  user: UserProfile | null;
  tickets: Ticket[];
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setTickets: (tickets: Ticket[]) => void;
  setLoading: (loading: boolean) => void;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => void;
  deleteTicket: (ticketId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  tickets: [],
  isLoading: false,
  setUser: (user) => set({ user }),
  setTickets: (tickets) => set({ tickets }),
  setLoading: (loading) => set({ isLoading: loading }),
  updateTicketStatus: (ticketId, status) => 
    set((state) => ({
      tickets: state.tickets.map((t) => 
        t.id === ticketId ? { ...t, status } : t
      )
    })),
  deleteTicket: (ticketId) => 
    set((state) => ({
      tickets: state.tickets.filter((t) => t.id !== ticketId)
    })),
}));