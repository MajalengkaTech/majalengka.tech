-- Custom migration to align projects.user_id with Better Auth user table
PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS `projects_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
	`title` text NOT NULL,
	`slug` text NOT NULL UNIQUE,
	`description` text NOT NULL,
	`thumbnail_url` text,
	`repo_url` text,
	`demo_url` text,
	`tags` text,
	`is_published` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);

INSERT OR IGNORE INTO `projects_new` SELECT * FROM `projects`;
DROP TABLE `projects`;
ALTER TABLE `projects_new` RENAME TO `projects`;

PRAGMA foreign_keys = ON;
