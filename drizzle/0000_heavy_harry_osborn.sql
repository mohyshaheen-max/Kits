CREATE TABLE `admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_idx` ON `admins` (`email`);--> statement-breakpoint
CREATE TABLE `grades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`curriculum` text,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kit_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kit_id` integer NOT NULL,
	`sku_id` integer NOT NULL,
	`qty` integer NOT NULL,
	`unit_price` real NOT NULL,
	`line_total` real NOT NULL,
	`subject` text,
	`is_core` integer DEFAULT true NOT NULL,
	`is_optional` integer DEFAULT false NOT NULL,
	`source_list_item_id` integer,
	`substitution_allowed` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`kit_id`) REFERENCES `kits`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sku_id`) REFERENCES `skus`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_list_item_id`) REFERENCES `list_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`grade_id` integer NOT NULL,
	`list_id` integer NOT NULL,
	`academic_year` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`base_price` real DEFAULT 0 NOT NULL,
	`cogs` real DEFAULT 0 NOT NULL,
	`margin_pct` real DEFAULT 0 NOT NULL,
	`labeling_available` integer DEFAULT true NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`published_at` text,
	`created_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`list_id`) REFERENCES `school_lists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `list_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`list_id` integer NOT NULL,
	`sku_id` integer,
	`raw_text` text,
	`qty` integer,
	`subject` text,
	`is_optional` integer DEFAULT false NOT NULL,
	`is_excluded` integer DEFAULT false NOT NULL,
	`exclusion_reason` text,
	`notes` text,
	FOREIGN KEY (`list_id`) REFERENCES `school_lists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sku_id`) REFERENCES `skus`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `school_brand_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`sku_category` text NOT NULL,
	`brand` text NOT NULL,
	`rule` text NOT NULL,
	`note` text,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `school_lists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`grade_id` integer NOT NULL,
	`academic_year` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`source_file_url` text,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`name_ar` text,
	`tier` text DEFAULT 'B' NOT NULL,
	`district` text,
	`contact_name` text,
	`contact_phone` text,
	`contact_email` text,
	`commission_rate` real DEFAULT 0.05 NOT NULL,
	`commission_active_until` text,
	`referral_slug` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_referral_slug_idx` ON `schools` (`referral_slug`);--> statement-breakpoint
CREATE TABLE `skus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`name_ar` text,
	`category` text NOT NULL,
	`spec` text,
	`size` text,
	`colour` text,
	`brand` text,
	`tier` text DEFAULT 'GEN' NOT NULL,
	`unit_cost` real DEFAULT 0 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skus_code_idx` ON `skus` (`code`);