export function mutationRequestError(request) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return 'Cross-origin updates are not accepted.';
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) return 'Send this update as JSON.';
  return null;
}
