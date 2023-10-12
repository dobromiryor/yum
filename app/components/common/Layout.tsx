import { type ReactNode } from "react";

interface LayoutProps {
	children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
	return (
		<main className="flex justify-center">
			<div className="flex flex-col gap-6 basis-lg min-w-0 max-w-5xl m-4 ">
				{children}
			</div>
		</main>
	);
};
