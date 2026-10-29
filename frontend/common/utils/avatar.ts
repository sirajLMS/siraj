/**
 * Single-pass extraction of up to 2 initial characters from a name string.
 * Eliminates intermediate array allocations (`.split(" ")`, `.map()`) and string operations.
 */
export const avatarInitials = (name: string): string => {
  let initials = "";
  let inWord = false;

  for (let i = 0; i < name.length; i++) {
    const char = name[i];
    if (char !== " " && char !== "\t" && char !== "\n" && char !== "\r") {
      if (!inWord) {
        initials += char;
        if (initials.length === 2) {
          break;
        }
        inWord = true;
      }
    } else {
      inWord = false;
    }
  }

  return initials;
};
