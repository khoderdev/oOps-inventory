// import { clsx } from "clsx";
// import { ChevronDown } from "lucide-react";
// import React, { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";

// interface SelectOption {
//   value: string | number;
//   label: string;
//   disabled?: boolean;
// }

// interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "onChange"> {
//   label?: string;
//   error?: string;
//   helperText?: string;
//   options?: SelectOption[];
//   children?: ReactNode;
//   onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
//   placeholder?: string;
// }

// const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, helperText, options, children, placeholder, className, onChange, ...props }, ref) => {
//   if (options && children) {
//     console.warn("Select component received both 'options' and 'children'. Only one should be used.");
//   }

//   return (
//     <div className="w-full">
//       {label && (
//         <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//           {label}
//           {props.required && <span className="text-red-500 ml-1">*</span>}
//         </label>
//       )}
//       <div className="relative">
//         <select
//           id={props.id}
//           ref={ref}
//           className={clsx(
//             "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm appearance-none",
//             "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
//             "focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400",
//             "disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed",
//             "pr-10", // Space for dropdown icon
//             error && "border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 dark:focus:border-red-400",
//             className
//           )}
//           aria-invalid={error ? "true" : "false"}
//           aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
//           onChange={onChange}
//           {...props}
//         >
//           {placeholder && (
//             <option value="" disabled>
//               {placeholder}
//             </option>
//           )}
//           {/* Render options OR children */}
//           {options
//             ? options.map(option => (
//                 <option key={option.value} value={option.value} disabled={option.disabled}>
//                   {option.label}
//                 </option>
//               ))
//             : children}
//         </select>
//         <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
//       </div>
//       {error && (
//         <p id={`${props.id}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
//           {error}
//         </p>
//       )}
//       {helperText && !error && (
//         <p id={`${props.id}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
//           {helperText}
//         </p>
//       )}
//     </div>
//   );
// });

// Select.displayName = "Select";

// export default Select;

import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import React, { forwardRef, type ReactNode } from "react";
import SelectItem from "./SelectItem";

interface SelectOption<T = string | number> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SelectProps<T = string | number> extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children" | "onChange" | "value"> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption<T>[];
  children?: ReactNode;
  onChange?: (value: T | null) => void;
  placeholder?: string;
  value?: T | null;
}

const Select = forwardRef(<T extends string | number>({ label, error, helperText, options, children, placeholder, className, onChange, value, ...props }: SelectProps<T>, ref: React.Ref<HTMLSelectElement>) => {
  if (options && children) {
    console.warn("Select component received both 'options' and 'children'. Only one should be used.");
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onChange) return;

    const selectedValue = e.target.value;
    if (selectedValue === "") {
      onChange(null);
    } else {
      // Handle both string and number values
      const value = typeof options?.[0]?.value === "number" ? Number(selectedValue) : selectedValue;
      onChange(value as T);
    }
  };

  const selectValue = value === null || value === undefined ? "" : value.toString();

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={props.id}
          ref={ref}
          className={clsx(
            "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm appearance-none",
            "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
            "focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400",
            "disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed",
            "pr-10", // Space for dropdown icon
            error && "border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 dark:focus:border-red-400",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          onChange={handleChange}
          value={selectValue}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map(option => (
                <option key={option.value.toString()} value={option.value.toString()} disabled={option.disabled}>
                  {option.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
      </div>
      {error && (
        <p id={`${props.id}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${props.id}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

// Create a proper type for the Select component with Item property
type SelectWithItem = typeof Select & { Item: typeof SelectItem };

// Cast Select to include the Item property
const SelectWithItem = Select as SelectWithItem;
SelectWithItem.Item = SelectItem;

export default SelectWithItem;
