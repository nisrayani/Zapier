export function parse(
  text: string,
  values: Record<string, any>,
  startDelimeter = "{",
  endDelimeter = "}",
): string {
  let startIndex = 0;
  let endIndex = 1;

  let finalString = "";
  while (endIndex < text.length) {
    if (text[startIndex] === startDelimeter) {
      let endPoint = startIndex + 2;
      while (endPoint < text.length && text[endPoint] !== endDelimeter) {
        endPoint++;
      }

      let stringHoldingValue = text.slice(startIndex + 1, endPoint);
      const keys = stringHoldingValue.split(".");
      let localValues: any = { ...values };

      for (let i = 0; i < keys.length; i++) {
        if (typeof localValues === "string") {
          try {
            localValues = JSON.parse(localValues);
          } catch {
            break;
          }
        }
        // Safely access using type assertion or optional chaining check
        if (localValues != null && typeof localValues === "object") {
          localValues = localValues[keys[i]!];
        } else {
          localValues = undefined;
          break;
        }
      }

      finalString += localValues !== undefined ? localValues : "";
      startIndex = endPoint + 1;
      endIndex = endPoint + 2;
    } else {
      finalString += text[startIndex];
      startIndex++;
      endIndex++;
    }
  }
  if (startIndex < text.length && text[startIndex]) {
    finalString += text[startIndex];
  }
  return finalString;
}
