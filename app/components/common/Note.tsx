import { useSearchParams } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "~/components/common/UI/Button";
import { Icon } from "~/components/common/UI/Icon";

interface NoteProps {
	icon?: string;
	isClearable?: boolean;
	message: string | null | undefined;
}

export const Note = ({
	icon = "info",
	isClearable = false,
	message,
}: NoteProps) => {
	const [, setSearchParams] = useSearchParams();

	return (
		<AnimatePresence initial={false}>
			{message && (
				<motion.div
					animate={{
						translateY: 0,
						opacity: 1,
					}}
					className="flex gap-3 p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg "
					exit={{
						translateY: -10,
						opacity: 0,
					}}
					initial={{
						translateY: -10,
						opacity: 0,
					}}
					transition={{ duration: 0.3 }}
				>
					<Icon
						className="flex-grow self-start material-symbols-rounded"
						name={icon}
						size="36"
					/>
					<p className="flex-grow self-center">{message}</p>
					{isClearable && (
						<Button
							className="self-start"
							rounded="full"
							onClick={() => setSearchParams()}
						>
							<Icon name="close" size="16" />
						</Button>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
};
