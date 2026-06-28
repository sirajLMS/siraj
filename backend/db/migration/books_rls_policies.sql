-- 7. books configuration
ALTER TABLE "books" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "books" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS books_select_policy ON "books";
CREATE POLICY books_select_policy ON "books" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS books_insert_policy ON "books";
CREATE POLICY books_insert_policy ON "books" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS books_update_policy ON "books";
CREATE POLICY books_update_policy ON "books" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS books_soft_delete_policy ON "books";
DROP POLICY IF EXISTS books_delete_policy ON "books";
CREATE POLICY books_delete_policy ON "books" FOR DELETE USING (false);
