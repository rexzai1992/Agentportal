import { chromium, type BrowserContext, type Page, type Locator } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "/Users/cravemac2/Offline-Ota/frontend/public/docs";
const NAV_TIMEOUT = 180_000;

type Side = "left" | "right" | "top" | "bottom";

interface Annotation {
  num: number;
  find: (page: Page) => Locator;
  side?: Side;
}

interface Shot {
  path: string;
  file: string;
  fullPage?: boolean;
  settleMs?: number;
  annotations?: Annotation[];
  /** interactions to run before annotating/screenshotting */
  prepare?: (page: Page) => Promise<void>;
}

const drawAnnotation = async (page: Page, locator: Locator, num: number, side: Side) => {
  const el = locator.first();
  if ((await el.count()) === 0) {
    console.log(`  (marker ${num}: element not found, skipped)`);
    return;
  }
  try {
    await el.scrollIntoViewIfNeeded();
  } catch {
    /* ignore */
  }
  const handle = await el.elementHandle();
  if (!handle) return;
  await handle.evaluate(
    (target, opts) => {
      const rect = target.getBoundingClientRect();
      const x = rect.left + window.scrollX;
      const y = rect.top + window.scrollY;
      const w = rect.width;
      const h = rect.height;
      const COLOR = "#e11d48";
      const PAD = 6;

      const layer = document.createElement("div");
      layer.className = "__doc_annotation";
      layer.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:2147483647;";

      const box = document.createElement("div");
      box.style.cssText = `position:absolute;left:${x - PAD}px;top:${y - PAD}px;width:${w + PAD * 2}px;height:${h + PAD * 2}px;border:3px solid ${COLOR};border-radius:12px;box-shadow:0 0 0 2px rgba(255,255,255,.85), inset 0 0 0 2px rgba(255,255,255,.85);`;
      layer.appendChild(box);

      // badge + arrow, positioned per side
      const BADGE = 30;
      const GAP = 46; // distance from box edge to badge centre
      let bx = 0;
      let by = 0;
      if (opts.side === "left") {
        bx = x - PAD - GAP - BADGE / 2;
        by = y + h / 2 - BADGE / 2;
      } else if (opts.side === "right") {
        bx = x + w + PAD + GAP - BADGE / 2;
        by = y + h / 2 - BADGE / 2;
      } else if (opts.side === "top") {
        bx = x + w / 2 - BADGE / 2;
        by = y - PAD - GAP - BADGE / 2;
      } else {
        bx = x + w / 2 - BADGE / 2;
        by = y + h + PAD + GAP - BADGE / 2;
      }
      // keep badge on-page
      bx = Math.max(4, bx);
      by = Math.max(4, by);

      const badge = document.createElement("div");
      badge.textContent = String(opts.num);
      badge.style.cssText = `position:absolute;left:${bx}px;top:${by}px;width:${BADGE}px;height:${BADGE}px;border-radius:50%;background:${COLOR};color:#fff;font:700 15px/${BADGE}px system-ui;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.35);`;
      layer.appendChild(badge);

      // arrow from badge to box edge (SVG line + arrowhead)
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      const docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      const docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      svg.setAttribute("width", String(docW));
      svg.setAttribute("height", String(docH));
      svg.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;overflow:visible;";
      const defs = document.createElementNS(svgNS, "defs");
      const marker = document.createElementNS(svgNS, "marker");
      const mid = `__doc_arrow_${opts.num}_${Math.round(x)}`;
      marker.setAttribute("id", mid);
      marker.setAttribute("markerWidth", "8");
      marker.setAttribute("markerHeight", "8");
      marker.setAttribute("refX", "6");
      marker.setAttribute("refY", "3");
      marker.setAttribute("orient", "auto");
      const tip = document.createElementNS(svgNS, "path");
      tip.setAttribute("d", "M0,0 L6,3 L0,6 Z");
      tip.setAttribute("fill", COLOR);
      marker.appendChild(tip);
      defs.appendChild(marker);
      svg.appendChild(defs);

      const cx = bx + BADGE / 2;
      const cy = by + BADGE / 2;
      let ex = cx;
      let ey = cy;
      if (opts.side === "left") {
        ex = x - PAD - 6;
        ey = y + h / 2;
      } else if (opts.side === "right") {
        ex = x + w + PAD + 6;
        ey = y + h / 2;
      } else if (opts.side === "top") {
        ex = x + w / 2;
        ey = y - PAD - 6;
      } else {
        ex = x + w / 2;
        ey = y + h + PAD + 6;
      }
      // start the line at the badge edge, not centre
      const dx = ex - cx;
      const dy = ey - cy;
      const len = Math.max(Math.hypot(dx, dy), 1);
      const sx = cx + (dx / len) * (BADGE / 2 + 2);
      const sy = cy + (dy / len) * (BADGE / 2 + 2);

      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", String(sx));
      line.setAttribute("y1", String(sy));
      line.setAttribute("x2", String(ex));
      line.setAttribute("y2", String(ey));
      line.setAttribute("stroke", COLOR);
      line.setAttribute("stroke-width", "3");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("marker-end", `url(#${mid})`);
      svg.appendChild(line);
      layer.appendChild(svg);

      document.body.appendChild(layer);
    },
    { num, side }
  );
};

const clearAnnotations = (page: Page) =>
  page.evaluate(() => document.querySelectorAll(".__doc_annotation").forEach((n) => n.remove()));

const PUBLIC_SHOTS: Shot[] = [
  {
    path: "/login",
    file: "login",
    annotations: [
      { num: 1, find: (p) => p.getByText("Become an Agent"), side: "left" },
      { num: 2, find: (p) => p.getByText("Check Application Status"), side: "left" },
      { num: 3, find: (p) => p.getByRole("button", { name: "Sign In" }), side: "right" }
    ]
  },
  {
    path: "/register/agent",
    file: "register-terms",
    annotations: [{ num: 1, find: (p) => p.getByRole("button", { name: "Accept" }), side: "right" }]
  },
  {
    path: "/register/agent",
    file: "register",
    fullPage: true,
    prepare: async (page) => {
      await page.getByRole("button", { name: "Accept" }).click();
      await page.waitForTimeout(1500);
    },
    annotations: [
      { num: 1, find: (p) => p.getByText("Company Information").first(), side: "right" },
      { num: 2, find: (p) => p.getByRole("button", { name: /Save and Next/i }), side: "left" }
    ]
  }
];

const AGENT_SHOTS: Shot[] = [
  {
    path: "/agent/dashboard",
    file: "agent-dashboard",
    fullPage: true,
    settleMs: 6000,
    annotations: [
      { num: 1, find: (p) => p.getByText("Ticket Management"), side: "right" },
      { num: 2, find: (p) => p.getByText("Reports", { exact: true }).first(), side: "right" }
    ]
  },
  {
    path: "/ticket-purchase",
    file: "ticket-purchase",
    fullPage: true,
    settleMs: 5000,
    annotations: [
      { num: 1, find: (p) => p.locator("select").first(), side: "bottom" },
      { num: 2, find: (p) => p.locator('input[type="number"]').first(), side: "left" },
      { num: 3, find: (p) => p.getByRole("button", { name: /^(Add|Update)$/ }).first(), side: "right" },
      { num: 4, find: (p) => p.getByRole("button", { name: "Submit" }), side: "top" }
    ]
  },
  {
    path: "/transaction-review/AGT-26-213309",
    file: "transaction-review",
    settleMs: 5000,
    annotations: [
      { num: 1, find: (p) => p.locator("div.rounded-xl.bg-slate-50").first(), side: "right" },
      { num: 2, find: (p) => p.getByRole("button", { name: "Pay Offline" }), side: "top" }
    ]
  },
  {
    path: "/transaction-review/AGT-26-213309",
    file: "pay-offline-modal",
    settleMs: 4000,
    prepare: async (page) => {
      await page.getByRole("button", { name: "Pay Offline" }).click();
      await page.waitForTimeout(1500);
    },
    annotations: [
      { num: 1, find: (p) => p.getByText("Proof of Payment").first(), side: "left" },
      { num: 2, find: (p) => p.getByText("Payment Group").first(), side: "left" },
      { num: 3, find: (p) => p.getByRole("button", { name: /^Submit$/ }).last(), side: "left" }
    ]
  },
  {
    path: "/incomplete-orders",
    file: "incomplete-orders",
    settleMs: 5000,
    annotations: [{ num: 1, find: (p) => p.getByText("Complete →").first(), side: "left" }]
  },
  {
    path: "/reports/purchase",
    file: "agent-purchase-report",
    settleMs: 5000,
    annotations: [
      { num: 1, find: (p) => p.getByText("Filter By Date From").first(), side: "bottom" },
      { num: 2, find: (p) => p.getByRole("button", { name: "Search" }), side: "bottom" },
      { num: 3, find: (p) => p.locator("table a, table button").first(), side: "left" }
    ]
  },
  {
    path: "/vouchers",
    file: "voucher-issued",
    settleMs: 5000,
    annotations: [{ num: 1, find: (p) => p.locator("tbody tr").first(), side: "bottom" }]
  },
  {
    path: "/vouchers/cmrapsda0000brfnn383afyzy",
    file: "voucher-detail",
    settleMs: 6000,
    annotations: [
      { num: 1, find: (p) => p.locator("select").first(), side: "bottom" },
      { num: 2, find: (p) => p.getByRole("button", { name: "Export To Excel" }), side: "left" },
      { num: 3, find: (p) => p.getByRole("button", { name: "View QR" }).first(), side: "left" }
    ]
  },
  {
    path: "/profile",
    file: "profile",
    fullPage: true,
    settleMs: 5000,
    annotations: [
      { num: 1, find: (p) => p.getByText("Company Information").first(), side: "right" },
      { num: 2, find: (p) => p.getByText("Account Renewal").first(), side: "right" }
    ]
  },
  {
    path: "/settings",
    file: "settings",
    settleMs: 4000,
    annotations: [
      { num: 1, find: (p) => p.getByText("Change Password").first(), side: "right" },
      { num: 2, find: (p) => p.getByRole("button", { name: "Change Password" }), side: "top" }
    ]
  }
];

const ADMIN_SHOTS: Shot[] = [
  {
    path: "/admin/dashboard",
    file: "admin-dashboard",
    fullPage: true,
    settleMs: 8000,
    annotations: [
      { num: 1, find: (p) => p.getByText("Pending Agent Requests"), side: "bottom" },
      { num: 2, find: (p) => p.getByText("Pending Payment Approvals"), side: "bottom" }
    ]
  },
  {
    path: "/admin/registrations/agents",
    file: "admin-agent-requests",
    settleMs: 5000,
    annotations: [{ num: 1, find: (p) => p.locator("tbody tr").first(), side: "bottom" }]
  },
  {
    path: "/admin/offline-payments/pending",
    file: "admin-pending-payments",
    settleMs: 5000,
    annotations: [
      { num: 1, find: (p) => p.getByText("Awaiting finance").first(), side: "left" },
      { num: 2, find: (p) => p.getByRole("button", { name: "Approve Payment" }).first(), side: "left" }
    ]
  },
  {
    path: "/admin/purchase-schemes",
    file: "admin-schemes",
    fullPage: true,
    settleMs: 5000,
    annotations: [
      { num: 1, find: (p) => p.getByRole("button", { name: "New Purchase Scheme" }).first(), side: "left" }
    ]
  },
  {
    path: "/admin/complimentary",
    file: "admin-complimentary",
    fullPage: true,
    settleMs: 5000,
    annotations: [
      { num: 1, find: (p) => p.locator("select").first(), side: "right" },
      { num: 2, find: (p) => p.getByRole("button", { name: /Submit|Grant|Create/i }).first(), side: "left" }
    ]
  },
  {
    path: "/admin/renewals",
    file: "admin-renewals",
    settleMs: 5000,
    annotations: [{ num: 1, find: (p) => p.locator("tbody tr").first(), side: "bottom" }]
  },
  {
    path: "/admin/announcements",
    file: "admin-announcements",
    fullPage: true,
    settleMs: 5000,
    annotations: [
      { num: 1, find: (p) => p.getByRole("button", { name: /Create|Add|New/i }).first(), side: "left" }
    ]
  },
  {
    path: "/admin/outlets",
    file: "admin-outlets",
    fullPage: true,
    settleMs: 5000,
    annotations: [
      { num: 1, find: (p) => p.getByText(/BANK INFORMATION/i).first(), side: "right" },
      { num: 2, find: (p) => p.getByRole("button", { name: "Edit" }).first(), side: "left" }
    ]
  },
  {
    path: "/admin/outlets",
    file: "admin-outlet-bank-modal",
    settleMs: 5000,
    prepare: async (page) => {
      await page.getByRole("button", { name: "Edit" }).first().click();
      await page.waitForTimeout(1200);
    },
    annotations: [
      { num: 1, find: (p) => p.getByText("Bank Name", { exact: true }).last(), side: "left" },
      { num: 2, find: (p) => p.getByRole("button", { name: "Save Bank Information" }), side: "left" }
    ]
  },
  {
    path: "/admin/reports",
    file: "admin-reports-home",
    settleMs: 4000,
    annotations: [
      { num: 1, find: (p) => p.locator('a[href^="/admin/reports/"]').first(), side: "right" }
    ]
  },
  {
    path: "/admin/reports/transaction",
    file: "admin-report-transaction",
    fullPage: true,
    settleMs: 6000,
    annotations: [
      { num: 1, find: (p) => p.getByText("Filter By Date From").first(), side: "bottom" },
      { num: 2, find: (p) => p.getByRole("button", { name: "Search" }), side: "bottom" },
      { num: 3, find: (p) => p.getByRole("button", { name: "Export To Excel" }), side: "bottom" }
    ]
  }
];

const login = async (context: BrowserContext, email: string, password: string) => {
  const res = await context.request.post(`${BASE}/api/auth/login`, {
    data: { email, password },
    timeout: NAV_TIMEOUT
  });
  if (!res.ok()) throw new Error(`Login failed for ${email}: ${res.status()} ${await res.text()}`);
  console.log(`logged in as ${email}`);
};

const logout = async (context: BrowserContext) => {
  await context.request.post(`${BASE}/api/auth/logout`).catch(() => null);
  await context.clearCookies();
};

const capture = async (page: Page, shot: Shot) => {
  const started = Date.now();
  try {
    await page.goto(`${BASE}${shot.path}`, { waitUntil: "networkidle", timeout: NAV_TIMEOUT });
  } catch {
    console.log(`  (networkidle timeout on ${shot.path}, capturing anyway)`);
  }
  await page.waitForTimeout(shot.settleMs ?? 3000);
  if (shot.prepare) {
    try {
      await shot.prepare(page);
    } catch (err) {
      console.log(`  (prepare failed on ${shot.path}: ${(err as Error).message.split("\n")[0]})`);
    }
  }
  for (const a of shot.annotations ?? []) {
    try {
      await drawAnnotation(page, a.find(page), a.num, a.side ?? "left");
    } catch (err) {
      console.log(`  (marker ${a.num} failed: ${(err as Error).message.split("\n")[0]})`);
    }
  }
  // let scroll settle back to top for viewport shots
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${shot.file}.png`, fullPage: shot.fullPage ?? false });
  await clearAnnotations(page);
  console.log(`✓ ${shot.file}.png  (${shot.path})  ${Math.round((Date.now() - started) / 1000)}s`);
};

const main = async () => {
  const only = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
  const wanted = (shots: Shot[]) => shots.filter((s) => !only || only.has(s.file));

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(NAV_TIMEOUT);

  for (const shot of wanted(PUBLIC_SHOTS)) await capture(page, shot);

  const agentShots = wanted(AGENT_SHOTS);
  if (agentShots.length) {
    await login(context, "agent@travel-agent.demo", "agent123!");
    for (const shot of agentShots) await capture(page, shot);
    await logout(context);
  }

  const adminShots = wanted(ADMIN_SHOTS);
  if (adminShots.length) {
    await login(context, "admin@travel-agent.demo", "admin123!");
    for (const shot of adminShots) await capture(page, shot);
  }

  await browser.close();
  console.log("DONE");
};

main().catch((err) => {
  console.error("CAPTURE_FAILED", err);
  process.exit(1);
});
