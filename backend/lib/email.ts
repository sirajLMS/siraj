import validator from "validator";

export class Email {
  public readonly value: string;

  constructor(value?: string) {
    if (!value || !validator.isEmail(value)) {
      throw new Error(`Invalid email address: ${value}`);
    }
    this.value = value;
  }
}
