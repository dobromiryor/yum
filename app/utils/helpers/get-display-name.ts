import { DisplayName, type User } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";

export const getDisplayName = ({
	email,
	firstName,
	lastName,
	username,
	prefersDisplayName,
}: User | SerializeFrom<User>) => {
	if (
		prefersDisplayName !== DisplayName.email &&
		(username || (firstName && lastName))
	) {
		if (prefersDisplayName === DisplayName.username && username) {
			return username;
		}

		if (prefersDisplayName === DisplayName.names && firstName && lastName) {
			return `${firstName} ${lastName}`;
		}

		return email.split("@")[0];
	}

	return email.split("@")[0];
};
