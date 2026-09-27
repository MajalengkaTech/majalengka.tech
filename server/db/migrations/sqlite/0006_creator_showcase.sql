CREATE TABLE `project_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_comments_project_idx` ON `project_comments` (`project_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `project_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`url` text NOT NULL,
	`alt` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_images_project_idx` ON `project_images` (`project_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `project_likes` (
	`project_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`project_id`, `user_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_likes_user_idx` ON `project_likes` (`user_id`);--> statement-breakpoint
ALTER TABLE `projects` ADD `tagline` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `category` text DEFAULT 'lainnya' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `contribution` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `design_url` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `is_featured` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `featured_at` integer;--> statement-breakpoint
CREATE INDEX `projects_category_idx` ON `projects` (`category`);--> statement-breakpoint
ALTER TABLE `user` ADD `username` text;--> statement-breakpoint
ALTER TABLE `user` ADD `creatorRole` text;--> statement-breakpoint
ALTER TABLE `user` ADD `location` text;--> statement-breakpoint
ALTER TABLE `user` ADD `skills` text;--> statement-breakpoint
ALTER TABLE `user` ADD `openToWork` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `user` ADD `designUrl` text;--> statement-breakpoint
ALTER TABLE `user` ADD `linkedinUrl` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
-- Komentar dari ulasan bintang lama dipindahkan ke tabel komentar; nilai bintangnya tidak dikonversi.
INSERT INTO `project_comments` (`project_id`, `user_id`, `body`, `created_at`, `updated_at`)
SELECT `project_id`, `user_id`, `comment`, `created_at`, `updated_at` FROM `project_reviews`
WHERE `comment` IS NOT NULL AND trim(`comment`) <> '';
