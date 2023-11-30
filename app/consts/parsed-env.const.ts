import { ENVIRONMENT_VARIABLES_SCHEMA } from "root/env.schema";

export const PARSED_ENV = ENVIRONMENT_VARIABLES_SCHEMA.parse(process.env);
