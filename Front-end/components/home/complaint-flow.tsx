"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

// --- Animation Helpers ---
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const bezier = (x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, n = 32) => {
  const points = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
    points.push([x, y]);
  }
  return points;
};

const line = (x1: number, y1: number, x2: number, y2: number, n = 16) => {
  const points = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    points.push([lerp(x1, x2, t), lerp(y1, y2, t)]);
  }
  return points;
};

const emptySubscribe = () => () => {};

const NetworkCanvas = () => {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [log, setLogState] = useState({ text: "", color: "rgba(255,255,255,0.4)" });

  const containerRef = useRef<HTMLDivElement>(null);
  const componentRefs = useRef<Record<string, SVGElement | null>>({});
  const calloutRefs = useRef<Record<string, SVGElement | null>>({});
  const pktRefs = useRef<Record<string, SVGElement | null>>({});
  const rafRef = useRef<number | undefined>(undefined);

  const isDark = !mounted || resolvedTheme === "dark";

  useEffect(() => {
    let startTime: number | null = null;
    
    const setLog = (text: string, color: string) => {
      setLogState({ text, color });
    };

    const fade = (id: string, target: number, duration: number, startT: number, currentT: number) => {
      const el = calloutRefs.current[id] || pktRefs.current[id];
      if (!el) return;
      const progress = Math.min(Math.max((currentT - startT) / duration, 0), 1);
      const currentOpacity = parseFloat(el.getAttribute("opacity") || "0");
      const opacity = lerp(currentOpacity, target, progress === 1 ? 1 : 0.15);
      el.setAttribute("opacity", opacity.toString());
    };

    const pulse = (id: string, color?: string) => {
      const el = componentRefs.current[id];
      if (!el) return;
      (el as SVGElement).style.transition = "none";
      (el as SVGElement).style.filter = "brightness(2) saturate(1.5)";
      (el as SVGElement).style.strokeWidth = "2";
      if (color) (el as SVGElement).style.stroke = color;
      
      setTimeout(() => {
        if (el) {
          (el as SVGElement).style.transition = "all 600ms ease";
          (el as SVGElement).style.filter = "none";
          (el as SVGElement).style.strokeWidth = "1";
          if (id === "proxy") (el as SVGElement).style.stroke = isDark ? "rgba(251,191,36,0.22)" : "rgba(251,191,36,0.3)";
          else if (id.startsWith("node")) (el as SVGElement).style.stroke = isDark ? "rgba(139,92,246,0.32)" : "rgba(139,92,246,0.45)";
          else if (id === "ipfs") (el as SVGElement).style.stroke = isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.3)";
          else (el as SVGElement).style.stroke = isDark ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.15)";
        }
      }, 50);
    };

    const movePkt = (id: string, points: number[][], duration: number, startT: number, currentT: number) => {
      const el = pktRefs.current[id];
      if (!el) return;
      const progress = (currentT - startT) / duration;
      if (progress < 0 || progress > 1) {
        el.setAttribute("opacity", "0");
        return;
      }
      const eased = ease(progress);
      const idx = Math.floor(eased * (points.length - 1));
      const [x, y] = points[idx];
      el.setAttribute("cx", x.toString());
      el.setAttribute("cy", y.toString());
      el.setAttribute("opacity", "1");
    };

    const pathPkt1 = line(160, 260, 160, 330);
    const pathPkt2 = bezier(310, 410, 400, 410, 460, 250);
    const pathPkt3a = bezier(550, 360, 560, 440, 600, 495);
    const pathPkt3b = bezier(570, 360, 650, 460, 820, 510);
    const pathPkt3c = bezier(590, 360, 850, 420, 1040, 495);
    const pathPkt4 = bezier(570, 140, 750, 70, 980, 70);

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const DUR_PKT1 = 900, DUR_PKT2 = 1100, DUR_PKT3 = 1300, DUR_PKT4 = 1150;
      const step0 = 0, step1 = 150, step2 = step1 + DUR_PKT1, step3 = step2 + 1500, step4 = step3 + 150, step5 = step4 + DUR_PKT2, step6 = step5 + 1200, step7 = step6 + 150, step8 = step7 + DUR_PKT3 + 600, step9 = step7 + 250, step10 = step8 + 3000;

      if (elapsed >= step0 && elapsed < step0 + 20) { pulse("browser"); setLog("complaint.submit() → proxy:4000", "rgba(99,179,237,0.7)"); }
      if (elapsed >= step2 && elapsed < step2 + 20) { pulse("proxy"); setLog("proxy: stripping ip · user-agent · x-forwarded-for...", "rgba(251,191,36,0.7)"); }
      fade("g-strip", elapsed >= step2 && elapsed < step3 ? 1 : 0, 300, step2, elapsed);
      if (elapsed >= step3 && elapsed < step3 + 20) setLog("proxy: forwarding clean request →", "rgba(34,197,94,0.7)");
      if (elapsed >= step5 && elapsed < step5 + 20) { pulse("backend"); setLog("backend: signing MsgSubmitAnonymousComplaint...", "rgba(99,179,237,0.7)"); }
      if (elapsed >= step6 && elapsed < step6 + 20) setLog("backend: broadcasting to sawtak network nodes...", "rgba(139,92,246,0.7)");
      if (elapsed >= step7) {
        movePkt("pkt3a", pathPkt3a, DUR_PKT3, step7, elapsed);
        movePkt("pkt3b", pathPkt3b, DUR_PKT3, step7 + 110, elapsed);
        movePkt("pkt3c", pathPkt3c, DUR_PKT3, step7 + 220, elapsed);
        if (elapsed >= step7 + DUR_PKT3 && elapsed < step7 + DUR_PKT3 + 20) pulse("node1");
        if (elapsed >= step7 + 110 + DUR_PKT3 && elapsed < step7 + 110 + DUR_PKT3 + 20) pulse("node2");
        if (elapsed >= step7 + 220 + DUR_PKT3 && elapsed < step7 + 220 + DUR_PKT3 + 20) pulse("node3");
      }
      if (elapsed >= step8 && elapsed < step8 + 20) setLog("consensus: 3/3 nodes agree · block finalized ✓", "rgba(139,92,246,0.8)");
      fade("g-consensus", elapsed >= step8 && elapsed < step10 ? 1 : 0, 400, step8, elapsed);
      if (elapsed >= step9) {
        movePkt("pkt4", pathPkt4, DUR_PKT4, step9, elapsed);
        if (elapsed >= step9 + DUR_PKT4 && elapsed < step9 + DUR_PKT4 + 20) { pulse("ipfs"); setLog("ipfs: evidence pinned · cid recorded on-chain", "rgba(59,130,246,0.7)"); }
      }
      movePkt("pkt1", pathPkt1, DUR_PKT1, step1, elapsed);
      movePkt("pkt2", pathPkt2, DUR_PKT2, step4, elapsed);
      if (elapsed > step10) startTime = time;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isDark]);

  return (
    <section className="hidden md:block w-full py-[120px] mb-[120px] bg-[#fcfcfc] dark:bg-[#0a0a0a] transition-colors duration-500">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-500/5 border border-violet-500/30 dark:border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-semibold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Security Infrastructure
          </div>
          <h2 className="text-[clamp(32px,5vw,54px)] font-bold text-black dark:text-white mb-5 tracking-tight leading-[1.1]">
            How Your Complaint Travels Safely
          </h2>
          <p className="text-[clamp(18px,2vw,21px)] text-gray-600 dark:text-white/45 max-w-[800px] mx-auto leading-relaxed">
            Our multi-layered security protocol ensures your identity is stripped at the edge 
            and your data is cryptographically sealed before reaching the decentralized network.
          </p>
        </div>
        <div 
          ref={containerRef}
          className="relative w-full max-w-[1250px] mx-auto bg-white dark:bg-[#0c0c0c] rounded-[28px] border border-black/10 dark:border-white/10 overflow-hidden aspect-1200/650 shadow-xl dark:shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] transition-all duration-500"
        >
          <svg viewBox="0 0 1200 650" className="w-full h-full font-mono" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 1 1 L 9 5 L 1 9" stroke="context-stroke" strokeWidth="1" fill="none" />
              </marker>
            </defs>
            <g strokeDasharray="5 4" strokeWidth="1.2" markerEnd="url(#ah)">
              <path d="M 160 260 L 160 330" className="stroke-black/10 dark:stroke-white/10" />
              <path d="M 310 410 Q 400 410 460 250" className="stroke-black/10 dark:stroke-white/10" />
              <path d="M 550 360 Q 560 440 600 495" className="stroke-violet-500/15 dark:stroke-violet-500/12" />
              <path d="M 570 360 Q 650 460 820 510" className="stroke-violet-500/15 dark:stroke-violet-500/12" />
              <path d="M 590 360 Q 850 420 1040 495" className="stroke-violet-500/15 dark:stroke-violet-500/12" />
              <path d="M 570 140 Q 750 70 980 70" className="stroke-blue-500/15 dark:stroke-blue-500/12" strokeDasharray="4 5" />
            </g>
            <g className="stroke-violet-500/15 dark:stroke-violet-500/12" strokeWidth="1" strokeDasharray="3 4" fill="none">
              <path d="M 655 490 Q 740 490 810 515" />
              <path d="M 885 525 Q 960 510 1035 490" />
              <path d="M 600 550 Q 820 600 1040 550" />
            </g>
            <path d="M 460 330 Q 370 410 320 410" className="stroke-violet-500/10 dark:stroke-violet-500/8" strokeWidth="0.8" strokeDasharray="3 5" fill="none" />
            <g>
              <rect ref={el => { componentRefs.current["browser"] = el; }} x="40" y="50" width="240" height="210" rx="12" className="fill-gray-50 dark:fill-[#141414] stroke-black/15 dark:stroke-white/10" strokeWidth="1" />
              <path d="M 40 82 L 280 82" className="stroke-black/10 dark:stroke-white/10" strokeWidth="0.6" />
              <circle cx="58" cy="66" r="4" fill="#22c55e" />
              <text x="75" y="70" className="fill-black dark:fill-white" fontSize="14" fontWeight="600">browser</text>
              <text x="265" y="70" className="fill-gray-400 dark:fill-white/30" fontSize="12" textAnchor="end">:3000</text>
              <rect x="58" y="100" width="204" height="18" rx="4" className="fill-black/5 dark:fill-white/5 stroke-black/10 dark:stroke-white/10" />
              <rect x="58" y="130" width="204" height="14" rx="3" className="fill-black/5 dark:fill-white/5" />
              <rect x="58" y="152" width="204" height="14" rx="3" className="fill-black/5 dark:fill-white/5" />
              <rect x="58" y="174" width="140" height="14" rx="3" className="fill-black/5 dark:fill-white/5" />
              <rect x="58" y="205" width="85" height="24" rx="5" className="fill-blue-500/10 dark:fill-blue-500/12 stroke-blue-500/30 dark:stroke-blue-500/20" />
              <text x="100.5" y="221" className="fill-blue-600 dark:fill-blue-400" fontSize="11" textAnchor="middle">submit →</text>
              <rect x="155" y="205" width="107" height="24" rx="5" className="fill-green-500/10 dark:fill-green-500/12 stroke-green-500/30 dark:stroke-green-500/20" />
              <text x="208.5" y="221" className="fill-green-600 dark:fill-green-400" fontSize="10.5" textAnchor="middle">https encrypted</text>
              <circle cx="160" cy="260" r="5" className="fill-gray-50 dark:fill-[#141414] stroke-black/15 dark:stroke-white/10" />
            </g>
            <g>
              <rect ref={el => { componentRefs.current["proxy"] = el; }} x="40" y="330" width="270" height="160" rx="12" className="fill-gray-50 dark:fill-[#141414]" stroke={isDark ? "rgba(251,191,36,0.22)" : "rgba(251,191,36,0.3)"} strokeWidth="1" />
              <circle cx="58" cy="346" r="4" fill="#FEBC2E" />
              <text x="75" y="350" className="fill-amber-700 dark:fill-amber-400/80" fontSize="14" fontWeight="600">privacy proxy</text>
              <text x="295" y="350" className="fill-gray-400 dark:fill-white/30" fontSize="12" textAnchor="end">:4000</text>
              <text x="58" y="376" className="fill-gray-400 dark:fill-white/30" fontSize="11" fontWeight="500">strips metadata:</text>
              <g transform="translate(58, 388)">
                <rect width="80" height="22" rx="4" className="fill-amber-500/10 dark:fill-amber-500/8 stroke-amber-500/30 dark:stroke-amber-500/20" />
                <text x="40" y="15" className="fill-amber-800 dark:fill-amber-500/55" fontSize="10.5" textAnchor="middle">ip address</text>
                <rect x="92" width="90" height="22" rx="4" className="fill-amber-500/10 dark:fill-amber-500/8 stroke-amber-500/30 dark:stroke-amber-500/20" />
                <text x="137" y="15" className="fill-amber-800 dark:fill-amber-500/55" fontSize="10.5" textAnchor="middle">user-agent</text>
                <rect y="32" width="115" height="22" rx="4" className="fill-amber-500/10 dark:fill-amber-500/8 stroke-amber-500/30 dark:stroke-amber-500/20" />
                <text x="57.5" y="47" className="fill-amber-800 dark:fill-amber-500/55" fontSize="10.5" textAnchor="middle">x-forwarded-for</text>
              </g>
              <text x="58" y="465" className="fill-gray-400 dark:fill-white/30" fontSize="11">→ forwards clean request to backend</text>
              <circle cx="310" cy="410" r="5.5" className="fill-gray-50 dark:fill-[#141414]" stroke={isDark ? "rgba(251,191,36,0.45)" : "rgba(251,191,36,0.55)"} />
            </g>
            <g>
              <rect ref={el => { componentRefs.current["backend"] = el; }} x="460" y="140" width="220" height="220" rx="12" className="fill-gray-50 dark:fill-[#141414] stroke-black/15 dark:stroke-white/10" strokeWidth="1" />
              <circle cx="485" cy="162" r="4" fill="#22c55e" />
              <text x="502" y="166" className="fill-black dark:fill-white" fontSize="14" fontWeight="600">backend</text>
              <text x="665" y="166" className="fill-gray-400 dark:fill-white/30" fontSize="12" textAnchor="end">bun/elysia</text>
              <g transform="translate(482, 195)">
                <rect width="75" height="22" rx="4" className="fill-black/5 dark:fill-white/5 stroke-black/10 dark:stroke-white/10" />
                <text x="37.5" y="15" className="fill-gray-600 dark:fill-white/45" fontSize="11" textAnchor="middle">postgresql</text>
                <rect x="85" width="55" height="22" rx="4" className="fill-black/5 dark:fill-white/5 stroke-black/10 dark:stroke-white/10" />
                <text x="112.5" y="15" className="fill-gray-600 dark:fill-white/45" fontSize="11" textAnchor="middle">redis</text>
                <rect y="32" width="130" height="22" rx="4" className="fill-violet-500/10 dark:fill-violet-500/8 stroke-violet-500/30 dark:stroke-violet-500/20" />
                <text x="65" y="47" className="fill-violet-700 dark:fill-violet-400/65" fontSize="11" textAnchor="middle">cosmos indexer</text>
                <rect y="64" width="130" height="22" rx="4" className="fill-black/5 dark:fill-white/5 stroke-black/10 dark:stroke-white/10" />
                <text x="65" y="79" className="fill-gray-600 dark:fill-white/45" fontSize="11" textAnchor="middle">aes-256 encrypt</text>
              </g>
              <text x="570" y="335" className="fill-gray-500 dark:fill-white/25" fontSize="12" textAnchor="middle">signs tx · broadcasts</text>
              <circle cx="460" cy="250" r="5.5" className="fill-gray-50 dark:fill-[#141414] stroke-black/15 dark:stroke-white/10" />
              <circle cx="570" cy="360" r="5.5" className="fill-gray-50 dark:fill-[#141414]" stroke={isDark ? "rgba(139,92,246,0.45)" : "rgba(139,92,246,0.55)"} />
              <circle cx="570" cy="140" r="5.5" className="fill-gray-50 dark:fill-[#141414]" stroke={isDark ? "rgba(59,130,246,0.45)" : "rgba(59,130,246,0.55)"} />
            </g>
            <g>
              {[
                { id: "node1", cx: 600, cy: 495, name: "node-1" },
                { id: "node2", cx: 820, cy: 510, name: "node-2" },
                { id: "node3", cx: 1040, cy: 495, name: "node-3" }
              ].map(node => (
                <g key={node.id}>
                  <circle ref={el => { componentRefs.current[node.id] = el; }} cx={node.cx} cy={node.cy} r="55" className="fill-gray-50 dark:fill-[#141414]" stroke={isDark ? "rgba(139,92,246,0.32)" : "rgba(139,92,246,0.45)"} strokeWidth="1.2" />
                  <text x={node.cx} y={node.cy - 6} className="fill-gray-600 dark:fill-white/40" fontSize="14" fontWeight="600" textAnchor="middle">sawtak</text>
                  <text x={node.cx} y={node.cy + 14} className="fill-gray-400 dark:fill-white/30" fontSize="12" textAnchor="middle">{node.name}</text>
                  <circle cx={node.cx} cy={node.cy + 28} r="4.5" className="fill-violet-500 dark:fill-violet-400" />
                </g>
              ))}
              <text x="820" y="605" className="fill-violet-600 dark:fill-violet-500/25" fontSize="14" textAnchor="middle">cosmos sdk · tendermint (cometbft)</text>
            </g>
            <g ref={el => { componentRefs.current["ipfs"] = el; }}>
              <g className="opacity-40 dark:opacity-80">
                <ellipse cx="945" cy="85" rx="42" ry="30" className="fill-gray-50 dark:fill-[#141414] stroke-blue-500/30 dark:stroke-blue-500/20" strokeWidth="1" strokeDasharray="4 3" />
                <ellipse cx="995" cy="70" rx="48" ry="36" className="fill-gray-50 dark:fill-[#141414] stroke-blue-500/30 dark:stroke-blue-500/20" strokeWidth="1" strokeDasharray="4 3" />
                <ellipse cx="1045" cy="85" rx="42" ry="30" className="fill-gray-50 dark:fill-[#141414] stroke-blue-500/30 dark:stroke-blue-500/20" strokeWidth="1" strokeDasharray="4 3" />
              </g>
              <text x="995" y="73" className="fill-blue-600 dark:fill-blue-500/80" fontSize="16" fontWeight="600" textAnchor="middle">IPFS</text>
              <text x="995" y="90" className="fill-blue-700 dark:fill-blue-500/40" fontSize="12" textAnchor="middle">decentralized · evidence</text>
            </g>
            <g ref={el => { calloutRefs.current["g-strip"] = el; }} opacity="0">
              <rect x="330" y="360" width="160" height="72" rx="10" className="fill-white/95 dark:fill-black/95 stroke-amber-500/40 dark:stroke-amber-500/25" />
              <text x="348" y="378" className="fill-amber-800 dark:fill-amber-500/65" fontSize="12">✕ ip address</text>
              <text x="348" y="398" className="fill-amber-800 dark:fill-amber-500/65" fontSize="12">✕ user-agent</text>
              <text x="348" y="418" className="fill-amber-800 dark:fill-amber-500/65" fontSize="12">✕ x-fwd-for</text>
            </g>
            <g ref={el => { calloutRefs.current["g-consensus"] = el; }} opacity="0">
              <rect x="650" y="570" width="350" height="30" rx="8" className="fill-white/95 dark:fill-black/92 stroke-violet-500/40 dark:stroke-violet-500/25" />
              <circle cx="668" cy="585" r="4.5" fill="#8b5cf6" />
              <text x="680" y="589" className="fill-violet-700 dark:fill-violet-400/85" fontSize="12">consensus reached · block finalized ✓</text>
            </g>
            <circle ref={el => { pktRefs.current["pkt1"] = el; }} r="8" className="fill-gray-800 dark:fill-white" opacity="0" />
            <circle ref={el => { pktRefs.current["pkt2"] = el; }} r="8" fill="rgba(34,197,94,0.9)" opacity="0" />
            <circle ref={el => { pktRefs.current["pkt3a"] = el; }} r="7.5" fill="rgba(139,92,246,0.9)" opacity="0" />
            <circle ref={el => { pktRefs.current["pkt3b"] = el; }} r="7.5" fill="rgba(139,92,246,0.9)" opacity="0" />
            <circle ref={el => { pktRefs.current["pkt3c"] = el; }} r="7.5" fill="rgba(139,92,246,0.9)" opacity="0" />
            <circle ref={el => { pktRefs.current["pkt4"] = el; }} r="7" fill="rgba(59,130,246,0.9)" opacity="0" />
          </svg>
          <div className="absolute bottom-0 inset-x-0 h-7 bg-gray-100 dark:bg-[#080808] border-t border-black/5 dark:border-white/5 flex items-center px-4 pointer-events-none">
            <span className="font-mono text-[13px] transition-colors duration-300 tracking-wide" style={{ color: log.color }}>
              {log.text}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NetworkCanvas;
export { NetworkCanvas as ComplaintFlow };
