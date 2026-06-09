import { AppLanguage, CountryCode, Gender } from "@/lib/enum";
import { createPgEnumFromEnum } from "../../utils/db.utils";

export const appLanguageEnum = createPgEnumFromEnum("app_language", AppLanguage);

export const genderEnum = createPgEnumFromEnum("gender", Gender);

export const countryCodeEnum = createPgEnumFromEnum("country_code", CountryCode);
