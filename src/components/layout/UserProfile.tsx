"use client";

import { User } from "lucide-react";

export function UserProfile() {
  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-sidebar-hover transition-colors cursor-pointer">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light">
        <User size={14} className="text-accent" />
      </div>
      <span className="truncate font-medium">Personal</span>
    </div>
  );
}
