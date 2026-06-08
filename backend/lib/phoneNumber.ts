import {
	type PhoneNumber as GooglePhoneNumber,
	PhoneNumberFormat,
	PhoneNumberUtil,
} from "google-libphonenumber";

/**
 * TypeScript wrapper class for Google's PhoneNumber with validation support
 */
export class PhoneNumber {
	public readonly number: string;
	public readonly googlePhoneNumber: GooglePhoneNumber;

	constructor(numberOrGooglePhoneNumber: string | GooglePhoneNumber) {
		if (typeof numberOrGooglePhoneNumber === "string") {
			this.googlePhoneNumber = PhoneNumber.util.parse(
				numberOrGooglePhoneNumber,
			);
			this.number = PhoneNumber.util.format(
				this.googlePhoneNumber,
				PhoneNumberFormat.E164,
			);
		} else {
			this.googlePhoneNumber = numberOrGooglePhoneNumber;
			this.number = PhoneNumber.util.format(
				this.googlePhoneNumber,
				PhoneNumberFormat.E164,
			);
		}
	}

	public static readonly util = PhoneNumberUtil.getInstance();

	// Enum wrapper for CountryCodeSource
	public static readonly CountryCodeSource = {
		FROM_NUMBER_WITH_PLUS_SIGN: "FROM_NUMBER_WITH_PLUS_SIGN",
		FROM_NUMBER_WITH_IDD: "FROM_NUMBER_WITH_IDD",
		FROM_NUMBER_WITHOUT_PLUS_SIGN: "FROM_NUMBER_WITHOUT_PLUS_SIGN",
		FROM_DEFAULT_COUNTRY: "FROM_DEFAULT_COUNTRY",
		UNSPECIFIED: "UNSPECIFIED",
		toGoogleEnum(source: string): number {
			// google lib phone number uses numbers for enums
			switch (source) {
				case "FROM_NUMBER_WITH_PLUS_SIGN":
					return 1;
				case "FROM_NUMBER_WITH_IDD":
					return 5;
				case "FROM_NUMBER_WITHOUT_PLUS_SIGN":
					return 10;
				case "FROM_DEFAULT_COUNTRY":
					return 20;
				case "UNSPECIFIED":
					return 0;
				default:
					return 0;
			}
		},
		fromGoogleEnum(source: number): string {
			switch (source) {
				case 1:
					return "FROM_NUMBER_WITH_PLUS_SIGN";
				case 5:
					return "FROM_NUMBER_WITH_IDD";
				case 10:
					return "FROM_NUMBER_WITHOUT_PLUS_SIGN";
				case 20:
					return "FROM_DEFAULT_COUNTRY";
				case 0:
					return "UNSPECIFIED";
				default:
					return "UNSPECIFIED";
			}
		},
	};

	// Country Code properties and methods
	get hasCountryCode(): boolean {
		return this.googlePhoneNumber.hasCountryCode();
	}
	get countryCode(): number | undefined {
		return this.googlePhoneNumber.getCountryCode() ?? undefined;
	}
	setCountryCode(value: number): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.setCountryCode(value);
		return clone;
	}
	clearCountryCode(): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.clearCountryCode();
		return clone;
	}

	// National Number properties and methods
	get hasNationalNumber(): boolean {
		return this.googlePhoneNumber.hasNationalNumber();
	}
	get nationalNumber(): number | undefined {
		return this.googlePhoneNumber.getNationalNumber() ?? undefined;
	}
	setNationalNumber(value: number): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.setNationalNumber(value);
		return clone;
	}
	clearNationalNumber(): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.clearNationalNumber();
		return clone;
	}

	// Extension properties and methods
	get hasExtension(): boolean {
		return this.googlePhoneNumber.hasExtension();
	}
	get extension(): string | undefined {
		return this.googlePhoneNumber.getExtension() ?? undefined;
	}
	setExtension(value: string): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.setExtension(value);
		return clone;
	}
	clearExtension(): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.clearExtension();
		return clone;
	}

	// Italian Leading Zero properties and methods
	get hasItalianLeadingZero(): boolean {
		return this.googlePhoneNumber.hasItalianLeadingZero();
	}
	get isItalianLeadingZero(): boolean | undefined {
		return this.googlePhoneNumber.getItalianLeadingZero() ?? undefined;
	}
	setItalianLeadingZero(value: boolean): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.setItalianLeadingZero(value);
		return clone;
	}
	clearItalianLeadingZero(): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.clearItalianLeadingZero();
		return clone;
	}

	// Number of Leading Zeros properties and methods
	get hasNumberOfLeadingZeros(): boolean {
		return this.googlePhoneNumber.hasNumberOfLeadingZeros();
	}
	get numberOfLeadingZeros(): number | undefined {
		return this.googlePhoneNumber.getNumberOfLeadingZeros() ?? undefined;
	}
	setNumberOfLeadingZeros(value: number): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.setNumberOfLeadingZeros(value);
		return clone;
	}
	clearNumberOfLeadingZeros(): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.clearNumberOfLeadingZeros();
		return clone;
	}

	// Raw Input properties and methods
	get hasRawInput(): boolean {
		return this.googlePhoneNumber.hasRawInput();
	}
	get rawInput(): string | undefined {
		return this.googlePhoneNumber.getRawInput() ?? undefined;
	}
	setRawInput(value: string): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.setRawInput(value);
		return clone;
	}
	clearRawInput(): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.clearRawInput();
		return clone;
	}

	// Country Code Source properties and methods
	get hasCountryCodeSource(): boolean {
		return this.googlePhoneNumber.hasCountryCodeSource();
	}
	get countryCodeSource(): string | undefined {
		const src = this.googlePhoneNumber.getCountryCodeSource();
		return src !== undefined
			? PhoneNumber.CountryCodeSource.fromGoogleEnum(src)
			: undefined;
	}
	setCountryCodeSource(value: string): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.setCountryCodeSource(
			PhoneNumber.CountryCodeSource.toGoogleEnum(value),
		);
		return clone;
	}
	clearCountryCodeSource(): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.clearCountryCodeSource();
		return clone;
	}

	// Preferred Domestic Carrier Code properties and methods
	get hasPreferredDomesticCarrierCode(): boolean {
		return this.googlePhoneNumber.hasPreferredDomesticCarrierCode();
	}
	get preferredDomesticCarrierCode(): string | undefined {
		return (
			this.googlePhoneNumber.getPreferredDomesticCarrierCode() ?? undefined
		);
	}
	setPreferredDomesticCarrierCode(value: string): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.setPreferredDomesticCarrierCode(value);
		return clone;
	}
	clearPreferredDomesticCarrierCode(): PhoneNumber {
		const clone = this.clone();
		clone.googlePhoneNumber.clearPreferredDomesticCarrierCode();
		return clone;
	}

	// Utility methods
	// Note: google lib phone number does not support clear, mergeFrom, exactlySameAs, hashCode, or deep clone methods directly.
	// For equality, compare E164 formatted numbers.
	equals(other: unknown): boolean {
		if (this === other) return true;
		if (!(other instanceof PhoneNumber)) return false;
		return this.number === other.number;
	}

	toString(): string {
		return this.number;
	}

	private clone(): PhoneNumber {
		// Shallow clone by re-parsing the E164 number
		return new PhoneNumber(this.number);
	}
}
