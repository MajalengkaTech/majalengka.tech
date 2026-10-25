ALTER TABLE `users` ADD `bio` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `github_username` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `website_url` text;
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`thumbnail_url` text,
	`repo_url` text,
	`demo_url` text,
	`tags` text,
	`is_published` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);
