import isEmail from "validator/lib/isEmail";

export class Email {
  public readonly value: string;

  constructor(value?: string) {
    if (!value || !isEmail(value)) {
      throw new Error(`Invalid email address: ${value}`);
    }
    this.value = value;
  }
}
