export const getLabelId = (name: string, label: string) =>
	`${name.replaceAll(" ", "-")}__${label.replaceAll(" ", "-")}`;
