import fs from "node:fs";

const out = new URL("./assets/", import.meta.url);
fs.mkdirSync(out, { recursive: true });
const targets = await fetch("http://127.0.0.1:9222/json/list").then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("No Chrome page target");
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let nextId = 0;
const pending = new Map();
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});
function send(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function screenshot(name) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(new URL(name, out), Buffer.from(result.data, "base64"));
  console.log(name);
}
async function scrollToTitle(title) {
  const found = await evaluate(`(() => {
    const title = ${JSON.stringify(title)};
    const heading = [...document.querySelectorAll("h2,h3")].find((element) => element.textContent.includes(title));
    if (!heading) return false;
    heading.scrollIntoView({ block: "start", behavior: "instant" });
    window.scrollBy(0, -100);
    return true;
  })()`);
  if (!found) console.log(`Missing heading: ${title}`);
}
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
await new Promise((resolve) => setTimeout(resolve, 1800));
await screenshot("ui-setup.png");
console.log(await evaluate(`(() => {
  const select = document.getElementById("study-preset");
  select.value = "baseline-quick";
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return [...document.querySelectorAll("button")].map((button) => button.textContent.trim()).filter(Boolean).slice(-15);
})()`));
await evaluate(`(() => {
  const button = [...document.querySelectorAll("button")].find((element) => element.textContent.includes("Find better green times"));
  if (!button) throw new Error("Run button missing");
  button.click();
})()`);
let complete = false;
for (let attempt = 0; attempt < 180; attempt++) {
  complete = await evaluate(`document.body.innerText.includes("Recommended green times")`);
  if (complete) break;
  await new Promise((resolve) => setTimeout(resolve, 500));
}
if (!complete) throw new Error("The browser experiment did not complete");
await evaluate("window.scrollTo(0, 0)");
await screenshot("ui-results-overview.png");
await scrollToTitle("Follow the traffic");
await screenshot("ui-simulation.png");
await scrollToTitle("Average queues across fresh runs");
await screenshot("ui-queue.png");
await scrollToTitle("Which timing performs better?");
await screenshot("ui-comparison.png");
await evaluate(`(() => {
  window.scrollTo(0, 0);
  const button = [...document.querySelectorAll("button")].find((element) => element.textContent.includes("All simulation outcomes"));
  if (button) button.click();
})()`);
await screenshot("ui-outcomes.png");
await scrollToTitle("See the spread of outcomes");
await evaluate("window.scrollBy(0, 540)");
await screenshot("ui-outcomes-detail.png");
await scrollToTitle("How the estimate settles");
await screenshot("ui-convergence.png");
socket.close();
