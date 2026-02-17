import { getSupabaseBrowserClient } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Retry configuration for queries
 */
interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  retryableErrors?: string[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeout: 30000, // 30 seconds
  retryableErrors: [
    "network",
    "timeout",
    "fetch",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ECONNREFUSED",
  ],
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;

  const errorMessage = String(error?.message || error || "").toLowerCase();
  const errorCode = String(error?.code || "").toLowerCase();

  return DEFAULT_RETRY_CONFIG.retryableErrors.some(
    (retryable) =>
      errorMessage.includes(retryable) ||
      errorCode.includes(retryable) ||
      error?.name === "TypeError" ||
      error?.name === "NetworkError"
  );
}

/**
 * Sleep utility for retries
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a query with retry logic and timeout
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_RETRY_CONFIG.maxRetries,
    retryDelay = DEFAULT_RETRY_CONFIG.retryDelay,
    timeout = DEFAULT_RETRY_CONFIG.timeout,
  } = config;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query timeout after ${timeout}ms`));
        }, timeout);
      });

      console.log(`[ReliableClient] Attempt ${attempt + 1}/${maxRetries + 1} starting...`);

      // Race between query and timeout
      const result = await Promise.race([queryFn(), timeoutPromise]);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`[ReliableClient] Attempt ${attempt + 1} failed:`, error);

      // Don't retry on the last attempt
      if (attempt >= maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Exponential backoff: delay increases with each retry
      const delay = retryDelay * Math.pow(2, attempt);
      console.warn(
        `Query attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        error?.message || error
      );

      await sleep(delay);
    }
  }

  throw lastError || new Error("Query failed after all retries");
}

/**
 * Refresh session if needed
 */
export async function ensureSession(): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      return false;
    }

    // If session exists but is close to expiring, refresh it
    if (session) {
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
        // Refresh if expires in less than 5 minutes
        if (expiresIn < 300) {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error("Error refreshing session:", refreshError);
            return false;
          }
        }
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error ensuring session:", error);
    return false;
  }
}

/**
 * Reliable query wrapper that handles retries, timeouts, and session management
 */
export async function reliableQuery<T>(
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
  config: RetryConfig = {}
): Promise<{ data: T | null; error: any }> {
  try {
    // Ensure session is valid before querying
    await ensureSession();

    const supabase = getSupabaseBrowserClient();

    return await executeWithRetry(async () => {
      const result = await queryFn(supabase);

      // If we get an auth error, try refreshing session and retry once
      if (result.error && result.error.message?.includes("JWT")) {
        const sessionRefreshed = await ensureSession();
        if (sessionRefreshed) {
          // Retry once after session refresh
          return await queryFn(supabase);
        }
      }

      return result;
    }, config);
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error?.message || "Query failed",
        code: error?.code,
        details: error,
      },
    };
  }
}

/**
 * Reliable auth operation wrapper
 */
export async function reliableAuth<T = any>(
  authFn: (client: SupabaseClient) => Promise<{ data: T; error: any }>,
  config: RetryConfig = {}
): Promise<{ data: T; error: any }> {
  try {
    const supabase = getSupabaseBrowserClient();

    return await executeWithRetry(async () => {
      return await authFn(supabase);
    }, config);
  } catch (error: any) {
    return {
      data: null as any,
      error: {
        message: error?.message || "Authentication operation failed",
        code: error?.code,
        details: error,
      },
    };
  }
}
