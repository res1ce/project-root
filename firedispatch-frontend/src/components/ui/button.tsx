import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Определяем варианты кнопок с использованием cva
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
        secondary: "bg-blue-500 text-white hover:bg-blue-600 focus-visible:ring-blue-400",
        destructive: "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400",
        outline: "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-gray-400 bg-transparent",
        ghost: "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:ring-gray-400 bg-transparent",
        success: "bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-400",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus-visible:ring-yellow-400",
        link: "text-blue-500 underline-offset-4 hover:underline focus-visible:ring-blue-400 bg-transparent"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1.5 text-xs",
        lg: "h-12 px-6 py-3 text-base",
        icon: "h-10 w-10",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    }
  }
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant,
  size,
  ...props
}, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants }; 