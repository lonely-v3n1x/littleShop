/** Frozen Core §0.6 — single source for cross-cutting constants. */

export const MAX_QTY_PER_LINE = 10;

/** Session-only cart storage key. No customer data is persisted. */
export const CART_STORAGE_KEY = "littleshop.cart.v1";

/** Keys used to remember the recipient on this device only. */
export const RECIPIENT_STORAGE_KEY = "littleshop.recipient";
export const RECIPIENT_EMAIL_STORAGE_KEY = "littleshop.recipient.email";

/**
 * Jehucal is the merchant of record and the data agent. blink never charges
 * a card or a wallet: it creates the order on the owner's storefront through
 * Jehucal's public checkout API and sends the customer to the Paystack page that
 * Jehucal's own storefront uses. The sale (and therefore the commission) belongs
 * to the store.
 */
export const JEHUCAL_STORE_SLUG = "littleFlower";
export const JEHUCAL_STORE_URL = `https://store.jehucale-business.com/store/${JEHUCAL_STORE_SLUG}`;

/** Where Paystack sends the customer back to after payment. */
export const CHECKOUT_RETURN_PATH = "/checkout/return";

/** The shop's stated delivery promise. Never upgraded to a guarantee without the owner. */
export const DELIVERY_PROMISE = "under 30 min";

/**
 * Support is WhatsApp, not a form (plan §1.4). This number comes from the public
 * Jehucal catalogue for store `littleFlower`, not from a guess.
 * [OPEN] Owner to confirm it is the number customers should reach on.
 */
export const SUPPORT_WHATSAPP_URL = "https://wa.me/233531810252";

/** Displayed form, derived from the URL above so the two can never disagree. */
export const SUPPORT_INTL = SUPPORT_WHATSAPP_URL.split("/").pop() ?? "";
