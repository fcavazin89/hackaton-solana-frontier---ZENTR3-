import jsPDF from "jspdf";
import type { Agent } from "./agents";
import type { BusinessPlanData, AgentOutput } from "@/context/project-context";

// ─── PALETTE ──────────────────────────────────────────────────────────────────
type RGB = [number, number, number];
const BG: RGB       = [8,  15,  20];
const CARD: RGB     = [10, 18,  26];
const BORDER: RGB   = [30, 39,  48];
const CYAN: RGB     = [0,  209, 255];
const BODY: RGB     = [189,183, 195];
const MUTED: RGB    = [90, 100, 112];
const WHITE: RGB    = [232,227, 239];
const EMERALD: RGB  = [16, 185, 129];
const AMBER: RGB    = [245,158,  11];
const ROSE: RGB     = [244, 63,  94];
const VIOLET: RGB   = [139, 92, 246];
const ORANGE: RGB   = [249,115,  22];
const BLUE: RGB     = [59, 130, 246];
const INDIGO: RGB   = [99, 102, 241];
const PINK: RGB     = [236, 72, 153];
const GOLD: RGB     = [234,179,   8];

const AGENT_ACCENT: Record<string, RGB> = {
  emerald: EMERALD, amber: AMBER, rose: ROSE, cyan: CYAN,
  violet: VIOLET, orange: ORANGE, blue: BLUE, indigo: INDIGO,
  pink: PINK, gold: GOLD, red: ROSE, purple: VIOLET,
};

const PAGE_W  = 210;
const PAGE_H  = 297;
const MARGIN  = 18;
const CW      = PAGE_W - MARGIN * 2; // content width
const FOOTER_Y = PAGE_H - 12;

// ─── COLOR HELPERS ────────────────────────────────────────────────────────────
const fg     = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);
const bg     = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const border = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);

// ─── TEXT UTILITIES ───────────────────────────────────────────────────────────
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+(.*)/gm, (_m, t) => `\n◈ ${t.toUpperCase()}`)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g,  "$1")
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, (m) => m.replace(/`/g, ""))
    .replace(/^\s*[-*+]\s+/gm, "  • ")
    .replace(/^\s*\d+\.\s+/gm, (m) => `  ${m.trim()} `)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── PAGE HELPERS ─────────────────────────────────────────────────────────────
function fillBackground(doc: jsPDF): void {
  bg(doc, BG);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  bg(doc, CYAN);
  doc.rect(0, 0, PAGE_W, 2, "F");
}

function addNewPage(doc: jsPDF): number {
  doc.addPage();
  fillBackground(doc);
  return 24;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  return y + needed > FOOTER_Y - 4 ? addNewPage(doc) : y;
}

function addFooter(doc: jsPDF, page: number, total: number, project: string): void {
  bg(doc, BORDER);
  doc.rect(0, FOOTER_Y, PAGE_W, PAGE_H - FOOTER_Y, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  fg(doc, MUTED);
  doc.text("Spr1nt3 · Powered by Gemini AI", MARGIN, FOOTER_Y + 6);
  doc.text(project, PAGE_W / 2, FOOTER_Y + 6, { align: "center" });
  doc.text(`${page} / ${total}`, PAGE_W - MARGIN, FOOTER_Y + 6, { align: "right" });
}

// ─── COVER PAGE ───────────────────────────────────────────────────────────────
function drawCover(
  doc: jsPDF,
  title: string,
  subtitle: string,
  projectName: string,
  description?: string,
  accentColor: RGB = CYAN
): void {
  fillBackground(doc);

  // Left accent stripe
  bg(doc, accentColor);
  doc.rect(0, 2, 3, PAGE_H - 4, "F");

  // Title card
  bg(doc, CARD);
  doc.rect(MARGIN, 45, CW, 65, "F");
  border(doc, accentColor);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN, 45, CW, 65, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  fg(doc, accentColor);
  doc.text("Spr1nt3", MARGIN + 8, 60);

  doc.setFontSize(20);
  fg(doc, WHITE);
  const titleLines = doc.splitTextToSize(title, CW - 16);
  titleLines.forEach((line: string, i: number) => {
    doc.text(line, MARGIN + 8, 73 + i * 9);
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  fg(doc, MUTED);
  doc.text(subtitle, MARGIN + 8, 100);

  // Project badge
  bg(doc, [14, 24, 34] as RGB);
  doc.rect(MARGIN, 122, CW, 32, "F");
  bg(doc, accentColor);
  doc.rect(MARGIN, 122, 3, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  fg(doc, MUTED);
  doc.text("PROJECT", MARGIN + 8, 132);

  doc.setFontSize(15);
  fg(doc, accentColor);
  doc.text(projectName || "—", MARGIN + 8, 144);

  // Description
  if (description?.trim()) {
    const lines = doc.splitTextToSize(description, CW);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    fg(doc, BODY);
    let y = 168;
    lines.slice(0, 5).forEach((line: string) => {
      doc.text(line, MARGIN, y);
      y += 5.5;
    });
  }

  // Date + bottom bar
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  fg(doc, MUTED);
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Generated: ${dateStr}`, MARGIN, 262);
  doc.text("Confidential — Multi-Agent Intelligence Report", MARGIN, 268);

  bg(doc, accentColor);
  doc.rect(0, PAGE_H - 3, PAGE_W, 3, "F");
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function drawSectionHeader(doc: jsPDF, label: string, y: number, accent: RGB = CYAN): number {
  y = ensureSpace(doc, y, 16);
  bg(doc, accent);
  doc.rect(MARGIN, y, 3, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  fg(doc, accent);
  doc.text(label.toUpperCase(), MARGIN + 7, y + 7);
  border(doc, BORDER);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, y + 10.5, PAGE_W - MARGIN, y + 10.5);
  return y + 15;
}

// ─── BODY TEXT ────────────────────────────────────────────────────────────────
function drawBody(doc: jsPDF, text: string, startY: number, color: RGB = BODY): number {
  if (!text?.trim()) return startY;
  const cleaned = stripMarkdown(text);
  const allLines: string[] = [];
  cleaned.split("\n").forEach((para) => {
    if (!para.trim()) { allLines.push(""); return; }
    const wrapped = doc.splitTextToSize(para.trim(), CW);
    allLines.push(...wrapped);
  });

  let y = startY;
  doc.setFontSize(9);

  for (const line of allLines) {
    if (!line.trim()) { y += 2.5; continue; }
    y = ensureSpace(doc, y, 6);

    if (line.startsWith("◈ ")) {
      // Markdown heading
      y = ensureSpace(doc, y, 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      fg(doc, CYAN);
      doc.text(line.slice(2), MARGIN, y);
      doc.setFontSize(9);
      y += 5.5;
    } else if (line.startsWith("  • ")) {
      doc.setFont("helvetica", "normal");
      fg(doc, color);
      bg(doc, CYAN);
      doc.circle(MARGIN + 2.5, y - 1, 0.8, "F");
      doc.text(line.slice(4), MARGIN + 6, y);
      y += 4.8;
    } else {
      doc.setFont("helvetica", "normal");
      fg(doc, color);
      doc.text(line, MARGIN, y);
      y += 4.8;
    }
  }
  return y + 3;
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

export async function exportBusinessPlanPdf(plan: BusinessPlanData): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  drawCover(doc, "BUSINESS PLAN", "Multi-Agent Strategic Analysis", plan.projectName, plan.description);

  const sections: Array<{ label: string; accent: RGB; content: string }> = [
    { label: "Market Research & Analysis",  accent: EMERALD, content: plan.research },
    { label: "Tokenomics & Economic Design", accent: AMBER,  content: plan.tokenomics },
    { label: "Technical Architecture",       accent: CYAN,   content: plan.architecture },
    { label: "Go-To-Market Strategy",        accent: VIOLET, content: plan.gtm },
    { label: "Legal & Compliance",           accent: ROSE,   content: plan.compliance },
  ];

  for (const sec of sections) {
    let y = addNewPage(doc);
    y = drawSectionHeader(doc, sec.label, y, sec.accent);
    drawBody(doc, sec.content || "No data generated.", y + 2);
  }

  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    addFooter(doc, i - 1, total - 1, plan.projectName);
  }

  doc.save(`Spr1nt3_BusinessPlan_${plan.projectName.replace(/\s+/g, "_")}.pdf`);
}

export async function exportAgentPdf(agent: Agent, output: AgentOutput, projectName: string): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ac = AGENT_ACCENT[agent.color] || CYAN;

  drawCover(doc, agent.name, `${agent.role} — Agent Intelligence Report`, projectName, agent.description, ac);

  let y = addNewPage(doc);
  y = drawSectionHeader(doc, "Analysis & Deliverables", y, ac);
  y = drawBody(doc, output.content || "No output generated.", y + 2);

  // Agent profile card at the end
  y = ensureSpace(doc, y + 6, 28);
  bg(doc, CARD);
  doc.rect(MARGIN, y, CW, 22, "F");
  bg(doc, ac);
  doc.rect(MARGIN, y, 3, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  fg(doc, MUTED);
  doc.text("AGENT PROFILE", MARGIN + 7, y + 8);
  doc.setFontSize(11);
  fg(doc, ac);
  doc.text(agent.name, MARGIN + 7, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  fg(doc, MUTED);
  doc.text(`${agent.role} · ${agent.description}`, MARGIN + 7, y + 20);

  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    addFooter(doc, i - 1, total - 1, projectName);
  }

  doc.save(`Spr1nt3_${agent.name.replace(/\s+/g, "_")}_${projectName.replace(/\s+/g, "_")}.pdf`);
}

export async function exportExecutiveReport(
  plan: BusinessPlanData,
  agentOutputs: Record<string, AgentOutput>,
  agents: Agent[]
): Promise<void> {
  const KEY_IDS = ["1","2","3","4","5","6","7","9","10","13","14","21"];
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  drawCover(doc, "EXECUTIVE REPORT", "Full Multi-Agent Intelligence Synthesis", plan.projectName, plan.description);

  // ── TOC ──────────────────────────────────────────────────────────────────────
  let y = addNewPage(doc);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  fg(doc, CYAN);
  doc.text("TABLE OF CONTENTS", MARGIN, y);
  y += 7;
  border(doc, BORDER);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 7;

  let idx = 1;
  for (const id of KEY_IDS) {
    const a = agents.find(x => x.id === id);
    const out = agentOutputs[id];
    if (!a || !out?.content) continue;
    const ac = AGENT_ACCENT[a.color] || CYAN;
    y = ensureSpace(doc, y, 8);
    bg(doc, ac);
    doc.rect(MARGIN, y - 2.5, 2, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    fg(doc, WHITE);
    doc.text(`${String(idx).padStart(2, "0")}.  ${a.name}`, MARGIN + 5, y + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    fg(doc, MUTED);
    doc.text(a.role, PAGE_W - MARGIN, y + 2, { align: "right" });
    y += 7.5;
    idx++;
  }

  // ── AGENT SECTIONS ──────────────────────────────────────────────────────────
  for (const id of KEY_IDS) {
    const a = agents.find(x => x.id === id);
    const out = agentOutputs[id];
    if (!a || !out?.content) continue;
    const ac = AGENT_ACCENT[a.color] || CYAN;

    y = addNewPage(doc);

    // Agent banner
    bg(doc, CARD);
    doc.rect(MARGIN, y, CW, 18, "F");
    bg(doc, ac);
    doc.rect(MARGIN, y, 3, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    fg(doc, ac);
    doc.text(a.name, MARGIN + 8, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    fg(doc, MUTED);
    doc.text(`${a.role}  ·  ${a.description}`, MARGIN + 8, y + 14);
    y += 22;

    y = drawBody(doc, out.content, y);
  }

  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    addFooter(doc, i - 1, total - 1, plan.projectName);
  }

  doc.save(`Spr1nt3_Executive_Report_${plan.projectName.replace(/\s+/g, "_")}.pdf`);
}

export async function exportChatTranscript(
  agent: Agent,
  messages: Array<{ role: string; content: string }>,
  projectName = ""
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ac = AGENT_ACCENT[agent.color] || CYAN;

  drawCover(doc, agent.name, "Agent Conversation Transcript", projectName || "Spr1nt3", agent.description, ac);

  let y = addNewPage(doc);
  y = drawSectionHeader(doc, "Conversation Transcript", y, ac);
  y += 3;

  for (const msg of messages) {
    const isUser = msg.role === "user";
    const labelColor: RGB = isUser ? CYAN : ac;
    const label = isUser ? "USER" : agent.name.toUpperCase();

    y = ensureSpace(doc, y, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    fg(doc, labelColor);
    doc.text(label, MARGIN, y);
    border(doc, labelColor);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);
    y += 6;

    y = drawBody(doc, msg.content, y);
    y += 2;
  }

  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    addFooter(doc, i - 1, total - 1, agent.name);
  }

  doc.save(`Spr1nt3_Chat_${agent.name.replace(/\s+/g, "_")}.pdf`);
}

export async function exportTaskBoardPdf(
  tasks: Array<{
    id: string; title: string; description: string;
    status: string; priority: string; progress: number; assignedTo: string;
  }>,
  agents: Agent[],
  projectName = ""
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const STATUS_COLORS: Record<string, RGB> = {
    COMPLETED: EMERALD, IN_PROGRESS: CYAN, PENDING: MUTED, FAILED: ROSE,
  };
  const PRIORITY_COLORS: Record<string, RGB> = {
    HIGH: ROSE, MEDIUM: AMBER, LOW: EMERALD,
  };

  drawCover(doc, "TASK BOARD", `Project Management Overview — ${tasks.length} tasks`, projectName || "Spr1nt3", undefined);

  let y = addNewPage(doc);
  y = drawSectionHeader(doc, `All Tasks (${tasks.length})`, y, CYAN);
  y += 4;

  const ORDER = ["COMPLETED", "IN_PROGRESS", "PENDING", "FAILED"];
  for (const status of ORDER) {
    const group = tasks.filter(t => t.status === status);
    if (!group.length) continue;
    const sc = STATUS_COLORS[status] || MUTED;

    y = ensureSpace(doc, y + 4, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    fg(doc, sc);
    doc.text(`${status.replace("_", " ")} (${group.length})`, MARGIN, y);
    y += 6;

    for (const task of group) {
      y = ensureSpace(doc, y, 22);
      const pc = PRIORITY_COLORS[task.priority] || MUTED;
      const aAgent = agents.find(a => a.id === task.assignedTo);

      bg(doc, CARD);
      doc.rect(MARGIN, y - 2, CW, 18, "F");
      bg(doc, pc);
      doc.rect(MARGIN, y - 2, 2.5, 18, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      fg(doc, WHITE);
      doc.text(task.title, MARGIN + 7, y + 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      fg(doc, MUTED);
      const descLines = doc.splitTextToSize(task.description, CW - 55);
      doc.text(descLines[0] || "", MARGIN + 7, y + 10);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      fg(doc, pc);
      doc.text(task.priority, PAGE_W - MARGIN - 2, y + 4, { align: "right" });

      if (aAgent) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        fg(doc, MUTED);
        doc.text(aAgent.name, PAGE_W - MARGIN - 2, y + 10, { align: "right" });
      }

      if (task.progress > 0) {
        const bY = y + 14;
        bg(doc, BORDER);
        doc.rect(MARGIN + 7, bY, CW - 10, 1.5, "F");
        bg(doc, sc);
        doc.rect(MARGIN + 7, bY, (CW - 10) * (task.progress / 100), 1.5, "F");
      }

      y += 22;
    }
  }

  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    addFooter(doc, i - 1, total - 1, projectName || "Spr1nt3");
  }

  doc.save(`Spr1nt3_TaskBoard_${(projectName || "export").replace(/\s+/g, "_")}.pdf`);
}

export async function exportProtocolSimPdf(
  data: Array<{ time: string; price: number; tvl: number }>,
  tokenSymbol: string,
  projectName = ""
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  drawCover(doc, "PROTOCOL SIMULATOR", `${tokenSymbol} Market Telemetry Report`, projectName || "OVP Protocol", undefined);

  let y = addNewPage(doc);
  y = drawSectionHeader(doc, `${tokenSymbol} Simulation Data — Price & TVL`, y, CYAN);
  y += 4;

  // Table header
  const COL = CW / 3;
  bg(doc, BORDER);
  doc.rect(MARGIN, y, CW, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  fg(doc, CYAN);
  doc.text("EPOCH",              MARGIN + 4,           y + 5.5);
  doc.text(`${tokenSymbol} PRICE`, MARGIN + COL + 4,   y + 5.5);
  doc.text("TVL",                MARGIN + COL * 2 + 4, y + 5.5);
  y += 8;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    y = ensureSpace(doc, y, 7);
    if (i % 2 === 0) { bg(doc, CARD); doc.rect(MARGIN, y, CW, 7, "F"); }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    fg(doc, MUTED);  doc.text(row.time,                    MARGIN + 4,           y + 4.8);
    fg(doc, CYAN);   doc.text(`$${row.price.toFixed(2)}`,  MARGIN + COL + 4,     y + 4.8);
    fg(doc, EMERALD);doc.text(`$${row.tvl.toFixed(2)}M`,   MARGIN + COL * 2 + 4, y + 4.8);
    y += 7;
  }

  // Summary
  const first = data[0];
  const last  = data[data.length - 1];
  const pct   = ((last.price - first.price) / first.price) * 100;

  y = ensureSpace(doc, y + 8, 40);
  y = drawSectionHeader(doc, "Simulation Summary", y, EMERALD);
  y += 4;

  const stats: Array<{ label: string; value: string; color: RGB }> = [
    { label: "Final Price",        value: `$${last.price.toFixed(2)}`,   color: CYAN },
    { label: "Final TVL",          value: `$${last.tvl.toFixed(2)}M`,    color: EMERALD },
    { label: "Price Δ",            value: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, color: pct >= 0 ? EMERALD : ROSE },
    { label: "Epochs Simulated",   value: String(data.length),           color: BODY },
  ];

  const SW = CW / 2;
  stats.forEach((s, i) => {
    const sx = MARGIN + (i % 2) * (SW + 2);
    const sy = y + Math.floor(i / 2) * 20;
    bg(doc, CARD);
    doc.rect(sx, sy, SW - 2, 16, "F");
    bg(doc, s.color);
    doc.rect(sx, sy, 2.5, 16, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    fg(doc, MUTED);
    doc.text(s.label.toUpperCase(), sx + 6, sy + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    fg(doc, s.color);
    doc.text(s.value, sx + 6, sy + 14);
  });

  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    addFooter(doc, i - 1, total - 1, projectName || tokenSymbol);
  }

  doc.save(`Spr1nt3_ProtocolSim_${(projectName || tokenSymbol).replace(/\s+/g, "_")}.pdf`);
}
