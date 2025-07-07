import { clsx } from "clsx";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import Button from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  className?: string;
}

const Modal = ({ isOpen, onClose, title, children, size = "md", showCloseButton = true, className }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key and focus management
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Prevent body scroll
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);

      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";

      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Responsive sizes - mobile first approach
  const sizes = {
    sm: "w-full max-w-sm sm:max-w-md",
    md: "w-full max-w-md sm:max-w-lg",
    lg: "w-full max-w-lg sm:max-w-2xl md:max-w-3xl",
    xl: "w-full max-w-xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl",
    full: "w-full max-w-full"
  };

  // Mobile-specific classes for better mobile experience
  const mobileClasses = size === "full" || size === "xl" ? "mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh]" : "mx-4 sm:mx-6 max-h-[90vh] sm:max-h-[85vh]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 ease-out" role="dialog" aria-modal="true" aria-labelledby={title ? "modal-title" : undefined}>
      <div
        ref={modalRef}
        className={clsx(
          // Base styles
          "relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl",
          "transform transition-all duration-300 ease-out",
          "border border-gray-200 dark:border-gray-700",
          "overflow-hidden",

          // Responsive sizing
          sizes[size],
          mobileClasses,

          // Animation states
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4",

          // Custom className
          className
        )}
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
        role="document"
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {title && (
              <h3 id="modal-title" className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate pr-4">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0 p-2 -mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200" aria-label="Close modal">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] sm:max-h-[calc(85vh-8rem)]">
          <div className="px-4 py-4 sm:px-6 sm:py-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
