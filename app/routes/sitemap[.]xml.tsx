import { routes } from "@remix-run/dev/server-build";
import { type LoaderFunction } from "@remix-run/node";

import { experimental_sitemap } from "~/lib/sitemap";

export const loader: LoaderFunction = async ({ request }) => {
	return await experimental_sitemap(request, routes);
};
