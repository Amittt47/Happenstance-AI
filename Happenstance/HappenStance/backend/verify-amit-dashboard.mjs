import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Asus\\.gemini\\antigravity\\brain\\eaf2bf32-25f2-4245-acc3-8b730f33310f";
const OUTPUT_DIR = path.join(ARTIFACT_DIR, "screenshots", "amit_dashboard");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log("Logging in as Amit Mallick...");
  const loginRes = await fetch("http://localhost:8080/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "amit@happenstance.com", password: "SecurePassword123!" }),
  });
  const authData = await loginRes.json();
  const token = authData.accessToken;
  const userStr = JSON.stringify(authData.user);
  console.log("Logged in as:", authData.user.displayName, "| token length:", token.length);

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    "--remote-debugging-port=9455",
    "--window-size=1280,850",
    "--disable-gpu",
    "--no-sandbox",
    "http://localhost:3000/login",
  ]);

  await sleep(2000);

  try {
    const listRes = await fetch("http://127.0.0.1:9455/json/list");
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === "page");
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));

    let msgId = 0;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = ++msgId;
        const handler = (event) => {
          const d = JSON.parse(event.data);
          if (d.id === id) {
            ws.removeEventListener("message", handler);
            resolve(d.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send("Page.enable");
    await send("DOM.enable");
    await send("Runtime.enable");

    // Set localStorage directly on localhost:3000
    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem('happenstance_access_token', ${JSON.stringify(token)});
        localStorage.setItem('happenstance_user', ${JSON.stringify(userStr)});
      `,
    });

    // Navigate to dashboard with authenticated session
    await send("Page.navigate", { url: "http://localhost:3000/dashboard" });
    await sleep(3500);

    // Verify layout measurements via JavaScript in browser
    const measureResult = await send("Runtime.evaluate", {
      expression: `
        (() => {
          const nameEl = document.querySelector('h2');
          const bannerEl = document.querySelector('div.bg-gradient-to-r');
          const avatarEl = document.querySelector('div.w-20.h-20');
          if (!nameEl || !bannerEl) return { error: 'elements not found' };
          const nameRect = nameEl.getBoundingClientRect();
          const bannerRect = bannerEl.getBoundingClientRect();
          const avatarRect = avatarEl ? avatarEl.getBoundingClientRect() : null;
          return {
            name: nameEl.innerText,
            banner: { top: bannerRect.top, bottom: bannerRect.bottom, height: bannerRect.height },
            avatar: avatarRect ? { top: avatarRect.top, bottom: avatarRect.bottom, height: avatarRect.height } : null,
            namePos: { top: nameRect.top, bottom: nameRect.bottom, height: nameRect.height },
            gapBetweenBannerAndName: nameRect.top - bannerRect.bottom,
            isOverlapping: nameRect.top < bannerRect.bottom
          };
        })()
      `,
      returnByValue: true,
    });

    console.log("Layout measurement result for Amit Mallick:", JSON.stringify(measureResult.result.value, null, 2));

    // Capture Desktop (1280x850)
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(1000);
    let { data } = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(OUTPUT_DIR, "amit_dashboard_desktop.png"), Buffer.from(data, "base64"));
    console.log("Saved: amit_dashboard_desktop.png");

    // Capture Tablet (768x1024)
    await send("Emulation.setDeviceMetricsOverride", {
      width: 768,
      height: 1024,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await sleep(1000);
    ({ data } = await send("Page.captureScreenshot", { format: "png" }));
    fs.writeFileSync(path.join(OUTPUT_DIR, "amit_dashboard_tablet.png"), Buffer.from(data, "base64"));
    console.log("Saved: amit_dashboard_tablet.png");

    // Capture Mobile (375x812)
    await send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(1000);
    ({ data } = await send("Page.captureScreenshot", { format: "png" }));
    fs.writeFileSync(path.join(OUTPUT_DIR, "amit_dashboard_mobile.png"), Buffer.from(data, "base64"));
    console.log("Saved: amit_dashboard_mobile.png");

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch(console.error);
