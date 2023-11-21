import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import on from "public/images/404/display_on.png";
import placeholder from "public/images/404/display_placeholder.png";
import oven from "public/images/404/oven.png";
import { Button } from "~/components/common/UI/Button";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18next from "~/modules/i18next.server";
import { getFrom } from "~/utils/helpers/get-from.server";
import {
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const from = getFrom(request);

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("seo.notFound.title"),
		postfix: PARSED_ENV.APP_NAME,
	});

	return json({ from, meta: { title } }, { status: 404 });
};

export const NotFoundRoute = () => {
	const { from } = useLoaderData<typeof loader>();
	const { t } = useTranslation();

	return (
		<div className="flex flex-col items-center gap-6">
			<h1 className="text-2xl typography-bold text-center">
				{t("errorPages.404.title")}
			</h1>
			<div className="flex gap-2">
				{from && (
					<Link to={from}>
						<Button>{t("errorPages.common.backCTA")}</Button>
					</Link>
				)}
				<Link to="/">
					<Button>{t("errorPages.common.homeCTA")}</Button>
				</Link>
			</div>
			<div className="relative w-full max-w-lg max-h-lg aspect-square">
				<img alt="" className="absolute w-full drop-shadow-xl" src={oven} />
				<img alt="" className="absolute" src={placeholder} />
				<img alt="" className="absolute animate-blink" src={on} />
			</div>
		</div>
	);
};

export default NotFoundRoute;
