-- Tutorial dari kreator beserta peninjaunya, dan kolom tutorial_id untuk notifikasi hasil tinjauan.
-- Ditulis mengikuti DDL drizzle-kit untuk server/db/schema.ts, karena nuxt-db generate gagal me-resolve alias #auth/schema.
CREATE TABLE `tutorials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`project_id` integer,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`summary` text,
	`body` text NOT NULL,
	`level` text DEFAULT 'pemula' NOT NULL,
	`tags` text,
	`status` text DEFAULT 'draf' NOT NULL,
	`review_note` text,
	`reviewed_by` text,
	`reviewed_at` integer,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tutorials_slug_unique` ON `tutorials` (`slug`);--> statement-breakpoint
CREATE INDEX `tutorials_status_published_idx` ON `tutorials` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `tutorials_user_idx` ON `tutorials` (`user_id`);--> statement-breakpoint
CREATE INDEX `tutorials_project_idx` ON `tutorials` (`project_id`);--> statement-breakpoint
CREATE TABLE `tutorial_reviewers` (
	`user_id` text PRIMARY KEY NOT NULL,
	`added_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `notifications` ADD `tutorial_id` integer;
