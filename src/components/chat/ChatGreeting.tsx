"use client";

import { useEffect, useState } from "react";
import { Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { getGreeting, getGreetingIcon } from "@/lib/greeting";

const iconMap = {
  sunrise: Sunrise,
  sun: Sun,
  sunset: Sunset,
  moon: Moon,
} as const;

export function ChatGreeting() {
  const [greeting, setGreeting] = useState("");
  const [iconName, setIconName] = useState<keyof typeof iconMap>("sun");

  useEffect(() => {
    setGreeting(getGreeting());
    setIconName(getGreetingIcon() as keyof typeof iconMap);
  }, []);

  const Icon = iconMap[iconName];

  if (!greeting) return null;

  return (
    <div className="flex flex-col items-center gap-4 pb-8">
      <div className="flex h-10 w-10 items-center justify-center">
        <Icon size={28} className="text-accent" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <h1 className="font-display text-3xl font-normal text-text-primary italic">
          {greeting}.
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          Ready to build your wealth?
        </p>
      </div>
    </div>
  );
}
