import { Difficulty } from "@prisma/client";
import { z } from "zod";

export const DifficultySchema = z.nativeEnum(Difficulty);
