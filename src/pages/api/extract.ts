import type { APIRoute } from "astro";
import { extractContent } from "../../services/extractor";
import { calculateScore } from "../../services/scoring";
import { checkRateLimit } from "../../utils/rate-limit";

const EXTRACT_TIMEOUT_MS = 120_000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Visitor-Id",
};

function rateLimitHeaders(result: ReturnType<typeof checkRateLimit>) {
  return {
    "X-RateLimit-Limit": "3",
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetSeconds.toString(),
    ...(result.allowed
      ? {}
      : { "Retry-After": result.resetSeconds.toString() }),
  };
}

function json(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export const OPTIONS: APIRoute = () =>
  new Response(null, { status: 204, headers: CORS_HEADERS });

export const POST: APIRoute = async ({ request }) => {
  try {
    const visitorId = request.headers.get("x-visitor-id");
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";

    const limit = checkRateLimit(visitorId, clientIp);
    const rlHeaders = rateLimitHeaders(limit);

    if (!limit.allowed) {
      return json(
        {
          success: false,
          error:
            "Daily analysis limit reached (3/3). Come back tomorrow or use your own API key.",
        },
        429,
        rlHeaders,
      );
    }

    const body = await request.json();
    let { url } = body;

    if (!url || typeof url !== "string") {
      return json(
        { success: false, error: "Invalid or missing URL" },
        400,
        rlHeaders,
      );
    }

    url = url.trim();

    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    try {
      new URL(url);
    } catch {
      return json(
        { success: false, error: "Invalid URL format" },
        400,
        rlHeaders,
      );
    }

    const result = await Promise.race([
      extractContent(url).then((data) => ({
        data,
        score: calculateScore(data),
      })),
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Extraction timed out after ${EXTRACT_TIMEOUT_MS / 1000}s`,
              ),
            ),
          EXTRACT_TIMEOUT_MS,
        ),
      ),
    ]);

    return json({ success: true, ...result }, 200, rlHeaders);
  } catch (error) {
    console.error("Error in /api/extract:", error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500,
    );
  }
};
