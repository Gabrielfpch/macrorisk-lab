CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`business` text,
	`service` text NOT NULL,
	`challenge` text NOT NULL,
	`budget` real DEFAULT 0 NOT NULL,
	`urgency` text DEFAULT '30d' NOT NULL,
	`source` text DEFAULT 'honora_form' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`next_action` text DEFAULT 'Responder y validar encaje' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `leads_workspace_idx` ON `leads` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `leads_workspace_status_idx` ON `leads` (`workspace_id`,`status`);--> statement-breakpoint
CREATE INDEX `leads_workspace_email_idx` ON `leads` (`workspace_id`,`email`);--> statement-breakpoint
ALTER TABLE `workspaces` ADD `intake_slug` text;--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_intake_slug_unique` ON `workspaces` (`intake_slug`);