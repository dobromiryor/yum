import { z } from "zod";

export const NonEmptyStringSchema = z.string().min(1);
export const OptionalStringSchema = z.string().optional();

export const EmailSchema = z.string().email().min(1);
