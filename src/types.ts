export type Role = 'super_user' | 'non_student' | 'student';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  joinedAt: string;
  isActive: boolean;
  statusCondition?: string; // e.g. "Good Standing", "Flagged", "Under review"
  password?: string;
  phone?: string;
  picture?: string; // photo data-URL or URL
  customSize?: string; // e.g. "M", "L", etc. Remembers calibrated size
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string; // Styling class
  category: string;
  isVisible: boolean;
  iconName: string; // Style icon representative fallback
  accentColor: string; // Accent color name, can include 'magenta'
  sizes?: string[]; // clothing sizes (e.g. S, M, L, XL)
  imageUrl?: string; // actual garment picture url (or visual representation)
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Incident {
  id: string;
  username: string;
  userRole: Role;
  subject: string;
  description: string;
  category: string; // "shipping", "quality", "service", "other"
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  isComplaintTriggered?: boolean;
}
