CREATE TABLE `copilot_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`question` text NOT NULL,
	`intent` text NOT NULL,
	`answer` text NOT NULL,
	`evidence_json` text DEFAULT '[]' NOT NULL,
	`next_action` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `copilot_workspace_created_idx` ON `copilot_conversations` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `ledger_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`kind` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`occurred_on` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`client_name` text,
	`invoice_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `ledger_workspace_date_idx` ON `ledger_entries` (`workspace_id`,`occurred_on`);--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_invoice_unique` ON `ledger_entries` (`invoice_id`);--> statement-breakpoint
ALTER TABLE `workspaces` ADD `revenue_goal` real DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `business_type` text DEFAULT 'Servicios profesionales' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `primary_service` text DEFAULT 'Consultoría' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `onboarding_completed` integer DEFAULT false NOT NULL;