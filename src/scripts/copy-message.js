export async function copyMessage(message) {
  try {
    if (!navigator.clipboard?.writeText || !window.isSecureContext) return false;
    await navigator.clipboard.writeText(message);
    return true;
  } catch {
    return false;
  }
}
