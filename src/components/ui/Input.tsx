import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, helperText, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input ref={ref} className={clsx("w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm", "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500", "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed", error && "border-red-500 focus:ring-red-500 focus:border-red-500", className)} aria-invalid={error ? "true" : "false"} aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined} {...props} />
      {error && (
        <p id={`${props.id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${props.id}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
