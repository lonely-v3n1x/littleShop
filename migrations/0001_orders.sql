-- blink order log: records every checkout at creation time so a customer
-- dropping off before the Paystack return page still leaves a trace, and
-- webhook/reverify outcomes land on the same row.
--
-- Apply with: npx wrangler d1 migrations apply littleshop-db --remote

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Paystack/Jehucal payment reference (store_<ts>_<hex>); unique per order.
  reference TEXT NOT NULL UNIQUE,
  bundle_id TEXT NOT NULL,
  bundle_name TEXT NOT NULL,
  network_id TEXT NOT NULL,
  price_pesewas INTEGER NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  -- pending | paid | failed
  status TEXT NOT NULL DEFAULT 'pending',
  paystack_authorization_url TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders (phone, created_at);

-- Append-only audit trail: checkout.created, webhook.charge.success,
-- reverify.SUCCESS, etc. `detail` is a JSON string.
CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL,
  event TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_order_events_reference ON order_events (reference, created_at);