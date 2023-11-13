export const getLocalTime = () => {
	return new Date().toLocaleString("en-gb", { timeZone: "Europe/Sofia" });
};
