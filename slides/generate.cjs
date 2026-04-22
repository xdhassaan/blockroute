// Generate SupplyChain.pptx from scratch using pptxgenjs.
// Run with: node slides/generate.cjs

const path = require("path");
const PptxGenJS = require("C:/Users/Hassaan/AppData/Roaming/npm/node_modules/pptxgenjs");

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches
pres.title = "SupplyChain DApp — CY-326 Semester Project";
pres.author = "Team Supply Chain";

// ----------------------------------------------------------------
// Theme — "Midnight Executive": navy primary, ice-blue secondary, white accent
// ----------------------------------------------------------------
const C = {
  navy:    "1E2761",
  navyDk:  "121845",
  ice:     "CADCFC",
  iceDk:   "9DB4DE",
  white:   "FFFFFF",
  text:    "1A1A1A",
  muted:   "6B7280",
  accent:  "F96167", // coral accent for highlights/icons
  good:    "10B981",
  border:  "E5E7EB",
};
const F = { head: "Calibri", body: "Calibri" };

// Footer / page number on every content slide
function addFooter(slide, pageNo, total) {
  slide.addShape(pres.ShapeType.line, {
    x: 0.5, y: 7.0, w: 12.33, h: 0,
    line: { color: C.border, width: 0.75 },
  });
  slide.addText("CY-326 / CS-411 Blockchain · SupplyChain DApp", {
    x: 0.5, y: 7.05, w: 8, h: 0.35,
    fontFace: F.body, fontSize: 10, color: C.muted, align: "left",
  });
  slide.addText(`${pageNo} / ${total}`, {
    x: 11.83, y: 7.05, w: 1, h: 0.35,
    fontFace: F.body, fontSize: 10, color: C.muted, align: "right",
  });
}

function titleBlock(slide, text, eyebrow) {
  if (eyebrow) {
    slide.addText(eyebrow, {
      x: 0.5, y: 0.4, w: 12, h: 0.3,
      fontFace: F.body, fontSize: 11, bold: true, color: C.accent,
      charSpacing: 4,
    });
  }
  slide.addText(text, {
    x: 0.5, y: 0.7, w: 12.3, h: 0.85,
    fontFace: F.head, fontSize: 36, bold: true, color: C.navy,
  });
}

const TOTAL = 12;

// ----------------------------------------------------------------
// Slide 1 — Title
// ----------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  // Decorative coral bar on the left
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 0.4, h: 7.5, fill: { color: C.accent }, line: { type: "none" },
  });

  s.addText("CY-326 / CS-411 BLOCKCHAIN  ·  SEMESTER PROJECT", {
    x: 1.2, y: 1.6, w: 11, h: 0.4,
    fontFace: F.body, fontSize: 12, bold: true, color: C.iceDk, charSpacing: 6,
  });

  s.addText("SupplyChain", {
    x: 1.2, y: 2.1, w: 11, h: 1.4,
    fontFace: F.head, fontSize: 88, bold: true, color: C.white,
  });
  s.addText("DApp", {
    x: 1.2, y: 3.4, w: 11, h: 1.0,
    fontFace: F.head, fontSize: 56, bold: false, color: C.ice,
  });

  s.addText("Provenance, custody, and trust on Ethereum.", {
    x: 1.2, y: 4.6, w: 11, h: 0.5,
    fontFace: F.body, fontSize: 22, color: C.ice, italic: true,
  });

  s.addShape(pres.ShapeType.rect, {
    x: 1.2, y: 5.5, w: 0.7, h: 0.04, fill: { color: C.accent }, line: { type: "none" },
  });
  s.addText("Team [Member 1]  ·  [Member 2]  ·  [Member 3]  ·  [Member 4]", {
    x: 1.2, y: 5.65, w: 11, h: 0.35,
    fontFace: F.body, fontSize: 14, color: C.iceDk,
  });
  s.addText("Submission: April 21, 2026", {
    x: 1.2, y: 6.05, w: 11, h: 0.3,
    fontFace: F.body, fontSize: 12, color: C.iceDk,
  });
}

// ----------------------------------------------------------------
// Slide 2 — The Problem
// ----------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  titleBlock(s, "The problem with off-chain supply chains", "01 · CONTEXT");

  // Left: pain points
  const pains = [
    { icon: "Excel", h: "Spreadsheet ledgers", b: "Editable, forgeable, frequently lost." },
    { icon: "Email", h: "Email handoffs",        b: "No proof of who shipped what, when." },
    { icon: "Trust", h: "Single-party trust",   b: "Whoever owns the database owns the truth." },
  ];
  pains.forEach((p, i) => {
    const y = 1.9 + i * 1.45;
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.5, y, w: 0.85, h: 0.85,
      fill: { color: C.accent }, line: { type: "none" },
      rectRadius: 0.1,
    });
    s.addText(p.icon, {
      x: 0.5, y, w: 0.85, h: 0.85,
      fontFace: F.head, fontSize: 11, bold: true, color: C.white, align: "center", valign: "middle",
    });
    s.addText(p.h, {
      x: 1.55, y: y - 0.05, w: 5.5, h: 0.45,
      fontFace: F.head, fontSize: 20, bold: true, color: C.navy,
    });
    s.addText(p.b, {
      x: 1.55, y: y + 0.4, w: 5.5, h: 0.5,
      fontFace: F.body, fontSize: 14, color: C.muted,
    });
  });

  // Right: the consequence + tagline
  s.addShape(pres.ShapeType.roundRect, {
    x: 7.6, y: 1.9, w: 5.3, h: 4.5,
    fill: { color: C.navy }, line: { type: "none" }, rectRadius: 0.15,
  });
  s.addText("Result", {
    x: 7.9, y: 2.1, w: 4.7, h: 0.45,
    fontFace: F.body, fontSize: 12, bold: true, color: C.iceDk, charSpacing: 4,
  });
  s.addText("Counterfeits.\nShip-and-deny disputes.\nLost batches.", {
    x: 7.9, y: 2.6, w: 4.7, h: 1.8,
    fontFace: F.head, fontSize: 28, bold: true, color: C.white, lineSpacingMultiple: 1.2,
  });
  s.addShape(pres.ShapeType.rect, {
    x: 7.9, y: 4.7, w: 0.6, h: 0.04, fill: { color: C.accent }, line: { type: "none" },
  });
  s.addText("We replace \"trust the spreadsheet\" with \"verify the chain.\"", {
    x: 7.9, y: 4.85, w: 4.7, h: 1.2,
    fontFace: F.body, fontSize: 16, color: C.ice, italic: true,
  });

  addFooter(s, 2, TOTAL);
}

// ----------------------------------------------------------------
// Slide 3 — Our Solution
// ----------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  titleBlock(s, "Our solution", "02 · APPROACH");

  // 4 stat cards
  const cards = [
    { k: "Network", v: "Ethereum", sub: "Local Hardhat node for the demo" },
    { k: "Contract", v: "Solidity", sub: "0.8.26 + AccessControl" },
    { k: "Frontend", v: "React DApp", sub: "Role-aware UI · wagmi + RainbowKit" },
    { k: "Lifecycle", v: "6 states", sub: "Manufactured → Sold (linear)" },
  ];
  cards.forEach((c, i) => {
    const x = 0.5 + i * 3.13;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 1.95, w: 2.93, h: 2.05,
      fill: { color: C.white }, line: { color: C.border, width: 1 }, rectRadius: 0.1,
    });
    s.addShape(pres.ShapeType.rect, {
      x, y: 1.95, w: 2.93, h: 0.08, fill: { color: C.accent }, line: { type: "none" },
    });
    s.addText(c.k.toUpperCase(), {
      x: x + 0.2, y: 2.2, w: 2.6, h: 0.3,
      fontFace: F.body, fontSize: 10, bold: true, color: C.muted, charSpacing: 4,
    });
    s.addText(c.v, {
      x: x + 0.2, y: 2.55, w: 2.6, h: 0.7,
      fontFace: F.head, fontSize: 24, bold: true, color: C.navy,
    });
    s.addText(c.sub, {
      x: x + 0.2, y: 3.3, w: 2.6, h: 0.7,
      fontFace: F.body, fontSize: 12, color: C.muted,
    });
  });

  // Roles row
  s.addText("Three operational roles, enforced on-chain", {
    x: 0.5, y: 4.4, w: 12, h: 0.4,
    fontFace: F.head, fontSize: 18, bold: true, color: C.navy,
  });
  const roles = ["Manufacturer", "Distributor", "Retailer"];
  roles.forEach((r, i) => {
    const x = 0.5 + i * 4.27;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 4.95, w: 4.07, h: 1.4,
      fill: { color: C.navy }, line: { type: "none" }, rectRadius: 0.1,
    });
    s.addText(r, {
      x, y: 5.1, w: 4.07, h: 0.55,
      fontFace: F.head, fontSize: 22, bold: true, color: C.white, align: "center",
    });
    const subs = [
      "Registers products · ships to distributor",
      "Receives + ships to retailer",
      "Receives + marks sold to consumer",
    ];
    s.addText(subs[i], {
      x: x + 0.3, y: 5.7, w: 3.47, h: 0.6,
      fontFace: F.body, fontSize: 12, color: C.ice, align: "center",
    });
  });

  addFooter(s, 3, TOTAL);
}

// ----------------------------------------------------------------
// Slide 4 — Architecture
// ----------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  titleBlock(s, "Architecture", "03 · BUILD");

  const layers = [
    {
      h: "Presentation",
      tech: "React 19 · Vite · TypeScript · TailwindCSS",
      detail: "Pages: Dashboard, Register, Timeline, Scan, Analytics",
    },
    {
      h: "DApp glue",
      tech: "wagmi v2 · viem · RainbowKit · TanStack Query",
      detail: "Hooks for contract reads/writes, wallet UX, caching",
    },
    {
      h: "Network",
      tech: "Local Hardhat node (live demo)  ·  Sepolia (optional polish)",
      detail: "JSON-RPC eth_call / eth_sendRawTransaction",
    },
    {
      h: "Smart contract",
      tech: "Solidity 0.8.26 · OpenZeppelin AccessControl + ECDSA",
      detail: "Custom errors · indexed events · append-only history",
    },
  ];

  layers.forEach((l, i) => {
    const y = 2.0 + i * 1.15;
    // Left label
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.5, y, w: 2.4, h: 0.95,
      fill: { color: C.navy }, line: { type: "none" }, rectRadius: 0.08,
    });
    s.addText(l.h, {
      x: 0.5, y, w: 2.4, h: 0.95,
      fontFace: F.head, fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle",
    });
    // Right detail
    s.addShape(pres.ShapeType.roundRect, {
      x: 3.1, y, w: 9.7, h: 0.95,
      fill: { color: "F8FAFC" }, line: { color: C.border, width: 1 }, rectRadius: 0.08,
    });
    s.addText(l.tech, {
      x: 3.3, y: y + 0.1, w: 9.3, h: 0.4,
      fontFace: F.head, fontSize: 14, bold: true, color: C.navy,
    });
    s.addText(l.detail, {
      x: 3.3, y: y + 0.5, w: 9.3, h: 0.4,
      fontFace: F.body, fontSize: 12, color: C.muted,
    });
    // Arrow between layers
    if (i < layers.length - 1) {
      s.addShape(pres.ShapeType.downArrow, {
        x: 6.4, y: y + 1.0, w: 0.3, h: 0.15,
        fill: { color: C.iceDk }, line: { type: "none" },
      });
    }
  });

  addFooter(s, 4, TOTAL);
}

// ----------------------------------------------------------------
// Slide 5 — State Machine
// ----------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  titleBlock(s, "State machine", "04 · LIFECYCLE");

  const states = [
    "Manufactured",
    "Shipped → Distributor",
    "Received by Distributor",
    "Shipped → Retailer",
    "Received by Retailer",
    "Sold",
  ];
  // Two-row layout to keep boxes readable
  const top = states.slice(0, 3);
  const bot = states.slice(3);

  function drawRow(arr, y, isLast) {
    const w = 3.7, gap = 0.3;
    const totalW = arr.length * w + (arr.length - 1) * gap;
    const startX = (13.33 - totalW) / 2;
    arr.forEach((label, i) => {
      const x = startX + i * (w + gap);
      const isFinal = isLast && i === arr.length - 1;
      s.addShape(pres.ShapeType.roundRect, {
        x, y, w, h: 0.85,
        fill: { color: isFinal ? C.good : C.navy }, line: { type: "none" }, rectRadius: 0.08,
      });
      s.addText(label, {
        x, y, w, h: 0.85,
        fontFace: F.head, fontSize: 14, bold: true, color: C.white, align: "center", valign: "middle",
      });
      if (i < arr.length - 1) {
        s.addShape(pres.ShapeType.rightArrow, {
          x: x + w + 0.02, y: y + 0.32, w: 0.26, h: 0.2,
          fill: { color: C.iceDk }, line: { type: "none" },
        });
      }
    });
  }

  drawRow(top, 2.0, false);
  // Connector — drawn as a small wrap-around arrow on the right edge
  s.addShape(pres.ShapeType.line, {
    x: 12.45, y: 2.4, w: 0, h: 2.45,
    line: { color: C.iceDk, width: 2, endArrowType: "triangle" },
  });
  drawRow(bot, 4.45, true);

  // Bottom note
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 5.85, w: 12.33, h: 1.0,
    fill: { color: "F1F5F9" }, line: { color: C.border, width: 1 }, rectRadius: 0.08,
  });
  s.addText("Every transition emits an indexed event AND appends to the on-chain history array.", {
    x: 0.7, y: 5.95, w: 11.93, h: 0.4,
    fontFace: F.head, fontSize: 14, bold: true, color: C.navy,
  });
  s.addText("Linear · append-only · enforced by _requireTransition. Sold is terminal.", {
    x: 0.7, y: 6.35, w: 11.93, h: 0.4,
    fontFace: F.body, fontSize: 12, color: C.muted, italic: true,
  });

  addFooter(s, 5, TOTAL);
}

// ----------------------------------------------------------------
// Slide 6 — Role Matrix
// ----------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  titleBlock(s, "Role × function matrix", "05 · ACCESS CONTROL");

  const headerRow = [
    { text: "Role",            options: { bold: true, color: C.white, fill: { color: C.navy }, align: "left",   valign: "middle" } },
    { text: "register",        options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center", valign: "middle" } },
    { text: "ship→Dist",       options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center", valign: "middle" } },
    { text: "receiveAsDist",   options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center", valign: "middle" } },
    { text: "ship→Retail",     options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center", valign: "middle" } },
    { text: "receiveAsRetail", options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center", valign: "middle" } },
    { text: "markSold",        options: { bold: true, color: C.white, fill: { color: C.navy }, align: "center", valign: "middle" } },
  ];

  const rows = [
    ["Admin",         "—", "—", "—", "—", "—", "—"],
    ["Manufacturer",  "✓", "✓", "—", "—", "—", "—"],
    ["Distributor",   "—", "—", "✓", "✓", "—", "—"],
    ["Retailer",      "—", "—", "—", "—", "✓", "✓"],
  ];

  const tableRows = [headerRow];
  rows.forEach((r, idx) => {
    const row = r.map((c, j) => {
      const isFirst = j === 0;
      const isCheck = c === "✓";
      return {
        text: c,
        options: {
          bold: isFirst,
          color: isFirst ? C.navy : (isCheck ? C.good : C.muted),
          fill: { color: idx % 2 ? "F8FAFC" : C.white },
          align: isFirst ? "left" : "center",
          valign: "middle",
          fontSize: isFirst ? 14 : 18,
        },
      };
    });
    tableRows.push(row);
  });

  s.addTable(tableRows, {
    x: 0.5, y: 1.85, w: 12.33,
    colW: [2.43, 1.65, 1.65, 1.65, 1.65, 1.65, 1.65],
    rowH: 0.55,
    fontFace: F.body, fontSize: 13, border: { type: "solid", color: C.border, pt: 1 },
  });

  // Two-key check call-out
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 5.4, w: 6.0, h: 1.45,
    fill: { color: "F1F5F9" }, line: { color: C.border, width: 1 }, rectRadius: 0.08,
  });
  s.addText("Two-key check on every write", {
    x: 0.7, y: 5.5, w: 5.6, h: 0.4,
    fontFace: F.head, fontSize: 14, bold: true, color: C.navy,
  });
  s.addText("Role gate (onlyRole) + ownership gate (currentOwner == msg.sender). Both must pass.", {
    x: 0.7, y: 5.9, w: 5.6, h: 0.85,
    fontFace: F.body, fontSize: 12, color: C.muted,
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: 6.83, y: 5.4, w: 6.0, h: 1.45,
    fill: { color: "F1F5F9" }, line: { color: C.border, width: 1 }, rectRadius: 0.08,
  });
  s.addText("Recipient-side role enforcement", {
    x: 7.03, y: 5.5, w: 5.6, h: 0.4,
    fontFace: F.head, fontSize: 14, bold: true, color: C.navy,
  });
  s.addText("shipToX also checks the recipient holds the destination role — products can't \"escape\" the pipeline.", {
    x: 7.03, y: 5.9, w: 5.6, h: 0.85,
    fontFace: F.body, fontSize: 12, color: C.muted,
  });

  addFooter(s, 6, TOTAL);
}

// ----------------------------------------------------------------
// Slide 7 — Security & Design Decisions
// ----------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  titleBlock(s, "Security & design decisions", "06 · ENGINEERING");

  const items = [
    { h: "Custom errors",            b: "Cheaper than revert strings, self-documenting, machine-readable." },
    { h: "Indexed event params",     b: "Indexers can filter by productId or actor in O(log n)." },
    { h: "ECDSA signed receipts",    b: "chainid + contract + product + receiver + nonce + context — replay-proof across legs." },
    { h: "Append-only history",      b: "No function ever pops or mutates a prior entry — provable from source." },
    { h: "Two-key check",            b: "Role + ownership; rejects both 'wrong role' and 'stale owner' attacks." },
    { h: "Solidity 0.8.26 + cancun", b: "Built-in overflow checks; latest stable EVM features." },
  ];

  items.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 6.42;
    const y = 1.95 + row * 1.55;

    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: 6.0, h: 1.35,
      fill: { color: "F8FAFC" }, line: { color: C.border, width: 1 }, rectRadius: 0.08,
    });
    s.addShape(pres.ShapeType.ellipse, {
      x: x + 0.2, y: y + 0.25, w: 0.4, h: 0.4,
      fill: { color: C.accent }, line: { type: "none" },
    });
    s.addText(String(i + 1), {
      x: x + 0.2, y: y + 0.25, w: 0.4, h: 0.4,
      fontFace: F.head, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle",
    });
    s.addText(item.h, {
      x: x + 0.75, y: y + 0.18, w: 5.1, h: 0.4,
      fontFace: F.head, fontSize: 15, bold: true, color: C.navy,
    });
    s.addText(item.b, {
      x: x + 0.75, y: y + 0.6, w: 5.1, h: 0.7,
      fontFace: F.body, fontSize: 11.5, color: C.muted,
    });
  });

  addFooter(s, 7, TOTAL);
}

// ----------------------------------------------------------------
// Slide 8 — What we deliberately did NOT include
// ----------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  titleBlock(s, "What we deliberately did NOT include", "07 · TRADE-OFFS");

  const items = [
    {
      tag: "Pausable",
      why: "No external calls and no value held — there is no exploit path to pause. Adding it adds gas and an admin foot-gun without benefit.",
    },
    {
      tag: "ReentrancyGuard",
      why: "No .call, no token transfers, no ether flows. Re-entrancy is structurally impossible.",
    },
    {
      tag: "Upgradeability (proxy)",
      why: "Supply-chain history must be immutable; an upgradeable contract can have its logic swapped, undermining that guarantee. If we find a bug, deploy v2 and migrate.",
    },
  ];

  items.forEach((item, i) => {
    const y = 1.95 + i * 1.55;
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.5, y, w: 12.33, h: 1.35,
      fill: { color: C.white }, line: { color: C.border, width: 1 }, rectRadius: 0.08,
    });
    s.addShape(pres.ShapeType.rect, {
      x: 0.5, y, w: 0.12, h: 1.35,
      fill: { color: C.accent }, line: { type: "none" },
    });
    s.addText(item.tag, {
      x: 0.85, y: y + 0.2, w: 3.5, h: 0.5,
      fontFace: F.head, fontSize: 22, bold: true, color: C.navy,
    });
    s.addText(item.why, {
      x: 4.5, y: y + 0.18, w: 8.2, h: 1.0,
      fontFace: F.body, fontSize: 13, color: C.text,
    });
  });

  s.addText("\"We explain our choices, instead of importing everything.\"", {
    x: 0.5, y: 6.6, w: 12.33, h: 0.4,
    fontFace: F.body, fontSize: 13, italic: true, color: C.muted, align: "center",
  });

  addFooter(s, 8, TOTAL);
}

// ----------------------------------------------------------------
// Slide 9 — Coverage & Static Analysis
// ----------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  titleBlock(s, "Coverage & static analysis", "08 · QUALITY");

  // Three big stats
  const stats = [
    { v: "32", l: "tests passing", sub: "every role · every transition · every failure" },
    { v: "100%", l: "line coverage", sub: "100% function · 92.86% branch" },
    { v: "0", l: "Slither H/M/L findings", sub: "3 informational, all dispositioned in README" },
  ];
  stats.forEach((st, i) => {
    const x = 0.5 + i * 4.28;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 1.95, w: 4.05, h: 2.4,
      fill: { color: C.navy }, line: { type: "none" }, rectRadius: 0.1,
    });
    s.addText(st.v, {
      x, y: 2.1, w: 4.05, h: 1.0,
      fontFace: F.head, fontSize: 56, bold: true, color: C.white, align: "center",
    });
    s.addText(st.l, {
      x, y: 3.15, w: 4.05, h: 0.4,
      fontFace: F.body, fontSize: 14, bold: true, color: C.ice, align: "center", charSpacing: 2,
    });
    s.addText(st.sub, {
      x: x + 0.3, y: 3.6, w: 3.45, h: 0.65,
      fontFace: F.body, fontSize: 11, color: C.iceDk, italic: true, align: "center",
    });
  });

  // Gas table
  s.addText("Gas report (hardhat-gas-reporter)", {
    x: 0.5, y: 4.65, w: 12.33, h: 0.4,
    fontFace: F.head, fontSize: 16, bold: true, color: C.navy,
  });

  const gasHeader = [
    { text: "Method",                options: { bold: true, color: C.white, fill: { color: C.navy }, align: "left" } },
    { text: "Avg gas",               options: { bold: true, color: C.white, fill: { color: C.navy }, align: "right" } },
    { text: "Method",                options: { bold: true, color: C.white, fill: { color: C.navy }, align: "left" } },
    { text: "Avg gas",               options: { bold: true, color: C.white, fill: { color: C.navy }, align: "right" } },
  ];
  const gasRows = [
    ["registerProduct",      "269,666", "shipToRetailer",       "119,364"],
    ["shipToDistributor",    "136,277", "receiveAsRetailer",    "132,158"],
    ["receiveAsDistributor", "131,232", "markSold",             "111,572"],
  ];
  const tbl = [gasHeader];
  gasRows.forEach((r, idx) => {
    tbl.push(r.map((c, j) => ({
      text: c,
      options: {
        align: j % 2 ? "right" : "left",
        bold: j % 2 === 0,
        color: j % 2 ? C.muted : C.text,
        fill: { color: idx % 2 ? "F8FAFC" : C.white },
        fontFace: j % 2 ? "Consolas" : F.body,
      },
    })));
  });
  s.addTable(tbl, {
    x: 0.5, y: 5.1, w: 12.33,
    colW: [3.6, 2.55, 3.6, 2.58],
    rowH: 0.42, fontSize: 12, fontFace: F.body,
    border: { type: "solid", color: C.border, pt: 1 },
  });

  addFooter(s, 9, TOTAL);
}

// ----------------------------------------------------------------
// Slide 10 — Stretch features
// ----------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  titleBlock(s, "Stretch features", "09 · BEYOND THE SPEC");

  const features = [
    { tag: "IPFS",   h: "Off-chain metadata", b: "Bytes32 digest of JSON+image stored on-chain; full content lives on IPFS. Tamper-evident without paying for storage." },
    { tag: "QR",     h: "Camera lookup",      b: "Each product has a printable QR. /scan opens the device camera and deep-links to the timeline page." },
    { tag: "ECDSA",  h: "Signed receipts",    b: "Receivers submit a shipper signature; the contract recovers and verifies it. Replay-proof across chains, contracts, products, legs, and re-shipments." },
    { tag: "BI",     h: "Analytics view",     b: "State-distribution chart and top-manufacturers ranking, all derived from on-chain reads — no backend required." },
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 6.42;
    const y = 1.95 + row * 2.4;

    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: 6.0, h: 2.2,
      fill: { color: C.white }, line: { color: C.border, width: 1.5 }, rectRadius: 0.1,
    });
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.3, y: y + 0.3, w: 1.0, h: 0.6,
      fill: { color: C.navy }, line: { type: "none" }, rectRadius: 0.06,
    });
    s.addText(f.tag, {
      x: x + 0.3, y: y + 0.3, w: 1.0, h: 0.6,
      fontFace: F.head, fontSize: 14, bold: true, color: C.white, align: "center", valign: "middle",
    });
    s.addText(f.h, {
      x: x + 1.5, y: y + 0.3, w: 4.3, h: 0.55,
      fontFace: F.head, fontSize: 18, bold: true, color: C.navy,
    });
    s.addText(f.b, {
      x: x + 0.3, y: y + 1.05, w: 5.4, h: 1.0,
      fontFace: F.body, fontSize: 12, color: C.muted,
    });
  });

  addFooter(s, 10, TOTAL);
}

// ----------------------------------------------------------------
// Slide 11 — Live Demo
// ----------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  s.addText("LIVE DEMO", {
    x: 0.5, y: 0.5, w: 12, h: 0.5,
    fontFace: F.body, fontSize: 14, bold: true, color: C.accent, charSpacing: 8,
  });
  s.addText("What you're about to see", {
    x: 0.5, y: 0.95, w: 12.3, h: 0.85,
    fontFace: F.head, fontSize: 36, bold: true, color: C.white,
  });

  const steps = [
    { n: "01", h: "Register",        b: "Manufacturer registers a new product on-chain." },
    { n: "02", h: "Ship & receive",  b: "Walk it to the distributor, then on to the retailer." },
    { n: "03", h: "Mark sold",       b: "Retailer closes the lifecycle." },
    { n: "04", h: "Try to break it", b: "Wrong wallet / wrong order — the chain rejects it." },
    { n: "05", h: "Scan a QR",       b: "Phone camera opens the timeline of a product." },
    { n: "06", h: "Inspect chain",   b: "Public source, public state — anyone can verify." },
  ];

  steps.forEach((st, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 4.27;
    const y = 2.3 + row * 1.95;

    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: 4.07, h: 1.7,
      fill: { color: C.navyDk }, line: { color: C.iceDk, width: 1 }, rectRadius: 0.08,
    });
    s.addText(st.n, {
      x: x + 0.25, y: y + 0.2, w: 1.0, h: 0.5,
      fontFace: F.head, fontSize: 22, bold: true, color: C.accent,
    });
    s.addText(st.h, {
      x: x + 0.25, y: y + 0.65, w: 3.6, h: 0.4,
      fontFace: F.head, fontSize: 16, bold: true, color: C.white,
    });
    s.addText(st.b, {
      x: x + 0.25, y: y + 1.05, w: 3.6, h: 0.55,
      fontFace: F.body, fontSize: 11, color: C.ice,
    });
  });

  s.addText("Backup video and local Hardhat fallback are both ready.", {
    x: 0.5, y: 6.8, w: 12.3, h: 0.4,
    fontFace: F.body, fontSize: 12, italic: true, color: C.iceDk, align: "center",
  });
}

// ----------------------------------------------------------------
// Slide 12 — Thank you / Q&A
// ----------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  // Big left half — thanks
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 6.5, h: 7.5, fill: { color: C.navy }, line: { type: "none" },
  });
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 0.4, h: 7.5, fill: { color: C.accent }, line: { type: "none" },
  });

  s.addText("Thank you.", {
    x: 0.8, y: 2.7, w: 5.5, h: 1.2,
    fontFace: F.head, fontSize: 60, bold: true, color: C.white,
  });
  s.addText("Questions?", {
    x: 0.8, y: 3.9, w: 5.5, h: 0.7,
    fontFace: F.head, fontSize: 32, color: C.ice,
  });
  s.addShape(pres.ShapeType.rect, {
    x: 0.8, y: 4.85, w: 0.7, h: 0.04, fill: { color: C.accent }, line: { type: "none" },
  });
  s.addText("CY-326 / CS-411 Blockchain  ·  Spring 2026", {
    x: 0.8, y: 4.95, w: 5.5, h: 0.4,
    fontFace: F.body, fontSize: 12, color: C.iceDk, charSpacing: 2,
  });

  // Right half — links + team
  s.addText("Resources", {
    x: 7.0, y: 0.9, w: 5.8, h: 0.4,
    fontFace: F.body, fontSize: 11, bold: true, color: C.accent, charSpacing: 4,
  });
  s.addText("Where to find this project", {
    x: 7.0, y: 1.25, w: 5.8, h: 0.5,
    fontFace: F.head, fontSize: 22, bold: true, color: C.navy,
  });

  const rows = [
    { k: "GitHub",      v: "github.com/[username]/supply-chain-dapp" },
    { k: "Network",     v: "Local Hardhat node (chainId 31337)" },
    { k: "Docs",        v: "README.md  ·  docs/ARCHITECTURE.md  ·  docs/ROLE_MATRIX.md" },
    { k: "Demo script", v: "demo/demo-script.md  ·  demo/backup-demo.mp4" },
  ];
  rows.forEach((r, i) => {
    const y = 2.1 + i * 0.85;
    s.addText(r.k.toUpperCase(), {
      x: 7.0, y, w: 5.8, h: 0.3,
      fontFace: F.body, fontSize: 10, bold: true, color: C.muted, charSpacing: 3,
    });
    s.addText(r.v, {
      x: 7.0, y: y + 0.3, w: 5.8, h: 0.4,
      fontFace: "Consolas", fontSize: 12, color: C.text,
    });
  });

  // Team line
  s.addShape(pres.ShapeType.line, {
    x: 7.0, y: 6.05, w: 5.8, h: 0,
    line: { color: C.border, width: 1 },
  });
  s.addText("TEAM", {
    x: 7.0, y: 6.15, w: 5.8, h: 0.3,
    fontFace: F.body, fontSize: 10, bold: true, color: C.muted, charSpacing: 3,
  });
  s.addText("[Member 1] · [Member 2] · [Member 3] · [Member 4]", {
    x: 7.0, y: 6.45, w: 5.8, h: 0.45,
    fontFace: F.head, fontSize: 14, bold: true, color: C.navy,
  });
}

// ----------------------------------------------------------------
// Save
// ----------------------------------------------------------------
const out = path.join(__dirname, "SupplyChain.pptx");
pres.writeFile({ fileName: out }).then(() => {
  console.log(`Wrote ${out}`);
});
