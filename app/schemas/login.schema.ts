import { z } from "zod";

import { EmailSchema } from "~/schemas/common";

export const LoginSchema = z.object({ email: EmailSchema });
