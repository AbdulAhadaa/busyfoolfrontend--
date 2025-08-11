import React from "react"

import {
  LayoutDashboard,
  Coffee,
  Leaf,
  BarChart3,
  LogOut,
  X,
  Package,
  ShoppingCart,
  TrendingUp,
  Receipt
} from "lucide-react"
import { NavLink } from "react-router-dom"

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/welcome" },
  { name: "Products", icon: Coffee, path: "/products" },
  { name: "Ingredients", icon: Leaf, path: "/ingredients" },
  { name: "Stock", icon: Package, path: "/stock" },

  { name: "Sales", icon: Receipt, path: "/sales" },
  //  { name: "Daily Sales", icon: Receipt, path: "/dailysales" },
 
    // { name: "My Profile", icon: BarChart3, path: "/profile" }
    // { name: "What-If", icon: BarChart3, path: "/what-if" },

]
export const Sidebar = ({ isOpen, onClose }) => {
   const handleLogout = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      await fetch("https://busy-fool-backend-2-0.onrender.com/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      // Optionally handle error
    }
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } md:hidden`}
        onClick={onClose}
      />

      {/* Fixed Sidebar for full height coverage */}
      <aside
        className={`
          fixed top-0 left-0 z-50
          w-64 h-full min-h-screen
          bg-[#2c1a0e]/90 backdrop-blur-xl
          border-r border-[#ffffff1a] shadow-2xl text-white
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 flex flex-col
        `}
      >
        {/* Mobile Logo */}
        <div className="flex items-center justify-between md:hidden p-4 border-b border-white/10 flex-shrink-0">
          <img
            src="/assets/logo3.png"
            alt="Busy Fool Logo"
            className="h-16 w-auto mx-auto animate-elegant-glow"
          />
          <button onClick={onClose}>
            <X className="w-6 h-6 text-white hover:text-yellow-300 transition" />
          </button>
        </div>

        {/* Desktop Logo */}
        <div className="hidden md:flex items-center justify-center py-6 border-b border-white/10 flex-shrink-0">
          <img
            src="/assets/logo3.png"
            alt="Busy Fool Logo"
            className="h-24 w-auto animate-elegant-glow"
          />
        </div>

        {/* Navigation Links - This will expand to fill available space */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-[#3b2617]/70 scrollbar-track-transparent">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm tracking-wide transition-all
                ${
                  isActive
                    ? "bg-[#55341E] text-yellow-300 shadow-inner shadow-yellow-400/10"
                    : "text-white hover:bg-[#3a2416] hover:text-yellow-200"
                }`
              }
            >
              <item.icon className="w-5 h-5 text-yellow-100 group-hover:scale-105 transition-transform duration-200" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

       
       {/* Logout - Fixed at bottom */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <button 
          onClick={handleLogout}
            className="flex items-center w-full gap-3 px-4 py-3 rounded-xl text-white hover:bg-[#3a2416] hover:text-red-400 transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}