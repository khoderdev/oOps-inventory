import { clsx } from "clsx";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, helperText, leftIcon, rightIcon, className, ...props }, ref) => {
  const inputClasses = clsx(
    "block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:opacity-50",
    error && "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400",
    leftIcon && "pl-10",
    rightIcon && "pr-10",
    className
  );

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 dark:text-gray-500">{leftIcon}</div>}
        <input ref={ref} className={inputClasses} aria-invalid={error ? "true" : "false"} aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined} {...props} />
        {rightIcon && <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 dark:text-gray-500">{rightIcon}</div>}
      </div>
      {error && (
        <p id={`${props.id}-error`} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${props.id}-helper`} className="text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
