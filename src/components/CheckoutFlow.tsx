import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { CartItem, User, CurrencyCode, DeliveryDetails, Order, PaymentAccount, PaymentTransaction } from "../types";
import { CURRENCY_CONFIGS, convertFromUsd, formatCurrency, formatDirectAmount } from "../utils/currency";
import BrandLogo from "./BrandLogo";

interface CheckoutFlowProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currentUser: User;
  onOrderCompleted: (order: Order) => void;
  initialCurrency?: CurrencyCode;
}

export default function CheckoutFlow({
  isOpen,
  onClose,
  cartItems,
  currentUser,
  onOrderCompleted,
  initialCurrency = "NGN"
}: CheckoutFlowProps) {
  // Step state: 1 = Currency & Method, 2 = Payment Auth & Confirmation, 3 = Delivery Details, 4 = Waybill & Tracking
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(initialCurrency);
  
  // Payment Accounts from Admin
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  // Payment Transaction States
  const [paymentReference] = useState(() => `BF-${Math.floor(100000 + Math.random() * 900000)}`);
  const [orderNumber] = useState(() => `BTNS-${Math.floor(100000 + Math.random() * 900000)}`);
  const [proofNote, setProofNote] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Pending Confirmation state
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<PaymentTransaction | null>(null);
  const [isPendingConfirmation, setIsPendingConfirmation] = useState(false);
  const [confirmationSuccess, setConfirmationSuccess] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [rejectionNotice, setRejectionNotice] = useState<string | null>(null);

  // Delivery Form State
  const [deliveryForm, setDeliveryForm] = useState<DeliveryDetails>({
    fullName: currentUser.username || "",
    email: currentUser.email || "",
    phone: currentUser.phone || "+234 ",
    address: "",
    apartment: "",
    city: selectedCurrency === "NGN" ? "Lagos" : "New York",
    state: selectedCurrency === "NGN" ? "Lagos State" : "NY",
    country: selectedCurrency === "NGN" ? "Nigeria" : "United States",
    postalCode: selectedCurrency === "NGN" ? "100001" : "10001",
    deliveryOption: "standard",
    notes: ""
  });

  const [deliveryErrors, setDeliveryErrors] = useState<Record<string, string>>({});
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Polling ref for cleanup
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch admin-configured payment accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoadingAccounts(true);
      try {
        const res = await fetch("/api/payment-accounts?activeOnly=true");
        if (res.ok) {
          const data: PaymentAccount[] = await res.json();
          setPaymentAccounts(data);
        }
      } catch (err) {
        console.error("Failed to load payment accounts:", err);
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  // Filter accounts for selected currency
  const availableAccounts = paymentAccounts.filter(a => a.currency === selectedCurrency && a.isActive);

  // Auto-select primary or first account for selected currency
  useEffect(() => {
    if (availableAccounts.length > 0) {
      const primary = availableAccounts.find(a => a.isPrimary) || availableAccounts[0];
      setSelectedAccountId(primary.id);
    } else {
      setSelectedAccountId("");
    }
  }, [selectedCurrency, paymentAccounts]);

  // Calculations
  const isStudent = currentUser.role === "student";
  const originalSubtotalUsd = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const discountUsd = isStudent ? originalSubtotalUsd * 0.2 : 0;
  const subtotalAfterDiscountUsd = originalSubtotalUsd - discountUsd;
  const deliveryFeeUsd = cartItems.length > 0 ? 3.99 : 0;
  const taxUsd = subtotalAfterDiscountUsd * 0.08;
  const totalUsd = subtotalAfterDiscountUsd + deliveryFeeUsd + taxUsd;

  // Converted values
  const convertedTotal = convertFromUsd(totalUsd, selectedCurrency);
  const isNaira = selectedCurrency === "NGN";

  // Selected account details or fallback
  const activeSelectedAccount = availableAccounts.find(a => a.id === selectedAccountId) || availableAccounts[0] || {
    id: "fallback-acc",
    currency: selectedCurrency,
    accountType: isNaira ? "bank_transfer" : "wire_transfer",
    bankName: isNaira ? "Providus Bank" : "JPMorgan Chase Bank",
    accountNumber: isNaira ? "8034567891" : "9876543210",
    accountName: "BUTTONS FASHION ATELIER ENTERPRISES",
    instructions: "Please include your Reference Code in the payment description.",
    isActive: true,
    createdAt: new Date().toISOString()
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Timer counter when pending
  useEffect(() => {
    if (isPendingConfirmation && !confirmationSuccess) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPendingConfirmation, confirmationSuccess]);

  // Polling for Transaction Confirmation
  useEffect(() => {
    if (isPendingConfirmation && pendingTransaction?.id && !confirmationSuccess) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/transactions/${pendingTransaction.id}`);
          if (res.ok) {
            const data: PaymentTransaction = await res.json();
            if (data.status === "confirmed") {
              setConfirmationSuccess(true);
              setPendingTransaction(data);
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

              // Auto advance to delivery details after celebration
              setTimeout(() => {
                setCurrentStep(3);
                setIsPendingConfirmation(false);
              }, 1500);
            } else if (data.status === "rejected") {
              setRejectionNotice(data.rejectionReason || "Payment was not verified by admin.");
              setIsPendingConfirmation(false);
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            }
          }
        } catch (e) {
          console.error("Polling transaction error:", e);
        }
      }, 2000);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isPendingConfirmation, pendingTransaction?.id, confirmationSuccess]);

  // Handle "I have made payment" button click
  const handlePaymentSubmitted = async () => {
    setIsSubmittingPayment(true);
    setRejectionNotice(null);

    const itemsSummary = cartItems.map(i => `${i.quantity}x ${i.product.name}`).join(", ");

    const payload = {
      orderNumber,
      reference: paymentReference,
      amount: convertedTotal,
      amountInUsd: totalUsd,
      currency: selectedCurrency,
      paymentAccountId: activeSelectedAccount.id,
      paymentAccountDetails: {
        bankName: activeSelectedAccount.bankName,
        accountNumber: activeSelectedAccount.accountNumber,
        accountName: activeSelectedAccount.accountName,
        currency: selectedCurrency,
        routingOrSwift: activeSelectedAccount.routingOrSwift
      },
      userEmail: currentUser.email,
      userName: currentUser.username,
      userPhone: currentUser.phone,
      paymentMethod: isNaira ? "naira_bank_transfer" : "dollar_bank_transfer",
      proofNote: proofNote,
      itemsCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
      itemsSummary: itemsSummary
    };

    try {
      const res = await fetch("/api/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.transaction) {
        setPendingTransaction(data.transaction);
        setIsPendingConfirmation(true);
        setElapsedSeconds(0);
      } else {
        // Fallback simulation
        const fallbackTxn: PaymentTransaction = {
          id: `txn-${Date.now()}`,
          orderNumber,
          reference: paymentReference,
          userEmail: currentUser.email,
          userName: currentUser.username,
          currency: selectedCurrency,
          amount: convertedTotal,
          amountInUsd: totalUsd,
          paymentAccountDetails: {
            bankName: activeSelectedAccount.bankName,
            accountNumber: activeSelectedAccount.accountNumber,
            accountName: activeSelectedAccount.accountName,
            currency: selectedCurrency
          },
          paymentMethod: isNaira ? "naira_bank_transfer" : "dollar_bank_transfer",
          status: "pending",
          itemsCount: cartItems.length,
          itemsSummary: itemsSummary,
          createdAt: new Date().toISOString()
        };
        setPendingTransaction(fallbackTxn);
        setIsPendingConfirmation(true);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      const fallbackTxn: PaymentTransaction = {
        id: `txn-${Date.now()}`,
        orderNumber,
        reference: paymentReference,
        userEmail: currentUser.email,
        userName: currentUser.username,
        currency: selectedCurrency,
        amount: convertedTotal,
        amountInUsd: totalUsd,
        paymentAccountDetails: {
          bankName: activeSelectedAccount.bankName,
          accountNumber: activeSelectedAccount.accountNumber,
          accountName: activeSelectedAccount.accountName,
          currency: selectedCurrency
        },
        paymentMethod: isNaira ? "naira_bank_transfer" : "dollar_bank_transfer",
        status: "pending",
        itemsCount: cartItems.length,
        itemsSummary: itemsSummary,
        createdAt: new Date().toISOString()
      };
      setPendingTransaction(fallbackTxn);
      setIsPendingConfirmation(true);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Validate Delivery form
  const validateDeliveryForm = () => {
    const errors: Record<string, string> = {};
    if (!deliveryForm.fullName.trim()) errors.fullName = "Recipient name is required";
    if (!deliveryForm.phone.trim() || deliveryForm.phone.trim().length < 7) errors.phone = "Valid phone number is required";
    if (!deliveryForm.address.trim()) errors.address = "Street delivery address is required";
    if (!deliveryForm.city.trim()) errors.city = "City is required";
    if (!deliveryForm.state.trim()) errors.state = "State/Province is required";
    setDeliveryErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Final Order Submission
  const handleFinalizeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDeliveryForm()) return;

    setIsSubmittingOrder(true);

    const orderPayload = {
      orderNumber: orderNumber,
      trackingNumber: `TRACK-${selectedCurrency === "NGN" ? "NG" : "INT"}-${Math.floor(100000 + Math.random() * 900000)}`,
      userEmail: currentUser.email,
      userName: currentUser.username,
      items: cartItems,
      currency: selectedCurrency,
      subtotal: convertFromUsd(originalSubtotalUsd, selectedCurrency),
      discount: convertFromUsd(discountUsd, selectedCurrency),
      deliveryFee: convertFromUsd(deliveryFeeUsd, selectedCurrency),
      tax: convertFromUsd(taxUsd, selectedCurrency),
      total: convertedTotal,
      paymentMethod: isNaira ? "naira_bank_transfer" : "dollar_bank_transfer",
      paymentStatus: "paid",
      paymentDetails: {
        reference: paymentReference,
        transactionId: pendingTransaction?.id || `TXN-${Date.now()}`,
        paidAt: pendingTransaction?.confirmedAt || new Date().toISOString(),
        bankName: activeSelectedAccount.bankName,
        accountNumber: activeSelectedAccount.accountNumber,
        confirmedBy: pendingTransaction?.confirmedBy || "sunshinekolawole1@gmail.com"
      },
      deliveryDetails: deliveryForm
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
      const createdOrder = await response.json();
      setConfirmedOrder(createdOrder);
      onOrderCompleted(createdOrder);
      setCurrentStep(4);
    } catch (err) {
      const fallbackOrder: Order = {
        id: `ord-${Date.now()}`,
        ...orderPayload,
        status: "tailoring",
        createdAt: new Date().toISOString()
      } as Order;
      setConfirmedOrder(fallbackOrder);
      onOrderCompleted(fallbackOrder);
      setCurrentStep(4);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
      {/* Dark backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={currentStep === 4 ? onClose : undefined}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs"
      />

      {/* Main Checkout Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative bg-white w-full max-w-3xl border border-black shadow-2xl z-20 my-auto overflow-hidden flex flex-col rounded-none"
      >
        {/* Top Atelier Bar */}
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-6 w-6 text-white" color="#FFFFFF" />
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] leading-none">
                BUTTONS ATELIER CHECKOUT
              </h2>
              <p className="text-[8px] text-gray-400 font-mono tracking-widest uppercase mt-0.5">
                SECURE SUPER ADMIN CONFIRMED TRANSACTION
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-transparent border-none p-1 cursor-pointer transition-colors"
          >
            <Icons.X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="bg-[#FAF9FA] border-b border-[#EAEAEA] px-6 py-3">
          <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-wider">
            
            {/* Step 1 */}
            <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? "text-black" : "text-gray-400"}`}>
              <span className={`w-5 h-5 flex items-center justify-center rounded-none font-mono text-[9px] ${
                currentStep > 1 ? "bg-black text-white" : currentStep === 1 ? "border border-black bg-white text-black" : "bg-gray-200 text-gray-500"
              }`}>
                {currentStep > 1 ? "✓" : "1"}
              </span>
              <span className="hidden sm:inline">Currency & Total</span>
            </div>

            <div className="flex-1 h-[1px] bg-gray-200 mx-2" />

            {/* Step 2 */}
            <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? "text-black" : "text-gray-400"}`}>
              <span className={`w-5 h-5 flex items-center justify-center rounded-none font-mono text-[9px] ${
                currentStep > 2 ? "bg-black text-white" : currentStep === 2 ? "border border-black bg-white text-black" : "bg-gray-200 text-gray-500"
              }`}>
                {currentStep > 2 ? "✓" : "2"}
              </span>
              <span>
                Payment & Approval
              </span>
            </div>

            <div className="flex-1 h-[1px] bg-gray-200 mx-2" />

            {/* Step 3 */}
            <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? "text-black" : "text-gray-400"}`}>
              <span className={`w-5 h-5 flex items-center justify-center rounded-none font-mono text-[9px] ${
                currentStep > 3 ? "bg-black text-white" : currentStep === 3 ? "border border-black bg-white text-black" : "bg-gray-200 text-gray-500"
              }`}>
                {currentStep > 3 ? "✓" : "3"}
              </span>
              <span>Delivery Details</span>
            </div>

            <div className="flex-1 h-[1px] bg-gray-200 mx-2" />

            {/* Step 4 */}
            <div className={`flex items-center gap-1.5 ${currentStep === 4 ? "text-emerald-700 font-black" : "text-gray-400"}`}>
              <span className={`w-5 h-5 flex items-center justify-center rounded-none font-mono text-[9px] ${
                currentStep === 4 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                4
              </span>
              <span className="hidden sm:inline">Dispatched Waybill</span>
            </div>

          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">

          {/* ==================================================== */}
          {/* STEP 1: CURRENCY SELECTION & OVERVIEW */}
          {/* ==================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-black">
                  Select Settlement Currency
                </h3>
                <p className="text-xs text-gray-500 mt-1 font-sans">
                  Account details configured by the Super Admin will be provided for your transfer in Nigerian Naira or Global Currencies.
                </p>
              </div>

              {/* Currency Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* NGN Card */}
                <div
                  onClick={() => setSelectedCurrency("NGN")}
                  className={`p-4 border cursor-pointer transition-all relative ${
                    selectedCurrency === "NGN"
                      ? "border-black bg-white shadow-md ring-1 ring-black"
                      : "border-gray-200 bg-[#FAFAFA] hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🇳🇬</span>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                          <span>NGN (₦) - Nigerian Naira</span>
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 text-[8px] font-mono font-bold uppercase tracking-wider border border-emerald-300">
                          Direct Bank Transfer
                        </span>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-black flex items-center justify-center">
                      {selectedCurrency === "NGN" && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-baseline justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">Amount in NGN:</span>
                    <span className="text-sm font-black font-mono text-black">{formatCurrency(totalUsd, "NGN")}</span>
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1.5 font-sans">
                    Transfer to official Nigerian bank accounts managed by Super Admin.
                  </p>
                </div>

                {/* USD Card */}
                <div
                  onClick={() => setSelectedCurrency("USD")}
                  className={`p-4 border cursor-pointer transition-all relative ${
                    selectedCurrency === "USD"
                      ? "border-black bg-white shadow-md ring-1 ring-black"
                      : "border-gray-200 bg-[#FAFAFA] hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🇺🇸</span>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                          <span>USD ($) - US Dollar</span>
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-800 text-[8px] font-mono font-bold uppercase tracking-wider border border-blue-300">
                          US Wire / ACH / PayPal
                        </span>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-black flex items-center justify-center">
                      {selectedCurrency === "USD" && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-baseline justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">Amount in USD:</span>
                    <span className="text-sm font-black font-mono text-black">{formatCurrency(totalUsd, "USD")}</span>
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1.5 font-sans">
                    International wire transfer or direct payment to admin account.
                  </p>
                </div>

                {/* EUR Card */}
                <div
                  onClick={() => setSelectedCurrency("EUR")}
                  className={`p-4 border cursor-pointer transition-all relative ${
                    selectedCurrency === "EUR"
                      ? "border-black bg-white shadow-md ring-1 ring-black"
                      : "border-gray-200 bg-[#FAFAFA] hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🇪🇺</span>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                          <span>EUR (€) - Euro</span>
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-800 text-[8px] font-mono font-bold uppercase tracking-wider border border-blue-300">
                          SEPA Direct Transfer
                        </span>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-black flex items-center justify-center">
                      {selectedCurrency === "EUR" && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-baseline justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">Amount in EUR:</span>
                    <span className="text-sm font-black font-mono text-black">{formatCurrency(totalUsd, "EUR")}</span>
                  </div>
                </div>

                {/* GBP Card */}
                <div
                  onClick={() => setSelectedCurrency("GBP")}
                  className={`p-4 border cursor-pointer transition-all relative ${
                    selectedCurrency === "GBP"
                      ? "border-black bg-white shadow-md ring-1 ring-black"
                      : "border-gray-200 bg-[#FAFAFA] hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🇬🇧</span>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                          <span>GBP (£) - British Pound</span>
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-800 text-[8px] font-mono font-bold uppercase tracking-wider border border-blue-300">
                          UK Faster Payments
                        </span>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-black flex items-center justify-center">
                      {selectedCurrency === "GBP" && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-baseline justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">Amount in GBP:</span>
                    <span className="text-sm font-black font-mono text-black">{formatCurrency(totalUsd, "GBP")}</span>
                  </div>
                </div>

              </div>

              {/* Itemized summary breakdown */}
              <div className="bg-[#FAF9FA] p-4 border border-[#EAEAEA] space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Basket Standard Value</span>
                  <span className="font-mono">{formatCurrency(originalSubtotalUsd, selectedCurrency)}</span>
                </div>
                {isStudent && (
                  <div className="flex justify-between text-magenta font-bold">
                    <span>Student Privilege Discount (20%)</span>
                    <span className="font-mono">-{formatCurrency(discountUsd, selectedCurrency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Carbon-Neutral Dispatch Fee</span>
                  <span className="font-mono">{formatCurrency(deliveryFeeUsd, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-mono">{formatCurrency(taxUsd, selectedCurrency)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between text-sm font-black text-black">
                  <span>TOTAL PAYABLE ({selectedCurrency})</span>
                  <span className="font-mono">{formatCurrency(totalUsd, selectedCurrency)}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                id="btn-proceed-to-payment"
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full bg-black hover:bg-black/90 text-white font-mono font-bold text-xs py-4 uppercase tracking-widest border-none cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>View Official Account Details</span>
                <Icons.ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ==================================================== */}
          {/* STEP 2: PAYMENT AUTHENTICATION & ADMIN APPROVAL */}
          {/* ==================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6">
              
              {!isPendingConfirmation && (
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-[10px] font-mono uppercase tracking-wider text-gray-500 hover:text-black flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer"
                >
                  <Icons.ArrowLeft className="h-3 w-3" /> Change Currency
                </button>
              )}

              {/* Rejection Warning if applicable */}
              {rejectionNotice && (
                <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Icons.AlertTriangle className="h-4 w-4 text-rose-600" />
                    Previous Payment Notice Declined
                  </div>
                  <p>{rejectionNotice}</p>
                  <p className="text-[10px] text-rose-600">Please re-check your transfer or submit a new payment notification below.</p>
                </div>
              )}

              {/* Header banner */}
              <div className="bg-[#FAF0FF] border border-[#9C00BF]/30 p-4">
                <div className="flex items-center gap-2">
                  <Icons.Landmark className="h-5 w-5 text-magenta" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-magenta">
                    Official Buttons Fashion Atelier Bank Account Details
                  </h3>
                </div>
                <p className="text-[11px] text-gray-600 mt-1 font-sans leading-relaxed">
                  Make your transfer to the account details below configured by the Super Admin. After completing the payment, click the <strong>&quot;I have made payment&quot;</strong> button to alert the Super Admin for immediate confirmation.
                </p>
              </div>

              {/* Multiple Account Selector if more than 1 configured */}
              {availableAccounts.length > 1 && !isPendingConfirmation && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-600 block">
                    Select Preferred Beneficiary Account:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableAccounts.map(acc => (
                      <div
                        key={acc.id}
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={`p-3 border cursor-pointer transition-all text-xs font-mono ${
                          selectedAccountId === acc.id
                            ? "border-black bg-white shadow-xs ring-1 ring-black"
                            : "border-gray-200 bg-[#FAFAFA] hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-black uppercase">{acc.bankName}</span>
                          {acc.isPrimary && (
                            <span className="bg-black text-white text-[8px] px-1.5 py-0.5 uppercase">Primary</span>
                          )}
                        </div>
                        <div className="text-gray-600 text-[11px] mt-1">{acc.accountNumber}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* High-visibility Bank Account Details Card */}
              <div className="border-2 border-black bg-white p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block">Beneficiary Bank / Institution</span>
                    <h4 className="text-sm font-black text-black uppercase mt-0.5">{activeSelectedAccount.bankName}</h4>
                  </div>
                  <span className="px-2 py-1 bg-black text-white text-[9px] font-mono uppercase tracking-widest font-bold">
                    {selectedCurrency} Account
                  </span>
                </div>

                {/* Account Number with 1-click Copy */}
                <div className="bg-[#FAF9FA] p-3.5 border border-gray-300 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">Account Number / IBAN</span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-black tracking-widest">
                      {activeSelectedAccount.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeSelectedAccount.accountNumber, "account")}
                    className="bg-black hover:bg-magenta text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-2 border-none cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    {copiedField === "account" ? (
                      <>
                        <Icons.Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Icons.Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Beneficiary Name & Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-[#FAF9FA] p-3 border border-gray-200">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">Account Name / Beneficiary</span>
                    <span className="text-xs font-bold text-black uppercase font-mono block mt-0.5">
                      {activeSelectedAccount.accountName}
                    </span>
                  </div>

                  <div className="bg-[#FAF9FA] p-3 border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">Exact Amount to Pay</span>
                      <span className="text-sm font-black text-emerald-700 font-mono block mt-0.5">
                        {formatCurrency(totalUsd, selectedCurrency)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(convertedTotal.toFixed(2), "amount")}
                      className="text-[9px] font-mono font-bold text-black hover:text-magenta uppercase underline bg-transparent border-none cursor-pointer"
                    >
                      {copiedField === "amount" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Routing / SWIFT (if present) */}
                {activeSelectedAccount.routingOrSwift && (
                  <div className="bg-[#FAF9FA] p-3 border border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">Routing / SWIFT / Sort Code</span>
                      <span className="text-xs font-mono font-bold text-black">{activeSelectedAccount.routingOrSwift}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeSelectedAccount.routingOrSwift || "", "routing")}
                      className="text-[9px] font-mono font-bold text-black hover:text-magenta uppercase underline bg-transparent border-none cursor-pointer"
                    >
                      {copiedField === "routing" ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}

                {/* Reference Code */}
                <div className="bg-[#FAF9FA] p-3 border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">Payment Reference Code (Memo)</span>
                    <span className="text-xs font-mono font-bold text-black">{paymentReference}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentReference, "reference")}
                    className="text-[9px] font-mono font-bold text-black hover:text-magenta uppercase underline bg-transparent border-none cursor-pointer"
                  >
                    {copiedField === "reference" ? "Copied" : "Copy"}
                  </button>
                </div>

                {/* Admin Instructions (if any) */}
                {activeSelectedAccount.instructions && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-[10px] text-amber-900 font-mono flex items-start gap-2">
                    <Icons.Info className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span><strong>Admin Note:</strong> {activeSelectedAccount.instructions}</span>
                  </div>
                )}
              </div>

              {/* ---------------------------------------------------- */}
              {/* PENDING APPROVAL TERMINAL (When user clicked "I have made payment") */}
              {/* ---------------------------------------------------- */}
              {isPendingConfirmation ? (
                <div className="border border-black p-6 bg-zinc-950 text-white space-y-4 font-mono">
                  
                  {confirmationSuccess ? (
                    <div className="text-center py-4 space-y-2">
                      <div className="w-12 h-12 bg-emerald-600 text-white flex items-center justify-center mx-auto rounded-full">
                        <Icons.Check className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
                        🎉 Transaction Confirmed by Super Admin!
                      </h4>
                      <p className="text-xs text-gray-300 font-sans">
                        Your payment has been officially approved. Proceeding to delivery details...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
                          </div>
                          <div>
                            <span className="text-xs uppercase font-bold tracking-wider text-amber-400 block">
                              PENDING SUPER ADMIN CONFIRMATION
                            </span>
                            <span className="text-[9px] text-gray-400">
                              Elapsed: {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, "0")}s
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-700 text-[9px] font-bold tracking-widest uppercase">
                          Action Required: Admin Confirmation
                        </span>
                      </div>

                      {/* Explanation box */}
                      <div className="bg-zinc-900 p-4 border border-zinc-800 space-y-2 text-[11px] text-gray-300 font-sans">
                        <p className="flex items-center gap-1.5 text-white font-mono font-bold">
                          <Icons.Send className="h-3.5 w-3.5 text-magenta" />
                          Notification Dispatched to Super Admin!
                        </p>
                        <p>
                          A notification containing your transaction details (Ref: <strong>{paymentReference}</strong>, Amount: <strong>{formatCurrency(totalUsd, selectedCurrency)}</strong>) has been sent directly to the Super Admin&apos;s page and email (<strong>sunshinekolawole1@gmail.com</strong>).
                        </p>
                        <p className="text-gray-400 text-[10px]">
                          As soon as the Super Admin clicks &quot;Confirm Transaction&quot;, this screen will automatically advance you to the Delivery Details &amp; Tracking page.
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Icons.Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                          Live synchronization listening for admin approval...
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsPendingConfirmation(false)}
                          className="text-gray-400 hover:text-white underline bg-transparent border-none cursor-pointer"
                        >
                          Cancel / Edit
                        </button>
                      </div>
                    </>
                  )}

                </div>
              ) : (
                /* "I have made payment" action button */
                <div className="space-y-3">
                  
                  {/* Optional reference / notes note */}
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Transfer Note / Sender Name (Optional):
                    </label>
                    <input
                      type="text"
                      value={proofNote}
                      onChange={(e) => setProofNote(e.target.value)}
                      placeholder="e.g. Transferred from GTBank App by Sunshine"
                      className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs font-mono text-black rounded-none focus:border-black focus:outline-hidden"
                    />
                  </div>

                  <button
                    id="btn-i-have-made-payment"
                    type="button"
                    disabled={isSubmittingPayment}
                    onClick={handlePaymentSubmitted}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs py-4 uppercase tracking-widest border-none cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <Icons.Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Notifying Super Admin...</span>
                      </>
                    ) : (
                      <>
                        <Icons.CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        <span>I have made payment</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-gray-500 text-center font-sans">
                    Clicking this sends an instant notification and email to the Super Admin with your transaction details to confirm.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* ==================================================== */}
          {/* STEP 3: DELIVERY DETAILS & COURIER DISPATCH */}
          {/* ==================================================== */}
          {currentStep === 3 && (
            <form onSubmit={handleFinalizeOrder} className="space-y-5">
              
              <div className="bg-emerald-50 border border-emerald-300 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icons.CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span className="text-xs font-mono font-bold text-emerald-900 uppercase">
                    Payment Verified &amp; Confirmed ({paymentReference})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 uppercase">
                  {formatCurrency(totalUsd, selectedCurrency)}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-black">
                  Boutique Delivery &amp; Client Profile
                </h3>
                <p className="text-xs text-gray-500 mt-1 font-sans">
                  Provide the recipient and destination address for courier dispatch and live waybill routing.
                </p>
              </div>

              {/* Recipient details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-700 block mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    value={deliveryForm.fullName}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, fullName: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs font-sans text-black focus:border-black focus:outline-hidden"
                  />
                  {deliveryErrors.fullName && (
                    <p className="text-[10px] text-rose-600 mt-1 font-mono">{deliveryErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-700 block mb-1">
                    Phone Number for Courier *
                  </label>
                  <input
                    type="tel"
                    value={deliveryForm.phone}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, phone: e.target.value })}
                    placeholder="+234 800 000 0000"
                    className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs font-sans text-black focus:border-black focus:outline-hidden"
                  />
                  {deliveryErrors.phone && (
                    <p className="text-[10px] text-rose-600 mt-1 font-mono">{deliveryErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Address details */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-700 block mb-1">
                    Street Address &amp; Building *
                  </label>
                  <input
                    type="text"
                    value={deliveryForm.address}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, address: e.target.value })}
                    placeholder="12 Victoria Island Boulevard, Suite 4B"
                    className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs font-sans text-black focus:border-black focus:outline-hidden"
                  />
                  {deliveryErrors.address && (
                    <p className="text-[10px] text-rose-600 mt-1 font-mono">{deliveryErrors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-700 block mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={deliveryForm.city}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, city: e.target.value })}
                      placeholder="Lagos"
                      className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs font-sans text-black focus:border-black focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-700 block mb-1">
                      State / Province *
                    </label>
                    <input
                      type="text"
                      value={deliveryForm.state}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, state: e.target.value })}
                      placeholder="Lagos State"
                      className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs font-sans text-black focus:border-black focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-700 block mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={deliveryForm.country}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, country: e.target.value })}
                      placeholder="Nigeria"
                      className="w-full bg-[#FAF9FA] border border-gray-300 p-2.5 text-xs font-sans text-black focus:border-black focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Courier Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-700 block">
                  Select Courier Priority:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div
                    onClick={() => setDeliveryForm({ ...deliveryForm, deliveryOption: "standard" })}
                    className={`p-3 border cursor-pointer font-mono text-xs transition-all ${
                      deliveryForm.deliveryOption === "standard"
                        ? "border-black bg-white shadow-xs ring-1 ring-black"
                        : "border-gray-200 bg-[#FAF9FA]"
                    }`}
                  >
                    <div className="font-bold uppercase">Standard Courier</div>
                    <div className="text-[10px] text-gray-500 mt-1">2-4 Business Days</div>
                  </div>

                  <div
                    onClick={() => setDeliveryForm({ ...deliveryForm, deliveryOption: "express" })}
                    className={`p-3 border cursor-pointer font-mono text-xs transition-all ${
                      deliveryForm.deliveryOption === "express"
                        ? "border-black bg-white shadow-xs ring-1 ring-black"
                        : "border-gray-200 bg-[#FAF9FA]"
                    }`}
                  >
                    <div className="font-bold uppercase">Express Air Courier</div>
                    <div className="text-[10px] text-gray-500 mt-1">24-48 Hours</div>
                  </div>

                  <div
                    onClick={() => setDeliveryForm({ ...deliveryForm, deliveryOption: "same_day" })}
                    className={`p-3 border cursor-pointer font-mono text-xs transition-all ${
                      deliveryForm.deliveryOption === "same_day"
                        ? "border-black bg-white shadow-xs ring-1 ring-black"
                        : "border-gray-200 bg-[#FAF9FA]"
                    }`}
                  >
                    <div className="font-bold uppercase">Atelier White Glove</div>
                    <div className="text-[10px] text-gray-500 mt-1">Same Day (Lagos/Metro)</div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full bg-black hover:bg-black/90 text-white font-mono font-bold text-xs py-4 uppercase tracking-widest border-none cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingOrder ? (
                  <>
                    <Icons.Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Generating Official Waybill...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Track Delivery</span>
                    <Icons.ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ==================================================== */}
          {/* STEP 4: WAYBILL & TRACKING RECEIPT */}
          {/* ==================================================== */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto rounded-none">
                  <Icons.PackageCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-base font-black uppercase tracking-wider text-black">
                  Order Successfully Dispatched &amp; Authenticated
                </h3>
                <p className="text-xs text-gray-500 font-sans">
                  Your payment has been settled and verified. Your custom garments are entering tailoring and courier transit.
                </p>
              </div>

              {/* Waybill Card */}
              <div className="border-2 border-black p-5 bg-[#FAF9FA] space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-gray-300 pb-3">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest block">Waybill Tracking ID</span>
                    <span className="text-sm font-black text-black">{confirmedOrder?.trackingNumber || `TRACK-NG-${Math.floor(100000 + Math.random() * 900000)}`}</span>
                  </div>
                  <span className="bg-emerald-600 text-white px-2 py-1 text-[9px] font-bold uppercase tracking-widest">
                    Status: Tailoring / In Transit
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest block">Order Reference</span>
                    <span className="font-bold text-black">{confirmedOrder?.orderNumber || orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest block">Payment Channel</span>
                    <span className="font-bold text-black uppercase">{activeSelectedAccount.bankName} (Confirmed by Admin)</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest block">Recipient</span>
                    <span className="font-bold text-black">{deliveryForm.fullName} ({deliveryForm.phone})</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest block">Delivery Address</span>
                    <span className="text-black font-sans">{deliveryForm.address}, {deliveryForm.city}, {deliveryForm.state}, {deliveryForm.country}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-gray-300 pt-3 space-y-1">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-bold">Ordered Pieces</span>
                  {cartItems.map(item => (
                    <div key={item.product.id} className="flex justify-between text-gray-700">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span className="font-bold text-black">{formatCurrency(item.product.price * item.quantity, selectedCurrency)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-black text-xs">
                    <span>Total Settled:</span>
                    <span>{formatCurrency(totalUsd, selectedCurrency)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-black hover:bg-black/90 text-white font-mono font-bold text-xs py-3.5 uppercase tracking-widest border-none cursor-pointer"
              >
                Close &amp; Return to Atelier
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
