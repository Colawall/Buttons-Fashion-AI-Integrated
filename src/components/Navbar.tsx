import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { User, CartItem } from "../types";
import BrandLogo from "./BrandLogo";

interface NavbarProps {
  currentUser: User;
  onOpenCart: () => void;
  cartItems: CartItem[];
  activeView: "shop" | "admin";
  onSwitchView: (view: "shop" | "admin") => void;
  onOpenAdminWarning: () => void;
  onOpenProfile: () => void;
}

export default function Navbar({
  currentUser,
  onOpenCart,
  cartItems,
  activeView,
  onSwitchView,
  onOpenAdminWarning,
  onOpenProfile
}: NavbarProps) {
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isSuperUser = currentUser.role === "super_user";

  // State to track scroll performance and toggle floating action bar
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAdminTabClick = () => {
    if (isSuperUser) {
      onSwitchView("admin");
    } else {
      onOpenAdminWarning();
    }
  };

  return (
    <>
      {/* Primary Brand Header (Relative; naturally scrolls out of view) */}
      <nav className="bg-white border-b border-[#F0F0F0] py-4 md:py-5 px-4 relative z-40 shrink-0 font-sans">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand on left */}
          <div 
            onClick={() => onSwitchView("shop")} 
            className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer select-none group"
          >
            <div className="bg-magenta-light w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center border border-magenta/20 duration-300 group-hover:scale-105 shrink-0 p-1.5">
              <BrandLogo className="h-full w-full text-magenta" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-[0.08em] uppercase text-[#000000] leading-none font-sans flex items-center gap-1 group-hover:text-magenta duration-250">
                Buttons <span className="font-sans font-light text-gray-400 text-[10px] tracking-[0.2em] pl-1 uppercase">Fashion</span>
              </h1>
              <p className="text-[8px] sm:text-[9px] text-[#9C00BF] font-black tracking-[0.25em] h-[10px] uppercase leading-none mt-1">
                Ready-To-Wear Couture
              </p>
            </div>
          </div>

          {/* Navigation Tab Switcher - Strictly visible ONLY to Super Users. Standard customers enjoy a pure, fully minimalistic shopfront. */}
          {isSuperUser && (
            <div className="flex bg-[#F5F5F5] border border-[#EFEFEF] p-0.5 rounded-none shrink-0">
              <button
                onClick={() => onSwitchView("shop")}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all border-none cursor-pointer rounded-none ${
                  activeView === "shop"
                    ? "bg-[#000000] text-white shadow-sm"
                    : "text-gray-400 hover:text-[#000000]"
                }`}
              >
                <Icons.ShoppingBag className="h-3 w-3" />
                <span className="hidden sm:inline">Shop</span>
              </button>

              <button
                onClick={handleAdminTabClick}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all border-none cursor-pointer rounded-none ${
                  activeView === "admin"
                    ? "bg-[#000000] text-white shadow-sm"
                    : "text-gray-400 hover:text-[#000000]"
                }`}
              >
                <Icons.ShieldAlert className="h-3 w-3" />
                <span className="hidden sm:inline">Super User Desk</span>
              </button>
            </div>
          )}

          {/* Right side profile and basket links */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              id="btn-navbar-profile-trigger"
              onClick={onOpenProfile}
              className="border border-[#000000] bg-transparent hover:bg-[#000000] hover:text-white text-black py-2 px-3 sm:px-3.5 rounded-none flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all uppercase text-[9px] sm:text-[10px] font-bold tracking-widest focus:outline-none group"
            >
              <Icons.User className="h-3.5 w-3.5 font-bold text-magenta" />
              <span className="hidden md:inline truncate max-w-[120px]">{currentUser.username}</span>
              <span className="inline md:hidden">Profile</span>
            </button>

            <button
              id="btn-navbar-cart-trigger"
              onClick={onOpenCart}
              className="border-2 border-[#000000] bg-transparent hover:bg-[#000000] hover:text-white text-[#000000] py-2 px-3 sm:px-3.5 rounded-none flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all uppercase text-[9px] sm:text-[10px] font-bold tracking-widest group focus:outline-none"
            >
              <Icons.ShoppingCart className="h-3.5 w-3.5 group-hover:scale-110 duration-200" />
              <span className="hidden sm:inline">Basket</span>
              {cartCount > 0 && (
                <span className="bg-[#000000] text-white group-hover:bg-white group-hover:text-black transition-colors rounded-none text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.5 border border-white/25">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Floating Microscopic Control Panel (Triggered and stays sticky on scroll) */}
      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 18, stiffness: 220 }}
            className="fixed top-4 right-4 z-45 bg-white/80 backdrop-blur-md px-3.5 py-2 border border-zinc-200 shadow-xl flex items-center gap-2 rounded-none hover:bg-white hover:border-black/25 duration-150"
          >
            {/* Quick Micro Brand Button to scroll top */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-magenta p-1 hover:bg-zinc-150 rounded-none transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center mr-0.5"
              title="Scroll back to top"
            >
              <Icons.ArrowUp className="h-3 text-black font-black" />
            </button>

            <div className="h-4 w-px bg-zinc-200" />

            {/* Profile trigger */}
            <button
              onClick={onOpenProfile}
              className="text-[9px] font-black uppercase tracking-widest text-[#000000] hover:text-[#9C00BF] bg-transparent border-none cursor-pointer flex items-center gap-1.5 py-1 px-1.5 focus:outline-none font-mono"
            >
              <Icons.User className="h-3.5 w-3.5 text-magenta" />
              <span>{currentUser.username.split(" ")[0]}</span>
            </button>

            {/* Basket trigger with dynamic counter */}
            <button
              onClick={onOpenCart}
              className="relative ml-1 text-[9px] font-black uppercase tracking-widest bg-black text-white hover:bg-[#9C00BF] py-1 px-2.5 rounded-none border-none cursor-pointer flex items-center gap-1.5 transition-all focus:outline-none font-mono"
            >
              <Icons.ShoppingCart className="h-3.5 w-3.5 text-white" />
              <span>Basket</span>
              {cartCount > 0 ? (
                <span className="bg-magenta text-white font-mono text-[8px] font-black px-1.5 rounded-none ml-0.5 animate-pulse">
                  {cartCount}
                </span>
              ) : null}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
