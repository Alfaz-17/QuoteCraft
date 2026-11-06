import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const SCREENSHOTS_DIR = path.resolve(process.cwd(), "audit-screenshots");
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: "360x800", width: 360, height: 800 },
  { name: "390x844", width: 390, height: 844 },
  { name: "412x915", width: 412, height: 915 },
];

async function waitForServer(url, timeoutMs = 60000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200 || res.status === 307 || res.status === 302) {
        return true;
      }
    } catch (e) {
      // wait
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server failed to start at ${url} within ${timeoutMs}ms`);
}

async function auditPageDOM(page) {
  return await page.evaluate(() => {
    const issues = {
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      windowWidth: window.innerWidth,
      smallFonts: [],
      smallTapTargets: [],
      inputsWithoutInputMode: [],
    };

    // Check all visible elements for font size < 12px
    const all = document.querySelectorAll("*");
    for (const el of all) {
      if (!(el instanceof HTMLElement)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;

      // Direct text nodes check
      const hasDirectText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent && n.textContent.trim().length > 0
      );
      if (hasDirectText) {
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 12) {
          issues.smallFonts.push({
            tag: el.tagName.toLowerCase(),
            text: el.textContent?.trim().slice(0, 30),
            fontSize: `${fontSize}px`,
            className: el.className ? String(el.className).slice(0, 50) : "",
          });
        }
      }

      // Check interactive elements for tap targets < 44px
      const isInteractive =
        el.tagName === "BUTTON" ||
        el.tagName === "A" ||
        el.tagName === "INPUT" ||
        el.tagName === "SELECT" ||
        el.getAttribute("role") === "button";

      if (isInteractive) {
        if (rect.width < 44 || rect.height < 44) {
          issues.smallTapTargets.push({
            tag: el.tagName.toLowerCase(),
            text: el.innerText ? el.innerText.trim().slice(0, 25) : el.getAttribute("aria-label") || el.getAttribute("title") || "",
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            className: el.className ? String(el.className).slice(0, 50) : "",
          });
        }
      }

      // Check inputs for inputmode
      if (el.tagName === "INPUT") {
        const type = el.getAttribute("type") || "text";
        const inputMode = el.getAttribute("inputmode");
        if (type === "number" || type === "text") {
          const isNumeric =
            el.placeholder?.toLowerCase().includes("qty") ||
            el.placeholder?.toLowerCase().includes("price") ||
            el.placeholder?.toLowerCase().includes("rate") ||
            el.className?.includes("tabular-nums") ||
            el.className?.includes("font-mono");
          if (isNumeric && !inputMode) {
            issues.inputsWithoutInputMode.push({
              name: el.getAttribute("name") || el.getAttribute("placeholder") || "unnamed",
              type,
            });
          }
        }
      }
    }

    // Limit reported samples to 10
    issues.smallFonts = issues.smallFonts.slice(0, 10);
    issues.smallTapTargets = issues.smallTapTargets.slice(0, 15);
    return issues;
  });
}

async function run() {
  console.log("Starting Next.js production server on port 3000...");
  const server = spawn("npx.cmd", ["next", "start", "-p", "3000"], {
    stdio: "inherit",
    shell: true,
  });

  try {
    await waitForServer("http://localhost:3000");
    console.log("Next.js server is alive! Launching Playwright Chromium...");

    const browser = await chromium.launch({ headless: true });
    const auditResults = {};

    for (const vp of VIEWPORTS) {
      console.log(`\n--- Auditing Viewport ${vp.name} (${vp.width}x${vp.height}) ---`);
      auditResults[vp.name] = {};

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent:
          "Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36",
        hasTouch: true,
        isMobile: true,
      });

      const page = await context.newPage();

      // 1. Landing Page
      console.log(`Capturing Landing Page [${vp.name}]...`);
      await page.goto("http://localhost:3000/landing", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const landingShot = path.join(SCREENSHOTS_DIR, `landing_${vp.name}.png`);
      await page.screenshot({ path: landingShot, fullPage: false });
      const landingDom = await auditPageDOM(page);
      auditResults[vp.name]["Landing"] = landingDom;

      // 2. Sign-In Page
      console.log(`Capturing Sign-In Page [${vp.name}]...`);
      await page.goto("http://localhost:3000/sign-in", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const signinShot = path.join(SCREENSHOTS_DIR, `signin_${vp.name}.png`);
      await page.screenshot({ path: signinShot, fullPage: false });
      auditResults[vp.name]["SignIn"] = await auditPageDOM(page);

      // 3. Templates Page
      console.log(`Capturing Templates Page [${vp.name}]...`);
      await page.goto("http://localhost:3000/templates", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const templatesShot = path.join(SCREENSHOTS_DIR, `templates_${vp.name}.png`);
      await page.screenshot({ path: templatesShot, fullPage: false });
      auditResults[vp.name]["Templates"] = await auditPageDOM(page);

      // 4. Quotations List Page
      console.log(`Capturing Quotations List Page [${vp.name}]...`);
      await page.goto("http://localhost:3000/quotations", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const quotesShot = path.join(SCREENSHOTS_DIR, `quotations_${vp.name}.png`);
      await page.screenshot({ path: quotesShot, fullPage: false });
      auditResults[vp.name]["Quotations"] = await auditPageDOM(page);

      // 5. Dashboard Page
      console.log(`Capturing Dashboard Page [${vp.name}]...`);
      await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const dashShot = path.join(SCREENSHOTS_DIR, `dashboard_${vp.name}.png`);
      await page.screenshot({ path: dashShot, fullPage: false });
      auditResults[vp.name]["Dashboard"] = await auditPageDOM(page);

      // 6. Settings Page
      console.log(`Capturing Settings Page [${vp.name}]...`);
      await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const settingsShot = path.join(SCREENSHOTS_DIR, `settings_${vp.name}.png`);
      await page.screenshot({ path: settingsShot, fullPage: false });
      auditResults[vp.name]["Settings"] = await auditPageDOM(page);

      // Now inject a mock quotation in localStorage so we can audit Step 1, Step 2, Step 3
      console.log(`Auditing Builder Flow with Draft state [${vp.name}]...`);
      await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
      await page.evaluate(() => {
        const mockDraft = {
          documentInfo: {
            number: "QT-2026-001",
            date: "2026-11-06",
            validUntil: "2026-11-20",
            vessel: "MV OCEAN STAR",
            reference: "RFQ-7749",
            scope: "Engine overhaul spares",
          },
          company: {
            name: "Gulf Marine Trading LLC",
            address: "Al Mina Port, Dubai, UAE",
            phone: "+971 4 332 1100",
            email: "quotes@gulfmarine.ae",
          },
          client: {
            name: "Star Bulk Carriers SA",
            address: "Marina Bay, Singapore",
          },
          items: [
            {
              id: "item-1",
              itemName: "Piston Ring Top Compression",
              partNumber: "WAR-6L20-045",
              quantity: 6,
              unit: "PCS",
              unitPrice: 450,
            },
            {
              id: "item-2",
              itemName: "Exhaust Valve Spindle Nimonic",
              partNumber: "WAR-6L20-092",
              quantity: 3,
              unit: "PCS",
              unitPrice: 820,
            },
            {
              id: "item-3",
              itemName: "Fuel Injection Nozzle Tip",
              partNumber: "WAR-6L20-118",
              quantity: 12,
              unit: "PCS",
              unitPrice: 165,
            },
          ],
          currency: "USD",
          taxPercent: 5,
          shippingCharge: 150,
        };
        localStorage.setItem("quoteDraft", JSON.stringify(mockDraft));
      });

      // Reload to hydrate builder with draft
      await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);

      // Step 2 Screenshot (Items & Pricing)
      const step2Shot = path.join(SCREENSHOTS_DIR, `step2_check_items_${vp.name}.png`);
      await page.screenshot({ path: step2Shot, fullPage: false });
      auditResults[vp.name]["Step2CheckItems"] = await auditPageDOM(page);

      // Step 1: Click Step 1 in navigation
      const step1Tab = page.locator("button, a").filter({ hasText: "Upload" }).first();
      if (await step1Tab.isVisible().catch(() => false)) {
        await step1Tab.click();
        await page.waitForTimeout(800);
        const step1Shot = path.join(SCREENSHOTS_DIR, `step1_upload_${vp.name}.png`);
        await page.screenshot({ path: step1Shot, fullPage: false });
        auditResults[vp.name]["Step1Upload"] = await auditPageDOM(page);
      }

      // Step 3: Click Step 3 in navigation
      const step3Tab = page.locator("button, a").filter({ hasText: "Preview" }).first();
      if (await step3Tab.isVisible().catch(() => false)) {
        await step3Tab.click();
        await page.waitForTimeout(1000);
        const step3Shot = path.join(SCREENSHOTS_DIR, `step3_preview_send_${vp.name}.png`);
        await page.screenshot({ path: step3Shot, fullPage: false });
        auditResults[vp.name]["Step3PreviewSend"] = await auditPageDOM(page);
      }

      await context.close();
    }

    await browser.close();

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, "audit-results.json"),
      JSON.stringify(auditResults, null, 2)
    );
    console.log("\n✅ Audit complete! Results saved to audit-screenshots/audit-results.json");
  } catch (err) {
    console.error("Audit failed:", err);
  } finally {
    console.log("Shutting down Next.js production server...");
    server.kill("SIGINT");
  }
}

run();
