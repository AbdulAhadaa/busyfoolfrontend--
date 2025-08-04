import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
export default function Dashboard() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
   const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchDashboard = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setData(null);
    try {
      const token = localStorage.getItem("accessToken");
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(
        `http://168.231.74.35:3006/products/analytics/dashboard?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || "Unknown error");
    }
    setLoading(false);
  };

  return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-64 flex flex-col min-h-screen">
          <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 space-y-6">
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f3e8e2] flex flex-col items-center py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100"
      >
        <h1 className="text-3xl font-extrabold text-[#6B4226] mb-2 text-center">Business Dashboard</h1>
        <p className="text-gray-500 text-center mb-6">View your revenue, profit, and quick wins for any date range.</p>
        <form onSubmit={fetchDashboard} className="flex flex-col md:flex-row gap-4 items-center justify-center mb-2">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#6B4226] focus:border-transparent bg-gray-50"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#6B4226] focus:border-transparent bg-gray-50"
            />
          </div>
          <button
            type="submit"
            className="mt-5 md:mt-0 px-6 py-2 bg-gradient-to-r from-[#6B4226] to-[#5a3620] text-white rounded-xl font-semibold shadow hover:shadow-lg transition-all"
            disabled={loading}
          >
            {loading ? "Loading..." : "Show Dashboard"}
          </button>
        </form>
        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
      </motion.div>
      <AnimatePresence>
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center">
                <span className="text-lg text-gray-500">Total Revenue</span>
                <span className="text-3xl font-bold text-green-700 mt-1">${Number(data.revenue).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg text-gray-500">Total Costs</span>
                <span className="text-3xl font-bold text-red-600 mt-1">${Number(data.costs).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg text-gray-500">Profit</span>
                <span className="text-3xl font-bold text-[#6B4226] mt-1">${Number(data.profit).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                <span className="text-sm text-gray-400">Profit Margin: {Number(data.profitMargin).toFixed(2)}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4 shadow flex flex-col gap-2">
                <h2 className="font-bold text-red-700 text-lg mb-1">Products Losing Money</h2>
                {data.losingMoney.length === 0 ? (
                  <span className="text-gray-400">None 🎉</span>
                ) : (
                  <ul className="list-disc ml-6">
                    {data.losingMoney.map((p) => (
                      <li key={p.name} className="text-red-700 font-medium flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                        {p.name} <span className="text-xs text-gray-500">(${Number(p.margin_amount).toFixed(2)}/unit loss)</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow flex flex-col gap-2">
                <h2 className="font-bold text-green-700 text-lg mb-1">Top Winners</h2>
                {data.winners.length === 0 ? (
                  <span className="text-gray-400">None</span>
                ) : (
                  <ul className="list-disc ml-6">
                    {data.winners.map((p) => (
                      <li key={p.name} className="text-green-700 font-medium flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        {p.name} <span className="text-xs text-gray-500">(${Number(p.margin_amount).toFixed(2)}/unit profit)</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 shadow flex flex-col gap-2">
                <h2 className="font-bold text-yellow-700 text-lg mb-1">Quick Wins</h2>
                {data.quickWins.length === 0 ? (
                  <span className="text-gray-400">No suggestions</span>
                ) : (
                  <ul className="list-disc ml-6">
                    {data.quickWins.map((q) => (
                      <li key={q.name} className="text-yellow-700 font-medium flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                        {q.name} <span className="text-xs text-gray-500">- {q.suggestion}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </main>
     </div>
      </div>
  );
}
