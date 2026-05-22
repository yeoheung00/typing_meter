export function format(sentence: string): string[] {
  const chars = sentence.split("");
  const result: string[] = [];
  let numBuffer = "";
  chars.forEach((char, index) => {
    if (char === " " || isNaN(Number(char))) {
      result.push(char);
    } else {
      numBuffer += char;
      if (numBuffer.length === 2) {
        result.push(numBuffer);
        numBuffer = "";
      } else if (
        index === chars.length - 1 ||
        !isNaN(Number(chars[index + 1]))
      ) {
        result.push(numBuffer);
        numBuffer = "";
      }
    }
  });
  return result;
}
