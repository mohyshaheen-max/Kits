CREATE TABLE `refund_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`return_id` integer,
	`amount` real NOT NULL,
	`reason` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_by` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `return_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`return_id` integer NOT NULL,
	`order_item_id` integer NOT NULL,
	`qty` integer NOT NULL,
	`condition` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `returns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`reason` text NOT NULL,
	`message` text,
	`status` text DEFAULT 'requested' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`decided_at` text,
	`decided_by` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
