---
name: modelcontextprotocol
description: MCP specification and SDK reference links. Use when you need to look up MCP docs, spec sections, GitHub repos, or SDK links — NOT as general context for MCP development tasks.
user-invokable: true
---

# Model Context Protocol (MCP)

Open standard for connecting AI applications to external data sources, tools, and workflows. JSON-RPC 2.0 based, with defined primitives and transport layers. Verified against modelcontextprotocol.io and the `modelcontextprotocol` GitHub org on 2026-10-10.

## Architecture

```
Host (AI app)
 └─ Client (1:1 with server)
     └─ Server (exposes primitives)
```

- **Host**: The AI application (Claude Desktop, IDE, agent framework)
- **Client**: Connects a host to one server and supplies protocol version, identity, and capabilities on every request.
- **Server**: Exposes tools, resources, and prompts over a transport.

Servers can be **local** (stdio, launched as subprocess) or **remote** (Streamable HTTP). Authorization is optional in the spec; when used over HTTP it is OAuth 2.1-based.

## Primitives

| Primitive       | Offered by | Purpose                                                      |
| --------------- | ---------- | ------------------------------------------------------------ |
| **Tools**       | Server     | Functions the model can call (side effects, computation)     |
| **Resources**   | Server     | Data the client can attach as context                        |
| **Prompts**     | Server     | Templated messages/workflows for specific tasks              |
| **Elicitation** | Client     | Server asks the user for input via the client (form or URL mode) |
| **Sampling**    | Client     | Server asks the client for an LLM completion. Deprecated in 2026-07-28 (SEP-2577). |
| **Roots**       | Client     | Client tells the server which filesystem roots it can access. Deprecated in 2026-07-28 (SEP-2577). |

In 2026-07-28, client features are reached through Multi Round-Trip Requests: the server returns an `input_required` result carrying `inputRequests`, and the client retries the original request with `inputResponses`. Earlier revisions used server-initiated requests (`elicitation/create`, `sampling/createMessage`, `roots/list`).

## Transports

| Transport           | Use Case       | Notes                                                      |
| ------------------- | -------------- | ---------------------------------------------------------- |
| **stdio**           | Local servers  | Launched as subprocess, pipes for communication            |
| **Streamable HTTP** | Remote servers | Single endpoint; POST per request, response as JSON or a request-scoped SSE stream. 2026-07-28 removed `Mcp-Session-Id` sessions, the GET stream, and SSE resumability (`Last-Event-ID`); requires `Mcp-Method`/`Mcp-Name` headers. |

The legacy HTTP+SSE transport (separate `/sse` + `/messages` endpoints) is Deprecated under the feature lifecycle policy; use Streamable HTTP.

## Request Model (2026-07-28)

1. **Per-request metadata**: Every request carries `io.modelcontextprotocol/protocolVersion` and `io.modelcontextprotocol/clientCapabilities` in `_meta`, and should carry `io.modelcontextprotocol/clientInfo`. Results should carry `io.modelcontextprotocol/serverInfo`.
2. **Optional discovery**: Servers must implement `server/discover` (supported versions, capabilities, identity); clients may call it first or just send requests and handle `UnsupportedProtocolVersionError`.
3. **Stateless operation**: No `initialize` handshake, sessions, or `ping`. Cross-call state uses explicit server-minted handles passed as tool arguments. Every result has `resultType` (`"complete"` or `"input_required"`).
4. **Change notifications**: Clients opt in through `subscriptions/listen`, a long-lived POST response stream (replaces `resources/subscribe` and the HTTP GET stream). Progress and log notifications stay on the originating request's stream; log level is set per request via `io.modelcontextprotocol/logLevel`.

Revisions through `2025-11-25` use the `initialize`/`initialized` handshake. The 2026-07-28 versioning page covers backward compatibility with them.

## Capability Negotiation

Clients declare capabilities on every request. Servers return theirs from `server/discover`. Only use features the other side declared.

**Server capabilities**: `tools`, `resources`, `prompts`, `completions`, `logging` (deprecated in 2026-07-28, SEP-2577)
**Client capabilities**: `elicitation` (`form`, `url`); `sampling` and `roots` are deprecated in 2026-07-28 (SEP-2577), and new implementations should not add them.

Optional extensions are negotiated through the `extensions` map in both capability objects, keyed by identifier (`{vendor-prefix}/{name}`; official ones use `io.modelcontextprotocol/`).

## Specification

Current revision: **2026-07-28** (`/specification/latest` redirects here). A draft at `/specification/draft` accumulates changes for the next revision; its changelog was empty as of 2026-10-10. Previous revisions: `2025-11-25`, `2025-06-18`, `2025-03-26`, `2024-11-05`.

**2026-07-28 key changes**: stateless protocol (no handshake, sessions, or `ping`; SEP-2575, SEP-2567), mandatory `server/discover`, Multi Round-Trip Requests replacing server-initiated requests (SEP-2322), `subscriptions/listen`, required `ttlMs`/`cacheScope` on list and read results (SEP-2549), tasks moved to an extension (SEP-2663), any JSON Schema 2020-12 keyword allowed in `inputSchema`/`outputSchema` (SEP-2106), resource-not-found error code changed from `-32002` to `-32602`, and spec error codes moved into `-32020`..`-32099`. Deprecated: Roots, Sampling, Logging, Dynamic Client Registration (replaced by Client ID Metadata Documents), and HTTP+SSE. The full list is on the Changelog page.

| Section             | URL                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| Overview            | https://modelcontextprotocol.io/specification/2026-07-28                                              |
| Architecture        | https://modelcontextprotocol.io/specification/2026-07-28/architecture                                 |
| Base Protocol       | https://modelcontextprotocol.io/specification/2026-07-28/basic                                        |
| Versioning          | https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning                             |
| Message Patterns    | https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns                               |
| Multi Round-Trip    | https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr                          |
| Subscriptions       | https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions                 |
| Cancellation        | https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation                  |
| Progress            | https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/progress                      |
| Transports          | https://modelcontextprotocol.io/specification/2026-07-28/basic/transports                             |
| stdio               | https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio                       |
| Streamable HTTP     | https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http             |
| Authorization       | https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization                          |
| Client Registration | https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/client-registration      |
| AS Discovery        | https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery |
| Auth Security       | https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/security-considerations  |
| Server Features     | https://modelcontextprotocol.io/specification/2026-07-28/server                                       |
| Discovery           | https://modelcontextprotocol.io/specification/2026-07-28/server/discover                              |
| Tools               | https://modelcontextprotocol.io/specification/2026-07-28/server/tools                                 |
| Resources           | https://modelcontextprotocol.io/specification/2026-07-28/server/resources                             |
| Prompts             | https://modelcontextprotocol.io/specification/2026-07-28/server/prompts                               |
| Caching             | https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching                     |
| Completion          | https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/completion                  |
| Pagination          | https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/pagination                  |
| Logging             | https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/logging                     |
| Elicitation         | https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation                           |
| Sampling            | https://modelcontextprotocol.io/specification/2026-07-28/client/sampling                              |
| Roots               | https://modelcontextprotocol.io/specification/2026-07-28/client/roots                                 |
| Deprecated Features | https://modelcontextprotocol.io/specification/2026-07-28/deprecated                                   |
| Changelog           | https://modelcontextprotocol.io/specification/2026-07-28/changelog                                    |
| Schema Reference    | https://modelcontextprotocol.io/specification/2026-07-28/schema                                       |
| Draft               | https://modelcontextprotocol.io/specification/draft                                                   |

The normative schema source is `schema/<revision>/schema.ts` in the `modelcontextprotocol/modelcontextprotocol` repo.

## Documentation

Docs are versioned per revision (`/docs/<revision>/...`); the unversioned paths below redirect to the current revision.

| Page                    | URL                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Introduction            | https://modelcontextprotocol.io/docs/getting-started/intro                         |
| Architecture            | https://modelcontextprotocol.io/docs/learn/architecture                            |
| Server Concepts         | https://modelcontextprotocol.io/docs/learn/server-concepts                         |
| Client Concepts         | https://modelcontextprotocol.io/docs/learn/client-concepts                         |
| Versioning              | https://modelcontextprotocol.io/docs/learn/versioning                              |
| Build a Server          | https://modelcontextprotocol.io/docs/develop/build-server                          |
| Build a Client          | https://modelcontextprotocol.io/docs/develop/build-client                          |
| Client Best Practices   | https://modelcontextprotocol.io/docs/develop/clients/client-best-practices         |
| Connect Local Servers   | https://modelcontextprotocol.io/docs/develop/connect-local-servers                 |
| Connect Remote Servers  | https://modelcontextprotocol.io/docs/develop/connect-remote-servers                |
| Authorization Tutorial  | https://modelcontextprotocol.io/docs/tutorials/security/authorization              |
| Security Best Practices | https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices    |
| Local Server Security   | https://modelcontextprotocol.io/docs/tutorials/security/local-server-security      |
| Inspector               | https://modelcontextprotocol.io/docs/tools/inspector                               |
| Debugging               | https://modelcontextprotocol.io/docs/tools/debugging                               |
| SDKs                    | https://modelcontextprotocol.io/docs/sdk                                           |
| Examples                | https://modelcontextprotocol.io/examples                                           |
| LLM-friendly index      | https://modelcontextprotocol.io/llms.txt (append `.md` to any page URL for raw Markdown) |

## Extensions, Registry, Governance

| Page                     | URL                                                    |
| ------------------------ | ------------------------------------------------------ |
| Extensions Overview      | https://modelcontextprotocol.io/extensions/overview    |
| Extension Support Matrix | https://modelcontextprotocol.io/extensions/client-matrix |
| MCP Apps                 | https://modelcontextprotocol.io/extensions/apps/overview |
| Tasks                    | https://modelcontextprotocol.io/extensions/tasks/overview |
| Skills over MCP          | https://modelcontextprotocol.io/extensions/skills/overview |
| Registry (docs)          | https://modelcontextprotocol.io/registry/about         |
| Registry publish quickstart | https://modelcontextprotocol.io/registry/quickstart |
| Registry (live, preview) | https://registry.modelcontextprotocol.io/              |
| SEP Index                | https://modelcontextprotocol.io/seps                   |
| SDK Tiers                | https://modelcontextprotocol.io/community/sdk-tiers    |
| Feature Lifecycle        | https://modelcontextprotocol.io/community/feature-lifecycle |
| Roadmap                  | https://modelcontextprotocol.io/development/roadmap    |

Official extension identifiers: `io.modelcontextprotocol/tasks`, `io.modelcontextprotocol/oauth-client-credentials`, and others listed on the overview. The registry is in preview, so breaking changes and data resets may occur before GA.

## SDKs

Tiers come from the SDKs page. Tier 1 = 100% conformance, Tier 2 = 80%, Tier 3 = experimental.

| SDK        | Repo                                                                   | Docs                                   | Tier | Notes                    |
| ---------- | ---------------------------------------------------------------------- | -------------------------------------- | ---- | ------------------------ |
| TypeScript | [typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | https://ts.sdk.modelcontextprotocol.io | 1    | See below                |
| Python     | [python-sdk](https://github.com/modelcontextprotocol/python-sdk)       | https://py.sdk.modelcontextprotocol.io | 1    |                          |
| C#         | [csharp-sdk](https://github.com/modelcontextprotocol/csharp-sdk)       | https://csharp.sdk.modelcontextprotocol.io | 1 | With Microsoft           |
| Go         | [go-sdk](https://github.com/modelcontextprotocol/go-sdk)               | https://go.sdk.modelcontextprotocol.io | 1    | With Google              |
| Rust       | [rust-sdk](https://github.com/modelcontextprotocol/rust-sdk)           | https://rust.sdk.modelcontextprotocol.io | 1  |                          |
| Ruby       | [ruby-sdk](https://github.com/modelcontextprotocol/ruby-sdk)           | https://ruby.sdk.modelcontextprotocol.io | 1  |                          |
| Java       | [java-sdk](https://github.com/modelcontextprotocol/java-sdk)           | https://java.sdk.modelcontextprotocol.io | 2  | With Spring AI           |
| Swift      | [swift-sdk](https://github.com/modelcontextprotocol/swift-sdk)         | —                                      | 3    | Targets 2025-11-25       |
| PHP        | [php-sdk](https://github.com/modelcontextprotocol/php-sdk)             | https://php.sdk.modelcontextprotocol.io | 3   | With The PHP Foundation  |
| Kotlin     | [kotlin-sdk](https://github.com/modelcontextprotocol/kotlin-sdk)       | https://kotlin.sdk.modelcontextprotocol.io | 3 | With JetBrains           |

**TypeScript**: v2 is the stable line on `main` (`@modelcontextprotocol/server` + `@modelcontextprotocol/client`, released 2026-07-27, implements 2026-07-28), with optional middleware packages (`@modelcontextprotocol/node`, `express`, `fastify`, `hono`). Schemas use Standard Schema (Zod v4, Valibot, ArkType). Docs: https://ts.sdk.modelcontextprotocol.io/v2/ · migration guide: https://ts.sdk.modelcontextprotocol.io/v2/migration/upgrade-to-v2 · **v1.x** (`@modelcontextprotocol/sdk`) lives on the `v1.x` branch and gets bug and security fixes for at least six months after the v2 release.

## Scaffolding a TypeScript Server

[mcp-ts-core](https://github.com/cyanheads/mcp-ts-core) (`@cyanheads/mcp-ts-core`) is an agent-native TypeScript framework for MCP servers, built on the official TypeScript SDK. Each scaffold ships the framework reference and Agent Skills for designing tools, writing tests, security review, and releases. The framework stays a dependency, so fixes arrive as package upgrades.

```sh
bunx @cyanheads/mcp-ts-core init my-mcp-server
```

## Other GitHub Repositories

| Repo                                                                                   | Purpose                                         |
| -------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [modelcontextprotocol](https://github.com/modelcontextprotocol/modelcontextprotocol)   | Spec, schema, docs, and SEPs source             |
| [servers](https://github.com/modelcontextprotocol/servers)                             | Reference servers (educational, not production) |
| [inspector](https://github.com/modelcontextprotocol/inspector)                         | Inspector: web, CLI (`--cli`), TUI (`--tui`), plus `mcpdo` |
| [registry](https://github.com/modelcontextprotocol/registry)                           | MCP Registry service and `server.json` schema   |
| [conformance](https://github.com/modelcontextprotocol/conformance)                     | Conformance tests (basis for SDK tiers)         |
| [quickstart-resources](https://github.com/modelcontextprotocol/quickstart-resources)   | Tutorial servers and clients                    |
| [example-remote-server](https://github.com/modelcontextprotocol/example-remote-server) | Hosted Everything server for testing            |
| [mcpb](https://github.com/modelcontextprotocol/mcpb)                                   | MCP Bundles: one-click local server install in desktop apps |
| [ext-apps](https://github.com/modelcontextprotocol/ext-apps)                           | MCP Apps extension (embedded UIs)               |
| [ext-auth](https://github.com/modelcontextprotocol/ext-auth)                           | Authorization extensions                        |
| [ext-tasks](https://github.com/modelcontextprotocol/ext-tasks)                         | Tasks extension (long-running operations)       |
| [ext-skills](https://github.com/modelcontextprotocol/ext-skills)                       | Skills over MCP extension                       |

Incubating extensions live in `experimental-ext-*` repos in the same org.
