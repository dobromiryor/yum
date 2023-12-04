-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_subRecipeId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLogin" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_subRecipeId_fkey" FOREIGN KEY ("subRecipeId") REFERENCES "SubRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
