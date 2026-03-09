export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';
export type TicketPriority = 'Low' | 'Medium' | 'High';
export type TicketCategory = 'Technical Support' | 'Billing Inquiry' | 'Account Management' | 'General Inquiry' | 'Bug Report' | 'Feature Request';

export interface Ticket {
  id: string;
  userName: string;
  userEmail: string;
  issueCategory: TicketCategory;
  description: string;
  summary?: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  message: string;
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'admin';
}