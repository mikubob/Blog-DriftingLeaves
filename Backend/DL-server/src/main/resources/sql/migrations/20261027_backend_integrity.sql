-- Review and run against an explicitly selected database, after backup. No automatic migration runner.
-- Resolve these duplicate groups manually; never delete subscriptions solely to make an index succeed.
SELECT LOWER(TRIM(email)) AS normalized_email, COUNT(*) AS duplicates
FROM rss_subscriptions GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1;
SELECT visitor_id, COUNT(*) AS duplicates FROM rss_subscriptions
WHERE visitor_id IS NOT NULL GROUP BY visitor_id HAVING COUNT(*) > 1;

CREATE TABLE counter_sync_batches (
    batch_id CHAR(36) NOT NULL PRIMARY KEY,
    metric VARCHAR(8) NOT NULL,
    article_id BIGINT NOT NULL,
    delta BIGINT NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_counter_article(metric, article_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE rss_subscriptions
    MODIFY visitor_id INT NULL COMMENT 'Verified visitor; detached history can be null',
    MODIFY email VARCHAR(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    ADD confirmed TINYINT NOT NULL DEFAULT 0 COMMENT 'Mailbox ownership confirmed',
    ADD confirmation_id CHAR(36) NULL COMMENT 'Last successful confirmation ticket',
    ADD UNIQUE KEY uk_rss_email(email),
    ADD UNIQUE KEY uk_rss_visitor(visitor_id);

CREATE INDEX idx_comment_article_root ON article_comments(article_id, root_id, create_time, id);
CREATE INDEX idx_message_root ON messages(root_id, create_time, id);
