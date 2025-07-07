import { User as UserIcon } from "lucide-react";
import React from "react";
import { cn } from "../../lib/utils";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  fallbackClassName?: string;
  rounded?: boolean;
  bgColor?: string;
  textColor?: string;
  customFallback?: React.ReactNode;
}

const sizeClasses = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
  xl: "h-16 w-16 text-xl",
  "2xl": "h-20 w-20 text-2xl"
};

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = "md", className = "", fallbackClassName = "", rounded = true, bgColor = "bg-gray-200 dark:bg-gray-600", textColor = "text-gray-800 dark:text-gray-100", customFallback }) => {
  const getInitials = () => {
    if (!name) return null;

    const names = name.trim().split(/\s+/);
    if (names.length === 0) return null;

    let initials = names[0][0].toUpperCase();

    if (names.length > 1) {
      initials += names[names.length - 1][0].toUpperCase();
    }

    return initials;
  };

  const initials = getInitials();
  const hasImage = !!src;

  const avatarClasses = cn("flex items-center justify-center overflow-hidden", bgColor, textColor, rounded ? "rounded-full" : "rounded-md", sizeClasses[size], className);

  const fallbackClasses = cn("flex items-center justify-center w-full h-full", fallbackClassName);

  return (
    <div className={avatarClasses}>
      {hasImage ? (
        <img
          src={src}
          alt={name ? `${name}'s avatar` : "User avatar"}
          className="w-full h-full object-cover"
          onError={e => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      ) : null}

      {(!hasImage || (hasImage && !src)) && <div className={fallbackClasses}>{customFallback ? customFallback : initials ? <span className="font-medium">{initials}</span> : <UserIcon className="w-1/2 h-1/2 opacity-70" />}</div>}
    </div>
  );
};
