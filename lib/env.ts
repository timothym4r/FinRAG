type PublicEnv = {
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_API_URL: string;
  API_BASE_URL: string;
};

function requireUrl(value: string | undefined, key: string, fallback?: string) {
  const resolved = value || fallback;
  if (!resolved) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  try {
    new URL(resolved);
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL.`);
  }

  return resolved;
}

export function getPublicEnv(): PublicEnv {
  const nextPublicAppUrl = requireUrl(
    process.env.NEXT_PUBLIC_APP_URL,
    "NEXT_PUBLIC_APP_URL",
    "http://localhost:3000"
  );
  const nextPublicApiUrl = requireUrl(
    process.env.NEXT_PUBLIC_API_URL,
    "NEXT_PUBLIC_API_URL",
    "http://localhost:8000"
  );

  const apiBaseUrl = requireUrl(
    process.env.API_BASE_URL,
    "API_BASE_URL",
    typeof window === "undefined" ? nextPublicApiUrl : nextPublicApiUrl
  );

  return {
    NEXT_PUBLIC_APP_URL: nextPublicAppUrl,
    NEXT_PUBLIC_API_URL: nextPublicApiUrl,
    API_BASE_URL: apiBaseUrl
  };
}

