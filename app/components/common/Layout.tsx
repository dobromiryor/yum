import { useMatches } from "@remix-run/react";
import clsx from "clsx";
import { type ReactNode } from "react";

interface LayoutProps {
	children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
	const matches = useMatches();

	const isLogin = matches.some((item) => item.pathname === "/login");

	return (
		<main
			className={clsx(
				"flex-1 flex justify-center pb-16",
				"selection:bg-primary selection:text-light dark:selection:bg-secondary dark:selection:text-dark"
			)}
		>
			<div
				className={clsx(
					"flex flex-col gap-6 basis-lg min-w-0 max-w-5xl m-4",
					isLogin && "justify-center"
				)}
			>
				{children}
			</div>
		</main>
	);
};
