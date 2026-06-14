---
name: markdown-new
description: Fetch the full, unabridged content of a URL as clean Markdown. Use when you need the actual content of a web page — not a summary or extraction, but the real text, tables, and structure. Covers markdown.new, Cloudflare Workers AI toMarkdown, Markdown for Agents content negotiation, and Browser Rendering.
---

# markdown.new

Free URL-to-Markdown conversion. No auth required. Converts any public URL to clean Markdown.

## Quick Usage

```bash
curl -s 'https://markdown.new/' \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}' | jq -r '.content'
```

That's it. For most cases, this is all you need.

## When to Use

- You need the actual content of a web page, not a lossy summary
- You want the full text, tables, code blocks, and structure preserved
- The page has content that could be missed by partial extraction
- You need to read documentation, articles, or data-heavy pages faithfully

## API Details

### Parameters

| Parameter | Values | Default | Notes |
|-----------|--------|---------|-------|
| `url` | Any public URL | — | Required |
| `method` | `auto`, `ai`, `browser` | `auto` | `auto` tries fast conversion first, falls back to headless browser. Use `browser` explicitly for JS-heavy SPAs. |
| `retain_images` | `true`, `false` | `false` | Keep image references in output |

### Request Formats

**POST JSON** (preferred):
```bash
curl -s 'https://markdown.new/' \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}'
```

**URL prepend** (browser/quick access):
```
https://markdown.new/https://example.com
```

**Query parameters:**
```
https://markdown.new/https://example.com?method=browser&retain_images=true
```

### Response

```jsonc
{
  "success": true,
  "url": "https://example.com",
  "title": "Page Title",
  "content": "# Page Title\n\nMarkdown content...",
  "method": "Cloudflare Workers AI",
  "duration_ms": 306,
  "tokens": 939
}
```

The `content` field is what you want. Use `jq -r '.content'` to extract it directly.

### Rate Limits

- **500 requests/day per IP**
- HTTP 429 when exceeded
- Track via `x-rate-limit-remaining` response header

## Edge Cases

- **Authenticated/paywalled pages**: Only public URLs work.
- **JS-rendered SPAs**: Use `method=browser` explicitly — `auto` may return incomplete content from faster tiers.
- **Very large pages**: May be truncated. Origin responses over 2 MB may fail.
- **Rate limiting**: 500/day is generous for ad-hoc use. If a task requires bulk fetching, space requests or switch to Cloudflare Workers AI `toMarkdown` directly (requires a Cloudflare account).
- **Images**: Excluded by default. Set `retain_images=true` to keep image references.

## For Building Applications

When the user is integrating URL-to-Markdown into their own code (not ad-hoc fetching):

### Content Negotiation (Cloudflare Zones)

Sites on Cloudflare with "Markdown for Agents" enabled respond to `Accept: text/markdown` directly:

```bash
curl -s 'https://example.com' -H 'Accept: text/markdown'
```

### Workers AI `toMarkdown`

For programmatic use at scale — converts HTML, PDF, and images to Markdown. Available as a Worker binding or REST API. Requires a Cloudflare account.

**Binding:**
```ts
const result = await env.AI.toMarkdown(
  [{ name: "page.html", blob: htmlBlob }],
  { conversionOptions: { html: { cssSelector: "main" } } }
);
```

**REST:**
```bash
curl https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/tomarkdown \
  -X POST \
  -H 'Authorization: Bearer {API_TOKEN}' \
  -F "files=@page.html"
```
