import { useTranslation } from "react-i18next";

export const SearchInput = () => {
	const { t } = useTranslation();

	return (
		<input className="bg-light dark:bg-dark text-dark dark:text-light text-xl border-none px-2 py-1 rounded-lg transition-colors w-full outline-offset-[-1px]" />
	);
};
