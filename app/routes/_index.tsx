import { redirect } from "@remix-run/node";

export const loader = async () => {
	return redirect("/recipes");
};

export default function IndexRoute() {
	return null;
}
