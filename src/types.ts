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
  selectedSize?: string;
  selectedColor?: string;
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

export type CurrencyCode = 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToUsd: number;
  paymentMethod: 'naira_transfer' | 'paypal';
}

export interface DeliveryDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state?: string;
  stateOrProvince?: string;
  country: string;
  postalCode: string;
  deliveryOption?: 'standard' | 'express' | 'same_day' | string;
  deliveryMethod?: string;
  deliveryFee?: number;
  currency?: CurrencyCode;
  notes?: string;
}

export interface PaymentAccount {
  id: string;
  currency: CurrencyCode; // 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD'
  accountType: 'bank_transfer' | 'wire_transfer' | 'paypal' | 'other';
  bankName: string; // e.g. "Providus Bank", "Chase Bank", "Barclays Bank", "PayPal"
  accountNumber: string; // e.g. "8034567891" or "payments@buttons-atelier.com" / IBAN
  accountName: string; // e.g. "BUTTONS FASHION ATELIER ENTERPRISES"
  routingOrSwift?: string;
  instructions?: string;
  isPrimary?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentTransaction {
  id: string;
  orderNumber: string;
  reference: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  currency: CurrencyCode;
  amount: number;
  amountInUsd: number;
  paymentAccountId?: string;
  paymentAccountDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    currency: CurrencyCode;
    routingOrSwift?: string;
  };
  paymentMethod: 'naira_bank_transfer' | 'dollar_bank_transfer' | 'paypal';
  status: 'pending' | 'confirmed' | 'rejected';
  proofNote?: string;
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
  rejectionReason?: string;
  itemsCount: number;
  itemsSummary: string;
  orderId?: string;
}

export interface AdminNotification {
  id: string;
  type: 'payment_pending' | 'payment_confirmed' | 'payment_rejected' | 'complaint' | 'order';
  title: string;
  message: string;
  transactionId?: string;
  reference?: string;
  amount?: number;
  currency?: CurrencyCode;
  userEmail?: string;
  userName?: string;
  recipientEmails?: string[];
  emailSubject?: string;
  emailDispatched?: boolean;
  createdAt: string;
  isRead: boolean;
  transactionData?: Partial<PaymentTransaction>;
}

export interface Order {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  userEmail: string;
  userName: string;
  items: CartItem[];
  currency: CurrencyCode;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  paymentMethod: 'naira_bank_transfer' | 'dollar_bank_transfer' | 'paypal';
  paymentStatus: 'paid' | 'pending';
  paymentDetails: {
    reference: string;
    transactionId: string;
    paidAt: string;
    bankName?: string;
    accountNumber?: string;
    paypalEmail?: string;
    confirmedBy?: string;
  };
  deliveryDetails: DeliveryDetails;
  status: 'processing' | 'tailoring' | 'dispatched' | 'delivered';
  createdAt: string;
}

export interface UserLog {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: Role;
  loginAt: string;
  ipAddress?: string;
  location?: string;
  device?: string;
  performedTransaction: boolean;
  transactionCount: number;
  totalSpentNgn: number;
  totalSpentUsd: number;
  transactionIds: string[];
  orderNumbers: string[];
  lastActivityAt: string;
}

export interface CustomerIntelligence {
  userId: string;
  username: string;
  email: string;
  role: Role;
  phone?: string;
  customSize?: string;
  joinedAt: string;
  lastLoginAt: string;
  loginCount: number; // for "Most Active Customers"
  totalTransactions: number;
  totalSpentNgn: number; // for "Most Paying Customers"
  totalSpentUsd: number;
  averageOrderValueNgn: number;
  averageOrderValueUsd: number;
  conversionRate: number; // % of logins that turned into transactions
  statusCondition: string;
}

export interface SuperAdminDashboardStats {
  totalLogins: number;
  uniqueActiveUsers: number;
  totalRevenueNgn: number;
  totalRevenueUsd: number;
  totalTransactions: number;
  pendingTransactionsCount: number;
  loginToPurchaseRate: number;
  mostActiveCustomers: CustomerIntelligence[];
  topPayingCustomers: CustomerIntelligence[];
  recentUserLogs: UserLog[];
  activityTimeline: {
    date: string;
    logins: number;
    transactions: number;
    revenueNgn: number;
  }[];
}
