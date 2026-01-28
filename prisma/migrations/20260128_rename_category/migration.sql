-- -- -- -- Rename prenom2_category table to category
-- -- -- ALTER TABLE "prenom2_category" RENAME TO "category";

-- -- -- Add isPrenom2 column with default false
-- -- ALTER TABLE "category" ADD COLUMN "isPrenom2" BOOLEAN NOT NULL DEFAULT false;

-- -- -- Mark all existing categories as prenom2 categories
-- -- UPDATE "category" SET "isPrenom2" = true;

-- -- -- Rename prenom2_category_movie junction table to shortlist_nomination
-- -- ALTER TABLE "prenom2_category_movie" RENAME TO "shortlist_nomination";

-- -- -- Update foreign key constraint names (optional, but good for consistency)
-- -- -- The constraints reference the old table name, we need to update them

-- -- First, drop the old foreign key constraints
-- ALTER TABLE "shortlist_nomination" DROP CONSTRAINT IF EXISTS "prenom2_category_movie_categoryId_fkey";
-- ALTER TABLE "shortlist_nomination" DROP CONSTRAINT IF EXISTS "prenom2_category_movie_movieId_fkey";

-- -- Recreate with new names
-- ALTER TABLE "shortlist_nomination" 
--   ADD CONSTRAINT "shortlist_nomination_categoryId_fkey" 
--   FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ALTER TABLE "shortlist_nomination" 
--   ADD CONSTRAINT "shortlist_nomination_movieId_fkey" 
--   FOREIGN KEY ("movieId") REFERENCES "movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -- Update user_prenom2_selection foreign key for category
-- ALTER TABLE "user_prenom2_selection" DROP CONSTRAINT IF EXISTS "user_prenom2_selection_categoryId_fkey";
-- ALTER TABLE "user_prenom2_selection" 
--   ADD CONSTRAINT "user_prenom2_selection_categoryId_fkey" 
--   FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -- Update nomination foreign key for category
-- ALTER TABLE "nomination" DROP CONSTRAINT IF EXISTS "nomination_categoryId_fkey";
-- ALTER TABLE "nomination" 
--   ADD CONSTRAINT "nomination_categoryId_fkey" 
--   FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -- Update unique constraint name for shortlist_nomination
-- ALTER TABLE "shortlist_nomination" DROP CONSTRAINT IF EXISTS "prenom2_category_movie_categoryId_movieId_key";
-- ALTER TABLE "shortlist_nomination" 
--   ADD CONSTRAINT "shortlist_nomination_categoryId_movieId_key" 
--   UNIQUE ("categoryId", "movieId");
