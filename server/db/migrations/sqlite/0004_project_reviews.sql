CREATE TABLE IF NOT EXISTS `project_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL REFERENCES `projects`(`id`) ON DELETE CASCADE,
	`user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
	`rating` integer NOT NULL,
	`comment` text,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `project_user_review_unique` ON `project_reviews` (`project_id`, `user_id`);
