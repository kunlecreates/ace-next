-- Add indexes for Order.userId and Order.createdAt
CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order" ("userId");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order" ("createdAt");

-- For User.emailLower, enforce uniqueness. In SQLite, UNIQUE allows multiple NULLs by design,
-- so a standard unique index is sufficient and broadly compatible.
CREATE UNIQUE INDEX IF NOT EXISTS "User_emailLower_unique" ON "User" ("emailLower");