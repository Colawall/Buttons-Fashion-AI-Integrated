import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { CartItem, User, Product, CurrencyCode, Order } from "../types";
import { formatCurrency } from "../utils/currency";
import CheckoutFlow from "./CheckoutFlow";

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
  onOrderCreated?: (order: Order) => void;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  cartItems,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCreated
}: ShoppingCartProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("NGN");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Calculate pricing values in base USD
  const isStudent = currentUser.role === "student";
  
  const originalSubtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const discountAmount = isStudent ? originalSubtotal * 0.2 : 0;
  const finalSubtotal = originalSubtotal - discountAmount;
  const deliveryFee = cartItems.length > 0 ? 3.99 : 0;
  const tax = finalSubtotal * 0.08;
  const orderTotal = finalSubtotal + deliveryFee + tax;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setIsCheckoutOpen(true);
  };

  const handleOrderCompleted = (order: Order) => {
    if (onOrderCreated) {
      onOrderCreated(order);
    }
    onClearCart();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop screen filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50"
            />

            {/* Cart Sidebar panel */}
            <motion.div
              id="panel-shopping-cart-sidebar"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[440px] bg-white shadow-2xl border-l border-black z-50 flex flex-col justify-between font-sans rounded-none"
            >
              {/* Header portion */}
              <div className="p-5 border-b border-[#EFEFEF] flex items-center justify-between bg-white text-black shrink-0">
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

              {/* Currency Selector Bar in Cart */}
              <div className="bg-[#FAF9FA] border-b border-[#EFEFEF] px-5 py-2.5 flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <Icons.Globe className="h-3 w-3 text-black" />
                  Display Currency:
                </span>
                <div className="flex gap-1">
                  {(["NGN", "USD", "EUR", "GBP", "CAD"] as CurrencyCode[]).map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setSelectedCurrency(cur)}
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 border cursor-pointer transition-all ${
                        selectedCurrency === cur
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {cur === "NGN" ? "₦ NGN" : cur === "USD" ? "$ USD" : cur === "EUR" ? "€ EUR" : cur === "GBP" ? "£ GBP" : "CA$"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart list portfolio */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F9F9F9]">
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
                    const itemBasePrice = isStudent ? item.product.price * 0.8 : item.product.price;
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
                                  <span className="font-bold text-black font-mono">
                                    {formatCurrency(itemBasePrice, selectedCurrency)}
                                  </span>
                                  <span className="text-[10px] text-gray-400 line-through font-mono">
                                    {formatCurrency(item.product.price, selectedCurrency)}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-bold text-black font-mono">
                                  {formatCurrency(item.product.price, selectedCurrency)}
                                </span>
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
                        <Icons.PiggyBank className="h-4 w-4 text-magenta" />
                        Student Discount Active (20%)
                      </span>
                      <span>Saved {formatCurrency(discountAmount, selectedCurrency)}</span>
                    </div>
                  )}

                  {/* Payment Channel Indicator */}
                  <div className="p-2.5 bg-[#FAF9FA] border border-gray-200 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-gray-500 uppercase">Payment Channel:</span>
                    <span className="font-bold text-black uppercase flex items-center gap-1">
                      {selectedCurrency === "NGN" ? (
                        <>
                          <Icons.Landmark className="h-3 w-3 text-emerald-600" />
                          <span>Direct Naira Bank Transfer</span>
                        </>
                      ) : (
                        <>
                          <Icons.CreditCard className="h-3 w-3 text-blue-600" />
                          <span>PayPal Global Gateway</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Bill points */}
                  <div className="space-y-1.5 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Subtotal Standard</span>
                      <span className="font-medium text-black font-mono">{formatCurrency(originalSubtotal, selectedCurrency)}</span>
                    </div>
                    {isStudent && (
                      <div className="flex justify-between text-magenta font-bold">
                        <span>Privilege Discount (-20%)</span>
                        <span className="font-mono">-{formatCurrency(discountAmount, selectedCurrency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Carbon-Neutral Dispatch</span>
                      <span className="font-medium text-black font-mono">{formatCurrency(deliveryFee, selectedCurrency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (8.0%)</span>
                      <span className="font-medium text-black font-mono">{formatCurrency(tax, selectedCurrency)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-black border-t border-[#EFEFEF] pt-3 mt-2">
                      <span>ESTIMATED GRAND TOTAL</span>
                      <span className="font-mono">{formatCurrency(orderTotal, selectedCurrency)}</span>
                    </div>
                  </div>

                  <button
                    id="btn-checkout-trigger"
                    onClick={handleCheckout}
                    className="w-full bg-black hover:bg-black/90 text-white font-bold text-xs py-4 rounded-none tracking-widest uppercase transition-all shadow-md cursor-pointer border-none flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Payment & Delivery</span>
                    <Icons.ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Complete Checkout & Delivery Multi-Step Flow */}
      <CheckoutFlow
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        currentUser={currentUser}
        initialCurrency={selectedCurrency}
        onOrderCompleted={handleOrderCompleted}
      />
    </>
  );
}
