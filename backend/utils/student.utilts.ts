import { PhoneNumber } from "@/backend/lib";
import type { CountryCode, Gender } from "@/lib/enum";
import type { StudentDto, StudentEntity } from "../types";

export namespace StudentUtils {
	export const validateName = (name: string): Promise<string | null> => {
		if (name.length < 3 || name.length > 255) {
			return Promise.resolve(
				"Student name must be between 3 and 255 characters long.",
			);
		}
		return Promise.resolve(null);
	};

	export const mapEntityToDto = (
		entity: StudentEntity | null | undefined,
	): StudentDto | null => {
		if (!entity) {
			return null;
		}
		return {
			id: entity.id,
			name: entity.name,
			email: entity.email,
			phoneNumber: entity.phoneNumber
				? new PhoneNumber(entity.phoneNumber)
				: null,
			nationality: entity.nationality
				? (entity.nationality as CountryCode)
				: null,
			gender: entity.gender ? (entity.gender as Gender) : null,
			dateOfBirth: entity.dateOfBirth,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	};
}
