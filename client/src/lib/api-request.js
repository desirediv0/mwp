// Retry safe reads during brief API restarts. Never replay cart or payment mutations.
export async function fetchWithNetworkRetry(url, options = {}) {
  const isRead = ["GET", "HEAD"].includes((options.method || "GET").toUpperCase());
  const attempts = isRead ? 3 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (!(error instanceof TypeError) || options.signal?.aborted || attempt === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
}
