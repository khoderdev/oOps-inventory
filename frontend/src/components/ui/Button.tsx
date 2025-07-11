import { clsx } from "clsx";
import { forwardRef, useMemo, type ButtonHTMLAttributes, type ReactNode } from "react";
import useFloatingButtonVisibility from "../../hooks/useFloatingButtonVisibility";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  floating?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "bottom-center";
  threshold?: number;
  debounceDelay?: number;
  showOnTop?: boolean;
  autoHideDelay?: number;
  minScrollDistance?: number;
  animationType?: "fade" | "slide" | "scale";
  hideOnScroll?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant = "primary", size = "md", loading = false, leftIcon, rightIcon, children, className, disabled, floating = false, position = "bottom-right", threshold = 5, debounceDelay = 100, showOnTop = true, autoHideDelay = 3000, minScrollDistance = 100, animationType = "fade", hideOnScroll = true, ...props }, ref) => {
  const visibilityOptions = useMemo(() => {
    return floating && hideOnScroll
      ? {
          threshold,
          debounceDelay,
          showOnTop,
          autoHideDelay,
          minScrollDistance
        }
      : {};
  }, [floating, hideOnScroll, threshold, debounceDelay, showOnTop, autoHideDelay, minScrollDistance]);

  const { visible, isScrolling } = useFloatingButtonVisibility(visibilityOptions);
  const isVisible = floating ? (hideOnScroll ? visible : true) : true;

  const base = "inline-flex items-center justify-center font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none will-change-transform will-change-opacity";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-blue-500 dark:focus:ring-blue-400",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 focus:ring-gray-500 dark:focus:ring-gray-400",
    outline: "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800",
    ghost: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-blue-500 dark:focus:ring-blue-400",
    danger: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 focus:ring-red-500 dark:focus:ring-red-400"
  };

  const floatingSize = {
    sm: "px-3 py-2 text-sm min-w-[2.5rem] min-h-[2.5rem]",
    md: "px-4 py-3 text-sm min-w-[3rem] min-h-[3rem]",
    lg: "px-6 py-4 text-base min-w-[3.5rem] min-h-[3.5rem]"
  };

  const normalSize = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const positionClasses = {
    "bottom-right": "fixed bottom-6 right-6 z-20",
    "bottom-left": "fixed bottom-6 left-6 z-20",
    "top-right": "fixed top-6 right-6 z-20",
    "top-left": "fixed top-6 left-6 z-20",
    "bottom-center": "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20"
  };

  const getAnimationClasses = () => {
    if (!floating) return "";
    const transition = "transition-all duration-200 ease-in-out";
    if (animationType === "fade") {
      return `${transition} ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`;
    } else if (animationType === "scale") {
      return `${transition} ${isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0 pointer-events-none"}`;
    } else if (animationType === "slide") {
      const direction = position.includes("right") ? "translate-x-3" : position.includes("left") ? "-translate-x-3" : position.includes("bottom") ? "translate-y-3" : "-translate-y-3";
      return `${transition} ${isVisible ? "translate-x-0 translate-y-0 opacity-100" : `${direction} opacity-0 pointer-events-none`}`;
    }
    return transition;
  };

  const loadingSpinner = (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  const finalClassName = useMemo(() => clsx(base, variants[variant], floating ? floatingSize[size] : normalSize[size], floating && positionClasses[position], getAnimationClasses(), floating && isScrolling && "scale-95 opacity-80", floating && "active:scale-90", className), [floating, size, variant, position, isVisible, isScrolling, className]);

  return (
    <button ref={ref} className={finalClassName} disabled={disabled || loading} aria-disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && loadingSpinner}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = "Button";
export default Button;

///////////////////////////////////////

// import { Slot } from "@radix-ui/react-slot";
// import { cva, type VariantProps } from "class-variance-authority";
// import { type ClassValue, clsx } from "clsx";
// import * as React from "react";
// import { twMerge } from "tailwind-merge";
// import useFloatingButtonVisibility from "../../hooks/useFloatingButtonVisibility";

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

// const buttonVariants = cva("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background will-change-transform will-change-opacity", {
//   variants: {
//     variant: {
//       primary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-blue-500 dark:focus:ring-blue-400",
//       secondary: "bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 focus:ring-gray-500 dark:focus:ring-gray-400",
//       outline: "border border-input hover:bg-accent hover:text-accent-foreground",
//       ghost: "hover:bg-accent hover:text-accent-foreground",
//       danger: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 focus:ring-red-500 dark:focus:ring-red-400",
//       link: "underline-offset-4 hover:underline text-primary"
//     },
//     size: {
//       sm: "h-9 px-3 rounded-md",
//       md: "h-10 py-2 px-4",
//       lg: "h-11 px-8 rounded-md"
//     },
//     floating: {
//       true: "",
//       false: ""
//     },
//     floatingSize: {
//       sm: "px-3 py-2 text-sm min-w-[2.5rem] min-h-[2.5rem]",
//       md: "px-4 py-3 text-sm min-w-[3rem] min-h-[3rem]",
//       lg: "px-6 py-4 text-base min-w-[3.5rem] min-h-[3.5rem]"
//     },
//     position: {
//       "bottom-right": "fixed bottom-6 right-6 z-20",
//       "bottom-left": "fixed bottom-6 left-6 z-20",
//       "top-right": "fixed top-6 right-6 z-20",
//       "top-left": "fixed top-6 left-6 z-20",
//       "bottom-center": "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20"
//     }
//   },
//   compoundVariants: [
//     {
//       floating: true,
//       size: "sm",
//       className: "px-3 py-2 text-sm min-w-[2.5rem] min-h-[2.5rem]"
//     },
//     {
//       floating: true,
//       size: "md",
//       className: "px-4 py-3 text-sm min-w-[3rem] min-h-[3rem]"
//     },
//     {
//       floating: true,
//       size: "lg",
//       className: "px-6 py-4 text-base min-w-[3.5rem] min-h-[3.5rem]"
//     }
//   ],
//   defaultVariants: {
//     variant: "primary",
//     size: "md"
//   }
// });

// export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
//   asChild?: boolean;
//   loading?: boolean;
//   leftIcon?: React.ReactNode;
//   rightIcon?: React.ReactNode;
//   floating?: boolean;
//   position?: "bottom-right" | "bottom-left" | "top-right" | "top-left" | "bottom-center";
//   threshold?: number;
//   debounceDelay?: number;
//   showOnTop?: boolean;
//   autoHideDelay?: number;
//   minScrollDistance?: number;
//   animationType?: "fade" | "slide" | "scale";
//   hideOnScroll?: boolean;
// }

// const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, loading = false, leftIcon, rightIcon, floating = false, position = "bottom-right", threshold = 5, debounceDelay = 100, showOnTop = true, autoHideDelay = 3000, minScrollDistance = 100, animationType = "fade", hideOnScroll = true, children, ...props }, ref) => {
//   const visibilityOptions = React.useMemo(() => {
//     return floating && hideOnScroll
//       ? {
//           threshold,
//           debounceDelay,
//           showOnTop,
//           autoHideDelay,
//           minScrollDistance
//         }
//       : {};
//   }, [floating, hideOnScroll, threshold, debounceDelay, showOnTop, autoHideDelay, minScrollDistance]);

//   const { visible, isScrolling } = useFloatingButtonVisibility(visibilityOptions);
//   const isVisible = floating ? (hideOnScroll ? visible : true) : true;

//   const getAnimationClasses = () => {
//     if (!floating) return "";
//     const transition = "transition-all duration-200 ease-in-out";
//     if (animationType === "fade") {
//       return `${transition} ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`;
//     } else if (animationType === "scale") {
//       return `${transition} ${isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0 pointer-events-none"}`;
//     } else if (animationType === "slide") {
//       const direction = position.includes("right") ? "translate-x-3" : position.includes("left") ? "-translate-x-3" : position.includes("bottom") ? "translate-y-3" : "-translate-y-3";
//       return `${transition} ${isVisible ? "translate-x-0 translate-y-0 opacity-100" : `${direction} opacity-0 pointer-events-none`}`;
//     }
//     return transition;
//   };

//   const loadingSpinner = (
//     <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//     </svg>
//   );

//   const Comp = asChild ? Slot : "button";
//   return (
//     <Comp className={cn(buttonVariants({ variant, size, floating, position, className }), getAnimationClasses(), floating && isScrolling && "scale-95 opacity-80", floating && "active:scale-90")} ref={ref} disabled={props.disabled || loading} aria-disabled={props.disabled || loading} aria-busy={loading} {...props}>
//       {loading && loadingSpinner}
//       {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
//       {children}
//       {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
//     </Comp>
//   );
// });
// Button.displayName = "Button";

// export default Button;
// export { buttonVariants };
