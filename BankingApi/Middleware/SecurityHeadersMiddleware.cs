namespace BankingApi.Middleware;

public class SecurityHeadersMiddleware(RequestDelegate next, IHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        // ── X-Content-Type-Options ────────────────────────────────────────────
        // Prevents browsers from MIME-sniffing a response away from the declared
        // Content-Type. Stops attacks where a server serves user-uploaded content
        // that the browser misinterprets as executable script.
        headers["X-Content-Type-Options"] = "nosniff";

        // ── X-Frame-Options ───────────────────────────────────────────────────
        // Blocks the page from being embedded in an <iframe>, <frame>, or
        // <object>. Prevents clickjacking attacks where an attacker overlays an
        // invisible frame on top of a legitimate page to steal clicks.
        headers["X-Frame-Options"] = "DENY";

        // ── Referrer-Policy ───────────────────────────────────────────────────
        // Controls how much referrer information is included with requests.
        // strict-origin-when-cross-origin: sends full URL for same-origin
        // requests, only the origin for cross-origin HTTPS→HTTPS, and nothing
        // for HTTPS→HTTP. Prevents leaking sensitive URL parameters to third
        // parties (e.g. JWT tokens in query strings).
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // ── Permissions-Policy ────────────────────────────────────────────────
        // Disables browser features this API has no reason to use.
        // A REST API never needs camera, microphone, geolocation, or payment
        // APIs — explicitly disabling them reduces the attack surface if a
        // response is ever rendered in a browser context.
        headers["Permissions-Policy"] =
            "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()";

        // ── HSTS (production only) ────────────────────────────────────────────
        // Tells browsers to only contact this host over HTTPS for the next year.
        // includeSubDomains extends the policy to all subdomains.
        // preload opts into browser preload lists (requires registration at
        // hstspreload.org but is safe to include now).
        //
        // Only sent in Production because:
        //   - Development runs over plain HTTP — HSTS would break it.
        //   - Render/cloud proxies terminate TLS before the app, so the app
        //     itself only sees HTTP. HSTS is still correct here because the
        //     *browser* sees HTTPS from the proxy.
        if (env.IsProduction())
        {
            headers["Strict-Transport-Security"] =
                "max-age=31536000; includeSubDomains; preload";
        }

        // ── Content-Security-Policy ───────────────────────────────────────────
        // The most powerful XSS mitigation available. Tells the browser exactly
        // which sources are allowed for each resource type.
        //
        // Two policies:
        //
        //   Development / Staging — relaxed to allow Swagger UI, which loads
        //   inline scripts, inline styles, and resources from cdn.jsdelivr.net.
        //   Without 'unsafe-inline' the Swagger UI page renders blank.
        //
        //   Production — strict. No inline scripts, no inline styles, no eval.
        //   Swagger is disabled in production so there is no reason to relax it.
        //   frame-ancestors 'none' replaces X-Frame-Options for modern browsers
        //   (both are sent for maximum compatibility).
        headers["Content-Security-Policy"] = env.IsProduction()
            ? "default-src 'none'; " +
              "script-src 'none'; " +
              "style-src 'none'; " +
              "img-src 'none'; " +
              "font-src 'none'; " +
              "connect-src 'self'; " +
              "frame-ancestors 'none'; " +
              "base-uri 'none'; " +
              "form-action 'none'"
            : "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
              "img-src 'self' data: https://cdn.jsdelivr.net; " +
              "font-src 'self' https://cdn.jsdelivr.net; " +
              "connect-src 'self'; " +
              "frame-ancestors 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'";

        await next(context);
    }
}
