import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { UserLog, Role } from "../types";
import { formatDirectAmount } from "../utils/currency";

interface UserLogsViewProps {
  onRefresh?: () => void;
}

export default function UserLogsView({ onRefresh }: UserLogsViewProps) {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [transactionFilter, setTransactionFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<UserLog | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to load user logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteLog = async (id: string) => {
    try {
      const res = await fetch(`/api/user-logs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLogs(prev => prev.filter(l => l.id !== id));
        setDeleteConfirmationId(null);
        if (selectedLog?.id === id) setSelectedLog(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "super_user":
        return <span className="bg-black text-white text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider font-bold">Super Admin</span>;
      case "student":
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider font-bold">🎓 Student (20% Off)</span>;
      case "non_student":
      default:
        return <span className="bg-zinc-100 text-zinc-800 border border-zinc-300 text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider font-bold">Patron / Corporate</span>;
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    // Search match
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchSearch =
        log.username.toLowerCase().includes(s) ||
        log.email.toLowerCase().includes(s) ||
        (log.location && log.location.toLowerCase().includes(s)) ||
        (log.device && log.device.toLowerCase().includes(s)) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(s)) ||
        (log.orderNumbers && log.orderNumbers.some(o => o.toLowerCase().includes(s))) ||
        (log.transactionIds && log.transactionIds.some(t => t.toLowerCase().includes(s)));

      if (!matchSearch) return false;
    }

    // Role match
    if (roleFilter !== "all" && log.role !== roleFilter) {
      return false;
    }

    // Transaction match
    if (transactionFilter === "transaction_made" && !log.performedTransaction) {
      return false;
    }
    if (transactionFilter === "browsed_only" && log.performedTransaction) {
      return false;
    }

    return true;
  });

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Log ID", "Username", "Email", "Role", "Login Timestamp", "IP Address", "Location", "Device", "Performed Transaction", "Orders", "Total Spent (NGN)", "Total Spent (USD)"];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.username}"`,
      `"${l.email}"`,
      l.role,
      l.loginAt,
      l.ipAddress || "N/A",
      `"${l.location || "N/A"}"`,
      `"${l.device || "N/A"}"`,
      l.performedTransaction ? "YES" : "NO",
      `"${(l.orderNumbers || []).join(", ")}"`,
      l.totalSpentNgn || 0,
      l.totalSpentUsd || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `buttons_user_logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics for filtered selection
  const totalInFilter = filteredLogs.length;
  const totalTxnInFilter = filteredLogs.filter(l => l.performedTransaction).length;
  const totalRevNgnInFilter = filteredLogs.reduce((acc, l) => acc + (l.totalSpentNgn || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50 border border-black p-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
            Audit Trail &bull; Who Logged In, When, &amp; Transactions Performed
          </div>
          <h3 className="text-base font-serif font-bold text-black mt-0.5 flex items-center gap-2">
            <Icons.History className="h-4 w-4" />
            Live Customer Login &amp; Session Activity Logs
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-100 text-black border border-black text-[9px] font-mono uppercase tracking-widest font-bold cursor-pointer"
          >
            <Icons.Download className="h-3 w-3" />
            Export CSV
          </button>
          <button
            onClick={() => {
              fetchLogs();
              if (onRefresh) onRefresh();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-zinc-800 text-white text-[9px] font-mono uppercase tracking-widest font-bold cursor-pointer"
          >
            <Icons.RefreshCw className="h-3 w-3" />
            Live Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-black p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Icons.Search className="h-3.5 w-3.5 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email, location, device, or order..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-black text-xs font-mono placeholder:text-zinc-400 focus:outline-none focus:bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-black bg-transparent border-none cursor-pointer"
            >
              <Icons.X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold whitespace-nowrap">
            Role:
          </label>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full py-2 px-3 bg-zinc-50 border border-black text-xs font-mono focus:outline-none focus:bg-white cursor-pointer"
          >
            <option value="all">All Roles &amp; Accounts</option>
            <option value="student">🎓 Students (20% Discount)</option>
            <option value="non_student">Patrons &amp; Corporate Clients</option>
            <option value="super_user">⚡ Super Admin</option>
          </select>
        </div>

        {/* Transaction Performed Filter */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold whitespace-nowrap">
            Status:
          </label>
          <select
            value={transactionFilter}
            onChange={e => setTransactionFilter(e.target.value)}
            className="w-full py-2 px-3 bg-zinc-50 border border-black text-xs font-mono focus:outline-none focus:bg-white cursor-pointer"
          >
            <option value="all">All Activity Sessions</option>
            <option value="transaction_made">💰 Performed Transaction / Placed Order</option>
            <option value="browsed_only">👁️ Browsed Catalog Only</option>
          </select>
        </div>
      </div>

      {/* Filter Metric Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-500 px-1">
        <div className="flex items-center gap-3">
          <span>Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> login logs</span>
          <span className="text-zinc-300">|</span>
          <span className="text-emerald-700 font-bold">
            {totalTxnInFilter} purchase session{totalTxnInFilter === 1 ? "" : "s"}
          </span>
          <span className="text-zinc-300">|</span>
          <span className="text-black font-bold">
            Volume: ₦{totalRevNgnInFilter.toLocaleString()}
          </span>
        </div>

        {(searchTerm || roleFilter !== "all" || transactionFilter !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("all");
              setTransactionFilter("all");
            }}
            className="text-indigo-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-black overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-zinc-100 border-b border-black font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              <th className="py-3 px-4">User &amp; Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Login Timestamp</th>
              <th className="py-3 px-4">IP &amp; Location</th>
              <th className="py-3 px-4">Device / Client</th>
              <th className="py-3 px-4">Transaction / Order</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                  <Icons.Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-black" />
                  Loading user activity logs...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                  No login logs match the current search filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                  {/* User */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-black flex items-center gap-1.5">
                      <Icons.User className="h-3 w-3 text-zinc-400 shrink-0" />
                      <span>{log.username}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{log.email}</div>
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4">
                    {getRoleBadge(log.role)}
                  </td>

                  {/* Timestamp */}
                  <td className="py-3 px-4 font-mono text-[11px] text-zinc-600">
                    <div className="font-bold text-black">
                      {new Date(log.loginAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {new Date(log.loginAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>
                  </td>

                  {/* IP & Location */}
                  <td className="py-3 px-4 font-mono text-[11px] text-zinc-600">
                    <div className="flex items-center gap-1 text-black font-bold">
                      <Icons.MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                      <span>{log.location || "Lagos, Nigeria"}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      IP: {log.ipAddress || "102.89.23.41"}
                    </div>
                  </td>

                  {/* Device */}
                  <td className="py-3 px-4 font-mono text-[11px] text-zinc-600">
                    <div className="flex items-center gap-1 text-zinc-700">
                      <Icons.Smartphone className="h-3 w-3 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{log.device || "Web Browser"}</span>
                    </div>
                  </td>

                  {/* Transaction Status */}
                  <td className="py-3 px-4">
                    {log.performedTransaction ? (
                      <div className="bg-emerald-50 border border-emerald-300 p-2 text-[10px] font-mono">
                        <div className="font-bold text-emerald-900 flex items-center gap-1">
                          <Icons.CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Transaction Performed</span>
                        </div>
                        <div className="text-emerald-800 font-black mt-0.5">
                          ₦{(log.totalSpentNgn || 0).toLocaleString()} {log.totalSpentUsd > 0 && `($${log.totalSpentUsd.toFixed(2)})`}
                        </div>
                        {log.orderNumbers && log.orderNumbers.length > 0 && (
                          <div className="text-[9px] text-emerald-700 mt-0.5 truncate">
                            Ref: {log.orderNumbers.join(", ")}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-zinc-50 border border-zinc-200 px-2 py-1.5 text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
                        <Icons.Eye className="h-3 w-3 text-zinc-400" />
                        <span>Browsed Only (0 Txns)</span>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 bg-black hover:bg-zinc-800 text-white font-mono text-[9px] uppercase font-bold cursor-pointer"
                        title="View Detailed Log"
                      >
                        <Icons.Maximize2 className="h-3 w-3" />
                      </button>

                      {deleteConfirmationId === log.id ? (
                        <div className="flex items-center gap-1 bg-red-50 p-1 border border-red-300">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-[9px] font-mono bg-red-600 text-white px-1.5 py-0.5 uppercase font-bold cursor-pointer border-none"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmationId(null)}
                            className="text-[9px] font-mono bg-zinc-200 text-black px-1.5 py-0.5 uppercase cursor-pointer border-none"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmationId(log.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer"
                          title="Delete Log Entry"
                        >
                          <Icons.Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detailed Modal Inspection */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-2 border-black max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-black pb-3">
                <div className="flex items-center gap-2">
                  <Icons.ShieldCheck className="h-5 w-5 text-black" />
                  <h4 className="font-serif font-bold text-base text-black">
                    Audit Log Entry Detail
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 text-zinc-400 hover:text-black bg-transparent border-none cursor-pointer"
                >
                  <Icons.X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="bg-zinc-50 border border-zinc-200 p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 uppercase text-[10px]">Log Record ID:</span>
                    <span className="font-bold text-black">{selectedLog.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 uppercase text-[10px]">Customer Name:</span>
                    <span className="font-bold text-black">{selectedLog.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 uppercase text-[10px]">Email Address:</span>
                    <span className="text-black">{selectedLog.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 uppercase text-[10px]">Account Role:</span>
                    <span>{getRoleBadge(selectedLog.role)}</span>
                  </div>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 uppercase text-[10px]">Login Timestamp:</span>
                    <span className="text-black">{new Date(selectedLog.loginAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 uppercase text-[10px]">IP Address:</span>
                    <span className="text-black">{selectedLog.ipAddress || "102.89.23.41"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 uppercase text-[10px]">Geo Location:</span>
                    <span className="text-black">{selectedLog.location || "Lagos, Nigeria"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 uppercase text-[10px]">Device &amp; Client:</span>
                    <span className="text-black">{selectedLog.device || "Web Browser"}</span>
                  </div>
                </div>

                {/* Transaction section */}
                <div className={`border p-3 space-y-2 ${
                  selectedLog.performedTransaction ? "bg-emerald-50 border-emerald-300" : "bg-zinc-50 border-zinc-200"
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-600 uppercase text-[10px] font-bold">Transaction Status:</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold ${
                      selectedLog.performedTransaction ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-700"
                    }`}>
                      {selectedLog.performedTransaction ? "TRANSACTION PERFORMED" : "BROWSED ONLY"}
                    </span>
                  </div>

                  {selectedLog.performedTransaction && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-zinc-600 text-[10px]">Total Amount Spent:</span>
                        <span className="font-bold text-emerald-950">
                          ₦{(selectedLog.totalSpentNgn || 0).toLocaleString()} (USD ${(selectedLog.totalSpentUsd || 0).toFixed(2)})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600 text-[10px]">Transaction / Order Numbers:</span>
                        <span className="font-bold text-black">
                          {(selectedLog.orderNumbers || []).join(", ") || (selectedLog.transactionIds || []).join(", ") || "BTNS-ORDER"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-black text-white font-mono text-xs uppercase font-bold tracking-wider cursor-pointer"
                >
                  Close Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
