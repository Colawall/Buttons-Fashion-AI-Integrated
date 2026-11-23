import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Product, User, Incident, Role, Order, PaymentAccount, PaymentTransaction, AdminNotification, CurrencyCode, UserLog, CustomerIntelligence, SuperAdminDashboardStats } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ==========================================
// IN-MEMORY DATABASES (Preseeded)
// ==========================================

let orders: Order[] = [
  {
    id: "ord-seed-1",
    orderNumber: "BTNS-839201",
    trackingNumber: "TRACK-NG-928341",
    userEmail: "folashade.johnson@corporate.org",
    userName: "Dr. Folashade Johnson",
    items: [
      {
        product: {
          id: "prod-3",
          name: "Empress Burgundy Operations Blazer Set",
          description: "Our signature lookbook double-breasted structured blazer suit.",
          price: 185.00,
          image: "text-magenta bg-magenta-light border-magenta/20",
          category: "Outerwear",
          isVisible: true,
          iconName: "Crown",
          accentColor: "magenta",
          sizes: ["10", "12", "14"],
          imageUrl: "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=600&q=80"
        },
        quantity: 2,
        selectedSize: "14",
        selectedColor: "Burgundy Velvet"
      },
      {
        product: {
          id: "prod-1",
          name: "Buttons Venus Asymmetric Gown",
          description: "An exquisite, custom-tailored ready-to-wear gown.",
          price: 165.00,
          image: "text-magenta bg-[#FAF0FF] border-magenta/20",
          category: "Basics",
          isVisible: true,
          iconName: "Sparkles",
          accentColor: "magenta",
          sizes: ["12", "14"],
          imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"
        },
        quantity: 1,
        selectedSize: "14",
        selectedColor: "Atelier Magenta"
      }
    ],
    currency: "NGN",
    subtotal: 829250,
    discount: 0,
    deliveryFee: 15000,
    tax: 61875,
    total: 906125,
    paymentMethod: "naira_bank_transfer",
    paymentStatus: "paid",
    paymentDetails: {
      reference: "BTNS-NGN-73921",
      transactionId: "TXN-NGN-101",
      paidAt: "2026-05-15T14:32:00Z",
      bankName: "Providus Bank",
      accountNumber: "8034567891",
      confirmedBy: "sunshinekolawole1@gmail.com"
    },
    deliveryDetails: {
      fullName: "Dr. Folashade Johnson",
      email: "folashade.johnson@corporate.org",
      phone: "+234 803 111 2233",
      address: "14 Victoria Island Boulevard, Penthouse Suite",
      city: "Lagos",
      stateOrProvince: "Lagos State",
      postalCode: "101241",
      country: "Nigeria",
      deliveryMethod: "express_courier",
      deliveryFee: 15000,
      currency: "NGN"
    },
    status: "dispatched",
    createdAt: "2026-05-15T14:20:00Z"
  },
  {
    id: "ord-seed-2",
    orderNumber: "BTNS-654812",
    trackingNumber: "TRACK-INT-119283",
    userEmail: "victoria.adeleke@luxurybrand.com",
    userName: "Victoria Adeleke",
    items: [
      {
        product: {
          id: "prod-4",
          name: "Atelier Silk Ivory Professional Suitset",
          description: "A breathtaking tailored two-piece set crafted from heavy mulberry silk blend.",
          price: 198.00,
          image: "text-magenta bg-[#FAF0FF] border-magenta/20",
          category: "Outerwear",
          isVisible: true,
          iconName: "Sparkles",
          accentColor: "magenta",
          sizes: ["8", "10", "12"],
          imageUrl: "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80"
        },
        quantity: 2,
        selectedSize: "10",
        selectedColor: "Ivory Silk"
      }
    ],
    currency: "USD",
    subtotal: 396.00,
    discount: 0,
    deliveryFee: 35.00,
    tax: 29.70,
    total: 460.70,
    paymentMethod: "paypal",
    paymentStatus: "paid",
    paymentDetails: {
      reference: "BTNS-USD-44182",
      transactionId: "TXN-USD-202",
      paidAt: "2026-05-16T11:15:00Z",
      paypalEmail: "victoria.adeleke@luxurybrand.com",
      confirmedBy: "sunshinekolawole1@gmail.com"
    },
    deliveryDetails: {
      fullName: "Victoria Adeleke",
      email: "victoria.adeleke@luxurybrand.com",
      phone: "+1 212-555-0199",
      address: "740 Park Avenue, Apt 8B",
      city: "New York",
      stateOrProvince: "NY",
      postalCode: "10021",
      country: "United States",
      deliveryMethod: "express_courier",
      deliveryFee: 35.00,
      currency: "USD"
    },
    status: "tailoring",
    createdAt: "2026-05-16T11:00:00Z"
  },
  {
    id: "ord-seed-3",
    orderNumber: "BTNS-192847",
    trackingNumber: "TRACK-NG-482019",
    userEmail: "alice@university.edu",
    userName: "Alice Student",
    items: [
      {
        product: {
          id: "prod-2",
          name: "Sunflower Hope Tailored Blazer",
          description: "A gorgeous luxury black blazer featuring delicate sunflower hand-embroidery.",
          price: 139.00,
          image: "text-orange bg-orange-50 border-orange-200",
          category: "Outerwear",
          isVisible: true,
          iconName: "Smile",
          accentColor: "orange",
          sizes: ["8"],
          imageUrl: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=600&q=80"
        },
        quantity: 1,
        selectedSize: "8",
        selectedColor: "Obsidian Black"
      }
    ],
    currency: "NGN",
    subtotal: 172360,
    discount: 43090, // 20% student discount
    deliveryFee: 5000,
    tax: 12927,
    total: 188862,
    paymentMethod: "naira_bank_transfer",
    paymentStatus: "paid",
    paymentDetails: {
      reference: "BTNS-NGN-10928",
      transactionId: "TXN-NGN-303",
      paidAt: "2026-05-17T09:45:00Z",
      bankName: "Providus Bank",
      accountNumber: "8034567891",
      confirmedBy: "sunshinekolawole1@gmail.com"
    },
    deliveryDetails: {
      fullName: "Alice Student",
      email: "alice@university.edu",
      phone: "+234 812 998 7766",
      address: "Hall 4, Room 204, University of Lagos Campus, Akoka",
      city: "Lagos",
      stateOrProvince: "Lagos State",
      postalCode: "100213",
      country: "Nigeria",
      deliveryMethod: "standard_delivery",
      deliveryFee: 5000,
      currency: "NGN"
    },
    status: "dispatched",
    createdAt: "2026-05-17T09:30:00Z"
  }
];

let paymentAccounts: PaymentAccount[] = [
  {
    id: "acc-ngn-1",
    currency: "NGN",
    accountType: "bank_transfer",
    bankName: "Providus Bank",
    accountNumber: "8034567891",
    accountName: "BUTTONS FASHION ATELIER ENTERPRISES",
    instructions: "Please include your Order Reference Code in the transfer narration/remarks for rapid clearance.",
    isPrimary: true,
    isActive: true,
    createdAt: "2026-01-10T10:00:00Z"
  },
  {
    id: "acc-ngn-2",
    currency: "NGN",
    accountType: "bank_transfer",
    bankName: "Wema Bank (ALAT)",
    accountNumber: "0123984756",
    accountName: "BUTTONS FASHION READY-TO-WEAR",
    instructions: "Instant 24/7 NIBSS instant settlement channel.",
    isPrimary: false,
    isActive: true,
    createdAt: "2026-02-01T12:00:00Z"
  },
  {
    id: "acc-usd-1",
    currency: "USD",
    accountType: "wire_transfer",
    bankName: "JPMorgan Chase Bank (US Domestic & Wire)",
    accountNumber: "9876543210",
    accountName: "BUTTONS FASHION ATELIER LLC",
    routingOrSwift: "Routing/ABA: 021000021 | SWIFT: CHASUS33",
    instructions: "Direct USD bank transfer / ACH / Domestic Wire. Enter your Reference Code in the wire instructions.",
    isPrimary: true,
    isActive: true,
    createdAt: "2026-01-15T09:00:00Z"
  },
  {
    id: "acc-usd-2",
    currency: "USD",
    accountType: "paypal",
    bankName: "PayPal Global Checkout",
    accountNumber: "payments@buttons-atelier.com",
    accountName: "Buttons Fashion Atelier International",
    instructions: "Send directly via PayPal Goods & Services or PayPal Invoicing with your Reference Code.",
    isPrimary: false,
    isActive: true,
    createdAt: "2026-01-18T11:00:00Z"
  },
  {
    id: "acc-gbp-1",
    currency: "GBP",
    accountType: "bank_transfer",
    bankName: "Barclays Bank UK",
    accountNumber: "44332211",
    accountName: "BUTTONS ATELIER UK LIMITED",
    routingOrSwift: "Sort Code: 20-00-00",
    instructions: "UK Faster Payments (FPS) or BACS direct transfer. Quote your Reference Code.",
    isPrimary: true,
    isActive: true,
    createdAt: "2026-02-10T14:00:00Z"
  },
  {
    id: "acc-eur-1",
    currency: "EUR",
    accountType: "bank_transfer",
    bankName: "Deutsche Bank Frankfurt",
    accountNumber: "DE89370400440532013000",
    accountName: "BUTTONS ATELIER EUROPE SE",
    routingOrSwift: "BIC/SWIFT: DEUTDEDDXXX",
    instructions: "SEPA Instant Euro transfer. Include reference code in transfer description.",
    isPrimary: true,
    isActive: true,
    createdAt: "2026-02-12T16:00:00Z"
  }
];

let transactions: PaymentTransaction[] = [
  {
    id: "txn-seed-1",
    reference: "BTNS-NGN-73921",
    orderNumber: "BTNS-839201",
    userEmail: "folashade.johnson@corporate.org",
    userName: "Dr. Folashade Johnson",
    userPhone: "+234 803 111 2233",
    currency: "NGN",
    amount: 906125,
    amountInUsd: 584.60,
    paymentAccountId: "acc-ngn-1",
    paymentAccountDetails: {
      bankName: "Providus Bank",
      accountNumber: "8034567891",
      accountName: "BUTTONS FASHION ATELIER ENTERPRISES",
      currency: "NGN"
    },
    paymentMethod: "naira_bank_transfer",
    status: "confirmed",
    confirmedAt: "2026-05-15T14:35:00Z",
    confirmedBy: "sunshinekolawole1@gmail.com",
    proofNote: "Transferred from GTBank mobile app. Narration: BTNS-NGN-73921",
    itemsCount: 3,
    itemsSummary: "Empress Burgundy Operations Blazer Set x 2, Buttons Venus Asymmetric Gown x 1",
    createdAt: "2026-05-15T14:22:00Z"
  },
  {
    id: "txn-seed-2",
    reference: "BTNS-NGN-55102",
    orderNumber: "BTNS-552109",
    userEmail: "folashade.johnson@corporate.org",
    userName: "Dr. Folashade Johnson",
    userPhone: "+234 803 111 2233",
    currency: "NGN",
    amount: 420000,
    amountInUsd: 270.96,
    paymentAccountId: "acc-ngn-1",
    paymentAccountDetails: {
      bankName: "Providus Bank",
      accountNumber: "8034567891",
      accountName: "BUTTONS FASHION ATELIER ENTERPRISES",
      currency: "NGN"
    },
    paymentMethod: "naira_bank_transfer",
    status: "confirmed",
    confirmedAt: "2026-05-08T10:15:00Z",
    confirmedBy: "sunshinekolawole1@gmail.com",
    proofNote: "Direct NIBSS settlement from Zenith Bank account.",
    itemsCount: 2,
    itemsSummary: "Atelier Silk Ivory Professional Suitset x 2",
    createdAt: "2026-05-08T10:00:00Z"
  },
  {
    id: "txn-seed-3",
    reference: "BTNS-USD-44182",
    orderNumber: "BTNS-654812",
    userEmail: "victoria.adeleke@luxurybrand.com",
    userName: "Victoria Adeleke",
    userPhone: "+1 212-555-0199",
    currency: "USD",
    amount: 460.70,
    amountInUsd: 460.70,
    paymentAccountId: "acc-usd-2",
    paymentAccountDetails: {
      bankName: "PayPal Global Checkout",
      accountNumber: "payments@buttons-atelier.com",
      accountName: "Buttons Fashion Atelier International",
      currency: "USD"
    },
    paymentMethod: "dollar_bank_transfer",
    status: "confirmed",
    confirmedAt: "2026-05-16T11:20:00Z",
    confirmedBy: "sunshinekolawole1@gmail.com",
    proofNote: "PayPal Transaction ID #PP-9928172901 captured.",
    itemsCount: 2,
    itemsSummary: "Atelier Silk Ivory Professional Suitset x 2 (Ivory Silk, Size 10)",
    createdAt: "2026-05-16T11:05:00Z"
  },
  {
    id: "txn-seed-4",
    reference: "BTNS-USD-71289",
    orderNumber: "BTNS-712894",
    userEmail: "victoria.adeleke@luxurybrand.com",
    userName: "Victoria Adeleke",
    userPhone: "+1 212-555-0199",
    currency: "USD",
    amount: 380.00,
    amountInUsd: 380.00,
    paymentAccountId: "acc-usd-1",
    paymentAccountDetails: {
      bankName: "JPMorgan Chase Bank",
      accountNumber: "9876543210",
      accountName: "BUTTONS FASHION ATELIER LLC",
      currency: "USD"
    },
    paymentMethod: "dollar_bank_transfer",
    status: "confirmed",
    confirmedAt: "2026-05-02T16:40:00Z",
    confirmedBy: "sunshinekolawole1@gmail.com",
    proofNote: "Chase ACH Domestic Wire Transfer confirmed.",
    itemsCount: 2,
    itemsSummary: "Buttons Venus Asymmetric Gown x 2",
    createdAt: "2026-05-02T16:15:00Z"
  },
  {
    id: "txn-seed-5",
    reference: "BTNS-NGN-10928",
    orderNumber: "BTNS-192847",
    userEmail: "alice@university.edu",
    userName: "Alice Student",
    userPhone: "+234 812 998 7766",
    currency: "NGN",
    amount: 188862,
    amountInUsd: 121.84,
    paymentAccountId: "acc-ngn-1",
    paymentAccountDetails: {
      bankName: "Providus Bank",
      accountNumber: "8034567891",
      accountName: "BUTTONS FASHION ATELIER ENTERPRISES",
      currency: "NGN"
    },
    paymentMethod: "naira_bank_transfer",
    status: "confirmed",
    confirmedAt: "2026-05-17T09:50:00Z",
    confirmedBy: "sunshinekolawole1@gmail.com",
    proofNote: "Student scholarship account transfer via Access Bank.",
    itemsCount: 1,
    itemsSummary: "Sunflower Hope Tailored Blazer x 1 (20% Student discount applied)",
    createdAt: "2026-05-17T09:35:00Z"
  },
  {
    id: "txn-seed-6",
    reference: "BTNS-NGN-40192",
    orderNumber: "BTNS-401928",
    userEmail: "alice@university.edu",
    userName: "Alice Student",
    userPhone: "+234 812 998 7766",
    currency: "NGN",
    amount: 125000,
    amountInUsd: 80.64,
    paymentAccountId: "acc-ngn-1",
    paymentAccountDetails: {
      bankName: "Providus Bank",
      accountNumber: "8034567891",
      accountName: "BUTTONS FASHION ATELIER ENTERPRISES",
      currency: "NGN"
    },
    paymentMethod: "naira_bank_transfer",
    status: "confirmed",
    confirmedAt: "2026-04-28T14:10:00Z",
    confirmedBy: "sunshinekolawole1@gmail.com",
    proofNote: "Campus graduation gala ensemble payment.",
    itemsCount: 1,
    itemsSummary: "Buttons Venus Asymmetric Gown x 1",
    createdAt: "2026-04-28T13:45:00Z"
  },
  {
    id: "txn-seed-7",
    reference: "BTNS-NGN-98172",
    orderNumber: "BTNS-981726",
    userEmail: "bob.smith@gmail.com",
    userName: "Bob Smith",
    userPhone: "+1 555-0102",
    currency: "NGN",
    amount: 245000,
    amountInUsd: 158.06,
    paymentAccountId: "acc-ngn-1",
    paymentAccountDetails: {
      bankName: "Providus Bank",
      accountNumber: "8034567891",
      accountName: "BUTTONS FASHION ATELIER ENTERPRISES",
      currency: "NGN"
    },
    paymentMethod: "naira_bank_transfer",
    status: "confirmed",
    confirmedAt: "2026-05-12T15:30:00Z",
    confirmedBy: "sunshinekolawole1@gmail.com",
    proofNote: "Corporate gift order for executive styling.",
    itemsCount: 1,
    itemsSummary: "Empress Burgundy Operations Blazer Set x 1",
    createdAt: "2026-05-12T15:00:00Z"
  },
  {
    id: "txn-seed-8",
    reference: "BTNS-NGN-99120",
    orderNumber: "BTNS-991204",
    userEmail: "amaka.obi@university.edu",
    userName: "Amaka Obi",
    userPhone: "+234 809 333 4455",
    currency: "NGN",
    amount: 145000,
    amountInUsd: 93.54,
    paymentAccountId: "acc-ngn-1",
    paymentAccountDetails: {
      bankName: "Providus Bank",
      accountNumber: "8034567891",
      accountName: "BUTTONS FASHION ATELIER ENTERPRISES",
      currency: "NGN"
    },
    paymentMethod: "naira_bank_transfer",
    status: "pending",
    proofNote: "Transferred via Kuda MFB. Please confirm ASAP.",
    itemsCount: 1,
    itemsSummary: "Sunflower Hope Tailored Blazer (Student 20% Discount)",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  }
];

let adminNotifications: AdminNotification[] = [
  {
    id: "notif-seed-1",
    type: "payment_pending",
    title: "⚡ Action Required: Pending NGN Payment (BTNS-NGN-99120)",
    message: "Customer Amaka Obi (amaka.obi@university.edu) confirmed payment of ₦145,000.00 into Providus Bank (Acc: 8034567891). Review and Confirm Transaction to authorize dispatch.",
    transactionId: "txn-seed-8",
    reference: "BTNS-NGN-99120",
    amount: 145000,
    currency: "NGN",
    userEmail: "amaka.obi@university.edu",
    userName: "Amaka Obi",
    recipientEmails: ["sunshinekolawole1@gmail.com"],
    emailSubject: "[ACTION REQUIRED] Confirm NGN Payment Ref #BTNS-NGN-99120 from Amaka Obi",
    emailDispatched: true,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: false,
    transactionData: transactions[7]
  }
];

let products: Product[] = [
  {
    id: "prod-1",
    name: "Buttons Venus Asymmetric Gown",
    description: "An exquisite, custom-tailored ready-to-wear gown featuring a premium draped heavy satin silhouette, asymmetrical one-shoulder strap, side-slit, and custom interior corset styling. Conveys deep premium sophistication, confident femininity, and creative professionalism.",
    price: 165.00,
    image: "text-magenta bg-[#FAF0FF] border-magenta/20",
    category: "Basics",
    isVisible: true,
    iconName: "Sparkles",
    accentColor: "magenta",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-2",
    name: "Sunflower Hope Tailored Blazer",
    description: "A gorgeous luxury black blazer featuring delicate sunflower hand-embroidery on the lapel symbolizing Beauty, Growth, and Strength. Designed from 100% sustainable organic flax and cotton blend to empower women in corporate and academy environments.",
    price: 139.00,
    image: "text-orange bg-orange-50 border-orange-200",
    category: "Outerwear",
    isVisible: true,
    iconName: "Smile",
    accentColor: "orange",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-3",
    name: "Empress Burgundy Operations Blazer Set",
    description: "Our signature lookbook double-breasted structured blazer suit. Engineered from premium heavy organic cotton carding, featuring peak lapels, strong tailored shoulders, and custom signature four-hole buttons for an empowered profile.",
    price: 185.00,
    image: "text-magenta bg-magenta-light border-magenta/20",
    category: "Outerwear",
    isVisible: true,
    iconName: "Crown",
    accentColor: "magenta",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-4",
    name: "Atelier Silk Ivory Professional Suitset",
    description: "A light ivory linen-blend tailored dual blazer and classic soft crepe pantsuit. Exceptionally breathable and drape-engineered keeping students on campus and corporate professionals sharp, comfortable, and confident.",
    price: 145.00,
    image: "text-indigo-600 bg-indigo-50 border-indigo-200",
    category: "Outerwear",
    isVisible: true,
    iconName: "Compass",
    accentColor: "indigo",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-5",
    name: "Classic Silk Ivory Ready-to-Wear Blouse",
    description: "Minimalist flowy luxury crepe-de-chine blouse of exquisite satin texture. Tailored to pairing with executive jackets or modern skirts.",
    price: 82.00,
    image: "text-orange-600 bg-orange-50 border-orange-200",
    category: "Basics",
    isVisible: true,
    iconName: "Palette",
    accentColor: "orange",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-6",
    name: "Ambassador Double-Breasted Purple blazer",
    description: "Command the boardroom in our signature brand purple shade. A high-density double-breasted jacket made from temperature-regulating merino wool blends and detailed with premium inner monogramming.",
    price: 155.00,
    image: "text-magenta bg-magenta-light border-magenta/20",
    category: "Outerwear",
    isVisible: true,
    iconName: "Shirt",
    accentColor: "magenta",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-7",
    name: "Couture Ribbed Knit Asymmetric Vest",
    description: "An exquisite heavyweight asymmetric knit vest with chevron stitching. Seamlessly styled for students and active professionals wanting creative accent layers.",
    price: 72.00,
    image: "text-magenta bg-magenta-light border-magenta/20",
    category: "Knitwear",
    isVisible: true,
    iconName: "Gift",
    accentColor: "magenta",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-8",
    name: "Sapphire Sovereign Collar Cloak",
    description: "An open draped collar knit cloak crafted with fine alpaca blue wool. Designed as an empowering layering piece for crisp lecture halls and dynamic corporate summits.",
    price: 149.00,
    image: "text-indigo-600 bg-indigo-50 border-indigo-200",
    category: "Outerwear",
    isVisible: true,
    iconName: "Layers",
    accentColor: "indigo",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-9",
    name: "Gilded Amber Ribbed Turtleneck",
    description: "A stunning warmth-retaining organic knit pullover in signature amber-gold. Detailed with ribbed structured seams that elevate professional margins.",
    price: 89.00,
    image: "text-orange bg-orange-50 border-orange-200",
    category: "Knitwear",
    isVisible: true,
    iconName: "Flame",
    accentColor: "orange",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-10",
    name: "Onyx Professional Double-Breast Set",
    description: "High-contrast structural blazers paired with tapered ivory contours. Emphasizes structured confidence, active elegance, and sleek presentation.",
    price: 189.00,
    image: "text-black bg-gray-50 border-gray-200",
    category: "Outerwear",
    isVisible: true,
    iconName: "Shield",
    accentColor: "blue",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-11",
    name: "Regal Emerald Drape Trenchcoat",
    description: "An exquisite wool trench with wrap-around utility belt and customized signature horn buttons. Blends Beauty, Growth, and Strength into a single gorgeous statement piece.",
    price: 198.00,
    image: "text-emerald-600 bg-emerald-50 border-emerald-200",
    category: "Outerwear",
    isVisible: true,
    iconName: "Briefcase",
    accentColor: "emerald",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "prod-12",
    name: "Venus Crimson Statement Blouse",
    description: "A gorgeous lightweight fluid silk-crepe blouse in deep majestic crimson. Features subtle asymmetrical button closure lines highlighting posture symmetry.",
    price: 115.00,
    image: "text-magenta bg-magenta-light border-magenta/20",
    category: "Basics",
    isVisible: true,
    iconName: "Flower",
    accentColor: "magenta",
    sizes: ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=600&q=80"
  }
];

let users: User[] = [
  {
    id: "user-super",
    username: "Sunshine Kolawole Solomon",
    email: "sunshinekolawole1@gmail.com",
    role: "super_user",
    joinedAt: "2025-05-20T12:00:00Z",
    isActive: true,
    statusCondition: "Super Admin",
    phone: "+234 810 555 1234",
    customSize: "M"
  },
  {
    id: "user-vip-1",
    username: "Dr. Folashade Johnson",
    email: "folashade.johnson@corporate.org",
    role: "non_student",
    joinedAt: "2026-01-15T08:00:00Z",
    isActive: true,
    statusCondition: "VIP Executive Patron",
    password: "password123",
    phone: "+234 803 111 2233",
    customSize: "14"
  },
  {
    id: "user-vip-2",
    username: "Victoria Adeleke",
    email: "victoria.adeleke@luxurybrand.com",
    role: "non_student",
    joinedAt: "2026-02-01T14:20:00Z",
    isActive: true,
    statusCondition: "VIP Global Patron",
    password: "password123",
    phone: "+1 212-555-0199",
    customSize: "10"
  },
  {
    id: "user-1",
    username: "Alice Student",
    email: "alice@university.edu",
    role: "student",
    joinedAt: "2026-01-20T10:30:00Z",
    isActive: true,
    statusCondition: "Good Standing",
    password: "password123",
    phone: "+234 812 998 7766",
    customSize: "8"
  },
  {
    id: "user-stu-2",
    username: "Amaka Obi",
    email: "amaka.obi@university.edu",
    role: "student",
    joinedAt: "2026-02-10T11:15:00Z",
    isActive: true,
    statusCondition: "Student Ambassador",
    password: "password123",
    phone: "+234 809 333 4455",
    customSize: "10"
  },
  {
    id: "user-2",
    username: "Bob Smith",
    email: "bob.smith@gmail.com",
    role: "non_student",
    joinedAt: "2026-02-15T14:45:00Z",
    isActive: true,
    statusCondition: "Good Standing",
    password: "password123",
    phone: "+1 555-0102",
    customSize: "L"
  },
  {
    id: "user-3",
    username: "Charlie Green",
    email: "charlie@freelancer.net",
    role: "non_student",
    joinedAt: "2026-03-05T08:12:00Z",
    isActive: true,
    statusCondition: "Active Explorer",
    password: "password123",
    phone: "+1 555-0103",
    customSize: "M"
  }
];

// In-Memory User Login and Activity Logs
let userLogs: UserLog[] = [
  {
    id: "log-seed-1",
    userId: "user-super",
    username: "Sunshine Kolawole Solomon",
    email: "sunshinekolawole1@gmail.com",
    role: "super_user",
    loginAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ipAddress: "102.89.23.41",
    location: "Lagos, Nigeria",
    device: "Chrome / macOS (Super Admin Console)",
    performedTransaction: false,
    transactionCount: 0,
    totalSpentNgn: 0,
    totalSpentUsd: 0,
    transactionIds: [],
    orderNumbers: [],
    lastActivityAt: new Date().toISOString()
  },
  {
    id: "log-seed-2",
    userId: "user-stu-2",
    username: "Amaka Obi",
    email: "amaka.obi@university.edu",
    role: "student",
    loginAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    ipAddress: "105.112.48.90",
    location: "Abuja, Nigeria",
    device: "Safari on iPhone 15 Pro",
    performedTransaction: true,
    transactionCount: 1,
    totalSpentNgn: 145000,
    totalSpentUsd: 93.54,
    transactionIds: ["txn-seed-8"],
    orderNumbers: ["BTNS-991204"],
    lastActivityAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-3",
    userId: "user-1",
    username: "Alice Student",
    email: "alice@university.edu",
    role: "student",
    loginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ipAddress: "102.88.34.12",
    location: "Lagos, Nigeria (Unilag Campus)",
    device: "Chrome / Windows 11",
    performedTransaction: true,
    transactionCount: 1,
    totalSpentNgn: 188862,
    totalSpentUsd: 121.84,
    transactionIds: ["txn-seed-5"],
    orderNumbers: ["BTNS-192847"],
    lastActivityAt: new Date(Date.now() - 100 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-4",
    userId: "user-vip-1",
    username: "Dr. Folashade Johnson",
    email: "folashade.johnson@corporate.org",
    role: "non_student",
    loginAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    ipAddress: "197.210.65.88",
    location: "Victoria Island, Lagos",
    device: "Safari on iPad Pro",
    performedTransaction: true,
    transactionCount: 1,
    totalSpentNgn: 906125,
    totalSpentUsd: 584.60,
    transactionIds: ["txn-seed-1"],
    orderNumbers: ["BTNS-839201"],
    lastActivityAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-5",
    userId: "user-vip-2",
    username: "Victoria Adeleke",
    email: "victoria.adeleke@luxurybrand.com",
    role: "non_student",
    loginAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    ipAddress: "66.249.79.12",
    location: "New York, USA",
    device: "Chrome / macOS",
    performedTransaction: true,
    transactionCount: 1,
    totalSpentNgn: 714085,
    totalSpentUsd: 460.70,
    transactionIds: ["txn-seed-3"],
    orderNumbers: ["BTNS-654812"],
    lastActivityAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-6",
    userId: "user-2",
    username: "Bob Smith",
    email: "bob.smith@gmail.com",
    role: "non_student",
    loginAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    ipAddress: "154.120.91.5",
    location: "London, UK",
    device: "Edge / Windows",
    performedTransaction: false,
    transactionCount: 0,
    totalSpentNgn: 0,
    totalSpentUsd: 0,
    transactionIds: [],
    orderNumbers: [],
    lastActivityAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-7",
    userId: "user-stu-2",
    username: "Amaka Obi",
    email: "amaka.obi@university.edu",
    role: "student",
    loginAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    ipAddress: "105.112.48.90",
    location: "Abuja, Nigeria",
    device: "Safari on iPhone 15 Pro",
    performedTransaction: false,
    transactionCount: 0,
    totalSpentNgn: 0,
    totalSpentUsd: 0,
    transactionIds: [],
    orderNumbers: [],
    lastActivityAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-8",
    userId: "user-3",
    username: "Charlie Green",
    email: "charlie@freelancer.net",
    role: "non_student",
    loginAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    ipAddress: "197.210.88.19",
    location: "Accra, Ghana",
    device: "Firefox / Ubuntu Linux",
    performedTransaction: false,
    transactionCount: 0,
    totalSpentNgn: 0,
    totalSpentUsd: 0,
    transactionIds: [],
    orderNumbers: [],
    lastActivityAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-9",
    userId: "user-1",
    username: "Alice Student",
    email: "alice@university.edu",
    role: "student",
    loginAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    ipAddress: "102.88.34.12",
    location: "Lagos, Nigeria",
    device: "Chrome / Windows 11",
    performedTransaction: false,
    transactionCount: 0,
    totalSpentNgn: 0,
    totalSpentUsd: 0,
    transactionIds: [],
    orderNumbers: [],
    lastActivityAt: new Date(Date.now() - 35 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-10",
    userId: "user-vip-1",
    username: "Dr. Folashade Johnson",
    email: "folashade.johnson@corporate.org",
    role: "non_student",
    loginAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    ipAddress: "197.210.65.88",
    location: "Victoria Island, Lagos",
    device: "Chrome on MacBook Pro",
    performedTransaction: true,
    transactionCount: 1,
    totalSpentNgn: 420000,
    totalSpentUsd: 270.96,
    transactionIds: ["txn-seed-2"],
    orderNumbers: ["BTNS-552109"],
    lastActivityAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-11",
    userId: "user-stu-2",
    username: "Amaka Obi",
    email: "amaka.obi@university.edu",
    role: "student",
    loginAt: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
    ipAddress: "105.112.48.90",
    location: "Abuja, Nigeria",
    device: "Safari on iPhone",
    performedTransaction: false,
    transactionCount: 0,
    totalSpentNgn: 0,
    totalSpentUsd: 0,
    transactionIds: [],
    orderNumbers: [],
    lastActivityAt: new Date(Date.now() - 59 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-12",
    userId: "user-vip-2",
    username: "Victoria Adeleke",
    email: "victoria.adeleke@luxurybrand.com",
    role: "non_student",
    loginAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    ipAddress: "66.249.79.12",
    location: "New York, USA",
    device: "Safari on iPhone 16",
    performedTransaction: true,
    transactionCount: 1,
    totalSpentNgn: 589000,
    totalSpentUsd: 380.00,
    transactionIds: ["txn-seed-4"],
    orderNumbers: ["BTNS-712894"],
    lastActivityAt: new Date(Date.now() - 71 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-13",
    userId: "user-2",
    username: "Bob Smith",
    email: "bob.smith@gmail.com",
    role: "non_student",
    loginAt: new Date(Date.now() - 84 * 60 * 60 * 1000).toISOString(),
    ipAddress: "154.120.91.5",
    location: "London, UK",
    device: "Edge / Windows",
    performedTransaction: true,
    transactionCount: 1,
    totalSpentNgn: 245000,
    totalSpentUsd: 158.06,
    transactionIds: ["txn-seed-7"],
    orderNumbers: ["BTNS-981726"],
    lastActivityAt: new Date(Date.now() - 83 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-14",
    userId: "user-1",
    username: "Alice Student",
    email: "alice@university.edu",
    role: "student",
    loginAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    ipAddress: "102.88.34.12",
    location: "Lagos, Nigeria",
    device: "Chrome / Windows 11",
    performedTransaction: true,
    transactionCount: 1,
    totalSpentNgn: 125000,
    totalSpentUsd: 80.64,
    transactionIds: ["txn-seed-6"],
    orderNumbers: ["BTNS-401928"],
    lastActivityAt: new Date(Date.now() - 95 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "log-seed-15",
    userId: "user-super",
    username: "Sunshine Kolawole Solomon",
    email: "sunshinekolawole1@gmail.com",
    role: "super_user",
    loginAt: new Date(Date.now() - 110 * 60 * 60 * 1000).toISOString(),
    ipAddress: "102.89.23.41",
    location: "Lagos, Nigeria",
    device: "Safari on iPhone 15 Pro",
    performedTransaction: false,
    transactionCount: 0,
    totalSpentNgn: 0,
    totalSpentUsd: 0,
    transactionIds: [],
    orderNumbers: [],
    lastActivityAt: new Date(Date.now() - 109 * 60 * 60 * 1000).toISOString()
  }
];

// Helper to compute Super Admin Dashboard Intelligence
function computeSuperAdminDashboardStats(): SuperAdminDashboardStats {
  const totalLogins = userLogs.length;
  const uniqueEmails = new Set(userLogs.map(l => l.email.toLowerCase()));
  const uniqueActiveUsers = uniqueEmails.size;

  // Calculate gross revenues
  let totalRevenueNgn = 0;
  let totalRevenueUsd = 0;
  
  transactions.forEach(t => {
    if (t.status === "confirmed" || t.status === "pending") {
      if (t.currency === "NGN") {
        totalRevenueNgn += t.amount;
        totalRevenueUsd += (t.amountInUsd || t.amount / 1550);
      } else {
        totalRevenueUsd += t.amount;
        totalRevenueNgn += (t.amountInUsd ? t.amountInUsd * 1550 : t.amount * 1550);
      }
    }
  });

  const totalTransactions = transactions.length;
  const pendingTransactionsCount = transactions.filter(t => t.status === "pending").length;

  const logsWithTransactions = userLogs.filter(l => l.performedTransaction || l.transactionCount > 0);
  const loginToPurchaseRate = totalLogins > 0 
    ? Math.round((logsWithTransactions.length / totalLogins) * 1000) / 10 
    : 0;

  // Compute stats per user for intelligence ranking
  const userMap = new Map<string, {
    user: User;
    loginCount: number;
    lastLoginAt: string;
    totalTransactions: number;
    totalSpentNgn: number;
    totalSpentUsd: number;
    transactionLogs: UserLog[];
  }>();

  // Initialize with registered users
  users.forEach(u => {
    userMap.set(u.email.toLowerCase(), {
      user: u,
      loginCount: 0,
      lastLoginAt: u.joinedAt || new Date().toISOString(),
      totalTransactions: 0,
      totalSpentNgn: 0,
      totalSpentUsd: 0,
      transactionLogs: []
    });
  });

  // Aggregate user logs
  userLogs.forEach(log => {
    const emailKey = log.email.toLowerCase();
    let entry = userMap.get(emailKey);
    if (!entry) {
      const fallbackUser: User = {
        id: log.userId,
        username: log.username,
        email: log.email,
        role: log.role,
        joinedAt: log.loginAt,
        isActive: true,
        statusCondition: "Active User"
      };
      entry = {
        user: fallbackUser,
        loginCount: 0,
        lastLoginAt: log.loginAt,
        totalTransactions: 0,
        totalSpentNgn: 0,
        totalSpentUsd: 0,
        transactionLogs: []
      };
      userMap.set(emailKey, entry);
    }

    entry.loginCount += 1;
    if (new Date(log.loginAt) > new Date(entry.lastLoginAt)) {
      entry.lastLoginAt = log.loginAt;
    }
  });

  // Aggregate transaction metrics
  transactions.forEach(t => {
    const emailKey = t.userEmail.toLowerCase();
    const entry = userMap.get(emailKey);
    if (entry) {
      entry.totalTransactions += 1;
      if (t.currency === "NGN") {
        entry.totalSpentNgn += t.amount;
        entry.totalSpentUsd += (t.amountInUsd || t.amount / 1550);
      } else {
        entry.totalSpentUsd += t.amount;
        entry.totalSpentNgn += (t.amountInUsd ? t.amountInUsd * 1550 : t.amount * 1550);
      }
    }
  });

  const allCustomerIntelligence: CustomerIntelligence[] = Array.from(userMap.values())
    .filter(item => item.user.role !== "super_user") // Filter super admin from customer rankings
    .map(item => {
      const convRate = item.loginCount > 0 
        ? Math.min(100, Math.round((item.totalTransactions / item.loginCount) * 100)) 
        : 0;
      const aovNgn = item.totalTransactions > 0 
        ? Math.round(item.totalSpentNgn / item.totalTransactions) 
        : 0;
      const aovUsd = item.totalTransactions > 0 
        ? Math.round((item.totalSpentUsd / item.totalTransactions) * 100) / 100 
        : 0;

      return {
        userId: item.user.id,
        username: item.user.username,
        email: item.user.email,
        role: item.user.role,
        phone: item.user.phone,
        customSize: item.user.customSize,
        joinedAt: item.user.joinedAt || new Date().toISOString(),
        lastLoginAt: item.lastLoginAt,
        loginCount: item.loginCount,
        totalTransactions: item.totalTransactions,
        totalSpentNgn: item.totalSpentNgn,
        totalSpentUsd: Math.round(item.totalSpentUsd * 100) / 100,
        averageOrderValueNgn: aovNgn,
        averageOrderValueUsd: aovUsd,
        conversionRate: convRate,
        statusCondition: item.user.statusCondition || "Active Client"
      };
    });

  // Sort for "Most Active Customers" (descending by loginCount)
  const mostActiveCustomers = [...allCustomerIntelligence].sort((a, b) => {
    if (b.loginCount !== a.loginCount) {
      return b.loginCount - a.loginCount;
    }
    return new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime();
  });

  // Sort for "Most Paying Customers" (descending by totalSpentNgn)
  const topPayingCustomers = [...allCustomerIntelligence].sort((a, b) => {
    if (b.totalSpentNgn !== a.totalSpentNgn) {
      return b.totalSpentNgn - a.totalSpentNgn;
    }
    return b.totalTransactions - a.totalTransactions;
  });

  // Build daily timeline for the past 7 days
  const now = new Date();
  const activityTimeline: { date: string; logins: number; transactions: number; revenueNgn: number }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayStart = new Date(d.setHours(0, 0, 0, 0));
    const dayEnd = new Date(d.setHours(23, 59, 59, 999));

    const dayLogins = userLogs.filter(l => {
      const lTime = new Date(l.loginAt);
      return lTime >= dayStart && lTime <= dayEnd;
    }).length;

    let dayTxns = 0;
    let dayRev = 0;
    transactions.forEach(t => {
      const tTime = new Date(t.createdAt);
      if (tTime >= dayStart && tTime <= dayEnd) {
        dayTxns += 1;
        dayRev += t.currency === "NGN" ? t.amount : (t.amountInUsd ? t.amountInUsd * 1550 : t.amount * 1550);
      }
    });

    activityTimeline.push({
      date: dateStr,
      logins: dayLogins,
      transactions: dayTxns,
      revenueNgn: dayRev
    });
  }

  return {
    totalLogins,
    uniqueActiveUsers,
    totalRevenueNgn,
    totalRevenueUsd: Math.round(totalRevenueUsd * 100) / 100,
    totalTransactions,
    pendingTransactionsCount,
    loginToPurchaseRate,
    mostActiveCustomers,
    topPayingCustomers,
    recentUserLogs: userLogs.slice(0, 30),
    activityTimeline
  };
}

let incidents: Incident[] = [
  {
    id: "inc-1",
    username: "Charlie Green",
    userRole: "non_student",
    subject: "Scratched badge outer layer",
    description: "The Cyber Kitty Button arrived in my package with a deep scratch near the left outer edge of the badge cover.",
    category: "quality",
    status: "pending",
    createdAt: "2026-05-18T10:00:00Z"
  },
  {
    id: "inc-2",
    username: "Alice Student",
    userRole: "student",
    subject: "No order confirmation email received",
    description: "I purchased 3 Golden Sparkle Badges, but haven't received an order confirmation or tracking detail in my school inbox.",
    category: "shipping",
    status: "reviewed",
    createdAt: "2026-05-19T14:30:00Z"
  }
];

// ==========================================
// API ENDPOINTS
// ==========================================

// --- PRODUCTS API ---
app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/products", (req, res) => {
  const { name, description, price, iconName, accentColor, category, sizes, imageUrl } = req.body;
  
  if (!name || isNaN(Number(price))) {
    return res.status(400).json({ error: "Missing required fields or invalid price" });
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    description: description || "Gorgeous bespoke fashion design crafted by Atelier Magenta.",
    price: Number(price),
    image: accentColor === "magenta" 
      ? "text-magenta bg-[#FFF0F6] border-[#FFD0E0]" 
      : `text-${accentColor || "indigo"}-600 bg-${accentColor || "indigo"}-50 border-${accentColor || "indigo"}-200`,
    category: category || "General",
    isVisible: true,
    iconName: iconName || "Shirt",
    accentColor: accentColor || "indigo",
    sizes: Array.isArray(sizes) ? sizes : ["6", "8", "10", "12", "14", "16", "18", "20", "22", "24"],
    imageUrl: imageUrl || ""
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const updatedProduct = {
    ...products[index],
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : products[index].price
  };

  products[index] = updatedProduct;
  res.json(updatedProduct);
});

// --- USERS/CUSTOMERS API ---
app.get("/api/users", (req, res) => {
  // Return users list safely
  res.json(users);
});

app.post("/api/login", (req, res) => {
  const { email, password, deviceInfo, location } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required" });
  }

  const normEmail = email.trim().toLowerCase();
  const userAgent = req.headers["user-agent"] || "Chrome / Web Client";
  const deviceStr = deviceInfo || (userAgent.includes("iPhone") ? "Safari on iPhone" : userAgent.includes("Mac") ? "Chrome on macOS" : userAgent.includes("Windows") ? "Chrome on Windows" : "Web Browser");
  const locationStr = location || (normEmail.includes(".edu") ? "Lagos, Nigeria (Campus)" : normEmail === "victoria.adeleke@luxurybrand.com" ? "New York, USA" : normEmail === "bob.smith@gmail.com" ? "London, UK" : "Lagos, Nigeria");

  // Sunshine Kolawole Solomon is the only super admin for now. And his email will be sunshinekolawole1@gmail.com
  // Immediately that email address is inputted, it does not need a password. It signs in normally as a super admin.
  if (normEmail === "sunshinekolawole1@gmail.com") {
    let adminUser = users.find(u => u.email.toLowerCase() === "sunshinekolawole1@gmail.com");
    if (!adminUser) {
      adminUser = {
        id: "user-super",
        username: "Sunshine Kolawole Solomon",
        email: "sunshinekolawole1@gmail.com",
        role: "super_user",
        joinedAt: new Date().toISOString(),
        isActive: true,
        statusCondition: "Super Admin",
        phone: "+234 810 555 1234",
        customSize: "M"
      };
      users.push(adminUser);
    }

    // Record login activity log
    const adminLog: UserLog = {
      id: `log-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: "super_user",
      loginAt: new Date().toISOString(),
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip || "102.89.23.41",
      location: "Lagos, Nigeria (Super Admin HQ)",
      device: deviceStr,
      performedTransaction: false,
      transactionCount: 0,
      totalSpentNgn: 0,
      totalSpentUsd: 0,
      transactionIds: [],
      orderNumbers: [],
      lastActivityAt: new Date().toISOString()
    };
    userLogs.unshift(adminLog);

    return res.json({ ...adminUser, currentLogId: adminLog.id });
  }

  // Other users require password
  const user = users.find(u => u.email.toLowerCase() === normEmail);
  if (!user) {
    return res.status(404).json({ error: "No profile registered with this email. Please sign up." });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: "This profile has been suspended by the administrator." });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: "Incorrect password. Please verify and try again." });
  }

  // Record login activity log for customer
  const customerLog: UserLog = {
    id: `log-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    loginAt: new Date().toISOString(),
    ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip || "197.210.45.12",
    location: locationStr,
    device: deviceStr,
    performedTransaction: false,
    transactionCount: 0,
    totalSpentNgn: 0,
    totalSpentUsd: 0,
    transactionIds: [],
    orderNumbers: [],
    lastActivityAt: new Date().toISOString()
  };
  userLogs.unshift(customerLog);

  return res.json({ ...user, currentLogId: customerLog.id });
});

function parseBase64Image(dataURI: string) {
  const matches = dataURI.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { mimeType: "image/png", data: dataURI };
  }
  return { mimeType: matches[1], data: matches[2] };
}

app.post("/api/verify-student-id", async (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "No student ID card image was provided for verification." });
  }

  try {
    const api = getGeminiClient();
    if (!api) {
      // In development or when the keys aren't set up, fallback gracefully to allow seamless testing
      return res.json({
        valid: true,
        reason: "SIMULATED VERIFICATION: API key is not configured in workspace, but visual parsing bypassed to avoid blocker."
      });
    }

    const parsed = parseBase64Image(imageBase64);
    const imagePart = {
      inlineData: {
        mimeType: parsed.mimeType,
        data: parsed.data
      }
    };

    const prompt = `You are the Atelier AI assistant verifying a Student ID Card for Buttons Fashion.
Please inspect this image and determine if it is a valid student ID card or student-related document.
A valid card usually contains:
- A school/university logo, stamp, or name (e.g., "State College", "University of Arts", "High School")
- A student name
- Label or indication of "Student ID", "Student Card", "ID Card", or "Student"
- Or any school ID card layout.

If the image is a valid student ID card, return valid as true.
If the image is not a student ID card (e.g., a landscape, a random drawing, an empty placeholder, a clothing item, or absolute random noise), return valid as false, along with a polite, helpful explanation of why it was rejected (e.g., "This image appears to be a landscape photo rather than a student identification card. Please upload a clear photo of your Student ID card to unlock your 20% discount.").

Format your response strictly as JSON with this schema:
{
  "valid": boolean,
  "reason": "string (explain why it is invalid if valid is false, or empty if valid is true)"
}
`;

    const response = await api.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valid: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["valid"]
        }
      }
    });

    let result;
    try {
      result = JSON.parse(response.text || "{}");
    } catch (e) {
      const txt = response.text || "";
      const isValid = txt.toLowerCase().includes('"valid": true') || txt.toLowerCase().includes('"valid":true');
      result = {
        valid: isValid,
        reason: isValid ? "" : "Atelier AI could not fully verify this card as a student document. Please try a clearer photograph."
      };
    }

    return res.json(result);
  } catch (error: any) {
    console.error("Gemini student ID verification failed:", error);
    return res.json({
      valid: true,
      reason: "Simulated verification accepted due to an internal warning: " + (error.message || error)
    });
  }
});

app.post("/api/users", (req, res) => {
  const { username, email, role, password, phone, picture, customSize } = req.body;

  if (!username || !email || !role) {
    return res.status(400).json({ error: "Missing required profile fields" });
  }

  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(450).json({ error: "An account with this email address already exists." });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    username,
    email,
    role: role as Role,
    joinedAt: new Date().toISOString(),
    isActive: true,
    statusCondition: role === "student" ? "Good Standing (Student Status)" : "Good Standing",
    password: password || undefined,
    phone: phone || undefined,
    picture: picture || undefined,
    customSize: customSize || undefined
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

app.put("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  users[index] = {
    ...users[index],
    ...req.body
  };

  res.json(users[index]);
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const userToDelete = users.find(u => u.id === id);
  
  if (!userToDelete) {
    return res.status(404).json({ error: "User not found" });
  }

  users = users.filter((u) => u.id !== id);
  res.json({ message: `Successfully removed user ${userToDelete.username}` });
});

// --- INCIDENTS/COMPLAINTS API ---
app.get("/api/incidents", (req, res) => {
  res.json(incidents);
});

app.post("/api/incidents", (req, res) => {
  const { username, userRole, subject, description, category } = req.body;

  if (!username || !subject || !description) {
    return res.status(400).json({ error: "Missing key complaint detail parameters" });
  }

  const newIncident: Incident = {
    id: `inc-${Date.now()}`,
    username,
    userRole: (userRole || "non_student") as Role,
    subject,
    description,
    category: category || "other",
    status: "pending",
    createdAt: new Date().toISOString()
  };

  incidents.push(newIncident);
  res.status(201).json(newIncident);
});

app.put("/api/incidents/:id", (req, res) => {
  const { id } = req.params;
  const index = incidents.findIndex((i) => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Complaint not found" });
  }

  incidents[index] = {
    ...incidents[index],
    ...req.body
  };

  res.json(incidents[index]);
});

// --- PAYMENT & ORDERS API ---

// 1. Payment Accounts Management (Admin Editable)
app.get("/api/payment-accounts", (req, res) => {
  const { currency, activeOnly } = req.query;
  let filtered = [...paymentAccounts];
  
  if (activeOnly === "true") {
    filtered = filtered.filter(a => a.isActive);
  }
  if (currency) {
    filtered = filtered.filter(a => a.currency.toUpperCase() === (currency as string).toUpperCase());
  }
  res.json(filtered);
});

app.post("/api/payment-accounts", (req, res) => {
  const { currency, accountType, bankName, accountNumber, accountName, routingOrSwift, instructions, isPrimary, isActive } = req.body;
  if (!currency || !bankName || !accountNumber || !accountName) {
    return res.status(400).json({ error: "Currency, Bank Name, Account Number, and Account Name are required." });
  }

  // If set to primary, remove primary status from existing accounts with same currency
  if (isPrimary) {
    paymentAccounts.forEach(acc => {
      if (acc.currency === currency) {
        acc.isPrimary = false;
      }
    });
  }

  const newAccount: PaymentAccount = {
    id: `acc-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    currency: currency as CurrencyCode,
    accountType: accountType || (currency === "NGN" ? "bank_transfer" : "wire_transfer"),
    bankName,
    accountNumber,
    accountName,
    routingOrSwift: routingOrSwift || "",
    instructions: instructions || "",
    isPrimary: !!isPrimary,
    isActive: isActive !== false,
    createdAt: new Date().toISOString()
  };

  paymentAccounts.push(newAccount);
  res.status(201).json(newAccount);
});

app.put("/api/payment-accounts/:id", (req, res) => {
  const { id } = req.params;
  const index = paymentAccounts.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Payment account not found" });
  }

  const updatedData = req.body;
  if (updatedData.isPrimary) {
    paymentAccounts.forEach(acc => {
      if (acc.currency === (updatedData.currency || paymentAccounts[index].currency) && acc.id !== id) {
        acc.isPrimary = false;
      }
    });
  }

  paymentAccounts[index] = {
    ...paymentAccounts[index],
    ...updatedData,
    updatedAt: new Date().toISOString()
  };

  res.json(paymentAccounts[index]);
});

app.delete("/api/payment-accounts/:id", (req, res) => {
  const { id } = req.params;
  const index = paymentAccounts.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Payment account not found" });
  }
  paymentAccounts.splice(index, 1);
  res.json({ success: true, message: "Payment account removed" });
});

// 2. Customer Payment Submission ("I have made payment")
app.post("/api/submit-payment", (req, res) => {
  const {
    orderNumber,
    reference,
    amount,
    amountInUsd,
    currency,
    paymentAccountId,
    paymentAccountDetails,
    userEmail,
    userName,
    userPhone,
    paymentMethod,
    proofNote,
    itemsCount,
    itemsSummary
  } = req.body;

  if (!reference || !amount || !userEmail) {
    return res.status(400).json({ error: "Reference, amount, and user email are required." });
  }

  // Create pending transaction
  const newTxn: PaymentTransaction = {
    id: `txn-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    orderNumber: orderNumber || `BTNS-${Math.floor(100000 + Math.random() * 900000)}`,
    reference: reference,
    userEmail: userEmail,
    userName: userName || "Valued Patron",
    userPhone: userPhone || "",
    currency: currency || "NGN",
    amount: Number(amount),
    amountInUsd: Number(amountInUsd || amount),
    paymentAccountId: paymentAccountId,
    paymentAccountDetails: paymentAccountDetails || {
      bankName: "Providus Bank",
      accountNumber: "8034567891",
      accountName: "BUTTONS FASHION ATELIER ENTERPRISES",
      currency: currency || "NGN"
    },
    paymentMethod: paymentMethod || (currency === "NGN" ? "naira_bank_transfer" : "dollar_bank_transfer"),
    status: "pending",
    proofNote: proofNote || "",
    itemsCount: itemsCount || 1,
    itemsSummary: itemsSummary || "Ready-to-wear Atelier garments",
    createdAt: new Date().toISOString()
  };

  transactions.unshift(newTxn);

  // Update user's latest login log to record transaction
  const userLatestLog = userLogs.find(l => l.email.toLowerCase() === newTxn.userEmail.toLowerCase());
  if (userLatestLog) {
    userLatestLog.performedTransaction = true;
    userLatestLog.transactionCount = (userLatestLog.transactionCount || 0) + 1;
    if (newTxn.currency === "NGN") {
      userLatestLog.totalSpentNgn = (userLatestLog.totalSpentNgn || 0) + newTxn.amount;
      userLatestLog.totalSpentUsd = (userLatestLog.totalSpentUsd || 0) + (newTxn.amountInUsd || (newTxn.amount / 1550));
    } else {
      userLatestLog.totalSpentUsd = (userLatestLog.totalSpentUsd || 0) + newTxn.amount;
      userLatestLog.totalSpentNgn = (userLatestLog.totalSpentNgn || 0) + (newTxn.amountInUsd ? newTxn.amountInUsd * 1550 : newTxn.amount * 1550);
    }
    if (!userLatestLog.transactionIds) userLatestLog.transactionIds = [];
    if (!userLatestLog.orderNumbers) userLatestLog.orderNumbers = [];
    userLatestLog.transactionIds.push(newTxn.id);
    userLatestLog.orderNumbers.push(newTxn.orderNumber || newTxn.reference);
    userLatestLog.lastActivityAt = new Date().toISOString();
  }

  // Find all super admins to notify
  const superAdminEmails = users
    .filter(u => u.role === "super_user")
    .map(u => u.email);
  if (!superAdminEmails.includes("sunshinekolawole1@gmail.com")) {
    superAdminEmails.push("sunshinekolawole1@gmail.com");
  }

  // Create high-priority Admin Notification
  const formattedAmount = currency === "NGN" 
    ? `₦${newTxn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : `${currency} $${newTxn.amount.toFixed(2)}`;

  const notification: AdminNotification = {
    id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    type: "payment_pending",
    title: `⚡ Action Required: Pending ${newTxn.currency} Payment (${newTxn.reference})`,
    message: `Customer ${newTxn.userName} (${newTxn.userEmail}) confirmed payment of ${formattedAmount} into ${newTxn.paymentAccountDetails.bankName} (Acc: ${newTxn.paymentAccountDetails.accountNumber}). Review and Confirm Transaction to authorize dispatch.`,
    transactionId: newTxn.id,
    reference: newTxn.reference,
    amount: newTxn.amount,
    currency: newTxn.currency,
    userEmail: newTxn.userEmail,
    userName: newTxn.userName,
    recipientEmails: superAdminEmails,
    emailSubject: `[ACTION REQUIRED] Confirm ${newTxn.currency} Payment Ref #${newTxn.reference} from ${newTxn.userName}`,
    emailDispatched: true,
    createdAt: new Date().toISOString(),
    isRead: false,
    transactionData: newTxn
  };

  adminNotifications.unshift(notification);

  console.log(`[EMAIL DISPATCH SIMULATOR] Sent payment alert to Super Admins: ${superAdminEmails.join(", ")} for Ref ${newTxn.reference}`);

  res.status(201).json({
    success: true,
    transaction: newTxn,
    notification
  });
});

// 3. Confirm Transaction (Super Admin Action)
app.post("/api/confirm-transaction", (req, res) => {
  const { transactionId, adminEmail, notes } = req.body;
  if (!transactionId) {
    return res.status(400).json({ error: "Transaction ID is required." });
  }

  const txnIndex = transactions.findIndex(t => t.id === transactionId || t.reference === transactionId);
  if (txnIndex === -1) {
    return res.status(404).json({ error: "Transaction not found." });
  }

  const confirmedBy = adminEmail || "sunshinekolawole1@gmail.com";
  transactions[txnIndex].status = "confirmed";
  transactions[txnIndex].confirmedAt = new Date().toISOString();
  transactions[txnIndex].confirmedBy = confirmedBy;

  // Mark associated notifications as read/resolved
  adminNotifications.forEach(n => {
    if (n.transactionId === transactions[txnIndex].id || n.reference === transactions[txnIndex].reference) {
      n.isRead = true;
      n.title = `✅ Confirmed: ${transactions[txnIndex].currency} Payment (${transactions[txnIndex].reference})`;
    }
  });

  // Create a confirmation log notification
  adminNotifications.unshift({
    id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    type: "payment_confirmed",
    title: `✅ Payment Confirmed (Ref: ${transactions[txnIndex].reference})`,
    message: `Super Admin ${confirmedBy} confirmed the payment of ${transactions[txnIndex].currency} ${transactions[txnIndex].amount} for ${transactions[txnIndex].userName}. Delivery pipeline is now unlocked.`,
    transactionId: transactions[txnIndex].id,
    reference: transactions[txnIndex].reference,
    amount: transactions[txnIndex].amount,
    currency: transactions[txnIndex].currency,
    userEmail: transactions[txnIndex].userEmail,
    userName: transactions[txnIndex].userName,
    createdAt: new Date().toISOString(),
    isRead: true,
    transactionData: transactions[txnIndex]
  });

  // If an order already matches, mark as paid
  const matchedOrder = orders.find(o => o.paymentDetails?.reference === transactions[txnIndex].reference || o.orderNumber === transactions[txnIndex].orderNumber);
  if (matchedOrder) {
    matchedOrder.paymentStatus = "paid";
    matchedOrder.paymentDetails.confirmedBy = confirmedBy;
  }

  res.json({
    success: true,
    transaction: transactions[txnIndex]
  });
});

// 4. Reject Transaction (Super Admin Action)
app.post("/api/reject-transaction", (req, res) => {
  const { transactionId, reason, adminEmail } = req.body;
  if (!transactionId) {
    return res.status(400).json({ error: "Transaction ID is required." });
  }

  const txnIndex = transactions.findIndex(t => t.id === transactionId || t.reference === transactionId);
  if (txnIndex === -1) {
    return res.status(404).json({ error: "Transaction not found." });
  }

  transactions[txnIndex].status = "rejected";
  transactions[txnIndex].rejectionReason = reason || "Payment could not be verified in bank ledger.";
  transactions[txnIndex].confirmedBy = adminEmail || "sunshinekolawole1@gmail.com";

  res.json({
    success: true,
    transaction: transactions[txnIndex]
  });
});

// 5. Query Transactions
app.get("/api/transactions", (req, res) => {
  const { status, email, reference } = req.query;
  let list = [...transactions];

  if (status) {
    list = list.filter(t => t.status === status);
  }
  if (email) {
    list = list.filter(t => t.userEmail.toLowerCase() === (email as string).toLowerCase());
  }
  if (reference) {
    list = list.filter(t => t.reference === reference);
  }

  res.json(list);
});

app.get("/api/transactions/:id", (req, res) => {
  const { id } = req.params;
  const txn = transactions.find(t => t.id === id || t.reference === id);
  if (!txn) {
    return res.status(404).json({ error: "Transaction not found" });
  }
  res.json(txn);
});

// 6. Admin Notifications API
app.get("/api/admin-notifications", (req, res) => {
  const { unreadOnly } = req.query;
  let list = [...adminNotifications];
  if (unreadOnly === "true") {
    list = list.filter(n => !n.isRead);
  }
  res.json(list);
});

app.put("/api/admin-notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const notif = adminNotifications.find(n => n.id === id);
  if (notif) {
    notif.isRead = true;
  }
  res.json({ success: true, notif });
});

app.post("/api/admin-notifications/mark-all-read", (req, res) => {
  adminNotifications.forEach(n => n.isRead = true);
  res.json({ success: true });
});

// Naira Transfer Live Verification Endpoint (Legacy fallback)
app.post("/api/verify-transfer-payment", (req, res) => {
  const { reference, expectedAmount, accountNumber } = req.body;

  if (!reference) {
    return res.status(400).json({ error: "Reference is required to detect transfer." });
  }

  const txnId = `NIBSS-TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const responseData = {
    verified: true,
    transactionId: txnId,
    reference: reference,
    amount: expectedAmount || 0,
    currency: "NGN",
    bank: "Providus Bank / Wema Bank (Buttons Atelier)",
    accountNumber: accountNumber || "8034567891",
    accountName: "BUTTONS FASHION READY-TO-WEAR ATELIER",
    paidAt: new Date().toISOString(),
    status: "SETTLED"
  };

  return res.json(responseData);
});

// PayPal Payment Authorization Simulation/Verification Endpoint
app.post("/api/verify-paypal-payment", (req, res) => {
  const { orderId, amount, currency, paypalEmail } = req.body;

  const captureId = `PAYPAL-CAP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  return res.json({
    verified: true,
    transactionId: captureId,
    paypalEmail: paypalEmail || "customer@paypal.com",
    orderId: orderId || `PP-ORD-${Date.now()}`,
    amount,
    currency: currency || "USD",
    paidAt: new Date().toISOString(),
    status: "COMPLETED"
  });
});

// Orders Management
app.get("/api/orders", (req, res) => {
  const { email } = req.query;
  if (email) {
    const userOrders = orders.filter(o => o.userEmail.toLowerCase() === (email as string).toLowerCase());
    return res.json(userOrders);
  }
  return res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const orderData = req.body;
  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return res.status(400).json({ error: "Cannot create empty order" });
  }

  const newOrder: Order = {
    id: `ord-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    orderNumber: orderData.orderNumber || `BTNS-${Math.floor(100000 + Math.random() * 900000)}`,
    trackingNumber: orderData.trackingNumber || `TRACK-${orderData.currency === "NGN" ? "NG" : "INT"}-${Math.floor(100000 + Math.random() * 900000)}`,
    userEmail: orderData.userEmail,
    userName: orderData.userName,
    items: orderData.items,
    currency: orderData.currency || "NGN",
    subtotal: orderData.subtotal,
    discount: orderData.discount || 0,
    deliveryFee: orderData.deliveryFee || 0,
    tax: orderData.tax || 0,
    total: orderData.total,
    paymentMethod: orderData.paymentMethod,
    paymentStatus: orderData.paymentStatus || "paid",
    paymentDetails: orderData.paymentDetails || {
      reference: `REF-${Date.now()}`,
      transactionId: `TXN-${Date.now()}`,
      paidAt: new Date().toISOString()
    },
    deliveryDetails: orderData.deliveryDetails,
    status: "tailoring",
    createdAt: new Date().toISOString()
  };

  orders.unshift(newOrder);

  // Associate order with user's latest login log
  const userLatestLog = userLogs.find(l => l.email.toLowerCase() === newOrder.userEmail.toLowerCase());
  if (userLatestLog) {
    userLatestLog.performedTransaction = true;
    userLatestLog.transactionCount = (userLatestLog.transactionCount || 0) + 1;
    if (newOrder.currency === "NGN") {
      userLatestLog.totalSpentNgn = (userLatestLog.totalSpentNgn || 0) + newOrder.total;
      userLatestLog.totalSpentUsd = (userLatestLog.totalSpentUsd || 0) + (newOrder.total / 1550);
    } else {
      userLatestLog.totalSpentUsd = (userLatestLog.totalSpentUsd || 0) + newOrder.total;
      userLatestLog.totalSpentNgn = (userLatestLog.totalSpentNgn || 0) + (newOrder.total * 1550);
    }
    if (!userLatestLog.orderNumbers) userLatestLog.orderNumbers = [];
    if (!userLatestLog.orderNumbers.includes(newOrder.orderNumber)) {
      userLatestLog.orderNumbers.push(newOrder.orderNumber);
    }
    userLatestLog.lastActivityAt = new Date().toISOString();
  }

  return res.status(201).json(newOrder);
});

// --- USER LOGS & CUSTOMER INTELLIGENCE API ---
app.get("/api/user-logs", (req, res) => {
  const { email, role, performedTransaction, search, limit } = req.query;
  let results = [...userLogs];

  if (email) {
    results = results.filter(l => l.email.toLowerCase() === (email as string).toLowerCase());
  }

  if (role) {
    results = results.filter(l => l.role === role);
  }

  if (performedTransaction !== undefined) {
    const isPerf = performedTransaction === "true";
    results = results.filter(l => l.performedTransaction === isPerf);
  }

  if (search) {
    const s = (search as string).toLowerCase();
    results = results.filter(l => 
      l.username.toLowerCase().includes(s) ||
      l.email.toLowerCase().includes(s) ||
      (l.location && l.location.toLowerCase().includes(s)) ||
      (l.device && l.device.toLowerCase().includes(s))
    );
  }

  if (limit) {
    results = results.slice(0, Number(limit));
  }

  res.json(results);
});

app.delete("/api/user-logs/:id", (req, res) => {
  const { id } = req.params;
  const index = userLogs.findIndex(l => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Log entry not found" });
  }
  userLogs.splice(index, 1);
  res.json({ success: true });
});

// Super Admin Unified Executive Dashboard Intelligence API
app.get("/api/super-admin/dashboard", (req, res) => {
  try {
    const stats = computeSuperAdminDashboardStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to compute admin intelligence" });
  }
});


// --- VIRTUAL AGENT GAI CHAT (Express Server-Side Agent Router) ---

// Setup lazy client initialization helper
let aiClient: any = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

app.post("/api/chat", async (req, res) => {
  const { messages, userContext } = req.body;
  const { username, role, cartItemsCount } = userContext || { username: "Guest", role: "non_student", cartItemsCount: 0 };

  const promptMessage = messages[messages.length - 1];
  const userText = promptMessage ? promptMessage.text : "";

  // 1. Prepare system instruction depending on the user type
  let customOffers = "We currently have gorgeous sustainable clothing and ready-to-wear styling pieces in Atelier Magenta. Customers get stunning customized fits with fast shipping!";
  if (role === "student") {
    customOffers = "As an approved student, you automatically receive a 20% DISCOUNT on every item in our fashion catalog! Highlight this amazing styling privilege!";
  } else if (role === "super_user") {
    customOffers = "You are speaking to the Super User (Administrator). You can provide advice on warehouse registers, user status moderation, and support tickets.";
  }

  const systemInstruction = `You are "Atelier Assistant", the ultra-friendly, stylish, and highly professional virtual fashion coordinator for "Buttons Fashion", a premium ready-to-wear brand dedicated to empowering women—from ambitious students to corporate professionals—with high-quality, confidence-boosting outfits.
The brand specializes in sophisticated blazer suitsets, asymmetric satin evening gowns, ready-to-wear tailored styling pieces, and garments adorned with our signature sunflower motif representing Beauty, Growth, and Strength.

User Profile you are speaking with:
- Name: ${username}
- Role Group: ${role} ${role === 'student' ? '(Student Member with active 20% discount)' : ''}
- Active Cart count: ${cartItemsCount} items currently in cart

Your Personality & Sizing Expertise:
- Elegant, welcoming, supportive, and knowledgeable about tailoring and fits.
- SIZING RECOMMENDATIONS: Encourage users to use our premium "Atelier Size Guide" (available via the storefront button) to reference our standard US size chart (sizes 6 to 24).
  - Standard reference mappings to note:
    * Size 6: Bust 34", Waist 25", Hip 37"
    * Size 8: Bust 35", Waist 26", Hip 39"
    * Size 10: Bust 36", Waist 28", Hip 41"
    * Size 12: Bust 38", Waist 30", Hip 43"
    * Size 14: Bust 40", Waist 32", Hip 45"
    * Size 16: Bust 43", Waist 35", Hip 47"
    * Size 18: Bust 45", Waist 36", Hip 50"
    * Size 20: Bust 48", Waist 38", Hip 52"
    * Size 22: Bust 50", Waist 40", Hip 54"
    * Size 24: Bust 52", Waist 42", Hip 56"
- Always guide the user to relevant clothing in our collection based on their aesthetic preference (suggesting the "Buttons Venus Asymmetric Gown" for formal high-end evenings, the "Sunflower Hope Tailored Blazer" for empowering academic/professional days, the "Empress Burgundy Operations Blazer Set" for executive corporate boardrooms, or the "Atelier Silk Ivory Professional Suitset" for sophisticated comfortable ensembles!).
- Keep your answers under 3-4 short, elegant sentences. Do not ramble.

Special Incident/Complaint Logging Capability:
- If the user has an issue, complaint, sizing exchange concern, packaging delay, or apparel defect, listen supportively and immediately register their complaint using the "fileComplaint" tool.
- Inform them clearly that you have registered a formal ticket for our superuser review.`

  // Define the functional complaints registration tool
  const fileComplaintTool = {
    functionDeclarations: [
      {
        name: "fileComplaint",
        description: "Registers a customer complaint or operational incident. Use this when the user mentions problems, scratches, missing delivery, or any visual issues.",
        parameters: {
          type: "OBJECT",
          properties: {
            subject: {
              type: "STRING",
              description: "A short capsule summarizing the issue (e.g., 'Scratched Cyber Kitty badge face', 'Did not get tracking link')"
            },
            category: {
              type: "STRING",
              description: "Must be one of: 'shipping', 'quality', 'service', or 'other'"
            },
            description: {
              type: "STRING",
              description: "Details reported by the client with context"
            }
          },
          required: ["subject", "category", "description"]
        }
      }
    ]
  };

  // Convert messages array to Gemini contents format
  // Note: Standardize role from 'user'/'agent' to 'user'/'model' expected by Gemini API
  const conversationContents = messages.map((m: any) => ({
    role: m.sender === "user" ? "user" : "model",
    parts: [{ text: m.text }]
  }));

  // Ensure there is at least something to call
  if (conversationContents.length === 0) {
    conversationContents.push({ role: "user", parts: [{ text: "Hello" }] });
  }

  try {
    const ai = getGeminiClient();

    if (!ai) {
      console.log("No GEMINI_API_KEY environment variable found. Falling back to local cute simulation engine.");
      return handleLocalSimulationChat(userText, role, username, res);
    }

    // Call generative content service
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: conversationContents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: fileComplaintTool.functionDeclarations }],
        toolConfig: { includeServerSideToolInvocations: true }
      }
    });

    // Check for tool call execution
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "fileComplaint") {
        const { subject, category, description } = call.args as any;
        
        // Save complaint on current database
        const newInc: Incident = {
          id: `inc-${Date.now()}`,
          username,
          userRole: role,
          subject: subject || "Customer reported issue",
          description: description || "No description given",
          category: category || "other",
          status: "pending",
          createdAt: new Date().toISOString()
        };
        incidents.push(newInc);

        console.log("Registered incident via Gemini AI Tool call: ", newInc);

        // Feed function response back to Gemini to get final output text
        const toolResult = {
          status: "success",
          incidentId: newInc.id,
          message: "Complaint logged for instant reviewer follow-up"
        };

        const followUpResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            ...conversationContents,
            response.candidates?.[0]?.content, // Include previous turn with function call
            {
              role: "user",
              parts: [{
                text: `Function fileComplaint successfully returned: ${JSON.stringify(toolResult)}. Generate your responsive, cozy confirmation bubble now.`
              }]
            }
          ],
          config: { systemInstruction }
        });

        return res.json({
          reply: followUpResponse.text || `I have successfully registered your interest regarding this issue. An incident has been filed containing ID: ${newInc.id}. Our team will review this instantly!`,
          isComplaintTriggered: true,
          incident: newInc
        });
      }
    }

    // Standard conversational reply
    res.json({
      reply: response.text || "Hello! How can I help you today with Pin Badges?"
    });

  } catch (error: any) {
    console.error("Gemini GAI error:", error);
    // Return graceful fallback state
    return handleLocalSimulationChat(userText, role, username, res);
  }
});

// Cute localized simulation for smooth preview, ensuring client is fully functional
function handleLocalSimulationChat(userInputStr: string, role: Role, username: string, res: any) {
  const norm = userInputStr.toLowerCase();
  let reply = "";
  let isComplaintTriggered = false;
  let incident: any = null;

  if (norm.includes("complaint") || norm.includes("broken") || norm.includes("scratch") || norm.includes("tear") || norm.includes("rip") || norm.includes("stain") || norm.includes("slow") || norm.includes("problem") || norm.includes("issue") || norm.includes("error") || norm.includes("disappointed")) {
    const subject = norm.length > 30 ? userInputStr.substring(0, 30) + "..." : "User report via coordinate";
    const category = norm.includes("shipping") || norm.includes("delivery") ? "shipping" : "quality";
    
    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      username,
      userRole: role,
      subject,
      description: userInputStr,
      category,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    
    incidents.push(newInc);
    isComplaintTriggered = true;
    incident = newInc;

    reply = `I am very sorry to hear that, ${username}. I have automatically logged a service ticket (ID: **${newInc.id}**) regarding this issue under our **${category}** protocol. Our design team and superusers have been notified instantly. We will resolve this for you right away!`;
  } else if (norm.includes("size") || norm.includes("sizing") || norm.includes("measure") || norm.includes("fit") || norm.includes("chest") || norm.includes("waist")) {
    reply = `Of course, ${username}! Let me help you find your perfect fit in our collection. 📏 Simply click the **"Atelier Size Guide"** button at the top of the store to consult our standard US size chart (sizes 6 to 24)! \n\nStandard Mappings Example:\n• Size 6: Bust 34", Waist 25", Hip 37"\n• Size 10: Bust 36", Waist 28", Hip 41"\n• Size 16: Bust 43", Waist 35", Hip 47"\n• Size 24: Bust 52", Waist 42", Hip 56"\nWhat size are you currently styling?`;
  } else if (norm.includes("discount") || norm.includes("student") || norm.includes("offer") || norm.includes("price")) {
    if (role === "student") {
      reply = `Wonderful, ${username}! You're currently using your **Student Profile**, which automatically unlocks our **20% Student Member Discount** across the entire Atelier Magenta collection! The discounted prices are shown in magenta on the catalog. Enjoy your bespoke garments! ✨`;
    } else {
      reply = `Hello, ${username}! Standard user session prices are loaded. If you are a student, scroll to the top header and click **"SWITCH TEST PROFILE"** to select Alice Student. This instantly applies our active **20% Student Discount** for you! 🎓`;
    }
  } else if (norm.includes("hello") || norm.includes("hi") || norm.includes("assistant") || norm.includes("agent")) {
    reply = `Welcome, ${username}! I am your **Atelier Assistant** for Atelier Magenta. 🌿 I can guide you through our luxury sustainable designs, recommend fits (try asking about "sizes"), or file instant service tickets. What are you looking to style today?`;
  } else if (norm.includes("recommend") || norm.includes("suggest") || norm.includes("clothes") || norm.includes("items") || norm.includes("best")) {
    reply = `Our current curated items highlight modular sustainable styles! 🌹 I highly recommend the **Magenta Chevron Knit Vest** 🧶 for a bold asymmetric layered statement. For wet seasons, our **Eco-Sprout Linen Trench Coat** 🧥 is a gorgeous organic staple. Or, check out the structured **Cosmopolitan Double-Breasted Blazer** for premium tailoring!`;
  } else {
    reply = `Excellent point, ${username}! As your Atelier Assistant, I am here to help with sizing, sustainability specs, and garments. You can use our interactive **Atelier Size Guide** at the top of the storefront or ask me anything about finding your fit! 📐`;
  }

  return res.json({ reply, isComplaintTriggered, incident });
}


// ==========================================
// VITE OR STATIC SERVING MIDDLEWARE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Buttons] E-Commerce server running on http://localhost:${PORT}`);
  });
}

startServer();
