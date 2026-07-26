/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";

import { Product, User, Incident, CartItem } from "./types";
import Navbar from "./components/Navbar";
import ProfileDrawer from "./components/ProfileDrawer";
import ProductCatalog from "./components/ProductCatalog";
import AdminDashboard from "./components/AdminDashboard";
import ShoppingCart from "./components/ShoppingCart";
import VirtualAgent from "./components/VirtualAgent";
import BrandLogo from "./components/BrandLogo";
import LoginScreen from "./components/LoginScreen";

const BANNER_SLIDES = [
  {
    tag: "CAMPAIGN VERITAS",
    title: "Empowering Ready-to-Wear",
    desc: "Blending premium, posture-correct closures, GOTS organic cottons, and confidence. Engineered for ambitious graduates, scholars, and leading board directors alike to make every transition smooth.",
    buttonText: "Register Profile",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=905&q=80",
    badge: "BEAUTY • GROWTH • STRENGTH"
  },
  {
    tag: "SCHOLAR MATRIX ACTIVE",
    title: "20% Off Storewide Applied",
    desc: "Supporting academic growth is a core tenet of Buttons Fashion. Under our bespoke tariff model, any verified student customer instantly enjoys an automatic 20% discount on entire ready-to-wear ateliers.",
    buttonText: "Toggle Student Status",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=650&q=80",
    badge: "ACADEMIC ACCESSIBILITY"
  },
  {
    tag: "THE SUNFLOWER SUITSET",
    title: "Artisanal Drape Couture",
    desc: "From Peak Lapel blazers displaying subtle sunflower wrist embroidery to heavy asymmetric vests. Find gorgeous ready-to-wear garments curated with luxury, performance, and comfortable durability.",
    buttonText: "Browse Collection",
    image: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=650&q=80",
    badge: "HERITAGE ATELIER COUTURE"
  }
];

export default function App() {
  const [activeView, setActiveView] = useState<"shop" | "admin">("shop");
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showAdminWarning, setShowAdminWarning] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  
  // Incident submission popup alert
  const [notification, setNotification] = useState<{ show: boolean; msg: string } | null>(null);

  // Auto scroll top master banner
  useEffect(() => {
    if (activeView !== "shop") return;
    const scrollInterval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(scrollInterval);
  }, [activeView]);

  // Synchronize store context from Express database
  const handleRefreshAll = async () => {
    try {
      // 1. Fetch buttons
      const pRes = await fetch("/api/products");
      const pData = await pRes.json();
      setProducts(pData);

      // 2. Fetch users
      const uRes = await fetch("/api/users");
      const uData = await uRes.json();
      setUsers(uData);

      // Look up cached user in localStorage
      const cached = localStorage.getItem("buttons-current-user");
      let initialUser: User | null = null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const found = uData.find((u: User) => u.id === parsed.id || u.email.toLowerCase() === parsed.email.toLowerCase());
          if (found) {
            initialUser = found;
          }
        } catch (e) {
          console.error("Failed to parse cached user:", e);
        }
      }

      setCurrentUser((prev) => {
        if (prev) {
          const updated = uData.find((u: User) => u.id === prev.id);
          return updated || prev;
        }
        return initialUser;
      });
      setAuthChecked(true);

      // 3. Fetch complaints
      const iRes = await fetch("/api/incidents");
      const iData = await iRes.json();
      setIncidents(iData);
    } catch (err) {
      console.error("Failed to fetch boutique records:", err);
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    handleRefreshAll();
  }, []);

  // When a complaints is submitted by Magenta Assistant
  const triggerComplaintAlert = () => {
    handleRefreshAll();
    setNotification({
      show: true,
      msg: "✨ Magenta Assistant registered a new customer complaint inside the ticket room!"
    });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Manage Cart operations
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    
    // Quick micro animation trigger opened shopping card is sweet
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Safe Guard switches
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    // Auto pull back to shop view if student logged in while viewing Admin
    if (user.role !== "super_user") {
      setActiveView("shop");
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    handleRefreshAll();
  };

  const handleLogout = () => {
    localStorage.removeItem("buttons-current-user");
    setCurrentUser(null);
    setIsProfileOpen(false);
    setActiveView("shop");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-mono text-xs uppercase tracking-widest text-[#000000]">
        <div className="flex flex-col items-center gap-3">
          <Icons.Loader2 className="h-5 w-5 text-[#000000] animate-spin" />
          <p className="font-bold">PRIME BOUTIQUE REGISTER LOADING...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-start relative text-black font-sans pb-16">
      
      {/* Dynamic Profile Desk (Slide-over drawer on trigger) */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onRefreshAll={handleRefreshAll}
        onLogout={handleLogout}
      />
      
      {/* Prime Header & Navigation */}
      <Navbar
        currentUser={currentUser}
        onOpenCart={() => setIsCartOpen(true)}
        cartItems={cartItems}
        activeView={activeView}
        onSwitchView={setActiveView}
        onOpenAdminWarning={() => setShowAdminWarning(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Brand Elegant Head Banner Centered (Representing Page 8, 10 in the PDF) */}
      <div className="bg-white py-12 px-4 border-b border-[#F0F0F0] text-center flex flex-col items-center justify-center space-y-4 select-none animate-fadeIn">
        <div className="flex flex-col items-center justify-center gap-1">
          <BrandLogo className="h-16 w-16 text-black shrink-0" color="#000000" />
          <div className="text-center mt-2">
            <h1 className="text-3xl font-black tracking-[0.25em] text-[#000000] leading-none uppercase font-sans">
              BUTTONS
            </h1>
            <p className="text-[10px] text-[#000000]/70 tracking-[0.45em] uppercase font-light mt-1.5 leading-none pl-0.5 font-sans">
              FASHION
            </p>
          </div>
        </div>
        
        {/* Soft, beautiful tagline pairings of the brand in clean modern sans-serif */}
        <div className="flex items-center gap-3 text-[9px] font-mono tracking-widest text-gray-400 uppercase">
          <span>Beauty</span>
          <span className="text-[#9C00BF]">•</span>
          <span>Growth</span>
          <span className="text-[#9C00BF]">•</span>
          <span>Strength</span>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        <AnimatePresence mode="wait">
          {activeView === "shop" ? (
            <motion.div
              key="shop-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Atelier Animated Master Banner (The one major top banner that auto-rotates) */}
              <div className="relative overflow-hidden w-full bg-black text-white p-6 md:p-12 min-h-[380px] md:min-h-[440px] flex flex-col md:flex-row items-stretch justify-between gap-8 border border-zinc-900 rounded-none">
                
                {/* Visual content slide container */}
                <div className="flex-1 flex flex-col justify-between space-y-6 md:max-w-xl z-10 self-center">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-magenta opacity-80"></span>
                        <span className="relative inline-flex rounded-none h-1.5 w-1.5 bg-magenta"></span>
                      </span>
                      <span className="bg-magenta text-white text-[8px] font-mono font-bold tracking-widest px-2.5 py-0.5 uppercase leading-none rounded-none">
                        {BANNER_SLIDES[bannerIndex].tag}
                      </span>
                    </div>

                    <motion.h2 
                      key={`title-${bannerIndex}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-[0.14em] leading-tight font-sans text-white"
                    >
                      {BANNER_SLIDES[bannerIndex].title}
                    </motion.h2>

                    <motion.p 
                      key={`desc-${bannerIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-gray-300 text-xs leading-relaxed font-sans max-w-lg"
                    >
                      {BANNER_SLIDES[bannerIndex].desc}
                    </motion.p>
                  </div>

                  {/* Dynamic Action Buttons/Indicators */}
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      onClick={() => {
                        if (bannerIndex === 1) {
                          setIsProfileOpen(true);
                        } else {
                          const catalogEl = document.getElementById("catalog-section");
                          if (catalogEl) {
                            catalogEl.scrollIntoView({ behavior: "smooth" });
                          }
                        }
                      }}
                      className="border border-white hover:bg-white hover:text-black hover:border-white text-white py-2 px-5 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer rounded-none focus:outline-none bg-transparent"
                    >
                      {BANNER_SLIDES[bannerIndex].buttonText}
                    </button>

                    {/* Left/Right controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBannerIndex((prev) => (prev - 1 + 3) % 3)}
                        className="p-1 hover:text-magenta transition-colors focus:outline-none border-none bg-transparent text-white cursor-pointer"
                      >
                        <Icons.ArrowLeft className="h-4 w-4" />
                      </button>
                      
                      {/* Numeric indicator */}
                      <span className="text-[10px] font-mono text-gray-400 select-none">
                        {bannerIndex + 1} / 3
                      </span>

                      <button
                        onClick={() => setBannerIndex((prev) => (prev + 1) % 3)}
                        className="p-1 hover:text-magenta transition-colors focus:outline-none border-none bg-transparent text-white cursor-pointer"
                      >
                        <Icons.ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side Image Banner with gorgeous sliding visuals */}
                <div className="flex-1 relative overflow-hidden min-h-[260px] md:min-h-auto max-w-full md:max-w-md w-full border border-white/10 shrink-0 self-stretch">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`img-${bannerIndex}`}
                      src={BANNER_SLIDES[bannerIndex].image}
                      alt={BANNER_SLIDES[bannerIndex].title}
                      referrerPolicy="no-referrer"
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 0.85, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                  </AnimatePresence>
                  
                  {/* Fine linear gradient to prevent heavy edges */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/20 to-transparent h-24 pointer-events-none" />
                  
                  <div className="absolute bottom-4 left-4 z-10">
                    <span className="bg-white/10 backdrop-blur-md text-white text-[8px] font-mono tracking-widest font-bold px-2 py-1 rounded-none border border-white/15">
                      {BANNER_SLIDES[bannerIndex].badge}
                    </span>
                  </div>
                </div>

                {/* Aesthetic slide navigation bullet points overlay */}
                <div className="absolute bottom-4 left-6 md:left-12 flex gap-1.5 z-10">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={i}
                      onClick={() => setBannerIndex(i)}
                      className={`h-1.5 transition-all duration-300 cursor-pointer border-none p-0 ${
                        bannerIndex === i ? "w-6 bg-magenta" : "w-1.5 bg-gray-650 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Grid Content - Catalog positioned directly under single top banner */}
              <div id="catalog-section" className="pt-2">
                <ProductCatalog
                  products={products}
                  currentUser={currentUser}
                  onAddToCart={handleAddToCart}
                />
              </div>

              {/* Secondary Lookbooks and Archive Displays (Tucked cleanly at the end) */}
              <div className="pt-16 border-t border-[#F5F5F5] space-y-6">
                <div>
                  <h3 className="font-sans font-black uppercase tracking-[0.2em] text-[#000000] text-sm">
                    Atelier Lookup Archives
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase mt-1 leading-none">
                    Historic Campaigns & Editorial Highlights
                  </p>
                </div>

                {/* Curated Themed Picture Lookbook Banner */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 select-none">
                  {/* Left Side: Editorial cover styling */}
                  <div className="md:col-span-7 bg-[#000000] border border-[#EFEFEF] relative overflow-hidden group min-h-[300px] flex flex-col justify-end p-6">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80" 
                      alt="Corporate Senior Suitset" 
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-101 transition-transform duration-700 pointer-events-none"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent h-48 pointer-events-none" />
                    
                    <div className="z-10 space-y-2">
                      <span className="bg-[#9C00BF] text-white text-[8px] font-mono tracking-widest font-bold uppercase px-2.5 py-1 rounded-none">
                        ATELIER PREMIERE
                      </span>
                      <h3 className="text-xl font-black text-white uppercase tracking-wider leading-none">
                        The Sunflower Suitset Cues
                      </h3>
                      <p className="text-[10px] text-gray-300 font-sans tracking-wide max-w-lg leading-relaxed">
                        Custom tailored with double-breast button posture alignments in deep slate. Engineered for executive elevation, and academic confidence alike.
                      </p>
                    </div>
                  </div>

                  {/* Right Side Stack: Two editorial cards */}
                  <div className="md:col-span-5 grid grid-rows-2 gap-4">
                    {/* Stack Item 1: Chic Ivory Coordinates */}
                    <div className="bg-[#000000] border border-[#EFEFEF] relative overflow-hidden group p-4 flex flex-col justify-end min-h-[142px]">
                      <img 
                        src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=650&q=80" 
                        alt="Ivory Tonal Embroidery and Closures" 
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-101 transition-transform duration-750 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                      
                      <div className="z-10 space-y-1">
                        <span className="bg-white text-black text-[7px] font-mono tracking-widest font-black uppercase px-2.5 py-0.5 rounded-none">
                          CHEST TAILORING
                        </span>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                          Tonal Embroidery Closeups
                        </h4>
                      </div>
                    </div>

                    {/* Stack Item 2: High Fashion Purple Gown Look */}
                    <div className="bg-[#000000] border border-[#EFEFEF] relative overflow-hidden group p-4 flex flex-col justify-end min-h-[142px]">
                      <img 
                        src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=650&q=80" 
                        alt="Venus Gown & Academic Grace" 
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-101 transition-transform duration-750 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

                      <div className="z-10 space-y-1">
                        <span className="bg-white text-black text-[7px] font-mono tracking-widest font-black uppercase px-2.5 py-0.5 rounded-none">
                          STRENGTH & BEAUTY
                        </span>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                          Venus Gowns & Capes
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Brand Manifesto and Heritage Lookbook Grid */}
              <div className="pt-10 border-t border-[#EFEFEF]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Manifesto Column 1 */}
                  <div className="bg-[#FAF0FF] p-6 border border-magenta/15 flex flex-col items-center text-center space-y-4 rounded-none">
                    <div className="w-14 h-14 bg-white flex items-center justify-center border-2 border-[#9C00BF] p-2 shrink-0">
                      <svg viewBox="0 0 120 160" className="h-full w-full text-magenta" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="60" cy="55" r="35" stroke="currentColor" strokeWidth="10" />
                        <circle cx="48" cy="43" r="5" fill="currentColor" />
                        <circle cx="72" cy="43" r="5" fill="currentColor" />
                        <circle cx="48" cy="67" r="5" fill="currentColor" />
                        <circle cx="72" cy="67" r="5" fill="currentColor" />
                        <path d="M60 90V152" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
                        <path d="M42 105H52M68 105H78" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
                        <path d="M38 123H52M68 123H82" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#9C00BF] font-mono">
                        Confident Femininity
                      </h4>
                      <p className="text-[11px] text-gray-600 leading-relaxed font-sans">
                        Our iconic symbol merges the classic apparel button with the Venus ♀ motif, representing custom tailoring designed to empower and brace your everyday life.
                      </p>
                    </div>
                  </div>

                  {/* Manifesto Column 2 */}
                  <div className="bg-white p-6 border-2 border-black flex flex-col items-center text-center space-y-4 rounded-none">
                    <div className="w-14 h-14 bg-[#000000] flex items-center justify-center shrink-0">
                      <Icons.GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-black font-mono">
                        Academic to Corporate
                      </h4>
                      <p className="text-[11px] text-gray-600 leading-relaxed font-sans">
                        Bridging tertiary education and corporate boardrooms, our outfits are tailored with precise lines, ready-to-wear comfort, and accessible scholar tiers.
                      </p>
                    </div>
                  </div>

                  {/* Manifesto Column 3 (Sunflower) */}
                  <div className="bg-[#FAF0FF] p-6 border border-magenta/15 flex flex-col items-center text-center space-y-4 rounded-none">
                    <div className="w-14 h-14 bg-white flex items-center justify-center border-2 border-orange-400 shrink-0 text-orange-400">
                      <Icons.Sun className="h-6 w-6 animate-spin-slow" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-orange-500 font-mono">
                        Sunflower Motif
                      </h4>
                      <p className="text-[11px] text-gray-600 leading-relaxed font-sans">
                        Embodied as our crest symbol, the Sunflower represents <strong>Beauty, Growth, and Strength</strong>. A confident reminder to flourish in every environment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Aesthetic footer copyright inside main view */}
                <div className="text-center pt-8 pb-4 text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                  © 2026 Buttons Fashion Brand Inc. • Premium Ready-to-Wear Ateliers
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard
                products={products}
                users={users}
                incidents={incidents}
                onUpdateProducts={setProducts}
                onUpdateUsers={setUsers}
                onUpdateIncidents={setIncidents}
                onRefreshAll={handleRefreshAll}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Designer Studio Footer */}
      <footer className="bg-black text-white mt-16 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BrandLogo className="h-8 w-8 text-white" color="#FFFFFF" />
              <div>
                <h4 className="text-sm font-black tracking-[0.2em] uppercase leading-none定位 text-white">
                  BUTTONS
                </h4>
                <p className="text-[8px] text-gray-400 tracking-[0.3em] uppercase leading-none mt-1">
                  ATELIER FASHION
                </p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-sans max-w-sm">
              Established on peak lapels, meticulous posture-correct draping, and absolute sustainable growth. Buttons Fashion delivers empowering ready-to-wear ateliers and tailored statement garments built with heritage craftsmanship.
            </p>
          </div>

          {/* Locations Col */}
          <div className="space-y-3.5">
            <h5 className="font-mono text-[9px] font-black uppercase tracking-widest text-[#9C00BF]">
              CHIC BOUTIQUE LOCATIONS
            </h5>
            <ul className="space-y-3 text-[11px] text-gray-400 font-sans list-none p-0 m-0">
              <li className="flex items-start gap-2">
                <Icons.MapPin className="h-3.5 w-3.5 text-magenta shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-medium block">Soho Flagship Boutique</strong>
                  <span className="text-gray-400 block mt-0.5">85 Mercer Street, New York, NY 10012, USA</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Icons.MapPin className="h-3.5 w-3.5 text-magenta shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-medium block">Parisian Atelier</strong>
                  <span className="text-gray-400 block mt-0.5">42 Rue du Faubourg Saint-Honoré, 75008 Paris, France</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="space-y-3.5">
            <h5 className="font-mono text-[9px] font-black uppercase tracking-widest text-[#9C00BF]">
              CLIENT CONCIERGERIE
            </h5>
            <ul className="space-y-3 text-[11px] font-sans list-none p-0 m-0 text-gray-400 font-sans">
              <li className="flex items-center gap-2">
                <Icons.Phone className="h-3.5 w-3.5 text-magenta shrink-0" />
                <div>
                  <span className="text-gray-400 block">Direct Atelier:</span>
                  <a href="tel:+12125550190" className="text-white hover:text-magenta transition-colors font-mono font-medium">+1 (212) 555-0190</a>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <Icons.Mail className="h-3.5 w-3.5 text-magenta shrink-0" />
                <div>
                  <span className="text-gray-400 block">Inquiries:</span>
                  <a href="mailto:concierge@buttons.fashion" className="text-white hover:text-magenta transition-colors">concierge@buttons.fashion</a>
                </div>
              </li>
            </ul>
          </div>

          {/* Connect Col */}
          <div className="space-y-3.5">
            <h5 className="font-mono text-[9px] font-black uppercase tracking-widest text-[#9C00BF]">
              WORLD OF ATELIER
            </h5>
            <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
              Subscribe to lookbook reveals, private viewing invitations, and seasonal organic collections releases.
            </p>
            {/* Social Media Links */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://instagram.com/buttons_fashion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-none border border-zinc-800 hover:border-magenta hover:text-magenta flex items-center justify-center text-white transition-all bg-zinc-950 cursor-pointer text-inherit decoration-none"
                aria-label="Instagram"
              >
                <Icons.Instagram className="h-4 w-4 text-white hover:text-magenta" />
              </a>
              <a
                href="https://facebook.com/buttons_fashion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-none border border-zinc-800 hover:border-magenta hover:text-magenta flex items-center justify-center text-white transition-all bg-zinc-950 cursor-pointer text-inherit decoration-none"
                aria-label="Facebook"
              >
                <Icons.Facebook className="h-4 w-4 text-white hover:text-magenta" />
              </a>
              <a
                href="https://twitter.com/buttons_fashion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-none border border-zinc-800 hover:border-magenta hover:text-magenta flex items-center justify-center text-white transition-all bg-zinc-950 cursor-pointer text-inherit decoration-none"
                aria-label="Twitter"
              >
                <Icons.Twitter className="h-4 w-4 text-white hover:text-magenta" />
              </a>
              <a
                href="https://youtube.com/buttons_fashion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-none border border-zinc-800 hover:border-magenta hover:text-magenta flex items-center justify-center text-white transition-all bg-zinc-950 cursor-pointer text-inherit decoration-none"
                aria-label="YouTube"
              >
                <Icons.Youtube className="h-4 w-4 text-white hover:text-magenta" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright segment */}
        <div className="border-t border-zinc-900 bg-zinc-950 py-6 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center">
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} BUTTONS FASHION. ALL RIGHTS RESERVED.
            </span>
            <div className="flex items-center gap-4 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
              <span className="hover:text-white transition-colors cursor-pointer">Bespoke Terms</span>
              <span>•</span>
              <span className="hover:text-white transition-colors cursor-pointer">Privacy Charter</span>
              <span>•</span>
              <span className="hover:text-white transition-colors cursor-pointer">Sustainability Covenant</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating virtual assistant */}
      <VirtualAgent
        currentUser={currentUser}
        cartItemsCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        products={products}
        onAddComplaint={triggerComplaintAlert}
        onNavigateToCatalog={() => setActiveView("shop")}
      />

      {/* Sliding Side Basket */}
      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        currentUser={currentUser}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Active Toast notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-24 left-6 z-40 max-w-sm bg-black text-white p-5 border-2 border-white flex items-center gap-4 font-mono text-xs rounded-none shadow-2xl"
          >
            <Icons.BellRing className="text-white h-5 w-5 animate-pulse shrink-0" />
            <div>
              <p className="font-sans leading-relaxed text-gray-350">{notification.msg}</p>
              <button
                onClick={() => {
                  setActiveView("admin");
                  setNotification(null);
                }}
                className="text-[9px] font-bold text-white uppercase hover:underline mt-1.5 cursor-pointer border-none bg-none block tracking-widest font-mono"
              >
                Go to incident room &rarr;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Standard User Lock Security Screen Modal */}
      <AnimatePresence>
        {showAdminWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminWarning(false)}
              className="absolute inset-0 bg-black/45 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-none p-8 max-w-md w-full border-2 border-black shadow-2xl relative z-10 text-center space-y-5 font-sans"
            >
              <button
                onClick={() => setShowAdminWarning(false)}
                className="absolute top-4 right-4 text-black hover:opacity-60 p-1 cursor-pointer border-none bg-transparent"
              >
                <Icons.X className="h-4 w-4" />
              </button>

              <div className="bg-black text-white w-12 h-12 rounded-none flex items-center justify-center mx-auto border border-black shadow-sm">
                <Icons.Lock className="h-5 w-5" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-serif italic font-bold text-lg text-black">Operational Workspace Locked</h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Only authorized **Super Users** are allowed to modify catalog items or moderate customer registries.
                </p>
              </div>

              {/* Instructions on how to bypass to keep testing incredibly fun */}
              <div className="bg-[#F9F9F9] border border-black p-4 rounded-none text-left space-y-1 text-xs font-mono">
                <span className="font-bold text-black block text-xs tracking-wider uppercase">🛠️ Profile bypass instructions</span>
                <p className="text-gray-600 mt-1 leading-relaxed">Scroll to the top, click **SWITCH TEST PROFILE** and select **SuperSam Admin** (or register your own Super User context) to unlock access instantly.</p>
              </div>

              <button
                onClick={() => setShowAdminWarning(false)}
                className="w-full bg-black hover:bg-black/95 text-white font-mono font-bold text-[10px] tracking-widest uppercase py-3.5 rounded-none cursor-pointer border-none"
              >
                Acknowledge Protocol
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
