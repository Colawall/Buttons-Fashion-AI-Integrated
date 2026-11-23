import { CurrencyCode, CurrencyConfig } from "../types";

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  NGN: {
    code: "NGN",
    symbol: "₦",
    name: "Nigerian Naira (Transfer)",
    rateToUsd: 1550, // 1 USD = 1,550 NGN
    paymentMethod: "naira_transfer"
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar (PayPal)",
    rateToUsd: 1,
    paymentMethod: "paypal"
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro (PayPal)",
    rateToUsd: 0.92, // 1 USD = 0.92 EUR
    paymentMethod: "paypal"
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound (PayPal)",
    rateToUsd: 0.79, // 1 USD = 0.79 GBP
    paymentMethod: "paypal"
  },
  CAD: {
    code: "CAD",
    symbol: "CA$",
    name: "Canadian Dollar (PayPal)",
    rateToUsd: 1.36, // 1 USD = 1.36 CAD
    paymentMethod: "paypal"
  }
};

export function convertFromUsd(amountInUsd: number, targetCurrency: CurrencyCode): number {
  const config = CURRENCY_CONFIGS[targetCurrency] || CURRENCY_CONFIGS.NGN;
  return amountInUsd * config.rateToUsd;
}

export function formatCurrency(amountInUsd: number, currency: CurrencyCode): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.NGN;
  const converted = convertFromUsd(amountInUsd, currency);
  
  if (currency === "NGN") {
    return `${config.symbol}${converted.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  if (currency === "EUR") {
    return `${config.symbol}${converted.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (currency === "GBP") {
    return `${config.symbol}${converted.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (currency === "CAD") {
    return `${config.symbol}${converted.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return `${config.symbol}${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDirectAmount(amountInTargetCurrency: number, currency: CurrencyCode): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.NGN;
  
  if (currency === "NGN") {
    return `${config.symbol}${amountInTargetCurrency.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  return `${config.symbol}${amountInTargetCurrency.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
