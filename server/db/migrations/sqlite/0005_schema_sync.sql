-- Menyamakan database dengan server/db/schema.ts. Semua perintah aman diulang, di SQLite lokal maupun D1.
DROP TABLE IF EXISTS `users`;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `projects_user_id_idx` ON `projects` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `projects_published_created_idx` ON `projects` (`is_published`,`created_at`);
