import { Gift, PhoneCall, PlayCircle, ReceiptText, Wifi, type LucideIcon } from "lucide-react";

/**
 * The ONLY place a service icon name becomes a component (Frozen Core §0.4).
 * Per-icon imports, never the lucide barrel. Unknown names throw loudly so a
 * typo in the service registry is caught in dev instead of rendering a blank card.
 */
const ICONS: Record<string, LucideIcon> = {
  Wifi,
  PhoneCall,
  ReceiptText,
  Gift,
  PlayCircle,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name];
  if (!Icon) throw new Error(`Unknown service icon "${name}". Add it to lib/service-icon.tsx.`);
  return <Icon className={className} aria-hidden="true" />;
}
