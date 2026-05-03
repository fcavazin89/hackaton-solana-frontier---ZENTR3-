import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MermaidChart } from "@/components/mermaid-chart";
import { Terminal, Cpu, Network, Zap, Download, Loader2 } from "lucide-react";
import { exportProtocolSimPdf } from "@/lib/export-pdf";
import { useProject } from "@/context/project-context";

function seedFromString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

function generateData(seed: number = 1000, initialPrice: number = 1000, initialTvl: number = 500) {
  const data = [];
  let value = initialPrice;
  let staked = initialTvl;
  const rng = (i: number) => {
    const x = Math.sin(seed + i) * 10000;
    return x - Math.floor(x);
  };
  for (let i = 0; i < 20; i++) {
    value = value + (rng(i * 2) - 0.4) * (initialPrice * 0.1);
    staked = staked + (rng(i * 2 + 1) - 0.3) * (initialTvl * 0.1);
    data.push({
      time: `T+${i}`,
      price: Math.max(10, value),
      tvl: Math.max(100, staked),
    });
  }
  return data;
}

export default function ProtocolSim() {
  const { businessPlan } = useProject();
  const seed = businessPlan ? seedFromString(businessPlan.projectName) : 42000;
  const tokenSymbol = businessPlan
    ? businessPlan.projectName.replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 4) || 'TKN'
    : 'OVP';
  const initPrice = 1000 + (seed % 500);
  const initTvl = 500 + (seed % 300);

  const [data, setData] = useState(() => generateData(seed, initPrice, initTvl));
  const [isRunning, setIsRunning] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setData(generateData(seed, initPrice, initTvl));
  }, [seed]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        const x = Math.sin(Date.now()) * 10000;
        const rng = x - Math.floor(x);
        const rng2 = Math.abs(Math.sin(Date.now() + 1) * 10000) % 1;
        newData.push({
          time: `T+${parseInt(last.time.substring(2)) + 1}`,
          price: Math.max(10, last.price + (rng - 0.4) * (initPrice * 0.1)),
          tvl: Math.max(100, last.tvl + (rng2 - 0.3) * (initTvl * 0.1)),
        });
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning]);

  async function handleExport() {
    setIsExporting(true);
    const wasRunning = isRunning;
    setIsRunning(false);
    try {
      await exportProtocolSimPdf(data, tokenSymbol, businessPlan?.projectName || "");
    } finally {
      setIsExporting(false);
      if (wasRunning) setIsRunning(true);
    }
  }

  const lastDataPoint = data[data.length - 1];

  const diagramDef = businessPlan
    ? `
graph TD
    A[User Wallet] -->|Stake ${tokenSymbol}| B(${businessPlan.projectName} Contract)
    B --> C{PoV Validator}
    C -->|Approved| D[Rewards Pool]
    C -->|Rejected| E[Slashing]
    D -->|Emit Yield| A
    F[AI Agents] -.->|Optimize| B
    F -.->|Adjust Params| D
    style A fill:#080F14,stroke:#00D1FF,stroke-width:2px,color:#BDB7C3
    style B fill:#0A121A,stroke:#00D1FF,stroke-width:2px,color:#00D1FF
    style C fill:#0A121A,stroke:#f59e0b,stroke-width:2px,color:#f59e0b
    style D fill:#0A121A,stroke:#10b981,stroke-width:2px,color:#10b981
    style E fill:#0A121A,stroke:#ef4444,stroke-width:2px,color:#ef4444
    style F fill:#0A121A,stroke:#8b5cf6,stroke-width:2px,stroke-dasharray: 5 5,color:#8b5cf6`
    : `
graph TD
    A[User Wallet] -->|Stake| B(OVP Contract)
    B --> C{PoV Validator}
    C -->|Approved| D[Rewards Pool]
    C -->|Rejected| E[Slashing]
    D -->|Emit Yield| A
    F[AI Agents] -.->|Optimize| B
    F -.->|Adjust Params| D
    style A fill:#080F14,stroke:#00D1FF,stroke-width:2px,color:#BDB7C3
    style B fill:#0A121A,stroke:#00D1FF,stroke-width:2px,color:#00D1FF
    style C fill:#0A121A,stroke:#f59e0b,stroke-width:2px,color:#f59e0b
    style D fill:#0A121A,stroke:#10b981,stroke-width:2px,color:#10b981
    style E fill:#0A121A,stroke:#ef4444,stroke-width:2px,color:#ef4444
    style F fill:#0A121A,stroke:#8b5cf6,stroke-width:2px,stroke-dasharray: 5 5,color:#8b5cf6`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {businessPlan ? `${businessPlan.projectName.toUpperCase()} — PROTOCOL_SIM` : 'PROTOCOL_SIMULATOR'}
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            {businessPlan ? `${tokenSymbol} / PoV Network Telemetry` : 'OVP / PoV Network Telemetry'}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs border-primary/50 text-primary hover:bg-primary/10"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting
              ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" />EXPORTING...</>
              : <><Download className="w-3 h-3 mr-2" />EXPORT_PDF</>
            }
          </Button>
          <Badge
            variant={isRunning ? "default" : "outline"}
            className={`font-mono cursor-pointer ${isRunning ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30' : ''}`}
            onClick={() => setIsRunning(!isRunning)}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`}></div>
            {isRunning ? 'SIMULATION_ACTIVE' : 'SIMULATION_PAUSED'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="font-mono text-sm text-muted-foreground flex items-center">
                <Network className="w-4 h-4 mr-2" /> GLOBAL_STATE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">EPOCH</p>
                <p className="text-xl font-display text-primary">{lastDataPoint?.time}</p>
              </div>
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">SIMULATED_TVL</p>
                <p className="text-xl font-display text-emerald-400">${lastDataPoint?.tvl.toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">{tokenSymbol}_PRICE</p>
                <p className="text-xl font-display text-primary">${lastDataPoint?.price.toFixed(2)}</p>
              </div>
              {businessPlan && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-mono text-muted-foreground mb-1">PROJECT</p>
                  <p className="text-sm font-display text-muted-foreground truncate">{businessPlan.projectName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#05080A] border-border/50 h-[300px] flex flex-col">
            <CardHeader className="py-2 border-b border-border/50 bg-muted/20">
              <CardTitle className="font-mono text-xs text-muted-foreground flex items-center">
                <Terminal className="w-3 h-3 mr-2" /> NODE_LOGS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex-1 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar text-muted-foreground">
              <div className="text-emerald-400">[OVP] Validating semantic graph... OK</div>
              <div className="text-emerald-400">[PoV] Consensus reached for block 8492</div>
              <div>[NET] Synchronizing state with peers...</div>
              <div className="text-primary">[AGENT:Risk] Adjusting collateral ratio +0.5%</div>
              <div className="text-amber-400">[WARN] High slippage detected in pool 0x4F...</div>
              <div>[SIM] Advancing to next epoch...</div>
              <div className="text-primary">[AGENT:Tokenomics] Yield emission rate: optimal</div>
              <div className="text-emerald-400">[PoV] Consensus reached for block 8493</div>
              {businessPlan && (
                <div className="text-violet-400">[PROJECT] {businessPlan.projectName} simulation active</div>
              )}
              <div className="flex gap-2 mt-2 animate-pulse text-primary/70">
                <span>{">"}</span><span>_</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center">
                <Zap className="w-5 h-5 mr-2 text-primary" />
                {businessPlan ? `${tokenSymbol} METRICS_TELEMETRY` : 'METRICS_TELEMETRY'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D1FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D1FF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3A3F45" vertical={false} />
                    <XAxis dataKey="time" stroke="#BDB7C3" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#BDB7C3" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val.toFixed(0)}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0A121A', borderColor: '#3A3F45', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                      itemStyle={{ color: '#00D1FF' }}
                      formatter={(value: any, name: string) => [`$${Number(value).toFixed(2)}`, name === 'price' ? tokenSymbol : 'TVL']}
                    />
                    <Area type="monotone" dataKey="price" stroke="#00D1FF" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
                    <Area type="monotone" dataKey="tvl" stroke="#10b981" fillOpacity={1} fill="url(#colorTvl)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/10">
              <CardTitle className="font-display text-lg flex items-center">
                <Cpu className="w-5 h-5 mr-2 text-primary" /> ARCHITECTURE_GRAPH
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                {businessPlan ? `${businessPlan.projectName} topology` : 'Live topology representation'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <MermaidChart chart={diagramDef} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
