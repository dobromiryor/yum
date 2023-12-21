export const getCommentId = (id: string) =>
	`c-${id.split("-")[id.split("-").length - 1]}`;
