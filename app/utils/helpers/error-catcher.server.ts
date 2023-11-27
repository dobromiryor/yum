import { Prisma } from "@prisma/client";
import { json } from "@remix-run/node";

import i18next from "~/modules/i18next.server";

export const errorCatcher = async (request: Request, error: unknown) => {
	const t = await i18next.getFixedT(request.clone());

	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		return json({ success: false, formError: error.message }, { status: 400 });
	} else {
		console.error(error);

		return json(
			{
				success: false,
				formError: t("error.somethingWentWrong"),
			},
			{ status: 500 }
		);
	}
};
