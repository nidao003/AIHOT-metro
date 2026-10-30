-- Where the visit came from, classified at write time: search / ai / social / referral / internal /
-- direct. Kept as its own column so the admin can group without re-parsing every referrer string.
ALTER TABLE analytics_events ADD COLUMN referrer_channel text;
