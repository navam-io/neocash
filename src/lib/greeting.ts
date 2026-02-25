export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getGreetingMessage(): string {
  return `${getGreeting()}. Ready to build your wealth?`;
}

export function getGreetingIcon(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "moon";
  if (hour < 12) return "sunrise";
  if (hour < 17) return "sun";
  if (hour < 20) return "sunset";
  return "moon";
}
