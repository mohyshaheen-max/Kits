CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`name_ar` text,
	`category` text NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE `skus` ADD `product_id` integer REFERENCES products(id);
--> statement-breakpoint
INSERT INTO products (name, category) VALUES
  ('Copybook', 'Copybook'),
  ('Spiral notebook', 'Notebook'),
  ('Zipper file A4', 'File'),
  ('Ring binder file A4', 'File'),
  ('Glue stick', 'Glue'),
  ('Poster paint set', 'Paint'),
  ('Playdough set', 'Playdough'),
  ('Plasticine set', 'Plasticine'),
  ('Scientific calculator', 'Calculator'),
  ('HB pencil', 'Pencil'),
  ('Colour pencils', 'Pencil'),
  ('Ballpoint pen', 'Pen'),
  ('White eraser', 'Eraser'),
  ('Single hole sharpener', 'Sharpener'),
  ('Ruler', 'Ruler'),
  ('Kids safety scissors', 'Scissors'),
  ('Wax crayons', 'Crayons'),
  ('Washable markers', 'Markers'),
  ('School bag', 'Bag'),
  ('Pencil case', 'Pencil case'),
  ('Facial tissue box', 'Hygiene'),
  ('Wet wipes pack', 'Hygiene'),
  ('Sticky notes pack', 'Stationery'),
  ('Highlighters', 'Markers'),
  ('Whiteboard markers', 'Markers');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Copybook') WHERE code IN ('COPY-40-SQ','COPY-80-SQ','COPY-40-LINE','COPY-100-LINE');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Spiral notebook') WHERE code IN ('NB-A4-SPIRAL','NB-A5-SPIRAL');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Zipper file A4') WHERE code IN ('FILE-ZIP-A4-RED','FILE-ZIP-A4-BLUE');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Ring binder file A4') WHERE code IN ('FILE-RING-A4');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Glue stick') WHERE code IN ('GLUE-STICK-PRITT','GLUE-STICK-UHU','GLUE-STICK-GENERIC');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Poster paint set') WHERE code IN ('PAINT-POSTER-JOVI','PAINT-POSTER-NOVA','PAINT-POSTER-GENERIC');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Playdough set') WHERE code IN ('PLAYDOUGH-NOVA','PLAYDOUGH-JOVI','PLAYDOUGH-GENERIC');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Plasticine set') WHERE code IN ('PLASTICINE-JOVI','PLASTICINE-GENERIC');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Scientific calculator') WHERE code IN ('CALC-CASIO-FX991ESPLUS','CALC-GENERIC-SCI');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'HB pencil') WHERE code IN ('PENCIL-HB-2');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Colour pencils') WHERE code IN ('PENCIL-COLOUR-12','PENCIL-COLOUR-24');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Ballpoint pen') WHERE code IN ('PEN-BLUE-BALLPOINT','PEN-BLACK-BALLPOINT','PEN-RED-BALLPOINT');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'White eraser') WHERE code IN ('ERASER-WHITE');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Single hole sharpener') WHERE code IN ('SHARPENER-SINGLE');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Ruler') WHERE code IN ('RULER-30CM');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Kids safety scissors') WHERE code IN ('SCISSORS-KIDS');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Wax crayons') WHERE code IN ('CRAYONS-12','CRAYONS-24');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Washable markers') WHERE code IN ('MARKERS-12-WASHABLE');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'School bag') WHERE code IN ('SCHOOLBAG-STD');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Pencil case') WHERE code IN ('PENCILCASE-STD');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Facial tissue box') WHERE code IN ('TISSUE-BOX');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Wet wipes pack') WHERE code IN ('WETWIPES-PACK');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Sticky notes pack') WHERE code IN ('STICKYNOTES-PACK');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Highlighters') WHERE code IN ('HIGHLIGHTERS-4');
--> statement-breakpoint
UPDATE skus SET product_id = (SELECT id FROM products WHERE name = 'Whiteboard markers') WHERE code IN ('WBMARKER-4');
