#!/usr/bin/env bun
/**
 * .claude/skills/procedural-canvas-animation/scripts/render-frames.ts
 *
 * Deterministic still / frame-sequence renderer for a self-contained Canvas 2D
 * animation page. Drives the system Google Chrome (headless) over the DevTools
 * Protocol — no npm dependencies. The page must expose the seek contract:
 *
 *   window.__anim = { ready: Promise<void>, duration: number, seek(t: number): void }
 *
 * `seek(t)` renders the frame at time t synchronously (render(t) is pure).
 *
 * Usage:
 *   bun render-frames.ts <index.html> --t 0.3,1.8,3.0 [--out stills/]
 *   bun render-frames.ts <index.html> --frames [--fps 24] [--from 0] [--to <duration>] [--loop] [--out frames/] [--mp4 out.mp4]
 *   Common: --size 720 (square) | --width 1280 --height 720, --scale 2, --chrome "/path/to/Chrome" (or $CHROME)
 *
 * --loop drops the frame at t = --to, so a seamless loop doesn't repeat its first frame.
 * Chrome runs headless on a throwaway profile; DevTools listens on 127.0.0.1 only.
 */

import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const has = (name: string): boolean => args.includes(`--${name}`);

const page = args.find((a) => !a.startsWith("--") && a.endsWith(".html"));
if (!page) {
  console.error("usage: render-frames.ts <index.html> (--t 0.3,1.8 | --frames [--fps 24] [--from s] [--to s] [--loop] [--mp4 out.mp4]) [--out dir] [--size 720 | --width w --height h] [--scale 2]");
  process.exit(2);
}

const size = Number(flag("size") ?? 720);
const width = Number(flag("width") ?? size);
const height = Number(flag("height") ?? size);
const scale = Number(flag("scale") ?? 2);
const outDir = resolve(flag("out") ?? (has("frames") ? "frames" : "stills"));
const chromeCandidates = [
  flag("chrome"), process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  Bun.which("google-chrome"), Bun.which("google-chrome-stable"), Bun.which("chromium"), Bun.which("chromium-browser"),
];
const chrome = chromeCandidates.find((p): p is string => !!p && existsSync(p));
if (!chrome) {
  console.error("no Chrome/Chromium found — pass --chrome <path> or set $CHROME");
  process.exit(2);
}
if ((width * scale) % 2 || (height * scale) % 2) console.error(`warning: ${width * scale}×${height * scale} has an odd side; H.264 yuv420p needs even dimensions`);
const port = 9333 + Math.floor(Math.random() * 500);
const profile = `${tmpdir()}/render-frames-${port}`;
const url = `file://${resolve(page)}`;

await mkdir(outDir, { recursive: true });

const proc = Bun.spawn(
  [chrome, "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
   `--window-size=${width},${height}`, "--hide-scrollbars", "--no-first-run", "--disable-gpu-vsync",
   "--allow-file-access-from-files", "about:blank"],
  { stdout: "ignore", stderr: "ignore" },
);

const waitForDevtools = async (): Promise<string> => {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
      const target = (await res.json()) as { webSocketDebuggerUrl: string };
      return target.webSocketDebuggerUrl;
    } catch {
      await Bun.sleep(100);
    }
  }
  throw new Error("Chrome DevTools endpoint never came up");
};

const ws = new WebSocket(await waitForDevtools());
await new Promise<void>((ok) => ws.addEventListener("open", () => ok(), { once: true }));

let seq = 0;
const pending = new Map<number, { ok: (v: any) => void; fail: (e: Error) => void }>();
const events = new Map<string, () => void>();
const pageErrors: string[] = [];
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(String(ev.data));
  if (msg.id !== undefined) {
    const p = pending.get(msg.id);
    pending.delete(msg.id);
    if (!p) return;
    msg.error ? p.fail(new Error(`${msg.error.message}`)) : p.ok(msg.result);
  } else if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    const line = `page error: ${d.exception?.description ?? d.text} (line ${d.lineNumber + 1})`;
    pageErrors.push(line);
    console.error(line);
  } else if (msg.method && events.has(msg.method)) {
    events.get(msg.method)!();
  }
});
const send = (method: string, params: Record<string, unknown> = {}): Promise<any> =>
  new Promise((ok, fail) => {
    const id = ++seq;
    pending.set(id, { ok, fail });
    ws.send(JSON.stringify({ id, method, params }));
  });
const once = (method: string): Promise<void> => new Promise((ok) => events.set(method, ok));

const evaluate = async (expression: string, awaitPromise = false): Promise<unknown> => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (r.exceptionDetails) throw new Error(`page threw: ${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description ?? ""}`);
  return r.result?.value;
};

const shutdown = async (code: number): Promise<never> => {
  try { ws.close(); } catch {}
  proc.kill();
  await proc.exited;
  await Bun.$`rm -rf ${profile}`.nothrow().quiet();
  process.exit(code);
};

try {
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: false });
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url });
  await loaded;
  if (await evaluate("typeof window.__anim?.seek") !== "function") {
    throw new Error(`page does not expose window.__anim.seek${pageErrors.length ? " (it threw while loading, see above)" : ""}`);
  }
  await evaluate("window.__anim.ready", true);
  const duration = Number(await evaluate("window.__anim.duration"));

  const shoot = async (t: number, file: string): Promise<void> => {
    await evaluate(`window.__anim.seek(${t})`);
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y: 0, width, height, scale: 1 },
      captureBeyondViewport: true,
      optimizeForSpeed: true,
    });
    await Bun.write(`${outDir}/${file}`, Buffer.from(shot.data, "base64"));
  };

  if (has("frames")) {
    const fps = Number(flag("fps") ?? 24);
    const from = Number(flag("from") ?? 0);
    const to = Number(flag("to") ?? duration);
    const count = Math.round((to - from) * fps) - (has("loop") ? 1 : 0);
    const started = performance.now();
    for (let i = 0; i <= count; i++) {
      await shoot(from + i / fps, `f${String(i).padStart(5, "0")}.png`);
      if (i % fps === 0) console.error(`  ${i}/${count} frames (${((performance.now() - started) / 1000).toFixed(1)}s)`);
    }
    console.log(`${count + 1} frames → ${outDir}`);
    const mp4 = flag("mp4");
    if (mp4) {
      await Bun.$`ffmpeg -y -loglevel error -framerate ${fps} -i ${outDir}/f%05d.png -c:v libx264 -pix_fmt yuv420p -crf 17 -movflags +faststart ${mp4}`;
      console.log(`mp4 → ${resolve(mp4)}`);
    }
  } else {
    const times = (flag("t") ?? "0").split(",").filter((s) => s.trim() !== "").map(Number);
    for (const t of times) {
      const name = `t${t.toFixed(2).replace(".", "_")}.png`;
      await shoot(t, name);
      console.log(`${outDir}/${name}`);
    }
  }
  await shutdown(0);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  await shutdown(1);
}
