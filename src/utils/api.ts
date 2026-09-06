/**
 * Resilient JSON Fetch Client Helper
 * Handles automated retries when backend dev server is initializing
 * and prevents "Unexpected non-JSON response (200): Starting Server..." crashes.
 */

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

export interface SafeFetchOptions extends RequestInit {
  maxRetries?: number;
  retryDelayMs?: number;
}

export async function safeFetchJson<T>(
  url: string,
  options?: SafeFetchOptions
): Promise<T> {
  const maxRetries = options?.maxRetries ?? (url.startsWith('/api') ? 5 : 0);
  const initialDelay = options?.retryDelayMs ?? 1000;

  let attempt = 0;

  while (true) {
    let response: Response;

    try {
      response = await fetch(url, options);
    } catch (networkError: any) {
      if (attempt < maxRetries) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, initialDelay * attempt));
        continue;
      }
      throw new Error(
        `Network connection failed: ${networkError.message || 'Unable to reach the server.'}`
      );
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Handle non-JSON responses (e.g. Cloud Run proxy "Starting Server..." placeholder HTML)
    if (!isJson) {
      const rawText = await response.text().catch(() => '');
      const isServerStarting =
        rawText.includes('Starting Server') ||
        rawText.includes('color-scheme: light dark') ||
        rawText.includes('<!DOCTYPE html>') ||
        rawText.includes('<html');

      if (isServerStarting && attempt < maxRetries) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, initialDelay * attempt));
        continue;
      }

      if (isServerStarting) {
        throw new Error('MindEcho AI service is finishing initialization. Please try again in just a moment.');
      }

      const cleanSnippet = rawText
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100);

      throw new Error(
        cleanSnippet
          ? `Server error (${response.status}): ${cleanSnippet}`
          : `Unexpected non-JSON response from ${url} (${response.status}).`
      );
    }

    // Handle HTTP error statuses with JSON bodies
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Server responded with status ${response.status}`);
    }

    const result = (await response.json()) as ApiResponse<T>;
    if (result && result.error) {
      throw new Error(result.error);
    }
    return (result.data !== undefined ? result.data : result) as T;
  }
}
