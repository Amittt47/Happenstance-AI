import { spawn } from "child_process";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function check() {
  const loginRes = await fetch("http://localhost:8080/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "amit@happenstance.com", password: "SecurePassword123!" }),
  });
  const authData = await loginRes.json();
  console.log("Logged in:", authData.user.displayName);

  const chromeProc = spawn(CHROME_PATH, [
    "--headless=new",
    "--remote-debugging-port=9455",
    "--disable-gpu",
    "--no-sandbox",
    "http://localhost:3000/login",
  ]);
  await sleep(2000);

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

  // Set localStorage directly on localhost:3000
  const userStr = JSON.stringify(authData.user);
  await send("Runtime.evaluate", {
    expression: `
      localStorage.setItem('happenstance_access_token', ${JSON.stringify(authData.accessToken)});
      localStorage.setItem('happenstance_user', ${JSON.stringify(userStr)});
    `,
  });

  // Navigate to dashboard on localhost:3000
  await send("Page.navigate", { url: "http://localhost:3000/dashboard" });
  await sleep(3500);

  const res = await send("Runtime.evaluate", {
    expression: `
      (() => {
        const cardH2 = document.querySelector('h2');
        return {
          h2Text: cardH2 ? cardH2.innerText : null,
          title: document.title,
          url: window.location.href,
          storageUser: localStorage.getItem('happenstance_user')
        };
      })()
    `,
    returnByValue: true,
  });
  console.log("Result:", JSON.stringify(res.result.value, null, 2));

  ws.close();
  chromeProc.kill();
}
check().catch(console.error);
