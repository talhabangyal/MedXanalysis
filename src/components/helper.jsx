"use client";

import { useState } from "react";

export default function useHelper() {
  const [currency, setCurrency] = useState("USD");
  const [darkMode, setDarkMode] = useState(false);
  const [yearly, setYearly] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const convertPrice = (usdPrice) => {
    if (currency === "USD") return `$${usdPrice}`;
    if (currency === "PKR") return `₨${usdPrice * 278}`; // rough estimate
    if (currency === "EUR") return `€${Math.round(usdPrice * 0.92)}`;
    if (currency === "GBP") return `£${Math.round(usdPrice * 0.79)}`;
    return `$${usdPrice}`;
  };

  return {
    currency,
    setCurrency,
    convertPrice,
    toggleTheme,
    darkMode,
    yearly,
    setYearly,
  };
}
