export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';
export type TicketPriority = 'Low' | 'Medium' | 'High';
export type TicketCategory = 'Technical Support' | 'Billing Inquiry' | 'Account Management' | 'General Inquiry' | 'Bug Report' | 'Feature Request';

export type UserRole = 
  | 'user' 
  | 'Billing Agent' 
  | 'Technical Support Agent' 
  | 'Customer Support Agent' 
  | 'Account Management Agent' 
  | 'Developer Agent' 
  | 'Product Team Agent' 
  | 'admin';

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
  assignedAgentId?: string;
  assignedAgentName?: string;
  department?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'agent' | 'admin';
  message: string;
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt?: string;
  status?: 'active' | 'disabled';
}
