import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = "C:\\Users\\Asus\\.gemini\\antigravity\\brain\\eaf2bf32-25f2-4245-acc3-8b730f33310f\\screenshots\\integrated";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id);
        this.callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  console.log("Obtaining Alice's real authentication session...");
  const loginRes = await fetch("http://localhost:8080/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "alice@happenstance.com", password: "SecurePassword123!" }),
  });
  const authData = await loginRes.json();
  const token = authData.accessToken;
  const userJson = JSON.stringify(authData.user);
  console.log("Token acquired for:", authData.user.displayName);

  console.log("Starting Chrome in headless remote debugging mode...");
  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    "--remote-debugging-port=9333",
    "--window-size=1280,850",
    "--disable-gpu",
    "--no-sandbox",
    "about:blank",
  ]);

  await sleep(2000);

  try {
    const listRes = await fetch("http://localhost:9333/json/list");
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send("Page.enable");
    await client.send("DOM.enable");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false,
    });

    async function capture(filename) {
      await sleep(1500);
      const { data } = await client.send("Page.captureScreenshot", { format: "png" });
      const filePath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(data, "base64"));
      console.log(`Saved screenshot: ${filename}`);
    }

    // 1. Landing Page
    console.log("1. Capturing Landing Page...");
    await client.send("Page.navigate", { url: "http://localhost:3000" });
    await capture("01_landing_page.png");

    // 2. Login Page
    console.log("2. Capturing Login Page...");
    await client.send("Page.navigate", { url: "http://localhost:3000/login" });
    await capture("02_login_page.png");

    // Authenticate in localStorage
    await client.send("Runtime.evaluate", {
      expression: `
        localStorage.setItem('happenstance_access_token', '${token}');
        localStorage.setItem('happenstance_user', '${userJson}');
      `,
    });

    // 3. Authenticated Dashboard
    console.log("3. Capturing Authenticated Dashboard...");
    await client.send("Page.navigate", { url: "http://localhost:3000/dashboard" });
    await sleep(2000);
    await capture("03_dashboard_authenticated.png");

    // 4. Discover Page
    console.log("4. Capturing Discover Page...");
    await client.send("Page.navigate", { url: "http://localhost:3000/discover" });
    await sleep(2000);
    await capture("04_discover_people.png");

    // 5. Profile Preview Modal with Mutual Connections (click on Diana's card preview)
    console.log("5. Opening Profile Preview Modal for Diana Prince...");
    await client.send("Runtime.evaluate", {
      expression: `
        const buttons = Array.from(document.querySelectorAll('button'));
        const dianaBtn = buttons.find(b => b.textContent && b.textContent.includes('Diana Prince'));
        if (dianaBtn) dianaBtn.click();
      `,
    });
    await sleep(2500);
    await capture("05_mutual_connections_preview_modal.png");

    // 6. Network Page
    console.log("6. Capturing Network Page...");
    await client.send("Page.navigate", { url: "http://localhost:3000/network" });
    await sleep(2000);
    await capture("06_network_connections_management.png");

    // 7. Recommendations Page
    console.log("7. Capturing Recommendations Page...");
    await client.send("Page.navigate", { url: "http://localhost:3000/recommendations" });
    await sleep(2000);
    await capture("07_ai_recommendations.png");

    // 8. Profile Page
    console.log("8. Capturing User Profile Page...");
    await client.send("Page.navigate", { url: "http://localhost:3000/profile" });
    await sleep(2000);
    await capture("08_user_profile.png");

    client.close();
  } finally {
    chromeProc.kill();
  }
}

run().catch(console.error);
