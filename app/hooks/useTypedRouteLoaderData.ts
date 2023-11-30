import { useRouteLoaderData } from "@remix-run/react";

import type { SerializeFrom } from "@remix-run/node";
import type { loader as RouteRootLoader } from "~/root";

type Loaders = {
	root: typeof RouteRootLoader;
};

export function useTypedRouteLoaderData<T extends keyof Loaders>(route: T) {
	return useRouteLoaderData(route) as SerializeFrom<Loaders[T]>;
}
