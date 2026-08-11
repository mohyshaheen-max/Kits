PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_kit_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kit_id` integer NOT NULL,
	`sku_id` integer NOT NULL,
	`qty` integer,
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
INSERT INTO `__new_kit_items`("id", "kit_id", "sku_id", "qty", "unit_price", "line_total", "subject", "is_core", "is_optional", "source_list_item_id", "substitution_allowed", "sort_order") SELECT "id", "kit_id", "sku_id", "qty", "unit_price", "line_total", "subject", "is_core", "is_optional", "source_list_item_id", "substitution_allowed", "sort_order" FROM `kit_items`;--> statement-breakpoint
DROP TABLE `kit_items`;--> statement-breakpoint
ALTER TABLE `__new_kit_items` RENAME TO `kit_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;