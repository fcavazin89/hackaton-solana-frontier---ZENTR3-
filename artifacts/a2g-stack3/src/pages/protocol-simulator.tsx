import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MermaidChart } from "@/components/mermaid-chart";
import { Terminal, Cpu, Network, Zap } from "lucide-react";

// Mock data for chart
const generateData = () => {
  const data = [];
  let value = 1000;
  let staked = 500;
  for (let i = 0; i < 20; i++) {
    value = value + (Math.random() - 0.4) * 100;
    staked = staked + (Math.random() - 0.3) * 50;
    data.push({
      time: `T+${i}`,
      price: Math.max(10, value),
      tvl: Math.max(100, staked),
    });
  }
  return data;
};

const PROTOCOL_DIAGRAM = `
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
    style F fill:#0A121A,stroke:#8b5cf6,stroke-width:2px,stroke-dasharray: 5 5,color:#8b5cf6
`;

export default function ProtocolSim() {
  const [data, setData] = useState(generateData());
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        newData.push({
          time: `T+${parseInt(last.time.substring(2)) + 1}`,
          price: Math.max(10, last.price + (Math.random() - 0.4) * 100),
          tvl: Math.max(100, last.tvl + (Math.random() - 0.3) * 50),
        });
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">PROTOCOL_SIMULATOR</h1>
          <p className="font-mono text-sm text-muted-foreground">OVP / PoV Network Telemetry</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={isRunning ? "default" : "outline"} className={`font-mono ${isRunning ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30' : ''}`} onClick={() => setIsRunning(!isRunning)}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`}></div>
            {isRunning ? 'SIMULATION_ACTIVE' : 'SIMULATION_PAUSED'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col - Stats & Terminal */}
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
                <p className="text-xl font-display text-primary">{data[data.length-1]?.time}</p>
              </div>
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">SIMULATED_TVL</p>
                <p className="text-xl font-display text-emerald-400">${data[data.length-1]?.tvl.toFixed(2)}M</p>
              </div>
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">TOKEN_PRICE</p>
                <p className="text-xl font-display text-primary">${data[data.length-1]?.price.toFixed(2)}</p>
              </div>
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
              <div className="flex gap-2 mt-2 animate-pulse text-primary/70">
                <span>{">"}</span>
                <span>_</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col - Charts & Diagram */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center">
                <Zap className="w-5 h-5 mr-2 text-primary" /> METRICS_TELEMETRY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D1FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00D1FF" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3A3F45" vertical={false} />
                    <XAxis dataKey="time" stroke="#BDB7C3" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#BDB7C3" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0A121A', borderColor: '#3A3F45', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                      itemStyle={{ color: '#00D1FF' }}
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
              <CardDescription className="font-mono text-xs">Live topology representation</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <MermaidChart chart={PROTOCOL_DIAGRAM} />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
