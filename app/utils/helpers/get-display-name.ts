import { DisplayName, type User } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";

export const getDisplayName = ({
	email,
	firstName,
	lastName,
	username,
	prefersDisplayName,
}: Pick<
	User | SerializeFrom<User>,
	"email" | "firstName" | "lastName" | "username" | "prefersDisplayName"
>) => {
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
