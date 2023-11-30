import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { NotFound } from "~/components/common/ErrorBoundary";
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

	return (
		<div className="flex flex-col items-center gap-6">
			<NotFound from={from} />
		</div>
	);
};

export default NotFoundRoute;
