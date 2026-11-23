import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { Product, User, Incident, Role, Order, PaymentAccount, PaymentTransaction, AdminNotification, CurrencyCode } from "../types";
import { formatCurrency, formatDirectAmount } from "../utils/currency";
import SuperAdminOverview from "./SuperAdminOverview";
import UserLogsView from "./UserLogsView";

// Dynamic Lucide Icon Helper
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.Smile className={className} />;
  return <IconComponent className={className} />;
};

// Predefined icons options for avant-garde clothing
const ICON_OPTIONS = [
  "Shirt", "Scissors", "Workflow", "Sparkles", "Smile", "Palette", "Gift", "Crown", "Compass", "Flame", "Star"
];

const ACCENT_OPTIONS = [
  { name: "Magenta Theme", value: "magenta", bg: "bg-magenta-light border-magenta/20 text-magenta" },
  { name: "Indigo", value: "indigo", bg: "bg-indigo-50 border-indigo-200 text-indigo-600" },
  { name: "Emerald", value: "emerald", bg: "bg-emerald-50 border-emerald-200 text-emerald-500" },
  { name: "Purple", value: "purple", bg: "bg-purple-50 border-purple-200 text-purple-600" },
  { name: "Amber", value: "amber", bg: "bg-amber-50 border-amber-200 text-amber-500" },
  { name: "Orange", value: "orange", bg: "bg-orange-50 border-orange-200 text-orange-600" },
  { name: "Blue", value: "blue", bg: "bg-blue-50 border-blue-200 text-blue-600" },
  { name: "Rose", value: "rose", bg: "bg-rose-50 border-rose-200 text-rose-600" }
];

interface AdminDashboardProps {
  products: Product[];
  users: User[];
  incidents: Incident[];
  onUpdateProducts: (updated: Product[]) => void;
  onUpdateUsers: (updated: User[]) => void;
  onUpdateIncidents: (updated: Incident[]) => void;
  onRefreshAll: () => void;
}

export default function AdminDashboard({
  products,
  users,
  incidents,
  onUpdateProducts,
  onUpdateUsers,
  onUpdateIncidents,
  onRefreshAll
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "transactions" | "accounts" | "catalog" | "customers" | "incidents" | "orders">("overview");
  
  // Orders & Transactions States
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // --- PAYMENT ACCOUNT FORM STATE ---
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({
    currency: "NGN" as CurrencyCode,
    accountType: "bank_transfer" as "bank_transfer" | "wire_transfer" | "paypal" | "other",
    bankName: "",
    accountNumber: "",
    accountName: "",
    routingOrSwift: "",
    instructions: "",
    isPrimary: false,
    isActive: true
  });

  // --- CATALOG CRUD STATE ---
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Outerwear",
    iconName: "Shirt",
    accentColor: "magenta",
    imageUrl: "",
    sizes: ["S", "M", "L", "XL"] as string[]
  });

  // --- CUSTOMER REGISTER STATE ---
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    username: "",
    email: "",
    role: "non_student" as Role,
    statusCondition: "Good Standing",
    password: "",
    phone: "",
    customSize: ""
  });

  // Fetch all payment accounts
  const fetchAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const res = await fetch("/api/payment-accounts");
      if (res.ok) {
        const data = await res.json();
        setPaymentAccounts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Fetch all transactions
  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Fetch all orders
  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin-notifications");
      if (res.ok) {
        const data = await res.json();
        setAdminNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Initial & Poll Data
  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchOrders();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchTransactions();
      fetchNotifications();
      fetchOrders();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const pendingTransactions = transactions.filter(t => t.status === "pending");

  // Show transient toast
  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // ==========================================
  // TRANSACTION CONFIRMATION ACTIONS
  // ==========================================
  const handleConfirmTransaction = async (txn: PaymentTransaction) => {
    try {
      const res = await fetch("/api/confirm-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: txn.id,
          adminEmail: "sunshinekolawole1@gmail.com"
        })
      });
      if (res.ok) {
        showToast(`✅ Transaction Ref ${txn.reference} for ${txn.userName} CONFIRMED! Customer can now proceed to delivery.`);
        fetchTransactions();
        fetchOrders();
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to confirm transaction:", err);
    }
  };

  const handleRejectTransaction = async (txn: PaymentTransaction) => {
    const reason = prompt("Enter rejection reason (e.g. 'Credit not received in bank ledger'):", "Payment alert could not be matched with bank statements.");
    if (reason === null) return;

    try {
      const res = await fetch("/api/reject-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: txn.id,
          reason,
          adminEmail: "sunshinekolawole1@gmail.com"
        })
      });
      if (res.ok) {
        showToast(`Transaction Ref ${txn.reference} rejected.`);
        fetchTransactions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // PAYMENT ACCOUNTS CRUD
  // ==========================================
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.bankName || !accountForm.accountNumber || !accountForm.accountName) {
      alert("Please fill in Bank Name, Account Number, and Account Name.");
      return;
    }

    try {
      if (editingAccountId) {
        const res = await fetch(`/api/payment-accounts/${editingAccountId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accountForm)
        });
        if (res.ok) {
          showToast("Payment account updated successfully.");
        }
      } else {
        const res = await fetch("/api/payment-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accountForm)
        });
        if (res.ok) {
          showToast("New payment account added successfully.");
        }
      }

      fetchAccounts();
      setShowAddAccount(false);
      setEditingAccountId(null);
      setAccountForm({
        currency: "NGN",
        accountType: "bank_transfer",
        bankName: "",
        accountNumber: "",
        accountName: "",
        routingOrSwift: "",
        instructions: "",
        isPrimary: false,
        isActive: true
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditAccount = (acc: PaymentAccount) => {
    setEditingAccountId(acc.id);
    setAccountForm({
      currency: acc.currency,
      accountType: acc.accountType,
      bankName: acc.bankName,
      accountNumber: acc.accountNumber,
      accountName: acc.accountName,
      routingOrSwift: acc.routingOrSwift || "",
      instructions: acc.instructions || "",
      isPrimary: !!acc.isPrimary,
      isActive: acc.isActive
    });
    setShowAddAccount(true);
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this payment account?")) return;
    try {
      const res = await fetch(`/api/payment-accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Payment account removed.");
        fetchAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAccountActive = async (acc: PaymentAccount) => {
    try {
      const res = await fetch(`/api/payment-accounts/${acc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !acc.isActive })
      });
      if (res.ok) {
        fetchAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // CATALOG OPERATIONS
  // ==========================================
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price)
        })
      });
      if (response.ok) {
        onRefreshAll();
        setShowAddProduct(false);
        setProductForm({
          name: "",
          description: "",
          price: "",
          category: "Outerwear",
          iconName: "Shirt",
          accentColor: "magenta",
          imageUrl: "",
          sizes: ["S", "M", "L", "XL"]
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !product.isVisible })
      });
      if (response.ok) {
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePrice = async (id: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice <= 0) return;
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: newPrice })
      });
      if (response.ok) {
        onRefreshAll();
        setEditingProductId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // CUSTOMER OPERATIONS
  // ==========================================
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.username || !customerForm.email) return;

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm)
      });
      if (response.ok) {
        onRefreshAll();
        setShowAddCustomer(false);
        setCustomerForm({
          username: "",
          email: "",
          role: "non_student",
          statusCondition: "Good Standing",
          password: "",
          phone: "",
          customSize: ""
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveCustomer = async (id: string) => {
    if (!window.confirm("Are you absolutely sure you want to remove this user from the system registry?")) return;
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserCondition = async (id: string, current: string) => {
    const nextVal = prompt("Enter new account condition / standing message:", current);
    if (nextVal === null) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusCondition: nextVal || "Good Standing" })
      });
      if (response.ok) {
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserActive = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (response.ok) {
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // INCIDENTS OPERATIONS
  // ==========================================
  const handleUpdateIncidentStatus = async (id: string, nextStatus: "pending" | "reviewed" | "resolved") => {
    try {
      const response = await fetch(`/api/incidents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-none border-2 border-black p-6 md:p-8 font-sans">
      
      {/* Toast alert message */}
      <AnimatePresence>
        {actionSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-emerald-600 text-white font-mono text-xs flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Icons.CheckCircle2 className="h-5 w-5 text-emerald-200 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button
              onClick={() => setActionSuccessMsg(null)}
              className="text-white hover:text-emerald-200 bg-transparent border-none cursor-pointer"
            >
              <Icons.X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Transactions Alert Banner */}
      {pendingTransactions.length > 0 && (
        <div className="mb-6 p-4 bg-amber-500 text-black border-2 border-black shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black text-amber-400 flex items-center justify-center font-bold">
              <Icons.BellRing className="h-4 w-4 animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider">
                {pendingTransactions.length} PENDING TRANSACTION{pendingTransactions.length > 1 ? "S" : ""} REQUIRING CONFIRMATION!
              </div>
              <div className="text-[10px] text-zinc-900 font-sans mt-0.5">
                Customers have reported payment. Notifications dispatched to <strong>sunshinekolawole1@gmail.com</strong>.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("transactions")}
            className="bg-black hover:bg-zinc-800 text-white px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider border-none cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Icons.CheckSquare className="h-3.5 w-3.5" />
            Review &amp; Confirm Now
          </button>
        </div>
      )}

      {/* Admin Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#EFEFEF] pb-6 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-bold italic text-black flex items-center gap-2.5">
            <Icons.ShieldCheck className="h-5 w-5 text-black" />
            Super Admin Control Center
          </h2>
          <p className="text-gray-400 text-[10px] mt-1.5 uppercase tracking-widest font-mono">
            Direct Account Management, Live Payment Approvals, and Dispatched Orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onRefreshAll();
              fetchAccounts();
              fetchTransactions();
              fetchOrders();
              showToast("All databases synchronized with server!");
            }}
            className="flex items-center gap-2 bg-black hover:bg-[#000000]/90 text-white px-4 py-2.5 rounded-none border border-black text-[9px] font-mono tracking-widest uppercase font-bold cursor-pointer transition-colors"
          >
            <Icons.RefreshCw className="h-3 w-3" />
            Synchronize Store Data
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-[#F5F5F5] border border-black rounded-none mb-8">
        
        {/* Executive Dashboard Tab */}
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-none text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer ${
            activeTab === "overview"
              ? "bg-black text-white"
              : "text-gray-500 hover:text-black hover:bg-white/10"
          }`}
        >
          <Icons.BarChart3 className="h-3.5 w-3.5 text-amber-400" />
          <span>Dashboard</span>
        </button>

        {/* User Activity Logs Tab */}
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-none text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer ${
            activeTab === "logs"
              ? "bg-black text-white"
              : "text-gray-500 hover:text-black hover:bg-white/10"
          }`}
        >
          <Icons.History className="h-3.5 w-3.5 text-indigo-400" />
          <span>User Logs</span>
        </button>

        {/* Approvals & Transactions Tab */}
        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-none text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer relative ${
            activeTab === "transactions"
              ? "bg-black text-white"
              : "text-gray-500 hover:text-black hover:bg-white/10"
          }`}
        >
          <Icons.CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Approvals &amp; Txns</span>
          {pendingTransactions.length > 0 && (
            <span className="bg-amber-400 text-black px-1.5 py-0.2 text-[8px] font-mono font-black animate-pulse">
              {pendingTransactions.length}
            </span>
          )}
        </button>

        {/* Payment Accounts Tab */}
        <button
          onClick={() => setActiveTab("accounts")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-none text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer ${
            activeTab === "accounts"
              ? "bg-black text-white"
              : "text-gray-500 hover:text-black hover:bg-white/10"
          }`}
        >
          <Icons.Landmark className="h-3.5 w-3.5" />
          <span>Accounts ({paymentAccounts.length})</span>
        </button>

        {/* Catalog Registry Tab */}
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-none text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer ${
            activeTab === "catalog"
              ? "bg-black text-white"
              : "text-gray-500 hover:text-black hover:bg-white/10"
          }`}
        >
          <Icons.LayoutGrid className="h-3.5 w-3.5" />
          <span>Catalog ({products.length})</span>
        </button>

        {/* Customers Tab */}
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-none text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer ${
            activeTab === "customers"
              ? "bg-black text-white"
              : "text-gray-500 hover:text-black hover:bg-white/10"
          }`}
        >
          <Icons.Users className="h-3.5 w-3.5" />
          <span>Customers ({users.length})</span>
        </button>

        {/* Complaints Tab */}
        <button
          onClick={() => setActiveTab("incidents")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-none text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer relative ${
            activeTab === "incidents"
              ? "bg-black text-white"
              : "text-gray-500 hover:text-black hover:bg-white/10"
          }`}
        >
          <Icons.HeartPulse className="h-3.5 w-3.5" />
          <span>Complaints</span>
          {incidents.filter(i => i.status === 'pending').length > 0 && (
            <span className="bg-black text-white border border-white text-[8px] px-1 font-bold font-mono">
              {incidents.filter(i => i.status === 'pending').length}
            </span>
          )}
        </button>

        {/* Orders Tab */}
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-none text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer relative ${
            activeTab === "orders"
              ? "bg-black text-white"
              : "text-gray-500 hover:text-black hover:bg-white/10"
          }`}
        >
          <Icons.PackageCheck className="h-3.5 w-3.5" />
          <span>Dispatches ({orders.length})</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* ======================================================== */}
        {/* TAB 0: EXECUTIVE DASHBOARD INTELLIGENCE */}
        {/* ======================================================== */}
        {activeTab === "overview" && (
          <motion.div
            key="overview-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SuperAdminOverview
              onNavigateTab={(tab) => setActiveTab(tab)}
              onRefresh={onRefreshAll}
            />
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* TAB 0.5: USER LOGIN & ACTIVITY AUDIT LOGS */}
        {/* ======================================================== */}
        {activeTab === "logs" && (
          <motion.div
            key="logs-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <UserLogsView onRefresh={onRefreshAll} />
          </motion.div>
        )}

        
        {/* ======================================================== */}
        {/* TAB 1: APPROVALS & TRANSACTIONS (PENDING CONFIRMATIONS) */}
        {/* ======================================================== */}
        {activeTab === "transactions" && (
          <motion.div
            key="transactions-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-black uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>Payment Ledger &amp; Live Approvals</span>
                  {pendingTransactions.length > 0 && (
                    <span className="bg-amber-400 text-black px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-widest">
                      {pendingTransactions.length} Pending Approval
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 font-sans">
                  Review customer &quot;I have made payment&quot; submissions and click <strong>Confirm Transaction</strong> to release deliveries.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchTransactions}
                  className="bg-black hover:bg-zinc-800 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-3 py-2 border-none cursor-pointer flex items-center gap-1"
                >
                  <Icons.RefreshCw className="h-3 w-3" /> Refresh Ledger
                </button>
              </div>
            </div>

            {/* Pending Approvals Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-black font-mono flex items-center gap-2 border-b border-black pb-2">
                <span className="w-2.5 h-2.5 bg-amber-500 inline-block" />
                <span>Pending Super Admin Action ({pendingTransactions.length})</span>
              </h4>

              {pendingTransactions.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-gray-300 bg-[#FAF9FA] font-mono text-xs text-gray-500">
                  <Icons.CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                  <p className="font-bold text-black uppercase">All Customer Payments Are Fully Cleared</p>
                  <p className="text-[11px] font-sans text-gray-500 mt-1">
                    When a client clicks &quot;I have made payment&quot; on checkout, it will trigger an instant alert here and dispatch an email notification to sunshinekolawole1@gmail.com.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTransactions.map(txn => (
                    <div
                      key={txn.id}
                      className="border-2 border-amber-500 bg-white p-5 space-y-4 font-mono text-xs shadow-md"
                    >
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200">
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-500 text-black font-black px-2 py-0.5 text-[9px] uppercase tracking-widest">
                            PENDING CONFIRMATION
                          </span>
                          <span className="bg-black text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                            Ref: {txn.reference}
                          </span>
                          <span className="text-gray-500 text-[10px]">
                            Order #{txn.orderNumber}
                          </span>
                        </div>
                        <span className="text-gray-500 text-[10px]">
                          Reported: {new Date(txn.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>

                      {/* Transaction Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest block">Customer Details</span>
                          <div className="font-bold text-black text-xs">{txn.userName}</div>
                          <div className="text-gray-600 text-[11px] font-sans">{txn.userEmail}</div>
                          {txn.userPhone && <div className="text-gray-500 text-[10px]">{txn.userPhone}</div>}
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest block">Transferred Amount</span>
                          <div className="text-base font-black text-emerald-700">
                            {formatDirectAmount(txn.amount, txn.currency)}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {txn.itemsCount} piece(s) ({txn.itemsSummary})
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest block">Beneficiary Account Credited</span>
                          <div className="font-bold text-black text-xs">{txn.paymentAccountDetails.bankName}</div>
                          <div className="text-black font-mono text-[11px]">Acc: <strong>{txn.paymentAccountDetails.accountNumber}</strong></div>
                          <div className="text-[10px] text-gray-500">{txn.paymentAccountDetails.accountName}</div>
                        </div>
                      </div>

                      {/* Customer proof memo if any */}
                      {txn.proofNote && (
                        <div className="p-2.5 bg-zinc-50 border border-gray-200 text-[11px] text-zinc-800">
                          <span className="font-bold text-black uppercase text-[9px] block">Customer Transfer Note / Reference:</span>
                          <span className="font-sans italic">&quot;{txn.proofNote}&quot;</span>
                        </div>
                      )}

                      {/* Email Alert Log */}
                      <div className="p-2 bg-amber-50/70 border border-amber-200 text-[10px] text-amber-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Icons.Mail className="h-3.5 w-3.5 text-amber-700" />
                          <span>Notification Email dispatched to: <strong>sunshinekolawole1@gmail.com</strong> &amp; Super Admins</span>
                        </span>
                        <span className="text-[8px] bg-amber-200 px-1.5 py-0.5 font-bold uppercase">Status: Dispatched</span>
                      </div>

                      {/* Super Admin Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => handleRejectTransaction(txn)}
                          className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-mono font-bold text-[10px] px-4 py-2.5 uppercase tracking-wider cursor-pointer"
                        >
                          Reject / Not Found
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmTransaction(txn)}
                          className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs px-6 py-3 uppercase tracking-widest border-none cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          <Icons.CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          <span>Confirm Transaction</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historic Cleared Transactions */}
            <div className="space-y-4 pt-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-black font-mono flex items-center gap-2 border-b border-black pb-2">
                <span className="w-2.5 h-2.5 bg-black inline-block" />
                <span>Confirmed &amp; Processed Ledger ({transactions.filter(t => t.status !== "pending").length})</span>
              </h4>

              {transactions.filter(t => t.status !== "pending").length === 0 ? (
                <p className="text-xs text-gray-400 font-mono">No historical transactions logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.filter(t => t.status !== "pending").map(txn => (
                    <div
                      key={txn.id}
                      className="p-3.5 border border-gray-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                            txn.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {txn.status}
                          </span>
                          <span className="font-bold text-black">{txn.reference}</span>
                          <span className="text-gray-400">({txn.userName})</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          {formatDirectAmount(txn.amount, txn.currency)} • Paid into: {txn.paymentAccountDetails.bankName} ({txn.paymentAccountDetails.accountNumber})
                        </div>
                      </div>

                      <div className="text-right text-[10px] text-gray-400">
                        <div>Confirmed by: {txn.confirmedBy || "Super Admin"}</div>
                        <div>{txn.confirmedAt ? new Date(txn.confirmedAt).toLocaleDateString() : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PAYMENT ACCOUNTS CONFIGURATION (SUPER ADMIN CRUD) */}
        {/* ======================================================== */}
        {activeTab === "accounts" && (
          <motion.div
            key="accounts-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F9F9F9] p-5 border border-[#EFEFEF] rounded-none gap-4">
              <div>
                <h4 className="font-serif italic font-bold text-sm text-black">
                  Official Atelier Payment Accounts
                </h4>
                <p className="text-gray-450 text-[10px] uppercase font-mono tracking-wider mt-1">
                  Manage bank details and payout accounts presented to patrons during checkout (Naira &amp; Global).
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddAccount(!showAddAccount);
                  setEditingAccountId(null);
                  setAccountForm({
                    currency: "NGN",
                    accountType: "bank_transfer",
                    bankName: "",
                    accountNumber: "",
                    accountName: "",
                    routingOrSwift: "",
                    instructions: "",
                    isPrimary: false,
                    isActive: true
                  });
                }}
                className="bg-black hover:bg-[#000000]/90 text-white font-bold text-[9px] tracking-widest font-mono uppercase px-4 py-3 rounded-none transition-colors cursor-pointer flex items-center gap-2 border-none"
              >
                {showAddAccount ? <Icons.X className="h-3 w-3" /> : <Icons.Plus className="h-3 w-3" />}
                {showAddAccount ? "CLOSE FORM" : "ADD PAYMENT ACCOUNT"}
              </button>
            </div>

            {/* Account Creation / Edit Form Modal */}
            <AnimatePresence>
              {showAddAccount && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSaveAccount}
                  className="bg-white border-2 border-black p-6 space-y-4 font-mono text-xs overflow-hidden"
                >
                  <div className="flex justify-between items-center border-b border-black pb-2">
                    <h5 className="font-black uppercase text-black">
                      {editingAccountId ? "Edit Payment Account" : "Register New Payment Account"}
                    </h5>
                    <span className="text-[10px] text-gray-500 font-sans">Visible in checkout dropdown</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-700 block mb-1">Currency *</label>
                      <select
                        value={accountForm.currency}
                        onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value as CurrencyCode })}
                        className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs text-black"
                      >
                        <option value="NGN">NGN (₦) - Nigerian Naira</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                        <option value="CAD">CAD ($) - Canadian Dollar</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-700 block mb-1">Account Category</label>
                      <select
                        value={accountForm.accountType}
                        onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value as any })}
                        className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs text-black"
                      >
                        <option value="bank_transfer">Direct Bank Transfer</option>
                        <option value="wire_transfer">Wire Transfer / ACH</option>
                        <option value="paypal">PayPal Merchant Account</option>
                        <option value="other">Other Settlement Channel</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-700 block mb-1">Bank / Platform Name *</label>
                      <input
                        type="text"
                        value={accountForm.bankName}
                        onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                        placeholder="e.g. Providus Bank / JPMorgan Chase"
                        className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs text-black"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-700 block mb-1">Account Number / IBAN / PayPal Email *</label>
                      <input
                        type="text"
                        value={accountForm.accountNumber}
                        onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                        placeholder="e.g. 8034567891 or payments@buttons-atelier.com"
                        className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs text-black"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-700 block mb-1">Account Name / Beneficiary *</label>
                      <input
                        type="text"
                        value={accountForm.accountName}
                        onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                        placeholder="BUTTONS FASHION ATELIER ENTERPRISES"
                        className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs text-black"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-700 block mb-1">Routing / Sort Code / SWIFT (Optional)</label>
                      <input
                        type="text"
                        value={accountForm.routingOrSwift}
                        onChange={(e) => setAccountForm({ ...accountForm, routingOrSwift: e.target.value })}
                        placeholder="Routing: 021000021 | SWIFT: CHASUS33"
                        className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs text-black"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-700 block mb-1">Customer Instructions (Optional)</label>
                      <input
                        type="text"
                        value={accountForm.instructions}
                        onChange={(e) => setAccountForm({ ...accountForm, instructions: e.target.value })}
                        placeholder="e.g. Include your Reference Code in transfer description"
                        className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs text-black"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={accountForm.isPrimary}
                        onChange={(e) => setAccountForm({ ...accountForm, isPrimary: e.target.checked })}
                      />
                      <span>Set as Primary Account for {accountForm.currency}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={accountForm.isActive}
                        onChange={(e) => setAccountForm({ ...accountForm, isActive: e.target.checked })}
                      />
                      <span>Active &amp; Display in Checkout</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAddAccount(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-600 font-mono text-[10px] uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-black hover:bg-zinc-800 text-white px-6 py-2.5 font-mono text-[10px] font-bold uppercase tracking-wider border-none cursor-pointer"
                    >
                      {editingAccountId ? "Save Changes" : "Create Account"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List of Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentAccounts.map(acc => (
                <div
                  key={acc.id}
                  className={`p-5 border bg-white space-y-3 font-mono text-xs transition-all ${
                    acc.isActive ? "border-black shadow-xs" : "border-gray-200 opacity-60 bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-black text-white px-2 py-0.5 text-[9px] font-bold uppercase">
                          {acc.currency}
                        </span>
                        <span className="text-xs font-bold text-black uppercase">{acc.bankName}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase block mt-1">
                        Type: {acc.accountType.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {acc.isPrimary && (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[8px] font-bold uppercase">
                          Primary
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[8px] font-bold uppercase ${
                        acc.isActive ? "bg-black text-white" : "bg-gray-200 text-gray-600"
                      }`}>
                        {acc.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  {/* Account Details Box */}
                  <div className="bg-[#FAF9FA] p-3 border border-gray-200 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-gray-400 uppercase">Account Number:</span>
                      <span className="font-black text-black tracking-wider">{acc.accountNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-gray-400 uppercase">Beneficiary:</span>
                      <span className="text-black text-[11px] font-bold">{acc.accountName}</span>
                    </div>
                    {acc.routingOrSwift && (
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-400 uppercase">Routing / SWIFT:</span>
                        <span className="text-gray-700 text-[10px]">{acc.routingOrSwift}</span>
                      </div>
                    )}
                  </div>

                  {acc.instructions && (
                    <div className="text-[10px] text-gray-500 font-sans italic">
                      &quot;{acc.instructions}&quot;
                    </div>
                  )}

                  {/* Action footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleToggleAccountActive(acc)}
                      className="text-[10px] font-mono text-gray-600 hover:text-black uppercase bg-transparent border-none cursor-pointer"
                    >
                      {acc.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditAccount(acc)}
                        className="text-[10px] font-mono font-bold text-black hover:text-magenta uppercase bg-transparent border-none cursor-pointer flex items-center gap-1"
                      >
                        <Icons.Edit2 className="h-3 w-3" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(acc.id)}
                        className="text-[10px] font-mono font-bold text-rose-600 hover:text-rose-800 uppercase bg-transparent border-none cursor-pointer flex items-center gap-1"
                      >
                        <Icons.Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CATALOG REGISTRY */}
        {/* ======================================================== */}
        {activeTab === "catalog" && (
          <motion.div
            key="catalog-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F9F9F9] p-5 border border-[#EFEFEF] rounded-none gap-4">
              <div>
                <h4 className="font-serif italic font-bold text-sm text-black">Add a New Piece to Atelier Catalog</h4>
                <p className="text-gray-450 text-[10px] uppercase font-mono tracking-wider mt-1">Define standards, retail pricing, and customized iconography.</p>
              </div>
              <button
                onClick={() => setShowAddProduct(!showAddProduct)}
                className="bg-black hover:bg-[#000000]/90 text-white font-bold text-[9px] tracking-widest font-mono uppercase px-4 py-3 rounded-none transition-colors cursor-pointer flex items-center gap-2 border-none"
              >
                {showAddProduct ? <Icons.X className="h-3 w-3" /> : <Icons.Plus className="h-3 w-3" />}
                {showAddProduct ? "CLOSE FORM" : "ADD PRODUCT"}
              </button>
            </div>

            {/* Add Product Form */}
            <AnimatePresence>
              {showAddProduct && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateProduct}
                  className="bg-white border-2 border-black p-6 space-y-4 overflow-hidden rounded-none"
                >
                  <h4 className="font-serif italic font-bold text-base text-black">New Atelier Garment Definition</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono uppercase tracking-widest text-black mb-1">Product Title *</label>
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="e.g. Buttons Couture Obsidian Corset"
                        className="w-full bg-[#FAFAFA] border border-black p-3 text-xs text-black placeholder:text-gray-400 focus:outline-hidden rounded-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono uppercase tracking-widest text-black mb-1">Retail Price ($ USD) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="145.00"
                        className="w-full bg-[#FAFAFA] border border-black p-3 text-xs text-black placeholder:text-gray-400 focus:outline-hidden rounded-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-widest text-black mb-1">Description & Material Composition</label>
                    <textarea
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Hand-woven tailoring, sustainable silk & organic linen blend..."
                      className="w-full bg-[#FAFAFA] border border-black p-3 text-xs text-black placeholder:text-gray-400 focus:outline-hidden rounded-none font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#EFEFEF]">
                    <button
                      type="button"
                      onClick={() => setShowAddProduct(false)}
                      className="px-4 py-2.5 border border-black text-black font-mono text-[9px] uppercase tracking-widest font-bold bg-transparent cursor-pointer rounded-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-black hover:bg-[#000000]/90 text-white font-mono text-[9px] uppercase tracking-widest font-bold border-none cursor-pointer rounded-none"
                    >
                      Publish to Registry
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <div
                  key={product.id}
                  className={`border border-black p-4 flex flex-col justify-between transition-all rounded-none bg-white ${
                    !product.isVisible ? "opacity-50 border-dashed" : ""
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 border border-black bg-[#F5F5F5] text-black">
                        {product.category}
                      </span>
                      <span className="font-mono font-bold text-xs text-black">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>

                    <h5 className="font-serif italic font-bold text-sm text-black line-clamp-1">{product.name}</h5>
                    <p className="text-gray-400 text-[10px] font-mono line-clamp-2">{product.description}</p>
                  </div>

                  <div className="pt-4 border-t border-[#EFEFEF] mt-4 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleVisibility(product)}
                      className={`text-[8px] font-mono uppercase tracking-widest px-2.5 py-1 font-bold border cursor-pointer ${
                        product.isVisible
                          ? "border-black bg-black text-white"
                          : "border-gray-400 text-gray-400 bg-transparent"
                      }`}
                    >
                      {product.isVisible ? "Visible in Store" : "Hidden"}
                    </button>

                    <button
                      onClick={() => {
                        const newP = prompt("Enter new USD price:", product.price.toString());
                        if (newP) handleUpdatePrice(product.id, parseFloat(newP));
                      }}
                      className="text-[9px] font-mono uppercase underline text-black hover:text-magenta bg-transparent border-none cursor-pointer"
                    >
                      Edit Price
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: CUSTOMERS */}
        {/* ======================================================== */}
        {activeTab === "customers" && (
          <motion.div
            key="customers-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#F9F9F9] p-5 border border-[#EFEFEF] rounded-none gap-4">
              <div>
                <h4 className="font-serif italic font-bold text-sm text-black">Customer Standing &amp; Accounts</h4>
                <p className="text-gray-450 text-[10px] uppercase font-mono tracking-wider mt-1">Manage verified patrons, student privilege discounts, and conditions.</p>
              </div>
              <button
                onClick={() => setShowAddCustomer(!showAddCustomer)}
                className="bg-black hover:bg-[#000000]/90 text-white font-bold text-[9px] tracking-widest font-mono uppercase px-4 py-3 rounded-none transition-colors cursor-pointer flex items-center gap-2 border-none"
              >
                {showAddCustomer ? <Icons.X className="h-3 w-3" /> : <Icons.Plus className="h-3 w-3" />}
                {showAddCustomer ? "CLOSE FORM" : "ADD CLIENT ACCOUNT"}
              </button>
            </div>

            {/* Customer List */}
            <div className="space-y-3">
              {users.map(u => (
                <div
                  key={u.id}
                  className="p-4 border border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black text-xs font-mono">{u.username}</span>
                      <span className={`px-2 py-0.5 text-[8px] font-mono uppercase font-bold ${
                        u.role === "super_user"
                          ? "bg-black text-white"
                          : u.role === "student"
                          ? "bg-magenta text-white"
                          : "bg-gray-200 text-black"
                      }`}>
                        {u.role.replace("_", " ")}
                      </span>
                      <span className="text-emerald-700 text-[9px] font-mono">
                        [{u.statusCondition || "Good Standing"}]
                      </span>
                    </div>
                    <div className="text-gray-500 text-[10px] font-mono mt-1">{u.email} {u.phone ? `• ${u.phone}` : ""}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateUserCondition(u.id, u.statusCondition || "Good Standing")}
                      className="text-[9px] font-mono uppercase text-black hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Update Standing
                    </button>
                    <button
                      onClick={() => handleToggleUserActive(u)}
                      className={`px-2 py-1 text-[8px] font-mono uppercase font-bold border cursor-pointer ${
                        u.isActive ? "border-black text-black" : "border-rose-500 text-rose-500"
                      }`}
                    >
                      {u.isActive ? "Active" : "Suspended"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: COMPLAINTS */}
        {/* ======================================================== */}
        {activeTab === "incidents" && (
          <motion.div
            key="incidents-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {incidents.length === 0 ? (
              <p className="text-xs text-gray-500 font-mono">No customer complaints filed.</p>
            ) : (
              incidents.map(inc => (
                <div key={inc.id} className="p-4 border border-black bg-white space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-black uppercase">{inc.subject}</span>
                    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase ${
                      inc.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                  <p className="text-gray-600 font-sans text-xs">{inc.description}</p>
                  <div className="flex justify-between items-center pt-2 text-[10px] text-gray-400">
                    <span>Filed by: {inc.username}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateIncidentStatus(inc.id, "reviewed")}
                        className="text-black hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Mark Reviewed
                      </button>
                      <button
                        onClick={() => handleUpdateIncidentStatus(inc.id, "resolved")}
                        className="text-emerald-700 font-bold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: DISPATCHES & ORDERS */}
        {/* ======================================================== */}
        {activeTab === "orders" && (
          <motion.div
            key="orders-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-black uppercase tracking-wider font-mono">
                  Atelier Dispatched Orders &amp; Waybills
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 font-sans">
                  Real-time customer transactions, payment authentication logs, and delivery routing.
                </p>
              </div>
            </div>

            {isLoadingOrders ? (
              <div className="p-12 text-center text-xs font-mono text-gray-400">
                <Icons.Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-black" />
                <span>Loading latest orders registry...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-gray-300 space-y-2 bg-[#FAF9FA]">
                <Icons.PackageCheck className="h-8 w-8 mx-auto text-gray-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-black font-mono">No Orders Placed Yet</h4>
                <p className="text-xs text-gray-500 font-sans">Customer orders authenticated through Naira Bank Transfer or Global Wire will appear here with live waybill tracking details.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(ord => (
                  <div key={ord.id} className="border border-black p-5 bg-white space-y-4 font-mono text-xs shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="bg-black text-white px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase">
                          {ord.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-emerald-50 text-emerald-800 border border-emerald-300">
                          {ord.paymentMethod === "naira_bank_transfer" ? "🇳🇬 Direct Naira Transfer" : "🌐 Global Transfer"}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {ord.paymentStatus}
                        </span>
                      </div>
                      <span className="text-gray-400 text-[10px]">
                        {new Date(ord.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>

                    {/* Customer & Destination */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest block">Recipient &amp; Contact</span>
                        <div className="text-black font-bold">{ord.deliveryDetails.fullName} ({ord.deliveryDetails.phone})</div>
                        <div className="text-gray-500 text-[11px] font-sans">{ord.userEmail}</div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest block">Delivery Destination</span>
                        <div className="text-black font-sans text-xs">
                          {ord.deliveryDetails.address}{ord.deliveryDetails.apartment ? `, ${ord.deliveryDetails.apartment}` : ""}, {ord.deliveryDetails.city}, {ord.deliveryDetails.state}, {ord.deliveryDetails.country}
                        </div>
                        <div className="text-gray-500 text-[10px] uppercase font-mono">Courier: {ord.deliveryDetails.deliveryOption} • Tracking: <span className="text-black font-bold">{ord.trackingNumber}</span></div>
                      </div>
                    </div>

                    {/* Items Purchased */}
                    <div className="bg-[#FAF9FA] p-3 border border-gray-200 space-y-1.5">
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest block font-bold">Ordered Pieces</span>
                      {ord.items.map(item => (
                        <div key={item.product.id} className="flex justify-between text-gray-700 text-xs">
                          <span>{item.quantity}x {item.product.name}</span>
                          <span className="font-bold text-black font-mono">{formatCurrency(item.product.price * item.quantity, ord.currency)}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-300 pt-2 flex justify-between font-black text-black text-xs">
                        <span>Total Settled ({ord.currency}):</span>
                        <span>{formatCurrency(ord.total, ord.currency)}</span>
                      </div>
                    </div>

                    {/* Transaction Reference Footer */}
                    <div className="text-[10px] text-gray-500 flex flex-wrap items-center gap-3 pt-1">
                      <span>Txn ID: <strong className="text-black">{ord.paymentDetails?.transactionId || "N/A"}</strong></span>
                      <span>•</span>
                      <span>Ref: <strong className="text-black">{ord.paymentDetails?.reference || "N/A"}</strong></span>
                      {ord.paymentDetails?.confirmedBy && (
                        <>
                          <span>•</span>
                          <span>Confirmed by: <strong className="text-black">{ord.paymentDetails.confirmedBy}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
