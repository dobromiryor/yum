import { Unit } from "@prisma/client";
import { z } from "zod";

export const UnitSystemSchema = z.union([
	z.literal("imperial"),
	z.literal("metric"),
]);

export const UnitSchema = z.nativeEnum(Unit).transform((v) => {
	if (v === Unit.fl_oz) {
		return "fl oz";
	}

	return v;
});
