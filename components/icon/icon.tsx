import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { HTMLAttributes } from "react";

interface IconWrapperProps extends HTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  size?: number;
}

export const IconWrapper = ({ icon: IconComponent, size = 20, className, ...props }: IconWrapperProps) => {
  return (
    <button
      type="button"
      className={cn("cursor-pointer transition-colors", className)}
      {...props}
    >
      <IconComponent size={size} />
    </button>
  );
};
