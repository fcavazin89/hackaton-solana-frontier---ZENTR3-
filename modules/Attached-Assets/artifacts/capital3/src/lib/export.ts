import jsPDF from "jspdf";
import PptxGenJS from "pptxgenjs";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageOrientation,
  convertInchesToTwip,
  Header,
  Footer,
} from "docx";

/* ─── Brand tokens ─────────────────────────────────────────────────────────── */
const GOLD = "#FFB300";
const AMBER = "#FFC107";
const ORANGE = "#FF9100";
const CARBON = "#0D0D0D";
const GRAPHITE = "#1A1A1A";
const SOFT_WHITE = "#EDEDED";
const MID_GREY = "#888888";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
export type AnalysisExportData = {
  id: number;
  startup_name: string;
  sector: string;
  stage: string;
  description: string;
  revenue_model: string;
  funding_strategy: string;
  valuation_estimate: string;
  runway_estimate: string;
  risk_level: string;
  tokenomics: {
    total_supply: string;
    distribution: Record<string, string>;
    vesting_schedule: string;
    token_utility: string;
  };
  scenarios: Array<{
    name: string;
    target_raise: string;
    valuation: string;
    timeline: string;
    probability: string;
  }>;
  risk_factors: string[];
  recommendations: string[];
  created_at: string | null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   PDF EXPORT
═══════════════════════════════════════════════════════════════════════════ */
export async function exportPDF(data: AnalysisExportData): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const ML = 18;
  const MR = W - 18;
  const CW = MR - ML; // content width

  /* helpers */
  const hex2rgb = (hex: string): [number, number, number] => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const setFill = (hex: string) => doc.setFillColor(...hex2rgb(hex));
  const setDraw = (hex: string) => doc.setDrawColor(...hex2rgb(hex));
  const setTxt = (hex: string) => doc.setTextColor(...hex2rgb(hex));
  const rect = (x: number, y: number, w: number, h: number, hex: string) => {
    setFill(hex); doc.rect(x, y, w, h, "F");
  };

  let y = 0;

  /* ── Watermark (repeating diagonal) ── */
  const drawWatermarks = () => {
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    setTxt(GOLD);
    for (let wy = 30; wy < H; wy += 48) {
      for (let wx = -20; wx < W; wx += 80) {
        doc.text("CAPITAL3", wx, wy, { angle: 35 });
      }
    }
    doc.restoreGraphicsState();
  };

  /* ── Page background ── */
  const drawBackground = () => {
    rect(0, 0, W, H, "#FAFAFA");
    drawWatermarks();
  };

  /* ── Header band ── */
  const drawHeader = (pageNum: number) => {
    rect(0, 0, W, 22, CARBON);
    // Gold accent stripe
    rect(0, 22, W, 1.5, GOLD);

    // C3 Badge
    rect(ML, 5, 10, 10, GOLD);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setTxt(CARBON);
    doc.text("C3", ML + 5, 11.5, { align: "center" });

    // Brand name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setTxt(GOLD);
    doc.text("CAPITAL3", ML + 13, 11.5);

    // Tagline
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    setTxt("#777777");
    doc.text("FUNDING. SCALE. DOMINATE.", ML + 13, 17);

    // Page number
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setTxt(MID_GREY);
    doc.text(`PAGE ${pageNum}`, MR, 13, { align: "right" });

    // Report label
    doc.setFontSize(7);
    setTxt("#AAAAAA");
    doc.text(`ANALYSIS REPORT — ID:${String(data.id).padStart(4, "0")}`, MR, 19, { align: "right" });
  };

  /* ── Footer ── */
  const drawFooter = () => {
    rect(0, H - 12, W, 12, CARBON);
    rect(0, H - 12, W, 0.8, GOLD);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    setTxt(MID_GREY);
    doc.text("CAPITAL3 — STACK3 HUB DE AGENTES", ML, H - 5.5);
    setTxt("#555555");
    doc.text(
      `Generated ${new Date().toISOString().split("T")[0]} — Confidential`,
      MR,
      H - 5.5,
      { align: "right" }
    );
  };

  /* ── Section label ── */
  const sectionLabel = (label: string, cy: number, color: string = GOLD): number => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setTxt(color);
    doc.text(label.toUpperCase(), ML, cy);
    setDraw(color);
    doc.setLineWidth(0.4);
    doc.line(ML, cy + 1.5, MR, cy + 1.5);
    return cy + 7;
  };

  /* ── Body text ── */
  const bodyText = (text: string, cy: number, opts?: { color?: string; size?: number; maxWidth?: number }): number => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(opts?.size ?? 8.5);
    setTxt(opts?.color ?? "#333333");
    const lines = doc.splitTextToSize(text, opts?.maxWidth ?? CW);
    doc.text(lines, ML, cy);
    return cy + lines.length * (opts?.size ? opts.size * 0.45 : 4) + 2;
  };

  /* ── New page ── */
  let pageNum = 1;
  const newPage = () => {
    doc.addPage();
    pageNum++;
    drawBackground();
    drawHeader(pageNum);
    drawFooter();
    y = 32;
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > H - 18) { newPage(); }
  };

  /* ══════════════ PAGE 1 — Cover ══════════════ */
  drawBackground();
  drawHeader(pageNum);
  drawFooter();

  // Hero cover block
  rect(ML, 30, CW, 55, CARBON);
  // Gold left bar
  rect(ML, 30, 3, 55, GOLD);
  // Inner accent line
  rect(ML + 3, 30, CW - 3, 1.5, "#2A2A2A");

  // Startup name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setTxt(GOLD);
  const name = data.startup_name.toUpperCase();
  doc.text(name, ML + 9, 50);

  // Sector + Stage badges
  const badgeY = 57;
  const drawBadge = (text: string, bx: number) => {
    const bw = doc.getTextWidth(text) + 6;
    rect(bx, badgeY - 4, bw, 6, "#2A2A2A");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setTxt(AMBER);
    doc.text(text, bx + 3, badgeY);
    return bx + bw + 3;
  };
  let bx = ML + 9;
  bx = drawBadge(data.sector.toUpperCase(), bx);
  drawBadge(data.stage.toUpperCase(), bx);

  // Description
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTxt(SOFT_WHITE);
  const descLines = doc.splitTextToSize(data.description, CW - 14);
  doc.text(descLines.slice(0, 3), ML + 9, 67);

  y = 94;

  /* KPI strip */
  const kpis = [
    { label: "VALUATION EST.", value: data.valuation_estimate },
    { label: "RUNWAY", value: data.runway_estimate },
    { label: "RISK LEVEL", value: data.risk_level.toUpperCase() },
    { label: "STAGE", value: data.stage.toUpperCase() },
  ];
  const kpiW = CW / kpis.length;
  kpis.forEach((kpi, i) => {
    const kx = ML + i * kpiW;
    rect(kx, y, kpiW - 1, 22, GRAPHITE);
    rect(kx, y, kpiW - 1, 1.5, i === 0 ? GOLD : i === 1 ? AMBER : i === 2 ? ORANGE : "#FF6D00");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    setTxt(MID_GREY);
    doc.text(kpi.label, kx + 4, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setTxt(GOLD);
    doc.text(kpi.value, kx + 4, y + 16, { maxWidth: kpiW - 8 });
  });
  y += 30;

  /* Funding Strategy */
  y = sectionLabel("FUNDING STRATEGY", y);
  y = bodyText(data.funding_strategy, y);
  y += 4;

  /* Revenue Model */
  checkPageBreak(25);
  y = sectionLabel("REVENUE MODEL", y);
  y = bodyText(data.revenue_model, y);
  y += 4;

  /* ══════════════ PAGE 2 — Tokenomics ══════════════ */
  newPage();

  y = sectionLabel("TOKEN DISTRIBUTION", y);

  const dist = Object.entries(data.tokenomics.distribution);
  const pieColors = [GOLD, AMBER, ORANGE, "#FF6D00", "#E65100"];

  // Distribution bars
  dist.forEach(([key, val], i) => {
    const pct = parseFloat(val);
    const barColor = pieColors[i % pieColors.length];
    const barY = y + i * 11;

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setTxt("#444444");
    doc.text(key.toUpperCase(), ML, barY + 3.5);

    // Track
    rect(ML + 35, barY, CW - 50, 5, "#E8E8E8");
    // Fill
    rect(ML + 35, barY, (CW - 50) * (pct / 100), 5, barColor);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setTxt(barColor);
    doc.text(val, MR, barY + 3.5, { align: "right" });
  });
  y += dist.length * 11 + 6;

  // Total supply
  rect(ML, y, CW, 9, "#F5F0E0");
  rect(ML, y, 2, 9, GOLD);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTxt("#555555");
  doc.text("TOTAL SUPPLY", ML + 6, y + 5.5);
  doc.setFont("helvetica", "bold");
  setTxt(CARBON);
  doc.text(data.tokenomics.total_supply, MR, y + 5.5, { align: "right" });
  y += 16;

  checkPageBreak(20);
  y = sectionLabel("TOKEN UTILITY", y);
  y = bodyText(data.tokenomics.token_utility, y);
  y += 4;

  checkPageBreak(20);
  y = sectionLabel("VESTING SCHEDULE", y);
  y = bodyText(data.tokenomics.vesting_schedule, y);
  y += 4;

  /* ══════════════ Scenarios ══════════════ */
  checkPageBreak(65);
  y = sectionLabel("FUNDING SCENARIOS", y);

  const scenColors: Record<string, string> = {
    conservative: GOLD,
    moderate: ORANGE,
    aggressive: "#ef4444",
  };
  const scenW = CW / data.scenarios.length;

  data.scenarios.forEach((s, i) => {
    const sx = ML + i * scenW;
    const sc = scenColors[s.name] ?? GOLD;
    rect(sx, y, scenW - 2, 42, "#F9F9F9");
    rect(sx, y, scenW - 2, 2, sc);
    rect(sx, y, 2, 42, sc);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTxt(sc);
    doc.text(s.name.toUpperCase(), sx + 5, y + 9);

    const fields = [
      ["RAISE", s.target_raise],
      ["VALUATION", s.valuation],
      ["TIMELINE", s.timeline],
      ["PROBABILITY", s.probability],
    ];
    fields.forEach(([k, v], fi) => {
      const fy = y + 16 + fi * 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      setTxt(MID_GREY);
      doc.text(k, sx + 5, fy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      setTxt(CARBON);
      doc.text(v, sx + 5, fy + 4.5, { maxWidth: scenW - 10 });
    });
  });
  y += 50;

  /* ══════════════ Risk Factors ══════════════ */
  checkPageBreak(30);
  y = sectionLabel("RISK VECTORS", y, "#ef4444");
  data.risk_factors.forEach((risk, i) => {
    checkPageBreak(12);
    const riskY = y;
    rect(ML, riskY, 5, 5, "#FFEEEE");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setTxt("#ef4444");
    doc.text(`${i + 1}`, ML + 2.5, riskY + 3.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setTxt("#333333");
    const lines = doc.splitTextToSize(risk, CW - 10);
    doc.text(lines, ML + 8, riskY + 3.5);
    y += lines.length * 4 + 5;
  });
  y += 2;

  /* ══════════════ Recommendations ══════════════ */
  checkPageBreak(30);
  y = sectionLabel("RECOMMENDATIONS", y);
  data.recommendations.forEach((rec, i) => {
    checkPageBreak(12);
    const recY = y;
    rect(ML, recY, 5, 5, "#FFF8E0");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setTxt(GOLD);
    doc.text(`${i + 1}`, ML + 2.5, recY + 3.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setTxt("#333333");
    const lines = doc.splitTextToSize(rec, CW - 10);
    doc.text(lines, ML + 8, recY + 3.5);
    y += lines.length * 4 + 5;
  });

  /* ══════════════ Back cover strip ══════════════ */
  checkPageBreak(20);
  rect(ML, y + 4, CW, 14, CARBON);
  rect(ML, y + 4, 3, 14, GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setTxt(GOLD);
  doc.text("CAPITAL3", ML + 8, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setTxt("#888888");
  doc.text("FUNDING. SCALE. DOMINATE.", ML + 8, y + 16.5);

  doc.save(`CAPITAL3_${data.startup_name.replace(/\s+/g, "_")}_Analysis.pdf`);
}

/* ═══════════════════════════════════════════════════════════════════════════
   PPTX EXPORT
═══════════════════════════════════════════════════════════════════════════ */
export async function exportPPTX(data: AnalysisExportData): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = `CAPITAL3 — ${data.startup_name}`;
  pptx.subject = "Startup Analysis Report";
  pptx.author = "CAPITAL3 AI Agent";

  const BG = "0D0D0D";
  const CARD = "1A1A1A";
  const G = "FFB300";
  const AMB = "FFC107";
  const ORA = "FF9100";
  const WH = "EDEDED";
  const GR = "666666";

  const pieColors = [G, AMB, ORA, "FF6D00", "E65100"];
  const scenColors: Record<string, string> = { conservative: G, moderate: ORA, aggressive: "EF4444" };

  /* ── watermark helper ── */
  const addWatermark = (slide: PptxGenJS.Slide) => {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        slide.addText("CAPITAL3", {
          x: c * 4.2 - 0.5,
          y: r * 2.5 + 0.3,
          w: 4,
          h: 0.6,
          fontSize: 20,
          bold: true,
          color: "FFB300",
          transparency: 92,
          rotate: 345,
        });
      }
    }
  };

  /* ── header bar helper ── */
  const addHeader = (slide: PptxGenJS.Slide, title: string) => {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.7, fill: { color: "1A1A1A" } });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0.7, w: "100%", h: 0.04, fill: { color: G } });
    // C3 badge
    slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 0.1, w: 0.45, h: 0.45, fill: { color: G } });
    slide.addText("C3", { x: 0.3, y: 0.1, w: 0.45, h: 0.45, align: "center", valign: "middle", fontSize: 9, bold: true, color: "000000" });
    slide.addText("CAPITAL3", { x: 0.85, y: 0.12, w: 2, h: 0.28, fontSize: 12, bold: true, color: G });
    slide.addText("FUNDING. SCALE. DOMINATE.", { x: 0.85, y: 0.4, w: 3, h: 0.22, fontSize: 6.5, color: "888888" });
    slide.addText(title.toUpperCase(), { x: 6.5, y: 0.2, w: 6.5, h: 0.4, align: "right", fontSize: 9, bold: true, color: "888888" });
  };

  /* ── footer helper ── */
  const addFooter = (slide: PptxGenJS.Slide, page: string) => {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.1, w: "100%", h: 0.4, fill: { color: "1A1A1A" } });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.1, w: "100%", h: 0.03, fill: { color: G } });
    slide.addText(`CAPITAL3 — ${data.startup_name.toUpperCase()} ANALYSIS`, { x: 0.3, y: 7.13, w: 6, h: 0.3, fontSize: 6, color: "666666" });
    slide.addText(`${page} — CONFIDENTIAL`, { x: 6.5, y: 7.13, w: 6.5, h: 0.3, align: "right", fontSize: 6, color: "666666" });
  };

  /* ══════════════ SLIDE 1 — Cover ══════════════ */
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG };
    addWatermark(slide);

    // Hero block
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 7.5, fill: { color: BG } });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: G } });
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.3, w: "100%", h: 0.2, fill: { color: G } });

    // Startup name
    slide.addText(data.startup_name.toUpperCase(), {
      x: 0.5, y: 1.4, w: 12.5, h: 1.4,
      fontSize: 54, bold: true, color: G, fontFace: "Arial",
    });

    // Tagline
    slide.addText("FUNDING. SCALE. DOMINATE.", {
      x: 0.5, y: 2.9, w: 10, h: 0.45,
      fontSize: 14, color: "888888", charSpacing: 6,
    });

    // Sector/Stage chips
    slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.55, w: 1.4, h: 0.35, fill: { color: "2A2A2A" } });
    slide.addText(data.sector.toUpperCase(), { x: 0.5, y: 3.55, w: 1.4, h: 0.35, align: "center", valign: "middle", fontSize: 8, bold: true, color: AMB });
    slide.addShape(pptx.ShapeType.rect, { x: 2.05, y: 3.55, w: 1.2, h: 0.35, fill: { color: "2A2A2A" } });
    slide.addText(data.stage.toUpperCase(), { x: 2.05, y: 3.55, w: 1.2, h: 0.35, align: "center", valign: "middle", fontSize: 8, bold: true, color: WH });

    // Description
    slide.addText(data.description, {
      x: 0.5, y: 4.1, w: 8, h: 1.2,
      fontSize: 10, color: "AAAAAA", wrap: true,
    });

    // C3 watermark logo (large right side)
    slide.addText("C3", {
      x: 9.5, y: 1.5, w: 3.5, h: 3.5,
      fontSize: 200, bold: true, color: G,
      transparency: 88,
      align: "center",
    });

    // Bottom meta bar
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 6.8, w: "100%", h: 0.7, fill: { color: "151515" } });
    const kpis = [
      { label: "VALUATION", value: data.valuation_estimate },
      { label: "RUNWAY", value: data.runway_estimate },
      { label: "RISK", value: data.risk_level.toUpperCase() },
      { label: "REPORT ID", value: `#${String(data.id).padStart(4, "0")}` },
    ];
    kpis.forEach((k, i) => {
      const kx = 0.5 + i * 3.3;
      slide.addText(k.label, { x: kx, y: 6.83, w: 3, h: 0.2, fontSize: 6, color: GR });
      slide.addText(k.value, { x: kx, y: 7.03, w: 3, h: 0.3, fontSize: 11, bold: true, color: G });
    });
  }

  /* ══════════════ SLIDE 2 — KPIs ══════════════ */
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG };
    addWatermark(slide);
    addHeader(slide, "Financial Overview");
    addFooter(slide, "02");

    const cards = [
      { label: "VALUATION EST.", value: data.valuation_estimate, color: G, x: 0.3 },
      { label: "RUNWAY", value: data.runway_estimate, color: AMB, x: 3.6 },
      { label: "RISK LEVEL", value: data.risk_level.toUpperCase(), color: ORA, x: 6.9 },
      { label: "TOKEN SUPPLY", value: data.tokenomics.total_supply, color: "FF6D00", x: 10.2 },
    ];
    cards.forEach((c) => {
      slide.addShape(pptx.ShapeType.rect, { x: c.x, y: 1.0, w: 3.0, h: 1.8, fill: { color: CARD } });
      slide.addShape(pptx.ShapeType.rect, { x: c.x, y: 1.0, w: 3.0, h: 0.08, fill: { color: c.color } });
      slide.addText(c.label, { x: c.x + 0.15, y: 1.18, w: 2.7, h: 0.3, fontSize: 7, color: "777777" });
      slide.addText(c.value, { x: c.x + 0.15, y: 1.55, w: 2.7, h: 0.9, fontSize: 14, bold: true, color: c.color, wrap: true });
    });

    // Funding strategy
    slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 3.0, w: 6.5, h: 3.7, fill: { color: CARD } });
    slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 3.0, w: 0.07, h: 3.7, fill: { color: G } });
    slide.addText("FUNDING STRATEGY", { x: 0.55, y: 3.1, w: 5.8, h: 0.35, fontSize: 8, bold: true, color: G });
    slide.addText(data.funding_strategy, { x: 0.55, y: 3.55, w: 5.8, h: 2.9, fontSize: 9, color: "AAAAAA", wrap: true });

    // Revenue model
    slide.addShape(pptx.ShapeType.rect, { x: 7.0, y: 3.0, w: 6.0, h: 3.7, fill: { color: CARD } });
    slide.addShape(pptx.ShapeType.rect, { x: 7.0, y: 3.0, w: 0.07, h: 3.7, fill: { color: AMB } });
    slide.addText("REVENUE MODEL", { x: 7.25, y: 3.1, w: 5.5, h: 0.35, fontSize: 8, bold: true, color: AMB });
    slide.addText(data.revenue_model, { x: 7.25, y: 3.55, w: 5.5, h: 2.9, fontSize: 9, color: "AAAAAA", wrap: true });
  }

  /* ══════════════ SLIDE 3 — Tokenomics ══════════════ */
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG };
    addWatermark(slide);
    addHeader(slide, "Tokenomics");
    addFooter(slide, "03");

    slide.addText("TOKENOMICS STRUCTURE", { x: 0.3, y: 0.9, w: 12, h: 0.5, fontSize: 20, bold: true, color: G });
    slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.42, w: 13, h: 0.04, fill: { color: G } });

    const dist = Object.entries(data.tokenomics.distribution);
    dist.forEach(([key, val], i) => {
      const barY = 1.6 + i * 0.72;
      const pct = parseFloat(val);
      const bc = pieColors[i % pieColors.length];
      slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: barY, w: 0.08, h: 0.45, fill: { color: bc } });
      slide.addText(key.toUpperCase(), { x: 0.55, y: barY + 0.1, w: 2.5, h: 0.3, fontSize: 8, bold: true, color: "AAAAAA" });
      slide.addShape(pptx.ShapeType.rect, { x: 3.0, y: barY + 0.12, w: 8.0, h: 0.2, fill: { color: "2A2A2A" } });
      slide.addShape(pptx.ShapeType.rect, { x: 3.0, y: barY + 0.12, w: 8.0 * (pct / 100), h: 0.2, fill: { color: bc } });
      slide.addText(val, { x: 11.2, y: barY + 0.08, w: 1.8, h: 0.3, align: "right", fontSize: 10, bold: true, color: bc });
    });

    // Supply + utility
    const infoY = 1.6 + dist.length * 0.72 + 0.2;
    slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: infoY, w: 5.8, h: 1.3, fill: { color: CARD } });
    slide.addText("TOTAL SUPPLY", { x: 0.5, y: infoY + 0.15, w: 5, h: 0.3, fontSize: 7, color: "888888" });
    slide.addText(data.tokenomics.total_supply, { x: 0.5, y: infoY + 0.5, w: 5.5, h: 0.5, fontSize: 18, bold: true, color: G });

    slide.addShape(pptx.ShapeType.rect, { x: 6.5, y: infoY, w: 6.8, h: 1.3, fill: { color: CARD } });
    slide.addText("TOKEN UTILITY", { x: 6.7, y: infoY + 0.1, w: 6.3, h: 0.25, fontSize: 7, color: "888888" });
    slide.addText(data.tokenomics.token_utility, { x: 6.7, y: infoY + 0.4, w: 6.3, h: 0.8, fontSize: 8.5, color: "CCCCCC", wrap: true });
  }

  /* ══════════════ SLIDE 4 — Scenarios ══════════════ */
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG };
    addWatermark(slide);
    addHeader(slide, "Funding Scenarios");
    addFooter(slide, "04");

    slide.addText("FUNDING SCENARIOS", { x: 0.3, y: 0.9, w: 12, h: 0.5, fontSize: 20, bold: true, color: G });
    slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.42, w: 13, h: 0.04, fill: { color: G } });

    const sW = 13 / data.scenarios.length;
    data.scenarios.forEach((s, i) => {
      const sx = 0.3 + i * sW;
      const sc = scenColors[s.name] ?? G;
      slide.addShape(pptx.ShapeType.rect, { x: sx, y: 1.55, w: sW - 0.15, h: 5.3, fill: { color: CARD } });
      slide.addShape(pptx.ShapeType.rect, { x: sx, y: 1.55, w: sW - 0.15, h: 0.1, fill: { color: sc } });
      slide.addShape(pptx.ShapeType.rect, { x: sx, y: 1.55, w: 0.08, h: 5.3, fill: { color: sc } });

      slide.addText(s.name.toUpperCase(), { x: sx + 0.2, y: 1.75, w: sW - 0.5, h: 0.45, fontSize: 16, bold: true, color: sc });

      const fields = [
        { k: "TARGET RAISE", v: s.target_raise },
        { k: "VALUATION", v: s.valuation },
        { k: "TIMELINE", v: s.timeline },
        { k: "PROBABILITY", v: s.probability },
      ];
      fields.forEach((f, fi) => {
        const fy = 2.45 + fi * 1.05;
        slide.addText(f.k, { x: sx + 0.2, y: fy, w: sW - 0.4, h: 0.25, fontSize: 6.5, color: "777777" });
        slide.addText(f.v, { x: sx + 0.2, y: fy + 0.25, w: sW - 0.4, h: 0.55, fontSize: 13, bold: true, color: WH, wrap: true });
      });
    });
  }

  /* ══════════════ SLIDE 5 — Risk + Recommendations ══════════════ */
  {
    const slide = pptx.addSlide();
    slide.background = { color: BG };
    addWatermark(slide);
    addHeader(slide, "Risk & Recommendations");
    addFooter(slide, "05");

    // Risks (left)
    slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 0.9, w: 6.3, h: 0.38, fill: { color: "EF444420" } });
    slide.addText("⚠ RISK VECTORS", { x: 0.35, y: 0.92, w: 6, h: 0.32, fontSize: 8.5, bold: true, color: "EF4444" });

    data.risk_factors.forEach((r, i) => {
      const ry = 1.45 + i * 1.05;
      slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: ry, w: 0.3, h: 0.3, fill: { color: "EF4444" } });
      slide.addText(`${i + 1}`, { x: 0.3, y: ry, w: 0.3, h: 0.3, align: "center", valign: "middle", fontSize: 7, bold: true, color: WH });
      slide.addText(r, { x: 0.7, y: ry, w: 5.8, h: 0.85, fontSize: 8, color: "CCCCCC", wrap: true });
    });

    // Recommendations (right)
    slide.addShape(pptx.ShapeType.rect, { x: 6.9, y: 0.9, w: 6.4, h: 0.38, fill: { color: "FFB30020" } });
    slide.addText("✦ RECOMMENDATIONS", { x: 6.95, y: 0.92, w: 6, h: 0.32, fontSize: 8.5, bold: true, color: G });

    data.recommendations.forEach((rec, i) => {
      const ry = 1.45 + i * 1.05;
      slide.addShape(pptx.ShapeType.rect, { x: 6.9, y: ry, w: 0.3, h: 0.3, fill: { color: G } });
      slide.addText(`${i + 1}`, { x: 6.9, y: ry, w: 0.3, h: 0.3, align: "center", valign: "middle", fontSize: 7, bold: true, color: "000000" });
      slide.addText(rec, { x: 7.3, y: ry, w: 5.9, h: 0.85, fontSize: 8, color: "CCCCCC", wrap: true });
    });
  }

  await pptx.writeFile({ fileName: `CAPITAL3_${data.startup_name.replace(/\s+/g, "_")}_Analysis.pptx` });
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOCX EXPORT
═══════════════════════════════════════════════════════════════════════════ */
export async function exportDOCX(data: AnalysisExportData): Promise<void> {
  const goldRgb = { r: 255, g: 179, b: 0 };
  const darkRgb = { r: 50, g: 50, b: 50 };

  const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
    new Paragraph({
      heading: level,
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          color: "FFB300",
          size: level === HeadingLevel.HEADING_1 ? 36 : level === HeadingLevel.HEADING_2 ? 26 : 22,
        }),
      ],
    });

  const body = (text: string) =>
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text, size: 20, color: "333333" })],
    });

  const label = (text: string) =>
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 18, color: "888888" })],
    });

  const value = (text: string, color = "111111") =>
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text, bold: true, size: 24, color })],
    });

  const divider = () =>
    new Paragraph({
      spacing: { before: 200, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "FFB300" } },
      children: [],
    });

  const kpiTable = () =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            { label: "VALUATION", val: data.valuation_estimate },
            { label: "RUNWAY", val: data.runway_estimate },
            { label: "RISK LEVEL", val: data.risk_level.toUpperCase() },
            { label: "STAGE", val: data.stage.toUpperCase() },
          ].map(
            (k) =>
              new TableCell({
                shading: { type: ShadingType.SOLID, color: "1A1A1A" },
                margins: { top: 120, bottom: 120, left: 150, right: 150 },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 8, color: "FFB300" },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: k.label, size: 14, color: "888888" })],
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: k.val, bold: true, size: 22, color: "FFB300" })],
                  }),
                ],
              })
          ),
        }),
      ],
    });

  const distTable = () =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: Object.entries(data.tokenomics.distribution).map(
        ([key, val]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 60, type: WidthType.PERCENTAGE },
                margins: { left: 120, right: 120, top: 80, bottom: 80 },
                children: [new Paragraph({ children: [new TextRun({ text: key.toUpperCase(), size: 18, bold: true })] })],
              }),
              new TableCell({
                width: { size: 40, type: WidthType.PERCENTAGE },
                margins: { left: 120, right: 120, top: 80, bottom: 80 },
                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: val, bold: true, size: 20, color: "FFB300" })] })],
              }),
            ],
          })
      ),
    });

  const doc = new Document({
    title: `CAPITAL3 — ${data.startup_name} Analysis`,
    description: "Startup Analysis Report",
    creator: "CAPITAL3 AI Agent",
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: "CAPITAL3", bold: true, size: 18, color: "FFB300" }),
                  new TextRun({ text: "  |  FUNDING. SCALE. DOMINATE.", size: 16, color: "AAAAAA" }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: "FFB300" } },
                spacing: { before: 80 },
                children: [
                  new TextRun({ text: `CAPITAL3  ·  ${data.startup_name}  ·  CONFIDENTIAL`, size: 14, color: "AAAAAA" }),
                ],
              }),
            ],
          }),
        },
        properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) } } },
        children: [
          /* Cover block */
          new Paragraph({
            spacing: { before: 200, after: 120 },
            shading: { type: ShadingType.SOLID, color: "0D0D0D" },
            children: [
              new TextRun({ text: data.startup_name.toUpperCase(), bold: true, size: 56, color: "FFB300", break: 1 }),
              new TextRun({ text: `${data.sector.toUpperCase()}  ·  ${data.stage.toUpperCase()}`, size: 20, color: "888888", break: 1 }),
              new TextRun({ text: " ", break: 1 }),
            ],
          }),

          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: data.description, size: 20, color: "555555", italics: true }),
            ],
          }),

          divider(),
          kpiTable(),
          divider(),

          heading("01 — Funding Strategy", HeadingLevel.HEADING_2),
          body(data.funding_strategy),

          heading("02 — Revenue Model", HeadingLevel.HEADING_2),
          body(data.revenue_model),

          divider(),
          heading("03 — Tokenomics", HeadingLevel.HEADING_2),
          label("Total Token Supply"),
          value(data.tokenomics.total_supply, "FFB300"),
          label("Distribution"),
          distTable(),
          new Paragraph({ children: [] }),
          label("Token Utility"),
          body(data.tokenomics.token_utility),
          label("Vesting Schedule"),
          body(data.tokenomics.vesting_schedule),

          divider(),
          heading("04 — Funding Scenarios", HeadingLevel.HEADING_2),
          ...data.scenarios.flatMap((s) => [
            new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [new TextRun({ text: s.name.toUpperCase(), bold: true, size: 24, color: s.name === "conservative" ? "FFB300" : s.name === "moderate" ? "FF9100" : "EF4444" })],
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                ["TARGET RAISE", s.target_raise],
                ["VALUATION", s.valuation],
                ["TIMELINE", s.timeline],
                ["PROBABILITY", s.probability],
              ].map(
                ([k, v]) =>
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        margins: { left: 120, right: 120, top: 60, bottom: 60 },
                        children: [new Paragraph({ children: [new TextRun({ text: k, size: 17, color: "888888" })] })],
                      }),
                      new TableCell({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        margins: { left: 120, right: 120, top: 60, bottom: 60 },
                        children: [new Paragraph({ children: [new TextRun({ text: v, bold: true, size: 19 })] })],
                      }),
                    ],
                  })
              ),
            }),
            new Paragraph({ children: [] }),
          ]),

          divider(),
          heading("05 — Risk Vectors", HeadingLevel.HEADING_2),
          ...data.risk_factors.map((r, i) =>
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({ text: `${i + 1}.  `, bold: true, size: 20, color: "EF4444" }),
                new TextRun({ text: r, size: 19, color: "444444" }),
              ],
            })
          ),

          divider(),
          heading("06 — Recommendations", HeadingLevel.HEADING_2),
          ...data.recommendations.map((rec, i) =>
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({ text: `${i + 1}.  `, bold: true, size: 20, color: "FFB300" }),
                new TextRun({ text: rec, size: 19, color: "444444" }),
              ],
            })
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CAPITAL3_${data.startup_name.replace(/\s+/g, "_")}_Analysis.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
