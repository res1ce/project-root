import React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({ defaultValue, className, children }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  
  // Передаем состояние активного таба дочерним компонентам
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab });
    }
    return child;
  });

  return (
    <div className={cn("w-full", className)}>
      {childrenWithProps}
    </div>
  );
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}

export function TabsList({ className, children, activeTab, setActiveTab }: TabsListProps) {
  // Передаем состояние активного таба дочерним компонентам
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab });
    }
    return child;
  });

  return (
    <div className={cn("flex space-x-2 rounded-md bg-gray-100 p-1", className)}>
      {childrenWithProps}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}

export function TabsTrigger({ value, children, className, activeTab, setActiveTab }: TabsTriggerProps) {
  const isActive = activeTab === value;
  
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive 
          ? "bg-white text-primary-foreground shadow-sm" 
          : "text-muted-foreground hover:bg-gray-200",
        className
      )}
      onClick={() => setActiveTab?.(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
}

export function TabsContent({ value, children, className, activeTab }: TabsContentProps) {
  const isActive = activeTab === value;
  
  if (!isActive) return null;
  
  return (
    <div className={cn("mt-2", className)}>
      {children}
    </div>
  );
} 