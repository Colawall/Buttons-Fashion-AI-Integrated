import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { CartItem, User, Product } from "../types";

// Dynamic Lucide Icon Helper
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.Circle className={className} />;
  return <IconComponent className={className} />;
};

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currentUser: User;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  cartItems,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: ShoppingCartProps) {
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceNumber] = useState(() => `INV-${Math.floor(100000 + Math.random() * 900000)}`);

  // Calculate pricing values
  const isStudent = currentUser.role === "student";
  
  const originalSubtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const finalSubtotal = isStudent ? originalSubtotal * 0.8 : originalSubtotal;
  const deliveryFee = cartItems.length > 0 ? 3.99 : 0;
  const tax = finalSubtotal * 0.08;
  const orderTotal = finalSubtotal + deliveryFee + tax;
  const totalSavings = originalSubtotal - finalSubtotal;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setShowInvoice(true);
  };

  const handleCloseInvoice = () => {
    setShowInvoice(false);
    onClearCart();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop screen filter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#000000]/40 backdrop-blur-xs z-50"
          />

          {/* Cart Sidebar panel */}
          <motion.div
            id="panel-shopping-cart-sidebar"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl border-l border-black z-50 flex flex-col justify-between font-sans rounded-none"
          >
            {/* Header portion */}
            <div className="p-6 border-b border-[#EFEFEF] flex items-center justify-between bg-white text-black shrink-0">
              <div className="flex items-center gap-2">
                <Icons.ShoppingBag className="text-black h-5 w-5" />
                <h3 className="font-sans font-black uppercase tracking-widest text-black text-sm">My Basket</h3>
                <span className="bg-black text-white text-[8px] font-mono font-bold px-2 py-1 rounded-none tracking-widest uppercase">
                  {cartItems.reduce((sum, i) => sum + i.quantity, 0)} Items
                </span>
              </div>
              <button
                onClick={onClose}
                className="bg-transparent hover:bg-gray-100 text-black p-2 rounded-none cursor-pointer border-none transition-colors"
              >
                <Icons.X className="h-4 w-4" />
              </button>
            </div>

            {/* Cart list portfolio */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F9F9F9]">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3.5">
                  <div className="bg-white p-4 rounded-none border border-black text-black">
                    <Icons.ShoppingBag className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-sans font-black uppercase tracking-widest text-black text-sm">Your Basket Is Empty</h4>
                    <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">Select illustrative handcrafted designs from our boutique and registry.</p>
                  </div>
                </div>
              ) : (
                cartItems.map((item) => {
                  const itemPrice = isStudent ? item.product.price * 0.8 : item.product.price;
                  return (
                    <div key={item.product.id} className="bg-white p-3.5 rounded-none border border-[#EFEFEF] hover:border-black flex items-center gap-3.5 transition-all">
                      {/* Brand product image preview */}
                      <div className="w-14 h-14 bg-gray-50 border border-[#EFEFEF] shrink-0 overflow-hidden relative flex items-center justify-center rounded-none">
                        {item.product.imageUrl ? (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center shrink-0 ${
                            item.product.accentColor === "indigo" ? "bg-indigo-50 text-indigo-500" :
                            item.product.accentColor === "emerald" ? "bg-emerald-50 text-emerald-500" :
                            item.product.accentColor === "purple" ? "bg-purple-50 text-purple-500" :
                            item.product.accentColor === "amber" ? "bg-amber-50 text-amber-500" :
                            item.product.accentColor === "orange" ? "bg-orange-50 text-orange-500" :
                            item.product.accentColor === "blue" ? "bg-blue-50 text-blue-500" :
                            item.product.accentColor === "magenta" ? "bg-magenta-light text-magenta" :
                            "bg-rose-50 text-rose-500"
                          }`}>
                            <DynamicIcon name={item.product.iconName} className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Info & Quantity controls */}
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-black text-xs line-clamp-1">{item.product.name}</h4>
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-gray-400 hover:text-black transition-colors p-0.5 cursor-pointer border-none bg-none"
                          >
                            <Icons.Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {/* Price */}
                          <div className="text-xs">
                            {isStudent ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-black font-mono">${itemPrice.toFixed(2)}</span>
                                <span className="text-[10px] text-gray-400 line-through font-mono">${item.product.price.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span className="font-bold text-black font-mono">${item.product.price.toFixed(2)}</span>
                            )}
                          </div>

                          {/* Controls */}
                          <div className="flex items-center bg-[#F5F5F5] rounded-none p-0.5 border border-gray-200">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, -1)}
                              className="text-gray-500 hover:text-black px-2 py-0.5 text-xs font-bold border-none bg-none cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-black text-xs font-extrabold px-1.5 font-mono">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              className="text-gray-500 hover:text-black px-2 py-0.5 text-xs font-bold border-none bg-none cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Subfooter checkout calculation */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-[#EFEFEF] bg-white shrink-0 space-y-4">
                
                {/* Promo check */}
                {isStudent && (
                  <div className="p-3 bg-white border border-black rounded-none flex items-center justify-between text-[10px] text-black uppercase tracking-widest font-bold">
                    <span className="font-bold flex items-center gap-1.5">
                      <Icons.PiggyBank className="h-4 w-4 text-black" />
                      Perspective Saver Active
                    </span>
                    <span>Saved ${totalSavings.toFixed(2)}</span>
                  </div>
                )}

                {/* Bill points */}
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Subtotal standard</span>
                    <span className="font-medium text-black font-mono">${originalSubtotal.toFixed(2)}</span>
                  </div>
                  {isStudent && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>Privilege Discount (-20%)</span>
                      <span className="font-mono">-${totalSavings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Carbon-Neutral Dispatch</span>
                    <span className="font-medium text-black font-mono">${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8.0%)</span>
                    <span className="font-medium text-black font-mono">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-black border-t border-[#EFEFEF] pt-3 mt-2">
                    <span>ESTIMATED GRAND TOTAL</span>
                    <span className="font-mono">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  id="btn-checkout-trigger"
                  onClick={handleCheckout}
                  className="w-full bg-black hover:bg-black/90 text-white font-bold text-[10px] py-4 rounded-none tracking-widest uppercase transition-all shadow-md cursor-pointer border-none"
                >
                  Pay & Place Order
                </button>
              </div>
            )}

            {/* INVOICE MODAL BACKPOP */}
            <AnimatePresence>
              {showInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#000000]/50 backdrop-blur-xs"
                  />

                  {/* Receipt Dialog */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-none overflow-hidden max-w-sm w-full border-2 border-black relative shadow-2xl z-10 p-6 flex flex-col space-y-4 font-mono text-black"
                  >
                    
                    {/* Top success ring badge */}
                    <div className="text-center space-y-2 pb-2">
                      <div className="bg-black text-white w-12 h-12 rounded-none flex items-center justify-center mx-auto border border-black">
                        <Icons.CheckCircle2 className="h-5 w-5" />
                      </div>
                      <h4 className="font-sans font-black uppercase tracking-widest text-black text-sm pt-1">Payment Authenticated</h4>
                      <p className="font-sans text-gray-400 text-xs mt-1">Thank you for supporting artisanal design.</p>
                    </div>

                    {/* Receipt Body */}
                    <div className="border-t-2 border-dashed border-[#EFEFEF] pt-4 space-y-3.5 text-xs relative">
                      
                      {/* Sideway receipt circular carvings */}
                      <span className="absolute -left-8 -top-2 w-3.5 h-3.5 rounded-full bg-[#000000]/50" />
                      <span className="absolute -right-8 -top-2 w-3.5 h-3.5 rounded-full bg-[#000000]/50" />

                      <div className="flex justify-between">
                        <span>RECEIPT CODE:</span>
                        <span className="font-bold text-black">{invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ORDER DATE:</span>
                        <span className="font-bold text-black">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PERSPECTIVE ID:</span>
                        <span className="font-bold text-black truncate max-w-[150px]">{currentUser.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CLASS RIGHT:</span>
                        <span className="font-bold text-black uppercase">{currentUser.role.replace('_', ' ')}</span>
                      </div>

                      {/* Items loop */}
                      <div className="border-t border-[#EFEFEF] pt-3 space-y-2.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Ordered Artworks</span>
                        {cartItems.map(item => {
                          const itemPrice = isStudent ? item.product.price * 0.8 : item.product.price;
                          return (
                            <div key={item.product.id} className="flex justify-between text-gray-600">
                              <span className="text-left truncate max-w-[210px]">{item.quantity}x {item.product.name}</span>
                              <span className="font-semibold text-black">${(itemPrice * item.quantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Math Summary */}
                      <div className="border-t-2 border-[#EFEFEF] pt-3.5 space-y-1.5 text-right text-gray-600">
                        <div>Subtotal standard: ${originalSubtotal.toFixed(2)}</div>
                        {isStudent && <div className="text-red-600 font-bold">Privilege Promo: -${totalSavings.toFixed(2)}</div>}
                        <div>Eco Courier: ${deliveryFee.toFixed(2)}</div>
                        <div>Assessed Tax (8.0%): ${tax.toFixed(2)}</div>
                        <div className="text-sm font-bold text-black border-t border-black pt-2.5 flex justify-between">
                          <span>Total Settled:</span>
                          <span>${orderTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cargo progress block */}
                    <div className="bg-[#F5F5F5] border border-[#EFEFEF] p-3 rounded-none flex items-center gap-3 text-[10px] font-sans text-gray-500">
                      <Icons.Rocket className="h-4 w-4 text-black animate-pulse" />
                      <div>
                        <div className="font-bold text-black uppercase tracking-wider text-[9px]">Simulated Handoff</div>
                        <div className="mt-0.5">Dispatched securely to {currentUser.email} within 24 hours.</div>
                      </div>
                    </div>

                    <button
                      onClick={handleCloseInvoice}
                      className="w-full bg-black hover:bg-[#000000]/90 text-white font-sans font-bold text-[10px] py-4 rounded-none border-none cursor-pointer tracking-widest uppercase transition-colors"
                    >
                      Awesome, thank you!
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
