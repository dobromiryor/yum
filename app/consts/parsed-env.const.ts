import { ENVIRONMENT_VARIABLES_SCHEMA } from "~/../env.schema";

export const PARSED_ENV = ENVIRONMENT_VARIABLES_SCHEMA.parse(process.env);
