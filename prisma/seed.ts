import { PrismaClient, Role } from "@prisma/client";

import { PARSED_ENV } from "~/consts/parsed-env.const";

const db = new PrismaClient();

const getUsers = () => {
	return [
		{
			email: PARSED_ENV.SEED_EMAIL,
			role: Role.ADMIN,
		},
	];
};

const seed = async () => {
	await Promise.all(
		getUsers().map((user) => {
			return db.user.create({ data: user });
		})
	);
};

seed();
