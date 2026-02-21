import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationIconProps {
  hasNotifications?: boolean;
  className?: string;
  size?: number;
}

export const NotificationIcon = ({ 
  hasNotifications = false, 
  className,
  size = 22 
}: NotificationIconProps) => {
  return (
    <button className={cn("relative p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer", className)}>
      <Bell size={size} />
      {hasNotifications && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-zinc-950"></span>
      )}
    </button>
  );
};