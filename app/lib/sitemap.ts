import { createSitemapGenerator } from "remix-sitemap";

import { PARSED_ENV } from "~/consts/parsed-env.const";

export const { experimental_sitemap, robots } = createSitemapGenerator({
	siteUrl: PARSED_ENV.DOMAIN_URL,
});
