/** @type {import('@remix-pwa/dev').WorkerConfig} */
export default {
	ignoredRouteFiles: ["**/.*"],
	serverDependenciesToBundle: [/@remix-pwa\/.*/, "remix-i18next"],
};
