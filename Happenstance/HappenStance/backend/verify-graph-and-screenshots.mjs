import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\Asus\\.gemini\\antigravity\\brain\\eaf2bf32-25f2-4245-acc3-8b730f33310f";
const OUTPUT_DIR = path.join(ARTIFACT_DIR, "screenshots", "network_graph");
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
  console.log("Logged in:", authData.user.displayName);

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    "--remote-debugging-port=9477",
    "--window-size=1280,850",
    "--disable-gpu",
    "--no-sandbox",
    "http://localhost:3000/login",
  ]);

  await sleep(2000);

  try {
    const listRes = await fetch("http://127.0.0.1:9477/json/list");
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

    // Authenticate session on localhost:3000
    await send("Runtime.evaluate", {
      expression: `
        localStorage.setItem('happenstance_access_token', ${JSON.stringify(token)});
        localStorage.setItem('happenstance_user', ${JSON.stringify(userStr)});
      `,
    });

    // 1. Dashboard with updated Skill Graph widget and fixed Amit Mallick card
    console.log("1. Navigating to Dashboard...");
    await send("Page.navigate", { url: "http://localhost:3000/dashboard" });
    await sleep(3500);

    let { data } = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(OUTPUT_DIR, "01_dashboard_with_graph_widget.png"), Buffer.from(data, "base64"));
    console.log("Saved: 01_dashboard_with_graph_widget.png");

    // 2. Network Graph Page - Full View
    console.log("2. Navigating to /graph...");
    await send("Page.navigate", { url: "http://localhost:3000/graph" });
    await sleep(4000);

    ({ data } = await send("Page.captureScreenshot", { format: "png" }));
    fs.writeFileSync(path.join(OUTPUT_DIR, "02_network_graph_overview.png"), Buffer.from(data, "base64"));
    console.log("Saved: 02_network_graph_overview.png");

    // 3. Hover an edge to show shared skill synergy tooltip
    console.log("3. Triggering edge hover for shared skills...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const edgeLines = document.querySelectorAll('line[stroke-width]');
          for (const line of edgeLines) {
            const stroke = line.getAttribute('stroke');
            if (stroke !== 'transparent') {
              line.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
              line.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
              break;
            }
          }
        })()
      `,
    });
    await sleep(1200);
    ({ data } = await send("Page.captureScreenshot", { format: "png" }));
    fs.writeFileSync(path.join(OUTPUT_DIR, "03_graph_edge_synergy_hover.png"), Buffer.from(data, "base64"));
    console.log("Saved: 03_graph_edge_synergy_hover.png");

    // 4. Click a node to reveal side detail drawer
    console.log("4. Clicking a member node to open side drawer...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const nodeGroups = document.querySelectorAll('g.nodes-layer > g');
          // Pick a non-self node
          for (const g of nodeGroups) {
            const text = g.querySelector('text')?.textContent || '';
            if (!text.includes('Amit') && !text.includes('YOU')) {
              g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              break;
            }
          }
        })()
      `,
    });
    await sleep(1500);
    ({ data } = await send("Page.captureScreenshot", { format: "png" }));
    fs.writeFileSync(path.join(OUTPUT_DIR, "04_graph_node_drawer_active.png"), Buffer.from(data, "base64"));
    console.log("Saved: 04_graph_node_drawer_active.png");

    // 5. Open Full Profile Modal
    console.log("5. Opening full Profile Modal from graph drawer...");
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('View Full Profile'));
          if (btn) btn.click();
        })()
      `,
    });
    await sleep(2000);
    ({ data } = await send("Page.captureScreenshot", { format: "png" }));
    fs.writeFileSync(path.join(OUTPUT_DIR, "05_graph_profile_modal.png"), Buffer.from(data, "base64"));
    console.log("Saved: 05_graph_profile_modal.png");

    // Close modal
    await send("Runtime.evaluate", {
      expression: `
        (() => {
          const closeBtn = document.querySelector('button[aria-label=\"Close dialog\"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText === '✕');
          if (closeBtn) closeBtn.click();
        })()
      `,
    });
    await sleep(1000);

    // 6. Tablet Layout (768x1024)
    console.log("6. Capturing Tablet layout...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 768,
      height: 1024,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await sleep(1500);
    ({ data } = await send("Page.captureScreenshot", { format: "png" }));
    fs.writeFileSync(path.join(OUTPUT_DIR, "06_graph_tablet_768.png"), Buffer.from(data, "base64"));
    console.log("Saved: 06_graph_tablet_768.png");

    // 7. Mobile Layout (375x812)
    console.log("7. Capturing Mobile layout...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(1500);
    ({ data } = await send("Page.captureScreenshot", { format: "png" }));
    fs.writeFileSync(path.join(OUTPUT_DIR, "07_graph_mobile_375.png"), Buffer.from(data, "base64"));
    console.log("Saved: 07_graph_mobile_375.png");

    ws.close();
    console.log("All graph verifications and screenshots captured successfully!");
  } finally {
    chromeProc.kill();
  }
}

run().catch(console.error);
