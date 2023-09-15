import { type LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ params }: LoaderArgs) {
	// invariant(params.id, "expected params.id");

	return params;
}

export default function UserByIdRoute() {
	const params = useLoaderData<typeof loader>();

	return <div>user {params.id}</div>;
}
