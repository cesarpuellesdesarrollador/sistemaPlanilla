"use client";

import { NotificationIcon } from "@/components/icon";
import { UserMenu } from "@/components/layout/user-menu";

export function Header() {
  return (
    <div className="flex items-center gap-6">
      <NotificationIcon hasNotifications={true} />
      <UserMenu />
    </div>
  );
}