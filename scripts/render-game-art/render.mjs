/**
 * Renders the Shop and guild-badge art (assets/images/game/*.webp) from the
 * low-poly models in scene.js, with three.js in headless Chrome.
 *
 *   node scripts/render-game-art/render.mjs
 *
 * Needs Google Chrome and Python (for a throwaway local web server). Uses
 * the three.js already in node_modules; installs nothing. Writes 256 px WebP
 * files of about 4 KB each.
 */
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const SRC = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");
const ROOT = path.resolve(SRC, "..", "..");
const OUT = process.argv[2] ?? path.join(ROOT, "assets", "images", "game");
// Work in a temp folder: scene.js plus the three.js build from node_modules.
const HERE = fs.mkdtempSync(path.join(os.tmpdir(), "karela-render-"));
fs.copyFileSync(path.join(SRC, "scene.js"), path.join(HERE, "scene.js"));
for (const f of ["three.module.js", "three.core.js"]) {
  fs.copyFileSync(path.join(ROOT, "node_modules", "three", "build", f), path.join(HERE, f));
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(HERE, "index.html"), `<!doctype html><html><body style="margin:0;background:transparent"><script type="module" src="scene.js"></script></body></html>`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HTTP = 8800 + Math.floor(Math.random() * 150);
const CDP = 9400 + Math.floor(Math.random() * 150);
const server = spawn("python", ["-m", "http.server", String(HTTP), "--bind", "127.0.0.1", "--directory", HERE], { stdio: "ignore" });
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${CDP}`, "--enable-unsafe-swiftshader", "--use-angle=swiftshader",
  "--no-first-run", "--no-default-browser-check", `--user-data-dir=${path.join(HERE, "profile-" + CDP)}`, "about:blank",
], { stdio: "ignore" });

try {
  let targets;
  for (let i = 0; i < 40; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); break; } catch { await sleep(250); }
  }
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500));
    return r.result?.result?.value;
  };

  await send("Page.enable");
  await send("Page.navigate", { url: `http://127.0.0.1:${HTTP}/index.html?v=${Date.now()}` });
  for (let i = 0; i < 60 && !(await evaluate("window.ready === true")); i++) await sleep(250);
  const ids = await evaluate("window.ITEM_IDS");
  for (const item of ids) {
    const url = await evaluate(`window.renderItem(${JSON.stringify(item)})`);
    const buf = Buffer.from(url.split(",")[1], "base64");
    fs.writeFileSync(path.join(OUT, `${item}.webp`), buf);
    console.log(item, buf.length, "bytes", url.slice(5, 15));
  }
  ws.close();
} finally {
  chrome.kill();
  server.kill();
  setTimeout(() => fs.rmSync(HERE, { recursive: true, force: true }), 1500);
}
