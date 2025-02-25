/**
 * Cloudflare Worker to redirect requests from size.forgithub.com to cache.zipobject.com
 * While preserving path parameters and authorization.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only process requests for size.forgithub.com
    if (url.hostname !== "size.forgithub.com") {
      return new Response("Not Found", { status: 404 });
    }

    // Parse the path: /owner/repo/page/...path
    const pathParts = url.pathname.split("/").filter((part) => part !== "");

    // We need at least owner and repo
    if (pathParts.length < 2) {
      return new Response("Invalid path format", { status: 400 });
    }

    const owner = pathParts[0];
    const repo = pathParts[1];

    // Construct the new URL
    const targetUrl = new URL(
      `https://cache.zipobject.com/github.com/${owner}/${repo}`,
    );

    // Add the query parameters
    targetUrl.searchParams.append("omitTree", "true");
    targetUrl.searchParams.append("omitFiles", "true");

    // Preserve any query parameters from the original request
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "omitTree" && key !== "omitFiles") {
        targetUrl.searchParams.append(key, value);
      }
    }

    // Create a new request to forward
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow",
    });

    // Forward the request to the target URL
    return fetch(newRequest);
  },
};
