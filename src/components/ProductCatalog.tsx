import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { Product, User } from "../types";

// Dynamic Lucide Icon Helper
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.Shirt className={className} />;
  return <IconComponent className={className} />;
};

// Available categories for avant-garde fashion atelier
const CATEGORIES = ["All", "Outerwear", "Basics", "Knitwear"];

interface ProductCatalogProps {
  products: Product[];
  currentUser: User;
  onAddToCart: (product: Product) => void;
}

export default function ProductCatalog({
  products,
  currentUser,
  onAddToCart
}: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // --- NEW SIZE CHART DATA ---
  const SIZE_CHART_DATA = [
    { size: "6", bust: "34", waist: "25", hip: "37" },
    { size: "8", bust: "35", waist: "26", hip: "39" },
    { size: "10", bust: "36", waist: "28", hip: "41" },
    { size: "12", bust: "38", waist: "30", hip: "43" },
    { size: "14", bust: "40", waist: "32", hip: "45" },
    { size: "16", bust: "43", waist: "35", hip: "47" },
    { size: "18", bust: "45", waist: "36", hip: "50" },
    { size: "20", bust: "48", waist: "38", hip: "52" },
    { size: "22", bust: "50", waist: "40", hip: "54" },
    { size: "24", bust: "52", waist: "42", hip: "56" }
  ];

  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [selectedUserSize, setSelectedUserSize] = useState<string | null>(
    currentUser.customSize || localStorage.getItem("atelier_selected_size") || null
  );

  const [chosenSizeForCart, setChosenSizeForCart] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Sync with profile changes
  React.useEffect(() => {
    if (currentUser.customSize) {
      setSelectedUserSize(currentUser.customSize);
    }
  }, [currentUser.customSize]);

  // Listen to open-size-guide event
  React.useEffect(() => {
    const handleOpen = () => {
      setSelectedProduct(null);
      setShowSizeGuide(true);
    };
    window.addEventListener("open-size-guide", handleOpen);
    return () => {
      window.removeEventListener("open-size-guide", handleOpen);
    };
  }, []);

  // Auto-open effect: trigger the size guide only for newly registered users who don't have a size selected yet
  React.useEffect(() => {
    const isNewUser = localStorage.getItem("is-new-user") === "true";
    if (isNewUser && !selectedUserSize) {
      setShowSizeGuide(true);
    }
  }, [selectedUserSize]);

  // Sync chosen size for detail modal whenever selectedProduct or the active profile size changes
  React.useEffect(() => {
    if (selectedProduct) {
      setChosenSizeForCart(selectedUserSize || (selectedProduct.sizes && selectedProduct.sizes[0]) || "10");
    }
  }, [selectedProduct, selectedUserSize]);

  const handleSelectActiveSize = (sz: string) => {
    setSelectedUserSize(sz);
    localStorage.setItem("atelier_selected_size", sz);
    // After a size is chosen, the guide disappears automatically
    setShowSizeGuide(false);
    // Clear the new user indicator since they now have a chosen size
    localStorage.removeItem("is-new-user");
  };

  // Filter catalog based on search, category selection, and user rights
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || prod.category === selectedCategory;
    
    // Non-super users can only browse visible clothes
    const isVisibleToUser = currentUser.role === "super_user" || prod.isVisible;

    return matchesSearch && matchesCategory && isVisibleToUser;
  });

  // Calculate pricing based on current user group (Student enjoys automatic 20% discount!)
  const getProductPriceDetails = (prod: Product) => {
    const originalPrice = prod.price;
    const isStudent = currentUser.role === "student";
    const discountedPrice = isStudent ? originalPrice * 0.8 : originalPrice;
    
    return {
      originalPrice,
      discountedPrice,
      isStudent,
      savings: originalPrice - discountedPrice
    };
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Sizing & Search Controls Panel */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch justify-between">
        
        {/* Minimalist Search Input */}
        <motion.div
          className="relative"
          animate={{
            flexGrow: isSearchFocused ? 1.4 : 1,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ flexBasis: "0%" }}
        >
          <Icons.Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
          <input
            id="input-catalog-search"
            type="text"
            placeholder="Search Atelier garments, organic cotton coats, asymmetrical vests or knitwear..."
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF9FA] border border-[#E9E9E9] hover:border-gray-300 focus:border-black focus:bg-white text-black placeholder-gray-400 text-xs pl-11 pr-5 py-3.5 rounded-none focus:outline-none transition-all font-sans"
          />
          {searchQuery && (
            <button
               onClick={() => setSearchQuery("")}
              className="absolute right-4 top-3.5 text-[10px] uppercase font-bold text-gray-400 hover:text-black bg-none border-none cursor-pointer"
            >
              Clear
            </button>
          )}
        </motion.div>

        {/* Dynamic Size Chart Selector button mimicking premier designer studio - only shown if size not specified */}
        {!selectedUserSize && (
          <motion.button
            onClick={() => {
              setSelectedProduct(null);
              setShowSizeGuide(true);
            }}
            className="relative overflow-hidden bg-black hover:bg-[#111111] text-white active:scale-[0.98] py-3.5 px-6 rounded-none text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2 border border-black group shadow-sm font-sans"
            whileHover={{ scale: 1.01 }}
          >
            <Icons.Ruler className="h-3.5 w-3.5 text-magenta group-hover:rotate-12 transition-transform" />
            <span>Atelier Size Guide</span>
          </motion.button>
        )}
      </div>

      {/* Modern Size Guide Drawer/Modal Container */}
      <AnimatePresence>
        {showSizeGuide && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSizeGuide(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Container */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white w-full max-w-md p-6 border-2 border-black shadow-2xl space-y-6 font-sans text-black z-50 rounded-none text-left"
              >
                {/* Header of Modal closely tracking uploaded look */}
                <div className="flex items-center justify-between border-b border-black/10 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black uppercase tracking-[0.12em] text-black">
                      Size Guide
                    </h3>
                    <p className="text-lg font-serif italic text-gray-800 leading-none mt-1">
                      Buttons Size Chart
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSizeGuide(false)}
                    className="text-gray-400 hover:text-black p-1 bg-none border-none cursor-pointer focus:outline-none transition-colors"
                  >
                    <Icons.X className="h-5 w-5" />
                  </button>
                </div>

                {/* Sizing Chart Table matching the requested graphic exactly */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black text-gray-500 font-mono text-[9px] uppercase tracking-widest">
                        <th className="py-2.5 font-bold">Size</th>
                        <th className="py-2.5 font-bold">Bust</th>
                        <th className="py-2.5 font-bold">Waist</th>
                        <th className="py-2.5 font-bold">Hip</th>
                        <th className="py-2.5 font-bold text-right">Selection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-xs font-sans">
                      {SIZE_CHART_DATA.map((row) => {
                        const isActive = selectedUserSize === row.size;
                        return (
                          <tr 
                            key={row.size} 
                            className={`transition-colors hover:bg-magenta-light/30 ${
                              isActive ? "bg-[#FFF0F5] font-bold text-[#9C00BF]" : "text-black"
                            }`}
                          >
                            <td className="py-3 font-mono font-bold text-sm">{row.size}</td>
                            <td className="py-3">{row.bust}</td>
                            <td className="py-3">{row.waist}</td>
                            <td className="py-3">{row.hip}</td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleSelectActiveSize(row.size)}
                                className={`text-[8px] font-mono font-bold leading-none px-2 py-1 uppercase tracking-wider rounded-none cursor-pointer transition-all ${
                                  isActive 
                                    ? "bg-magenta text-white border border-magenta" 
                                    : "bg-white border border-black hover:bg-black hover:text-white"
                                }`}
                              >
                                {isActive ? "Active" : "Select"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-gray-600 leading-normal pl-1 border-l-2 border-magenta font-sans">
                  * Select a standard size to automatically highlight available garments in our lookbook collections.
                </p>

                {/* AI Assistant consultation helper button */}
                <button
                  type="button"
                  onClick={() => {
                    const chosenLabel = selectedUserSize ? `Size ${selectedUserSize}` : "an unselected size";
                    const msgText = `Hello! I am reviewing the Atelier Size Chart and looking over my fit selection. I normally align with ${chosenLabel}. How do the Buttons Fashion classic tailored garments, drape outerwear, or structural blazers fit in this range? Let's discuss this!`;
                    window.dispatchEvent(new CustomEvent("open-atelier-chat", { detail: { message: msgText } }));
                    setShowSizeGuide(false);
                  }}
                  className="w-full bg-black hover:bg-magenta text-white py-3 px-4 rounded-none text-[9px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer border-none flex items-center justify-center gap-1.5"
                >
                  <Icons.Sparkles className="h-3.5 w-3.5 text-magenta" />
                  Consult Sizing Assistant
                </button>

                {/* Reset or Close footer action */}
                <div className="flex items-center justify-between pt-4 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserSize(null);
                      localStorage.removeItem("atelier_selected_size");
                    }}
                    className="text-[9px] font-mono uppercase font-bold tracking-widest text-gray-400 hover:text-black bg-none border-none cursor-pointer"
                  >
                    Clear Choice
                  </button>
                  <button
                    onClick={() => setShowSizeGuide(false)}
                    className="bg-black hover:bg-[#222] text-white py-2 px-5 rounded-none text-[9px] font-bold uppercase tracking-widest cursor-pointer transition-all border-none font-sans"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

        {/* Categories Carousel */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-gray-200">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 cursor-pointer border rounded-none ${
                selectedCategory === cat
                  ? "bg-magenta text-white border-magenta"
                  : "bg-[#F5F5F5] text-gray-400 border-[#EFEFEF] hover:bg-[#FDFDFD] hover:text-black"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      {/* Grid of Garments and Pieces */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-none p-12 text-center border border-[#EFEFEF] space-y-3">
          <Icons.Inbox className="h-8 w-8 text-gray-300 mx-auto" />
          <h4 className="font-sans font-black uppercase tracking-widest text-[#000000] text-sm">Empty Atelier Rack</h4>
          <p className="text-gray-400 text-xs tracking-tight">No garments match the selected filters or dimensions. Customize query keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20 p-2">
          {filteredProducts.map((prod) => {
            const pricing = getProductPriceDetails(prod);
            return (
              <div
                id={`product-card-${prod.id}`}
                key={prod.id}
                className="bg-white rounded-none flex flex-col justify-between group overflow-hidden transition-all duration-300 p-4 border border-zinc-100 hover:border-black/10 hover:shadow-xl space-y-4"
              >
                {/* Visual Header / Showcase Box */}
                <div 
                  className="bg-[#FAFAFA] relative h-80 overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-colors duration-300 group-hover:bg-[#F5F5F5]"
                  onClick={() => setSelectedProduct(prod)}
                >
                  
                  {/* Status Overlay for Super User */}
                  {currentUser.role === 'super_user' && (
                    <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
                      <span className="bg-black text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-none leading-none uppercase tracking-widest border border-white/20">
                        ATELIER CONTROL
                      </span>
                      {!prod.isVisible && (
                        <span className="bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-none leading-none uppercase tracking-widest flex items-center gap-0.5">
                          <Icons.EyeOff className="h-2 w-2" /> HIDDEN RACK
                        </span>
                      )}
                    </div>
                  )}

                  {/* Student Discount Tag */}
                  {pricing.isStudent && (
                    <span className="absolute top-4 right-4 bg-magenta text-white text-[8px] font-mono font-black px-2 py-1 rounded-none leading-none tracking-widest uppercase border border-white/10 shadow-sm z-10">
                      STUDENT RATE
                    </span>
                  )}

                  {/* Garment Image Content */}
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                  ) : (
                    <div 
                      className={`w-36 h-36 rounded-full border-4 shadow-md flex flex-col items-center justify-center relative select-none duration-300 group-hover:scale-105 ${
                        prod.accentColor === "indigo" ? "bg-indigo-50 border-indigo-200 text-indigo-500" :
                        prod.accentColor === "emerald" ? "bg-emerald-50 border-emerald-200 text-emerald-500" :
                        prod.accentColor === "purple" ? "bg-purple-50 border-purple-200 text-purple-500" :
                        prod.accentColor === "amber" ? "bg-amber-50 border-amber-200 text-amber-500" :
                        prod.accentColor === "orange" ? "bg-orange-50 border-orange-200 text-orange-500" :
                        prod.accentColor === "blue" ? "bg-blue-50 border-blue-200 text-blue-500" :
                        prod.accentColor === "magenta" ? "bg-magenta-light border-magenta/20 text-magenta" :
                        "bg-rose-50 border-rose-200 text-rose-500"
                      }`}
                    >
                      <div className="absolute top-1 left-2 w-16 h-8 bg-white/25 rounded-full rotate-[-15deg] blur-xs" />
                      <div>
                        <DynamicIcon name={prod.iconName} className="h-12 w-12 drop-shadow-sm" />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-4 text-[8px] text-black bg-white/85 backdrop-blur-xs px-2.5 py-1 font-bold uppercase tracking-[0.25em]">{prod.category}</div>
                </div>

                {/* Content description & footer values */}
                <div className="flex-1 flex flex-col justify-between space-y-3 px-1.5">
                  <div>
                    <h3 
                      className="font-bold text-[#000000] tracking-tight text-sm hover:underline cursor-pointer group-hover:text-magenta duration-250 leading-snug"
                      onClick={() => setSelectedProduct(prod)}
                    >
                      {prod.name}
                    </h3>
                    
                    {/* Size list summary badges */}
                    {prod.sizes && prod.sizes.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {prod.sizes.map((sz) => (
                          <span 
                            key={sz} 
                            className={`text-[8px] font-mono leading-none px-2 py-0.5 font-bold ${
                              selectedUserSize === sz 
                                ? "bg-magenta text-white border border-magenta" 
                                : "bg-[#F5F5F5] text-gray-400 border border-gray-100"
                            }`}
                          >
                            {sz}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-gray-500 text-xs mt-2.5 leading-relaxed line-clamp-2 font-light">
                      {prod.description}
                    </p>
                  </div>

                  {/* Purchase Line */}
                  <div className="flex flex-col space-y-3.5 pt-1">
                    <div className="flex justify-between items-end">
                      <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest pl-0.5">Price Value</div>
                      <div>
                        {pricing.isStudent ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] text-gray-400 line-through font-mono">Standard: ${pricing.originalPrice.toFixed(2)}</span>
                            <span className="text-sm font-sans font-extrabold text-magenta flex items-center gap-1.5 leading-none">
                              ${pricing.discountedPrice.toFixed(2)} 
                              <span className="text-[8px] font-sans uppercase font-black text-magenta bg-magenta-light border border-magenta/15 px-1.5 py-0.5">20% Off</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-mono font-black text-black border-b border-black/30 pb-0.5">${pricing.originalPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onAddToCart(prod)}
                      className="w-full flex items-center justify-center gap-2 border border-black hover:bg-magenta hover:border-magenta bg-white hover:text-white text-black py-2.5 px-3 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer focus:outline-none"
                    >
                      <Icons.ShoppingBag className="h-3 w-3" />
                      Add to basket
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Aesthetic Modal details popup drawer */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-[#000000]/40 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              layoutId={`card-container-${selectedProduct.id}`}
              className="bg-white rounded-none border-2 border-black overflow-hidden max-w-lg w-full shadow-2xl relative z-10 flex flex-col"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 bg-white/70 backdrop-blur-xs hover:bg-gray-100 text-black p-2 rounded-none transition-colors cursor-pointer border border-black/10 z-20"
              >
                <Icons.X className="h-4 w-4" />
              </button>

              {/* Showcase circle */}
              <div className="bg-[#F5F5F5] h-72 overflow-hidden flex flex-col items-center justify-center relative">
                
                {/* Visual student promo inside modal */}
                {currentUser.role === 'student' && (
                  <span className="absolute top-4 left-4 bg-magenta text-white text-[8px] font-mono font-bold px-2 py-1 rounded-none leading-none tracking-widest uppercase z-10 border border-white/20">
                    STUDENT PRIVILEGE UNLOCKED (20%)
                  </span>
                )}

                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-44 h-44 rounded-full border-4 shadow-xl flex items-center justify-center relative select-none ${
                      selectedProduct.accentColor === "indigo" ? "bg-indigo-50 border-indigo-200 text-indigo-500" :
                      selectedProduct.accentColor === "emerald" ? "bg-emerald-50 border-emerald-200 text-emerald-500" :
                      selectedProduct.accentColor === "purple" ? "bg-purple-50 border-purple-200 text-purple-500" :
                      selectedProduct.accentColor === "amber" ? "bg-amber-50 border-amber-200 text-amber-500" :
                      selectedProduct.accentColor === "orange" ? "bg-orange-50 border-orange-200 text-orange-500" :
                      selectedProduct.accentColor === "blue" ? "bg-blue-50 border-blue-200 text-blue-500" :
                      selectedProduct.accentColor === "magenta" ? "bg-magenta-light border-magenta/25 text-magenta" :
                      "bg-rose-50 border-rose-200 text-rose-500"
                    }`}
                  >
                    <div className="absolute top-2 left-3 w-20 h-10 bg-white/20 rounded-full rotate-[-15deg] blur-xs" />
                    <div>
                      <DynamicIcon name={selectedProduct.iconName} className="h-16 w-16 drop-shadow-md" />
                    </div>
                  </div>
                )}
                
                <span className="text-[8px] font-bold tracking-[0.25em] text-black bg-white/80 backdrop-blur-xs px-3 py-1.5 absolute bottom-4 right-4 uppercase">
                  Atelier Luxury Range
                </span>
              </div>

              {/* Specs body */}
              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                <div>
                  <h3 className="text-lg font-sans font-black uppercase tracking-wider text-[#000000] leading-tight">{selectedProduct.name}</h3>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="bg-magenta-light text-magenta border border-magenta/15 text-[8px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-none leading-none">
                      CATEGORY: {selectedProduct.category}
                    </span>
                    <span className="bg-[#F5F5F5] border border-[#EFEFEF] text-[8px] font-mono text-gray-500 font-bold uppercase tracking-widest px-2.5 py-1 rounded-none leading-none">
                      ICON SCHEMA: {selectedProduct.iconName}
                    </span>
                  </div>
                </div>

                <p className="text-gray-500 text-xs leading-relaxed">
                  {selectedProduct.description}
                </p>

                 {/* Sizes Available */}
                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold text-gray-405 pl-0.5">
                      <span>Bespoke Purchase Size</span>
                      <div className="flex items-center gap-2.5">
                        {selectedUserSize && (
                          <span className="text-[10px] font-mono font-bold text-magenta uppercase">
                            Your Size: {selectedUserSize}
                          </span>
                        )}
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(null);
                            setShowSizeGuide(true);
                          }}
                          className="text-[10px] font-mono font-black text-magenta hover:underline flex items-center gap-1 bg-none border-none p-0 cursor-pointer"
                        >
                          <Icons.Ruler className="h-3 w-3" />
                          <span>Size Guide</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {selectedProduct.sizes.map((sz) => {
                        const isChosen = chosenSizeForCart === sz;
                        const isProfileSize = selectedUserSize === sz;
                        return (
                          <button 
                            key={sz}
                            type="button"
                            onClick={() => setChosenSizeForCart(sz)}
                            className={`w-9 h-9 border text-xs font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                              isChosen 
                                ? "bg-magenta text-white border-magenta shadow-sm ring-1 ring-magenta" 
                                : isProfileSize
                                ? "border-magenta text-magenta bg-magenta-light/20 hover:bg-magenta-light/40"
                                : "border-black/15 text-black hover:border-black bg-white"
                            }`}
                          >
                            <span>{sz}</span>
                            {isProfileSize && (
                              <span className="absolute bottom-0 w-1.5 h-1.5 bg-magenta rounded-full transform -translate-y-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {selectedUserSize && selectedProduct.sizes.includes(selectedUserSize) && (
                      <p className="text-[10px] text-[#9C00BF] font-mono font-bold pt-1">
                        ★ Recommended Size {selectedUserSize} based on your standard fit calibration!
                      </p>
                    )}
                  </div>
                )}

                {/* Tailoring Specs */}
                <div className="bg-[#FDF1F6] border border-magenta/15 p-4 rounded-none space-y-1.5">
                  <div className="text-[9px] uppercase tracking-widest font-bold text-magenta pl-0.5">Garment Fabric & Calibrations</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-charcoal/80">
                    <div className="flex items-center gap-1.5 text-black">
                      <Icons.Workflow className="h-3 w-3 text-magenta" />
                      Weave: Avant-Garde Premium Double-Face
                    </div>
                    <div className="flex items-center gap-1.5 text-black">
                      <Icons.Smile className="h-3 w-3 text-magenta" />
                      Fiber: 100% GOTS Standard Organic
                    </div>
                    <div className="flex items-center gap-1.5 text-black">
                      <Icons.ShieldAlert className="h-3 w-3 text-magenta" />
                      Fit Silhouette: Ergonomic Relaxed
                    </div>
                    <div className="flex items-center gap-1.5 text-black">
                      <Icons.Sparkles className="h-3 w-3 text-magenta" />
                      Visual Grade: Museum Curated Tier A
                    </div>
                  </div>
                </div>

                {/* Subfooter action */}
                <div className="flex items-center justify-between border-t border-black/10 pt-4 mt-2">
                  <div>
                    {currentUser.role === 'student' ? (
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 line-through font-mono">Standard Rate: ${selectedProduct.price.toFixed(2)}</span>
                        <span className="text-base font-sans font-black text-magenta leading-none">
                          ${(selectedProduct.price * 0.8).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-sans font-black text-black border-b border-black/30 leading-none pb-0.5">${selectedProduct.price.toFixed(2)}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const productWithSize = {
                          ...selectedProduct,
                          name: `${selectedProduct.name} (Size ${chosenSizeForCart})`
                        };
                        onAddToCart(productWithSize);
                        setSelectedProduct(null);
                      }}
                      className="bg-magenta hover:bg-magenta-hover text-white font-bold text-[10px] py-3.5 px-6 rounded-none tracking-widest uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer border-none"
                    >
                      <Icons.ShoppingBag className="h-3.5 w-3.5" />
                      Add to basket
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
