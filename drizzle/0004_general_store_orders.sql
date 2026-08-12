PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`mode` text DEFAULT 'SCHOOL_INTEGRATED' NOT NULL,
	`school_id` integer,
	`grade_id` integer,
	`kit_id` integer,
	`kit_version` integer,
	`parent_name` text NOT NULL,
	`parent_phone` text NOT NULL,
	`parent_email` text,
	`child_name` text NOT NULL,
	`child_class` text NOT NULL,
	`subtotal` real NOT NULL,
	`labeling_fee` real DEFAULT 0 NOT NULL,
	`delivery_fee` real NOT NULL,
	`total` real NOT NULL,
	`delivery_method` text NOT NULL,
	`delivery_address` text,
	`payment_method` text NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`fulfilment_status` text DEFAULT 'pending' NOT NULL,
	`referral_school_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`kit_id`) REFERENCES `kits`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referral_school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "order_number", "mode", "school_id", "grade_id", "kit_id", "kit_version", "parent_name", "parent_phone", "parent_email", "child_name", "child_class", "subtotal", "labeling_fee", "delivery_fee", "total", "delivery_method", "delivery_address", "payment_method", "payment_status", "fulfilment_status", "referral_school_id", "created_at") SELECT "id", "order_number", "mode", "school_id", "grade_id", "kit_id", "kit_version", "parent_name", "parent_phone", "parent_email", "child_name", "child_class", "subtotal", "labeling_fee", "delivery_fee", "total", "delivery_method", "delivery_address", "payment_method", "payment_status", "fulfilment_status", "referral_school_id", "created_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;