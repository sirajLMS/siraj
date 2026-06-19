"use client";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within an AppThemeProvider");
  }

  // Provide default values for new properties if they don't exist (for backward compatibility)
  const defaultIsThemeChanging = false;
  const defaultSetIsThemeChanging = () => {};

  return {
    ...context,
    isThemeChanging: context.isThemeChanging ?? defaultIsThemeChanging,
    setIsThemeChanging: context.setIsThemeChanging ?? defaultSetIsThemeChanging,
  };
};
