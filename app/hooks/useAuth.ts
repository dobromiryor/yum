import { Role } from "@prisma/client";

import { type UserWithSerializedStateDates } from "~/types/serialized-state-dates.type";

export const useAuth = (user: UserWithSerializedStateDates | null) => {
	return {
		user: user
			? {
					...user,
					// reconstruct user dates
					createdAt: new Date(user.createdAt),
					updatedAt: new Date(user.updatedAt),
			  }
			: null,
		isAuthenticated: user && user.isVerified,
		isAdmin: user && user.role === Role.ADMIN,
	};
};
