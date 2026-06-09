export namespace AuthUtils {
  export const validateUserName = (name: string) => {
    if (name.length < 3 || name.length > 255) {
      throw new Error("User name must be between 3 and 255 characters long.");
    }
  };
}
