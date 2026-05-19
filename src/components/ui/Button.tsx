import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const buttonVariants = {
  default: "bg-gray-900 text-white hover:bg-gray-900/90 shadow-sm",
  destructive: "bg-red-500 text-white hover:bg-red-500/90 shadow-sm",
  outline: "border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900",
  ghost: "hover:bg-gray-100 hover:text-gray-900",
  link: "text-gray-900 underline-offset-4 hover:underline",
};

const buttonSizes = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-9 rounded-md px-3 text-xs",
  lg: "h-12 rounded-lg px-8 text-base",
  icon: "h-10 w-10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
