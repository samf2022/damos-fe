-- Fixed-window counters for failed logins and public form submissions.
-- `key` names what is limited, e.g. "login:user:admin", "login:ip:203.0.113.5",
-- "request:ip:203.0.113.5". Rows past `reset_at` are stale and get cleaned up.
CREATE TABLE rate_limits (
	key TEXT PRIMARY KEY NOT NULL,
	count INTEGER NOT NULL,
	reset_at TEXT NOT NULL
);

CREATE INDEX idx_rate_limits_reset_at ON rate_limits (reset_at);
