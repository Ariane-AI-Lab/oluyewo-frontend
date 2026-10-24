export function canSubmitVerification(text: string, imageCount: number): boolean {
  return text.trim().length > 0 && imageCount === 1;
}

export function isImageFile(file: Pick<File, "type">): boolean {
  return file.type.startsWith("image/");
}
