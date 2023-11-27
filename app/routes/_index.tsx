import { redirect } from "@remix-run/node";

export const sitemap = () => ({
	priority: 1.0,
});

export const loader = async () => {
	return redirect("/recipes");
};

export default function IndexRoute() {
	return null;
}

export { ErrorBoundaryContent as ErrorBoundary } from "~/components/common/ErrorBoundary";
