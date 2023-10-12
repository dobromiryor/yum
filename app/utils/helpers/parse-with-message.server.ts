import { type AnyZodObject, type z } from "zod";

export const parseWithMessage = async <T extends AnyZodObject>(
	schema: T,
	data: unknown,
	message?: string
): Promise<z.infer<T>> => {
	try {
		return await schema.parseAsync(data);
	} catch (error) {
		if (message) {
			throw new Error(message);
		}

		throw new Error(JSON.stringify(error));
	}
};
