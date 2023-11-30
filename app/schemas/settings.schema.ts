import { DisplayName, TemperatureScale, UnitSystem } from "@prisma/client";
import { z } from "zod";

import { NAME_REGEX, USERNAME_REGEX } from "~/consts/regex.const";

export const EmailSchema = z.object({
	email: z.string().email(),
});

export const NamesSchema = z.object({
	firstName: z.string().min(2).max(35).regex(NAME_REGEX),
	lastName: z.string().min(2).max(35).regex(NAME_REGEX),
	prefersDisplayName: z.nativeEnum(DisplayName),
});

export const UsernameSchema = z.object({
	username: z.string().min(2).max(35).regex(USERNAME_REGEX),
	prefersDisplayName: z.nativeEnum(DisplayName),
});

export const PreferencesSchema = z.object({
	autoConvert: z.boolean(),
	displayNameToggle: z.boolean().optional(),
	prefersTemperatureScale: z.nativeEnum(TemperatureScale),
	prefersUnitSystem: z.nativeEnum(UnitSystem),
});

export const SettingsSchema = z.object({
	prefersDisplayName: z.nativeEnum(DisplayName),
});
