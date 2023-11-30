interface ErrorCountProps {
	errorCount: number | undefined | null;
}

export const ErrorCount = ({ errorCount }: ErrorCountProps) => {
	if (!errorCount || errorCount < 1) {
		return null;
	}

	return (
		<span className="flex justify-center items-center min-w-5 max-h-5 px-1 bg-red-700 rounded-md text-sm text-light select-none">
			{errorCount}
		</span>
	);
};
