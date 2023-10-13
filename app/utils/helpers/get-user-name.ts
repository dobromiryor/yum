import { type User } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";

export const getUserName = (user: SerializeFrom<User>) => {
	const { firstName, lastName, username, email } = user;

	if (username) {
		return username;
	}

	if (firstName && lastName) {
		return `${user.firstName} ${user.lastName}`;
	}

	return email.split("@")[0];
};
