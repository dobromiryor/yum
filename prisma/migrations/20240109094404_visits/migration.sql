/*
  Warnings:

  - You are about to drop the column `editedAt` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `visitCount` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `editedAt` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `visitCount` on the `Recipe` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "editedAt",
DROP COLUMN "visitCount";

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "editedAt",
DROP COLUMN "visitCount";

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "categoryId" TEXT,
    "recipeId" TEXT,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
