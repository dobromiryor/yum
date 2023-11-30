import { type User } from "@prisma/client";
import { Authenticator } from "remix-auth";
import { EmailLinkStrategy } from "remix-auth-email-link";

import { PARSED_ENV } from "~/consts/parsed-env.const";
import { prisma } from "~/utils/prisma.server";
import { sendAuthEmail } from "~/utils/sendgrid.server";
import { sessionStorage } from "~/utils/session.server";

export const auth = new Authenticator<User>(sessionStorage);

auth.use(
	new EmailLinkStrategy(
		{
			sendEmail: sendAuthEmail,
			secret: PARSED_ENV.MAGIC_LINK_SECRET,
			callbackURL: "/magic",
			validateSessionMagicLink: true,
		},
		async ({ email }: { email: string }) => {
			const existingUser = await prisma.user.findUnique({ where: { email } });

			if (existingUser) {
				return existingUser;
			}

			return await prisma.user.create({ data: { email } });
		}
	)
);
