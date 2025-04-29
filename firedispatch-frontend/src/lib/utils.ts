import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
// Функция для объединения классов с использованием tailwind-merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 