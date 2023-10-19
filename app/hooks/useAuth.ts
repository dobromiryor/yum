import { Role, type User } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";

export const useAuth = (user: SerializeFrom<User> | null) => {
	return {
		user,
		isAuthenticated: user && user.isVerified,
		isAdmin: user && user.role === Role.ADMIN,
	};
};
