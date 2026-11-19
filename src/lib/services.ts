import type { Service } from "@/types";

/**
 * Central registry of everything littleShop offers (now and later).
 * Adding a new service = implement it under src/features/<name> and add an entry here.
 * The UI reads this list to render the service rail and future "coming soon" cards.
 */
export const services: Service[] = [
  {
    id: "data",
    name: "Mobile Data",
    description: "Buy MTN, Telecel & AT data bundles instantly.",
    status: "active",
    icon: "Wifi",
    href: "/",
  },
  {
    id: "airtime",
    name: "Airtime",
    description: "Top up any Ghanaian network in seconds.",
    status: "coming-soon",
    icon: "PhoneCall",
  },
  {
    id: "bills",
    name: "Bill Payments",
    description: "Pay electricity, water, TV and more.",
    status: "planned",
    icon: "ReceiptText",
  },
  {
    id: "gift-cards",
    name: "Gift Cards",
    description: "Digital gift cards and codes.",
    status: "planned",
    icon: "Gift",
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    description: "Streaming and software subscriptions.",
    status: "planned",
    icon: "PlayCircle",
  },
];

export const activeServices = services.filter((s) => s.status === "active");
