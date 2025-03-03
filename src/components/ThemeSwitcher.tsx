// src/components/ThemeSwitcher.tsx
"use client";
import React from "react";

export const ThemeSwitcher = () => {
  const handleThemeChange = (theme: "light" | "dark") => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={() => handleThemeChange("light")}
        className="py-2 px-4 text-sm hover:bg-gray-100 text-gray-700"
      >
        Light Mode
      </button>
      <button
        onClick={() => handleThemeChange("dark")}
        className="py-2 px-4 text-sm hover:bg-gray-100 text-gray-700"
      >
        Dark Mode
      </button>
    </div>
  );
};
