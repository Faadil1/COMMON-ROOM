-- The Living Collection: cards that visitors chose to add to the shared wall.
-- Only the card code is stored (marks, hidden traces, dates, optional first name, signature).
CREATE TABLE IF NOT EXISTS wall_cards (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  family TEXT NOT NULL,
  number TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  ip_hash TEXT
);
CREATE INDEX IF NOT EXISTS wall_cards_created ON wall_cards (created_at DESC);
CREATE INDEX IF NOT EXISTS wall_cards_ip ON wall_cards (ip_hash, created_at);
