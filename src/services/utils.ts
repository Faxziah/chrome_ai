export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  const apiKeyPattern = /^[A-Za-z0-9_-]{8,}$/;
  return apiKeyPattern.test(apiKey);
}
