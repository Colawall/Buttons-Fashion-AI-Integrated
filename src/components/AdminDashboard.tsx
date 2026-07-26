import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { Product, User, Incident, Role } from "../types";

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
  const [activeTab, setActiveTab] = useState<"catalog" | "customers" | "incidents">("catalog");

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
      
      {/* Admin Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#EFEFEF] pb-6 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-bold italic text-black flex items-center gap-2.5">
            <Icons.ShieldAlert className="h-5 w-5 text-black" />
            Registry & Catalog Desk
          </h2>
          <p className="text-gray-400 text-[10px] mt-1.5 uppercase tracking-widest font-mono">
            Catalog visibility, Customer Standing, and active incident response
          </p>
        </div>

        <button
          onClick={onRefreshAll}
          className="flex items-center gap-2 bg-black hover:bg-[#000000]/90 text-white px-4 py-2.5 rounded-none border border-black text-[9px] font-mono tracking-widest uppercase font-bold cursor-pointer transition-colors"
        >
          <Icons.RefreshCw className="h-3 w-3" />
          Synchronize Store Data
        </button>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-[#F5F5F5] border border-black rounded-none mb-8 max-w-lg">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-none text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer ${
            activeTab === "catalog"
              ? "bg-black text-white"
              : "text-gray-400 hover:text-black hover:bg-white/10"
          }`}
        >
          <Icons.LayoutGrid className="h-3.5 w-3.5" />
          Catalog Registry ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-none text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer ${
            activeTab === "customers"
              ? "bg-black text-white"
              : "text-gray-400 hover:text-black hover:bg-white/10"
          }`}
        >
          <Icons.Users className="h-3.5 w-3.5" />
          Customers ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("incidents")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-none text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer relative ${
            activeTab === "incidents"
              ? "bg-black text-white"
              : "text-gray-400 hover:text-black hover:bg-white/10"
          }`}
        >
          <Icons.HeartPulse className="h-3.5 w-3.5" />
          Complaints
          {incidents.filter(i => i.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white border border-white text-[8px] w-4.5 h-4.5 flex items-center justify-center font-bold font-mono">
              {incidents.filter(i => i.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ======================================================== */}
        {/* CATALOG PANEL */}
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
                <h4 className="font-serif italic font-bold text-sm text-black">Add a New Button to Catalog</h4>
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

            {/* Create form slide */}
            {showAddProduct && (
              <form onSubmit={handleCreateProduct} className="bg-white p-6 rounded-none border-2 border-black grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Garment Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eco-Sprout Linen Trench Coat"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-white border border-black rounded-none px-3.5 py-2.5 text-xs focus:outline-none placeholder-gray-400 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Standard Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 120.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-white border border-black rounded-none px-3.5 py-2.5 text-xs focus:outline-none placeholder-gray-400 font-mono"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Garment Description / Sustainability Specs</label>
                  <textarea
                    rows={2}
                    placeholder="Describe the fabric specs, drape weights, fit details, or tailored composition of this item..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full bg-white border border-black rounded-none px-3.5 py-2.5 text-xs focus:outline-none placeholder-gray-400 resize-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-white border border-black rounded-none h-[42px] px-3.5 py-2 text-xs focus:outline-none font-sans cursor-pointer"
                  >
                    <option>Outerwear</option>
                    <option>Basics</option>
                    <option>Knitwear</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Choose Fallback Theme Icon</label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-[#F9F9F9] rounded-none border border-gray-250 max-h-[100px] overflow-y-auto">
                    {ICON_OPTIONS.map(ico => (
                      <button
                        key={ico}
                        type="button"
                        onClick={() => setProductForm({ ...productForm, iconName: ico })}
                        className={`p-2 rounded-none border transition-all text-xs shrink-0 flex items-center justify-center ${
                          productForm.iconName === ico 
                            ? "bg-black text-white border-black" 
                            : "bg-white text-black border-gray-200 hover:bg-[#F5F5F5]"
                        }`}
                        title={ico}
                      >
                        <DynamicIcon name={ico} className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Garment Image URL (Preferred)</label>
                  <input
                    type="url"
                    placeholder="e.g. https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    className="w-full bg-white border border-black rounded-none px-3.5 py-2.5 text-xs focus:outline-none placeholder-gray-400 font-sans"
                  />
                  <p className="text-[9px] text-gray-400 leading-none pl-0.5">Input an Unsplash/web image hotlink to render instead of fallback vector icons.</p>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Garment Sizes to Stock *</label>
                  <div className="flex flex-wrap gap-2">
                    {["XS", "S", "M", "L", "XL", "XXL"].map((sz) => {
                      const active = productForm.sizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            const updated = active
                              ? productForm.sizes.filter(x => x !== sz)
                              : [...productForm.sizes, sz];
                            setProductForm({ ...productForm, sizes: updated });
                          }}
                          className={`w-10 h-10 border text-xs font-mono font-bold flex items-center justify-center transition-all ${
                            active
                              ? "bg-magenta border-magenta text-white shadow-sm"
                              : "border-black/25 text-black bg-white hover:border-black"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Color Association Code</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    {ACCENT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setProductForm({ ...productForm, accentColor: opt.value })}
                        className={`p-3 rounded-none border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                          productForm.accentColor === opt.value
                            ? "ring-2 ring-black ring-offset-1 scale-[1.01] bg-black text-white border-black"
                            : "bg-white text-black border-gray-200 hover:bg-[#F5F5F5]"
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-current" />
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 pt-3 flex justify-end">
                  <button
                    type="submit"
                    className="bg-magenta hover:bg-magenta-hover text-white font-mono font-bold text-[10px] tracking-widest uppercase py-3.5 px-6 rounded-none transition-all cursor-pointer border-none shadow-none"
                  >
                    Add Couture piece To inventory
                  </button>
                </div>
              </form>
            )}

             {/* Products Inventory list */}
            <div className="bg-white border-2 border-black rounded-none overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-black text-white font-mono font-bold text-[9px] tracking-widest uppercase border-b border-black">
                    <th className="p-4">Visual Art / Image</th>
                    <th className="p-4">Name & Category</th>
                    <th className="p-4">Standard Price</th>
                    <th className="p-4">Student Price (20% off)</th>
                    <th className="p-4">Status State</th>
                    <th className="p-4 text-right">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEFEF]">
                  {products.map((prod) => {
                    const themedStyle = ACCENT_OPTIONS.find(a => a.value === prod.accentColor)?.bg || "bg-magenta-light text-magenta border-magenta/20";
                    return (
                      <tr key={prod.id} className="hover:bg-[#F9F9F9] transition-colors">
                        <td className="p-4">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-12 h-12 object-cover border border-black/10 shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-full border flex items-center justify-center p-2.5 shadow-sm shrink-0 ${themedStyle}`}>
                              <DynamicIcon name={prod.iconName} className="h-6 w-6" />
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-black">{prod.name}</div>
                          <div className="text-[9px] text-gray-400 font-bold font-mono tracking-widest uppercase mt-0.5">{prod.category}</div>
                          {prod.sizes && prod.sizes.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {prod.sizes.map(sz => (
                                <span key={sz} className="text-[8px] font-mono bg-gray-100 text-gray-600 px-1 py-0.2">{sz}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-mono">
                          {editingProductId === prod.id ? (
                            <input
                              type="number"
                              step="0.01"
                              className="w-20 bg-white border-2 border-black rounded-none p-1.5 text-xs font-bold focus:outline-none"
                              defaultValue={prod.price}
                              onBlur={(e) => handleUpdatePrice(prod.id, Number(e.target.value))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleUpdatePrice(prod.id, Number((e.target as HTMLInputElement).value));
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span className="font-bold text-black">${prod.price.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="p-4 font-mono">
                          <span className="font-bold text-magenta">${(prod.price * 0.8).toFixed(2)}</span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleVisibility(prod)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-[9px] font-mono tracking-widest uppercase font-bold border cursor-pointer transition-all ${
                              prod.isVisible
                                ? "bg-black text-white border-black"
                                : "bg-white text-gray-400 border-gray-250 hover:border-black hover:text-black"
                            }`}
                          >
                            {prod.isVisible ? (
                              <>
                                <Icons.Eye className="h-3.5 w-3.5" />
                                Live Registry
                              </>
                            ) : (
                              <>
                                <Icons.EyeOff className="h-3.5 w-3.5 text-gray-400" />
                                Shelved
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setEditingProductId(editingProductId === prod.id ? null : prod.id)}
                            className="bg-white hover:bg-black hover:text-white text-black p-2.5 rounded-none border border-black text-xs font-semibold cursor-pointer transition-colors"
                            title="Edit Price"
                          >
                            <Icons.Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* CUSTOMERS PANEL */}
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
                <h4 className="font-serif italic font-bold text-sm text-black">Add a New Customer to Store</h4>
                <p className="text-gray-450 text-[10px] uppercase font-mono tracking-wider mt-1">Define permissions, default role types, and system credentials.</p>
              </div>
              <button
                onClick={() => setShowAddCustomer(!showAddCustomer)}
                className="bg-black hover:bg-[#000000]/90 text-white font-bold text-[9px] tracking-widest font-mono uppercase px-4 py-3 rounded-none transition-colors cursor-pointer flex items-center gap-2 border-none"
              >
                {showAddCustomer ? <Icons.X className="h-3 w-3" /> : <Icons.Plus className="h-3 w-3" />}
                {showAddCustomer ? "CLOSE FORM" : "ADD PROFILE"}
              </button>
            </div>

            {/* Create form customer slide */}
            {showAddCustomer && (
              <form onSubmit={handleCreateCustomer} className="bg-white p-6 rounded-none border-2 border-black grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Client Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Foster"
                    value={customerForm.username}
                    onChange={(e) => setCustomerForm({ ...customerForm, username: e.target.value })}
                    className="w-full bg-white border border-black rounded-none px-3.5 py-2.5 text-xs focus:outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Client Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rachel@university.edu"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full bg-white border border-black rounded-none px-3.5 py-2.5 text-xs focus:outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Select User Role</label>
                  <select
                    value={customerForm.role}
                    onChange={(e) => setCustomerForm({ ...customerForm, role: e.target.value as Role })}
                    className="w-full bg-white border border-black rounded-none h-[42px] px-3.5 py-2 text-xs focus:outline-none font-sans cursor-pointer"
                  >
                    <option value="student">Student Class (-20% discount applied)</option>
                    <option value="non_student">Standard Class (Standard pricing)</option>
                    <option value="super_user">Super User Authority</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Access Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Default user password"
                    value={customerForm.password}
                    onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })}
                    className="w-full bg-white border border-black rounded-none px-3.5 py-2.5 text-xs focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 555-0199"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full bg-white border border-black rounded-none px-3.5 py-2.5 text-xs focus:outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Default Fitted Size</label>
                  <select
                    value={customerForm.customSize}
                    onChange={(e) => setCustomerForm({ ...customerForm, customSize: e.target.value })}
                    className="w-full bg-white border border-black rounded-none h-[42px] px-3.5 py-2 text-xs focus:outline-none font-sans cursor-pointer"
                  >
                    <option value="">-- No Calibration --</option>
                    <option value="6">Size 6</option>
                    <option value="8">Size 8</option>
                    <option value="10">Size 10</option>
                    <option value="12">Size 12</option>
                    <option value="14">Size 14</option>
                    <option value="16">Size 16</option>
                    <option value="18">Size 18</option>
                    <option value="20">Size 20</option>
                    <option value="22">Size 22</option>
                    <option value="24">Size 24</option>
                  </select>
                </div>

                <div className="md:col-span-3 pt-3 flex justify-end">
                  <button
                    type="submit"
                    className="bg-black hover:bg-[#000000]/90 text-white font-mono font-bold text-[10px] tracking-widest uppercase py-3.5 px-6 rounded-none transition-all cursor-pointer border-none shadow-none"
                  >
                    Register Customer Profile
                  </button>
                </div>
              </form>
            )}

            {/* Customers Registry list */}
            <div className="bg-white border-2 border-black rounded-none overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-black text-white font-mono font-bold text-[9px] tracking-widest uppercase border-b border-black">
                    <th className="p-4">Customer identity</th>
                    <th className="p-4">Secure Email</th>
                    <th className="p-4">Registered Class</th>
                    <th className="p-4">Standing Condition</th>
                    <th className="p-4">System State</th>
                    <th className="p-4 text-right">Direct Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEFEF]">
                  {users.map((item) => {
                    const isRoleSuper = item.role === 'super_user';
                    const isRoleStudent = item.role === 'student';
                    return (
                      <tr key={item.id} className="hover:bg-[#F9F9F9] transition-colors">
                        <td className="p-4 font-bold text-black">
                          <div className="flex items-center gap-2.5">
                            {item.picture ? (
                              <img
                                src={item.picture}
                                alt={item.username}
                                className="w-8 h-8 rounded-full object-cover border border-black shadow-inner"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-[#000000] text-white font-mono font-bold flex items-center justify-center text-xs uppercase shadow-inner">
                                {item.username.charAt(0)}
                              </span>
                            )}
                            <div className="flex flex-col">
                              <span>{item.username}</span>
                              {item.phone && (
                                <span className="text-[10px] text-gray-400 font-mono font-normal">
                                  📞 {item.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 font-mono">{item.email}</td>
                        <td className="p-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`px-2 py-0.5 rounded-none text-[8px] font-mono font-bold uppercase tracking-widest border leading-none ${
                              isRoleSuper 
                                ? "bg-black text-white border-black" 
                                : isRoleStudent 
                                  ? "bg-white text-black border-black" 
                                  : "bg-white text-gray-500 border-gray-200"
                            }`}>
                              {item.role.replace('_', ' ')}
                            </span>
                            {item.customSize && (
                              <span className="text-[9px] font-mono bg-[#FAF0FF] text-[#9C00BF] border border-[#9C00BF]/20 px-1.5 py-0.5 leading-none">
                                Size: {item.customSize}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-[10px] uppercase">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${item.statusCondition?.includes('Good') ? 'bg-black' : 'bg-red-500'}`} />
                            <span className="text-black font-bold">{item.statusCondition || "Good Standing"}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleUserActive(item)}
                            className={`px-3 py-1 rounded-none text-[9px] font-mono tracking-widest uppercase font-bold border transition-colors cursor-pointer ${
                              item.isActive 
                                ? "bg-black text-white border-black" 
                                : "bg-white text-red-655 border-red-500 font-bold hover:bg-red-50"
                            }`}
                          >
                            {item.isActive ? "Authorized" : "Suspended"}
                          </button>
                        </td>
                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleUpdateUserCondition(item.id, item.statusCondition || "")}
                            className="bg-white hover:bg-black hover:text-white text-black p-2 rounded-none border border-black text-xs font-semibold cursor-pointer transition-colors"
                            title="Set Condition Message"
                          >
                            <Icons.AlertCircle className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveCustomer(item.id)}
                            disabled={isRoleSuper}
                            className={`p-2 rounded-none border text-xs font-semibold transition-colors ${
                              isRoleSuper 
                                ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed" 
                                : "bg-white hover:bg-red-500 hover:text-white text-red-600 border-red-500 cursor-pointer"
                            }`}
                            title="Remove Customer Account Directly"
                          >
                            <Icons.UserMinus className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* INCIDENTS PANEL */}
        {/* ======================================================== */}
        {activeTab === "incidents" && (
          <motion.div
            key="incidents-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#F5F5F5] p-5 border border-black rounded-none">
              <h4 className="font-serif italic font-bold text-sm text-black flex items-center gap-2">
                <Icons.Sparkles className="h-4 w-4 text-black" />
                Live Customer Complaints Register
              </h4>
              <p className="text-gray-550 text-[10px] uppercase font-mono tracking-wider mt-1.5">
                Incidents published by accounts through our interactive Button Buddy Assistant dashboard dynamically.
              </p>
            </div>

            {incidents.length === 0 ? (
              <div className="p-12 text-center bg-[#F9F9F9] border border-dashed border-black rounded-none space-y-3">
                <Icons.CheckCircle2 className="h-8 w-8 text-black mx-auto" />
                <h4 className="font-serif italic font-bold text-base text-black">Perfect Integrity</h4>
                <p className="text-gray-400 text-xs leading-relaxed max-w-sm mx-auto">No client complaints currently reported inside database logs. Live assistance is fully clear.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {incidents.map((inc) => {
                  const isPending = inc.status === 'pending';
                  const isReviewed = inc.status === 'reviewed';
                  const isResolved = inc.status === 'resolved';

                  return (
                    <div key={inc.id} className={`p-5 rounded-none border-2 transition-all ${
                      isPending 
                        ? "bg-white border-black"
                        : isReviewed 
                          ? "bg-[#F9F9F9] border-gray-400"
                          : "bg-gray-50 border-gray-200"
                    }`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-black text-white text-[8px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-none">
                              {inc.id.toUpperCase()}
                            </span>
                            <span className="text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-none border border-black bg-white text-black">
                              {inc.category} Category
                            </span>
                            <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-none border ${
                              isPending 
                                ? "bg-red-50 text-red-750 border-red-500 animate-pulse" 
                                : isReviewed 
                                  ? "bg-yellow-50 text-yellow-800 border-yellow-500" 
                                  : "bg-black text-white border-black"
                            }`}>
                              {inc.status}
                            </span>
                          </div>

                          <h3 className="text-base font-serif italic font-bold text-black pt-1">{inc.subject}</h3>
                          
                          <p className="text-black text-xs whitespace-pre-line bg-[#F9F9F9] p-4 rounded-none border border-gray-200 font-mono leading-relaxed">
                            {inc.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[9px] font-mono tracking-widest uppercase text-gray-450 font-bold">
                            <Icons.User className="h-3.5 w-3.5 text-black shrink-0" />
                            <span>Sender: <strong className="text-black font-black">{inc.username}</strong></span>
                            <span>•</span>
                            <span className="text-black">{inc.userRole.replace('_', ' ')} status</span>
                            <span>•</span>
                            <span>{new Date(inc.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </div>

                        {/* Status Change controls */}
                        <div className="shrink-0 flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <button
                            onClick={() => handleUpdateIncidentStatus(inc.id, "pending")}
                            className={`flex-1 sm:flex-none text-[9px] font-mono tracking-widest uppercase font-bold py-2 px-3.5 rounded-none border transition-colors cursor-pointer text-center ${
                              isPending ? "bg-black text-white border-black" : "bg-white text-black hover:bg-[#F5F5F5] border-gray-300"
                            }`}
                          >
                            Set Pending
                          </button>
                          <button
                            onClick={() => handleUpdateIncidentStatus(inc.id, "reviewed")}
                            className={`flex-1 sm:flex-none text-[9px] font-mono tracking-widest uppercase font-bold py-2 px-3.5 rounded-none border transition-colors cursor-pointer text-center ${
                              isReviewed ? "bg-black text-white border-black" : "bg-white text-black hover:bg-[#F5F5F5] border-gray-300"
                            }`}
                          >
                            Set Reviewed
                          </button>
                          <button
                            onClick={() => handleUpdateIncidentStatus(inc.id, "resolved")}
                            className={`flex-1 sm:flex-none text-[9px] font-mono tracking-widest uppercase font-bold py-2 px-3.5 rounded-none border transition-colors cursor-pointer text-center ${
                              isResolved ? "bg-black text-white border-black" : "bg-white text-black hover:bg-[#F5F5F5] border-gray-300"
                            }`}
                          >
                            Set Resolved
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
