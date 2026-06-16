// Function to validate password
/**
 * Validates if the given password is valid.
 * @param {string} password - The password to validate.
 * @returns {string} - 'empty', 'short', or 'valid' based on the password length.
 */
export const isPasswordValid = (password: string): string => {
  if (password.length === 0) {
    return "empty";
  } else if (password.length < 8) {
    return "short";
  }
  return "valid";
};

// Function to validate confirm password
/**
 * Validates if the confirmation password matches the original password.
 * @param {string} confirmPassword - The confirmation password to validate.
 * @param {string} password - The original password.
 * @returns {string} - 'empty', 'short', 'mismatch', or 'valid' based on the validation.
 */
export const isValidConfirmPassword = (confirmPassword: string, password: string): string => {
  if (confirmPassword.length === 0) {
    return "empty";
  } else if (confirmPassword.length < 8) {
    return "short";
  } else if (confirmPassword !== password) {
    return "mismatch";
  }
  return "valid";
};
