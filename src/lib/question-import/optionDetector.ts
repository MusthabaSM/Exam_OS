export type OptionMatch = {
  key: string;
  text: string;
};

export function detectOptionStart(line: string): OptionMatch | null {
  const trimmed = line.trim();

  // A. Option, A) Option, (A) Option
  const alphaMatch = trimmed.match(/^[\(]?([A-Ea-e])[\.\)]\s+(.+)$/);
  if (alphaMatch) {
    return {
      key: alphaMatch[1].toUpperCase(),
      text: alphaMatch[2]
    };
  }
  
  // Just the option letter without text (e.g. if text is on next line)
  const alphaMatchNoText = trimmed.match(/^[\(]?([A-Ea-e])[\.\)]$/);
  if (alphaMatchNoText) {
    return {
      key: alphaMatchNoText[1].toUpperCase(),
      text: ""
    };
  }

  // 1. Option, 1) Option, (1) Option (can be ambiguous with questions)
  const numMatch = trimmed.match(/^[\(]?(\d+)[\.\)]\s+(.+)$/);
  if (numMatch) {
    return {
      key: numMatch[1],
      text: numMatch[2]
    };
  }

  const numMatchNoText = trimmed.match(/^[\(]?(\d+)[\.\)]$/);
  if (numMatchNoText) {
     return {
      key: numMatchNoText[1],
      text: ""
    };
  }

  return null;
}
