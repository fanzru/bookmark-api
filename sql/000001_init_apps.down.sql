-- Drop indexes first
DROP INDEX IF EXISTS idx_bookmark_tags_tag_id;
DROP INDEX IF EXISTS idx_bookmark_tags_bookmark_id;
DROP INDEX IF EXISTS idx_bookmarks_category_id;
DROP INDEX IF EXISTS idx_bookmarks_user_id;

-- Drop junction table first to avoid foreign key constraints
DROP TABLE IF EXISTS bookmark_tags;

-- Drop tables with foreign key dependencies next
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS tags;

-- Drop base tables last
DROP TABLE IF EXISTS users;