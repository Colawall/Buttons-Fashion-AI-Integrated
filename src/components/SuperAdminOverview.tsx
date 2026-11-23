import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import * as Icons from "lucide-react";
import { SuperAdminDashboardStats, CustomerIntelligence, Role } from "../types";
import { formatDirectAmount } from "../utils/currency";

interface SuperAdminOverviewProps {
  onNavigateTab: (tab: "transactions" | "accounts" | "customers" | "catalog" | "incidents" | "logs") => void;
  onRefresh: () => void;
}

export default function SuperAdminOverview({ onNavigateTab, onRefresh }: SuperAdminOverviewProps) {
  const [stats, setStats] = useState<SuperAdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currencyMode, setCurrencyMode] = useState<"NGN" | "USD">("NGN");
  const [rankingTab, setRankingTab] = useState<"active" | "paying">("paying");

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to load dashboard intelligence:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

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

  if (loading && !stats) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-black" />
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
          Aggregating Real-Time Customer &amp; Transaction Intelligence...
        </p>
      </div>
    );
  }

  const topActive = stats?.mostActiveCustomers || [];
  const topPaying = stats?.topPayingCustomers || [];

  return (
    <div className="space-y-8">
      {/* Top Controls & Currency Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50 border border-black p-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
            Executive Summary &bull; In-Memory Real-Time Metrics
          </div>
          <h3 className="text-base font-serif font-bold text-black mt-0.5">
            Customer Behavior &amp; Financial Operations Intelligence
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Currency Toggle */}
          <div className="inline-flex border border-black bg-white p-0.5 font-mono text-[9px]">
            <button
              onClick={() => setCurrencyMode("NGN")}
              className={`px-2.5 py-1 uppercase font-bold cursor-pointer transition-colors ${
                currencyMode === "NGN" ? "bg-black text-white" : "text-zinc-600 hover:text-black"
              }`}
            >
              🇳🇬 NGN (₦)
            </button>
            <button
              onClick={() => setCurrencyMode("USD")}
              className={`px-2.5 py-1 uppercase font-bold cursor-pointer transition-colors ${
                currencyMode === "USD" ? "bg-black text-white" : "text-zinc-600 hover:text-black"
              }`}
            >
              🇺🇸 USD ($)
            </button>
          </div>

          <button
            onClick={() => {
              fetchStats();
              onRefresh();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-zinc-800 text-[9px] font-mono uppercase tracking-widest font-bold cursor-pointer"
            title="Refresh Intelligence Data"
          >
            <Icons.RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-black p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] font-mono uppercase tracking-widest font-bold">
            <span>Gross Revenue</span>
            <Icons.DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-black mt-2">
            {currencyMode === "NGN"
              ? formatDirectAmount(stats?.totalRevenueNgn || 0, "NGN")
              : formatDirectAmount(stats?.totalRevenueUsd || 0, "USD")}
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1 flex items-center justify-between">
            <span>
              {currencyMode === "NGN"
                ? `Equiv. $${(stats?.totalRevenueUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                : `Equiv. ₦${(stats?.totalRevenueNgn || 0).toLocaleString()}`}
            </span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
              {stats?.totalTransactions || 0} Orders
            </span>
          </div>
        </div>

        {/* User Logins & Active Clients */}
        <div className="bg-white border border-black p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] font-mono uppercase tracking-widest font-bold">
            <span>Total Login Events</span>
            <Icons.Activity className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-black mt-2">
            {stats?.totalLogins || 0}
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1 flex items-center justify-between">
            <span>{stats?.uniqueActiveUsers || 0} Unique Customer Accounts</span>
            <button
              onClick={() => onNavigateTab("logs")}
              className="text-indigo-600 hover:underline font-bold bg-transparent border-none p-0 cursor-pointer"
            >
              View Logs &rarr;
            </button>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white border border-black p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 text-[10px] font-mono uppercase tracking-widest font-bold">
            <span>Login-to-Buy Rate</span>
            <Icons.TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-black mt-2">
            {stats?.loginToPurchaseRate || 0}%
          </div>
          <div className="text-[10px] font-mono text-zinc-500 mt-1 flex items-center justify-between">
            <span>Conversion efficiency</span>
            <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 border border-blue-200">
              High Intent
            </span>
          </div>
        </div>

        {/* Pending Action Alerts */}
        <div className={`border p-5 relative overflow-hidden ${
          (stats?.pendingTransactionsCount || 0) > 0 
            ? "bg-amber-50 border-amber-500 text-amber-950" 
            : "bg-white border-black"
        }`}>
          <div className="flex items-center justify-between text-zinc-500 text-[10px] font-mono uppercase tracking-widest font-bold">
            <span>Pending Approvals</span>
            <Icons.Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-black mt-2 flex items-center gap-2">
            <span>{stats?.pendingTransactionsCount || 0}</span>
            {(stats?.pendingTransactionsCount || 0) > 0 && (
              <span className="text-[9px] font-mono font-bold bg-amber-500 text-black px-2 py-0.5 uppercase tracking-wider animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono mt-1 flex items-center justify-between">
            <span>Pending Super Admin Review</span>
            <button
              onClick={() => onNavigateTab("transactions")}
              className="text-black hover:underline font-bold bg-transparent border-none p-0 cursor-pointer"
            >
              Review Now &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Activity & Revenue Timeline */}
      {stats?.activityTimeline && stats.activityTimeline.length > 0 && (
        <div className="bg-white border border-black p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-zinc-200 pb-3">
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-black flex items-center gap-2">
                <Icons.BarChart2 className="h-4 w-4" />
                7-Day Activity &amp; Revenue Cadence
              </h4>
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                Daily logins, transaction counts, and generated volume across the Atelier
              </p>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-black inline-block"></span>
                Login Sessions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 inline-block"></span>
                Transactions
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-2">
            {stats.activityTimeline.map((item, idx) => {
              const maxLogins = Math.max(...stats.activityTimeline.map(t => t.logins), 1);
              const loginHeight = Math.max(12, Math.round((item.logins / maxLogins) * 60));
              
              return (
                <div key={idx} className="flex flex-col items-center gap-2 text-center bg-zinc-50 border border-zinc-200 p-2.5">
                  <div className="text-[9px] font-mono font-bold text-zinc-600 uppercase">
                    {item.date}
                  </div>

                  <div className="h-16 flex items-end justify-center gap-1.5 w-full my-1">
                    {/* Logins bar */}
                    <div 
                      style={{ height: `${loginHeight}%` }} 
                      className="w-3 bg-black transition-all"
                      title={`${item.logins} Logins`}
                    />
                    {/* Transactions bar */}
                    <div 
                      style={{ height: `${Math.min(100, Math.max(8, item.transactions * 25))}%` }} 
                      className={`w-3 transition-all ${item.transactions > 0 ? "bg-emerald-500" : "bg-zinc-200"}`}
                      title={`${item.transactions} Purchases`}
                    />
                  </div>

                  <div className="w-full text-[9px] font-mono border-t border-zinc-200 pt-1">
                    <div className="font-bold text-black">{item.logins} logins</div>
                    <div className="text-emerald-700 font-semibold">{item.transactions} txns</div>
                    {item.revenueNgn > 0 && (
                      <div className="text-[8px] text-zinc-500 mt-0.5 truncate">
                        {currencyMode === "NGN" ? `₦${(item.revenueNgn / 1000).toFixed(0)}k` : `$${(item.revenueNgn / 1550).toFixed(0)}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Intelligence: Most Active & Most Paying Leaders */}
      <div className="bg-white border border-black">
        {/* Header Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-black p-4 gap-3 bg-zinc-50">
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-black flex items-center gap-2">
              <Icons.Award className="h-4 w-4 text-black" />
              Customer Intelligence &amp; Value Rankings
            </h4>
            <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
              Identify your most engaged visitors and highest revenue-generating patrons
            </p>
          </div>

          <div className="flex items-center gap-1 border border-black bg-white p-0.5 font-mono text-[9px]">
            <button
              onClick={() => setRankingTab("paying")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold uppercase cursor-pointer transition-colors ${
                rankingTab === "paying" ? "bg-black text-white" : "text-zinc-600 hover:text-black"
              }`}
            >
              <Icons.DollarSign className="h-3 w-3" />
              Most Paying Customers ({topPaying.length})
            </button>
            <button
              onClick={() => setRankingTab("active")}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold uppercase cursor-pointer transition-colors ${
                rankingTab === "active" ? "bg-black text-white" : "text-zinc-600 hover:text-black"
              }`}
            >
              <Icons.Zap className="h-3 w-3" />
              Most Active Customers ({topActive.length})
            </button>
          </div>
        </div>

        {/* Paying Customers Table */}
        {rankingTab === "paying" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-300 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Customer Name &amp; Profile</th>
                  <th className="py-3 px-4">Role / Category</th>
                  <th className="py-3 px-4 text-right">Total Spent</th>
                  <th className="py-3 px-4 text-center">Paid Orders</th>
                  <th className="py-3 px-4 text-right">Average Order</th>
                  <th className="py-3 px-4 text-center">Conversion</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {topPaying.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500 font-mono text-xs">
                      No transaction records found yet.
                    </td>
                  </tr>
                ) : (
                  topPaying.map((cust, idx) => (
                    <tr key={cust.userId || idx} className="hover:bg-zinc-50 transition-colors">
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        {idx === 0 ? (
                          <span className="w-6 h-6 inline-flex items-center justify-center bg-amber-400 text-black font-black text-xs">
                            🥇 1
                          </span>
                        ) : idx === 1 ? (
                          <span className="w-6 h-6 inline-flex items-center justify-center bg-zinc-300 text-black font-black text-xs">
                            🥈 2
                          </span>
                        ) : idx === 2 ? (
                          <span className="w-6 h-6 inline-flex items-center justify-center bg-amber-700 text-white font-black text-xs">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-bold">#{idx + 1}</span>
                        )}
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-black flex items-center gap-2">
                          <span>{cust.username}</span>
                          {cust.customSize && (
                            <span className="text-[9px] font-mono bg-zinc-100 border border-zinc-300 px-1.5 py-0.2 text-zinc-600">
                              Size: {cust.customSize}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{cust.email}</div>
                        {cust.phone && (
                          <div className="text-[10px] text-zinc-400 font-mono">{cust.phone}</div>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <div>{getRoleBadge(cust.role)}</div>
                        <div className="text-[9px] text-zinc-500 font-mono mt-1">
                          {cust.statusCondition}
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-black text-emerald-800 text-sm">
                          {currencyMode === "NGN"
                            ? formatDirectAmount(cust.totalSpentNgn, "NGN")
                            : formatDirectAmount(cust.totalSpentUsd, "USD")}
                        </div>
                        <div className="text-[9px] font-mono text-zinc-400 mt-0.5">
                          {currencyMode === "NGN"
                            ? `($${cust.totalSpentUsd.toFixed(2)})`
                            : `(₦${cust.totalSpentNgn.toLocaleString()})`}
                        </div>
                      </td>

                      {/* Paid Orders */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold bg-zinc-100 border border-zinc-300 px-2 py-0.5 text-xs text-black">
                          {cust.totalTransactions} {cust.totalTransactions === 1 ? "order" : "orders"}
                        </span>
                      </td>

                      {/* Average Order Value */}
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-700">
                        {currencyMode === "NGN"
                          ? `₦${cust.averageOrderValueNgn.toLocaleString()}`
                          : `$${cust.averageOrderValueUsd.toFixed(2)}`}
                      </td>

                      {/* Conversion Rate */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className={`px-2 py-0.5 text-[10px] font-bold ${
                          cust.conversionRate >= 50
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : cust.conversionRate > 0
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-zinc-100 text-zinc-500"
                        }`}>
                          {cust.conversionRate}%
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onNavigateTab("logs")}
                          className="px-2.5 py-1 bg-black hover:bg-zinc-800 text-white font-mono text-[9px] uppercase font-bold tracking-wider cursor-pointer"
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Most Active Customers Table */}
        {rankingTab === "active" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-300 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Customer Name &amp; Profile</th>
                  <th className="py-3 px-4">Role / Category</th>
                  <th className="py-3 px-4 text-center">Total Logins</th>
                  <th className="py-3 px-4">Last Login Session</th>
                  <th className="py-3 px-4 text-right">Total Spent</th>
                  <th className="py-3 px-4 text-center">Order Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {topActive.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500 font-mono text-xs">
                      No active login records registered.
                    </td>
                  </tr>
                ) : (
                  topActive.map((cust, idx) => (
                    <tr key={cust.userId || idx} className="hover:bg-zinc-50 transition-colors">
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        {idx === 0 ? (
                          <span className="w-6 h-6 inline-flex items-center justify-center bg-indigo-600 text-white font-black text-xs">
                            🔥 1
                          </span>
                        ) : idx === 1 ? (
                          <span className="w-6 h-6 inline-flex items-center justify-center bg-indigo-400 text-white font-black text-xs">
                            2
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-bold">#{idx + 1}</span>
                        )}
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-black flex items-center gap-2">
                          <span>{cust.username}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{cust.email}</div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <div>{getRoleBadge(cust.role)}</div>
                      </td>

                      {/* Total Logins */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-black text-sm bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1">
                          {cust.loginCount} {cust.loginCount === 1 ? "login" : "logins"}
                        </span>
                      </td>

                      {/* Last Login Time */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-600">
                        <div>{new Date(cust.lastLoginAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                        <div className="text-[9px] text-zinc-400">
                          {new Date(cust.lastLoginAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-black">
                          {currencyMode === "NGN"
                            ? formatDirectAmount(cust.totalSpentNgn, "NGN")
                            : formatDirectAmount(cust.totalSpentUsd, "USD")}
                        </div>
                        <div className="text-[9px] text-zinc-400">{cust.totalTransactions} transactions</div>
                      </td>

                      {/* Conversion / Purchase Flag */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        {cust.totalTransactions > 0 ? (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] px-2 py-0.5 uppercase font-bold">
                            Active Buyer ({cust.conversionRate}%)
                          </span>
                        ) : (
                          <span className="bg-zinc-100 text-zinc-500 text-[9px] px-2 py-0.5 uppercase font-medium">
                            Browsing Patron
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onNavigateTab("logs")}
                          className="px-2.5 py-1 bg-black hover:bg-zinc-800 text-white font-mono text-[9px] uppercase font-bold tracking-wider cursor-pointer"
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div 
          onClick={() => onNavigateTab("logs")}
          className="bg-zinc-50 border border-black p-4 hover:bg-zinc-100 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
              <Icons.List className="h-4 w-4 text-black" />
              Live User Logs
            </span>
            <Icons.ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            Real-time feed of login timestamps, IP addresses, devices, and transaction flags.
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab("transactions")}
          className="bg-zinc-50 border border-black p-4 hover:bg-zinc-100 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
              <Icons.CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Payment Approvals
            </span>
            <Icons.ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            Confirm pending bank transfers and authorisations to unlock order delivery.
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab("accounts")}
          className="bg-zinc-50 border border-black p-4 hover:bg-zinc-100 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
              <Icons.Landmark className="h-4 w-4 text-indigo-600" />
              Super Admin Accounts
            </span>
            <Icons.ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            Configure bank accounts and PayPal credentials shown to clients at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
