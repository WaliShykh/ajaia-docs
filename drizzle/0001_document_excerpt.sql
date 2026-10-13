ALTER TABLE "documents" ADD COLUMN "excerpt" text DEFAULT '' NOT NULL;--> statement-breakpoint
-- Backfill previews for existing documents (strip tags, collapse whitespace, cap length).
UPDATE "documents" SET "excerpt" = left(btrim(regexp_replace(regexp_replace("content_html", '<[^>]+>', ' ', 'g'), '\s+', ' ', 'g')), 200);
