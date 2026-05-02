import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidChartProps {
  chart: string;
}

export function MermaidChart({ chart }: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#0A121A',
          primaryTextColor: '#00D1FF',
          primaryBorderColor: '#00D1FF',
          lineColor: '#3A3F45',
          secondaryColor: '#080F14',
          tertiaryColor: '#0A121A',
        }
      });
      mermaid.render('mermaid-svg', chart).then((result) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = result.svg;
        }
      }).catch(e => console.error("Mermaid rendering error", e));
    }
  }, [chart]);

  return (
    <div 
      className="mermaid-container w-full overflow-x-auto bg-card border border-border rounded-md p-4 flex justify-center items-center" 
      ref={containerRef} 
    />
  );
}
