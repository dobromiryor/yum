import { redirect, type ActionFunctionArgs } from "@remix-run/node";

import { i18nCookie } from "~/modules/i18next.server";
import { LanguageSchema, NonEmptyStringSchema } from "~/schemas/common";

export const sitemap = () => ({
	exclude: true,
});

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.clone().formData();
	const locale = LanguageSchema.parse(formData.get("locale"));
	const pathname = NonEmptyStringSchema.parse(formData.get("pathname"));

	return redirect(pathname, {
		headers: { "set-cookie": await i18nCookie.serialize(locale) },
	});
};

export const loader = async () => redirect("/");
