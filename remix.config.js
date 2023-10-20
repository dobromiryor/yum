/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	ignoredRouteFiles: ["**/.*"],
	serverDependenciesToBundle: ["remix-i18next", "remix-hook-form"],
	serverModuleFormat: "cjs",
};
