import { type User } from "@prisma/client";

export type SerializedStateDates<T, U extends string> = Omit<T, U> & {
	[key in U]: string;
};

export type UserWithSerializedStateDates = SerializedStateDates<
	User,
	"createdAt" | "updatedAt"
>;
