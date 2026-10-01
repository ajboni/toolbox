export function encodeUrl(text: string): string {
  return encodeURIComponent(text);
}

export function decodeUrl(text: string): string | null {
  try {
    return decodeURIComponent(text.replace(/\+/g, ' '));
  } catch {
    return null;
  }
}

export function encodeUrlForm(text: string): string {
  return encodeURIComponent(text).replace(/%20/g, '+');
}
