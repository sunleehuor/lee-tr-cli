import constant from "../data/constant";

export function removeSpaceAndSpacialChar(text: string) {
  text = text.replace(/\{.*?\}/g, "");
  const formattedText = text.replace(/[^\w\s]/g, "") // Remove special characters
    .split(" ") // Split into words
    .map((word, index) => 
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(""); // Join without any spaces

  return formattedText.slice(0, constant.LIMIT_OF_TRANSLATE_KEYS); // Limit to 20 characters
}

export const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
