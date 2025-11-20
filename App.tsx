/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HeroScene } from './components/FinancialScene';
import { MarketTrendChart, ForecastChart, VarianceChart, WaterfallChart } from './components/FinancialCharts';
import { ArrowDown, Menu, X, Upload, TrendingUp, AlertTriangle, Activity, DollarSign, FileSpreadsheet, Cpu, Loader2, Terminal, ChevronUp, ChevronDown, CheckCircle2, Info, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Declare global Pyodide types & SheetJS
declare global {
  interface Window {
    loadPyodide: any;
    pyodide: any;
    XLSX: any;
  }
}

// --- TYPES ---
interface FinancialRecord {
  Year: number;
  Revenue: number;
  'Net Income': number;
  'Free Cash Flow': number;
  Budget: number;
  [key: string]: number;
}

// --- MOCK DATA GENERATOR ---
const generateSampleData = (): FinancialRecord[] => {
  const baseRevenue = 100000;
  return Array.from({ length: 6 }, (_, i) => {
    const year = 2020 + i;
    const growth = 1 + (i * 0.1) + (Math.random() * 0.05);
    const revenue = Math.round(baseRevenue * growth);
    return {
      Year: year,
      Revenue: revenue,
      'Net Income': Math.round(revenue * 0.15),
      'Free Cash Flow': Math.round(revenue * 0.12),
      Budget: Math.round(revenue * (Math.random() > 0.5 ? 0.95 : 1.05)), // Random budget variance
    };
  });
};

// --- HELPER: CSV PARSER ---
const parseCSV = (text: string): FinancialRecord[] => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]+/g, ''));
    
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((h, i) => {
            const val = values[i]?.trim();
            // Convert to number if possible, otherwise keep string
            obj[h] = isNaN(Number(val)) ? val : Number(val);
        });
        
        // Ensure critical fields exist or default them
        if (!obj.Budget && obj.Revenue) obj.Budget = Math.round(obj.Revenue * 0.95);
        
        return obj as FinancialRecord;
    });
};

// --- COMPONENTS ---

const MetricCard = ({ title, value, subtext, delay }: { title: string, value: string, subtext: string, delay: string }) => {
  return (
    <div className="flex flex-col group animate-fade-in-up items-start p-6 bg-white rounded-none border border-stone-200 shadow-none hover:border-black transition-all duration-300 w-full" style={{ animationDelay: delay }}>
      <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-3">{title}</p>
      <h3 className="font-serif text-4xl text-black mb-2">{value}</h3>
      <div className="w-8 h-1 bg-black mb-3 opacity-10 group-hover:opacity-100 group-hover:w-12 transition-all duration-300"></div>
      <p className="text-xs text-stone-400 font-medium">{subtext}</p>
    </div>
  );
};

const SectionHeading = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-8 text-center md:text-left">
        <div className="inline-block mb-3 text-xs font-bold tracking-widest text-stone-400 uppercase">{subtitle}</div>
        <h2 className="font-serif text-5xl text-black tracking-tight">{title}</h2>
        <div className="w-24 h-1 bg-black mt-6 mx-auto md:mx-0"></div>
    </div>
  );

const ToolDescription = ({ context, utility }: { context: string, utility: string }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 p-8 bg-stone-50 border-l-2 border-black">
        <div>
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-black mb-3 flex items-center gap-2">
                <Info size={12} /> Operational Context
            </h4>
            <p className="text-sm text-stone-600 leading-relaxed font-light">{context}</p>
        </div>
        <div>
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-black mb-3 flex items-center gap-2">
                <Activity size={12} /> Strategic Utility
            </h4>
            <p className="text-sm text-stone-600 leading-relaxed font-light">{utility}</p>
        </div>
    </div>
);

const StrategicInsight = ({ metric, data, horizon }: { metric: string, data: any[], horizon: number }) => {
    const insight = useMemo(() => {
        if (data.length < 2) return "Insufficient data for analysis.";
        
        // Find start (last historical) and end (last forecast)
        const history = data.filter(d => d.Historical !== null && d.Historical !== undefined);
        const forecast = data.filter(d => d.Forecast !== null && d.Forecast !== undefined);
        
        if (history.length === 0 || forecast.length === 0) return "Model initialization required.";

        const startVal = history[history.length - 1].Historical;
        const endVal = forecast[forecast.length - 1].Forecast;
        
        const cagr = (Math.pow(endVal / startVal, 1 / horizon) - 1) * 100;
        const direction = cagr > 0 ? "expansion" : "contraction";
        const strength = Math.abs(cagr) > 10 ? "aggressive" : Math.abs(cagr) > 5 ? "moderate" : "stable";

        return `Based on the linear projection model, ${metric} is signaling a ${strength} ${direction} phase, with an implied Compound Annual Growth Rate (CAGR) of ${cagr.toFixed(2)}% over the next ${horizon} years. The projected terminal value of $${endVal.toLocaleString()} assumes current market conditions persist without significant regulatory or macroeconomic disruption.`;
    }, [data, metric, horizon]);

    return (
        <div className="bg-stone-50 border border-stone-200 p-6 mt-6">
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-black mb-3 flex items-center gap-2">
                <Layers size={12} /> Automated Strategic Commentary
            </h4>
            <p className="text-sm text-stone-800 leading-relaxed font-serif italic">
                "{insight}"
            </p>
        </div>
    )
}

const SystemConsole = ({ logs, status, expanded, setExpanded }: { logs: string[], status: string, expanded: boolean, setExpanded: (v: boolean) => void }) => (
    <div className={`fixed bottom-0 left-0 right-0 bg-black border-t border-stone-800 transition-all duration-300 z-50 ${expanded ? 'h-64' : 'h-9'}`}>
        <div 
            className="h-9 px-4 flex items-center justify-between cursor-pointer hover:bg-stone-900"
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-center gap-3">
                <Terminal size={12} className="text-white" />
                <span className="text-xs font-mono text-stone-300 font-bold tracking-wider">SYSTEM KERNEL</span>
                <span className={`text-[9px] px-2 py-px rounded-sm font-bold tracking-wider uppercase ${status === 'ready' ? 'bg-white text-black' : status === 'error' ? 'bg-stone-700 text-white' : 'bg-stone-800 text-stone-400'}`}>
                    {status === 'ready' ? 'ONLINE' : status === 'error' ? 'ERROR' : 'BOOTING'}
                </span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[10px] text-stone-500 uppercase hidden sm:inline tracking-widest">Python Runtime Environment</span>
                {expanded ? <ChevronDown size={12} className="text-white" /> : <ChevronUp size={12} className="text-white" />}
            </div>
        </div>
        
        <div className="p-4 font-mono text-xs text-stone-400 h-[calc(100%-36px)] overflow-y-auto space-y-1 bg-black">
            {logs.length === 0 && <span className="text-stone-700 italic">Waiting for system events...</span>}
            {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                    <span className="text-stone-600">[{new Date().toLocaleTimeString()}]</span>
                    <span className={log.includes('Error') ? 'text-stone-200 font-bold' : log.includes('Python') ? 'text-white' : log.includes('Integrity') ? 'text-stone-300' : 'text-stone-500'}>
                        {log}
                    </span>
                </div>
            ))}
            <div id="log-end" />
        </div>
    </div>
);

// --- MAIN APP ---

const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'forecast' | 'risk' | 'valuation'>('market');
  const [data, setData] = useState<FinancialRecord[]>(generateSampleData());
  
  // -- PYTHON STATE --
  const [pythonStatus, setPythonStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pythonLogs, setPythonLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  // -- FORECAST STATE --
  const [forecastHorizon, setForecastHorizon] = useState(5);
  const [forecastMetric, setForecastMetric] = useState<string>('Revenue');
  const [forecastSensitivity, setForecastSensitivity] = useState(10); // +/- 10%
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [computeSource, setComputeSource] = useState<'Python/NumPy' | 'JS Fallback' | null>(null);

  // -- RISK STATE --
  const [baseRev, setBaseRev] = useState(100000);
  const [baseCost, setBaseCost] = useState(80000);

  // -- VALUATION STATE --
  const [wacc, setWacc] = useState(10);
  const [termGrowth, setTermGrowth] = useState(2.5);
  const [netDebt, setNetDebt] = useState(150);
  const [shares, setShares] = useState(50);
  const [valuationResult, setValuationResult] = useState<{sharePrice: number, waterfall: any[]}>({ sharePrice: 0, waterfall: [] });
  const [valuationSource, setValuationSource] = useState<'Python/NumPy' | 'JS Fallback' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => setPythonLogs(prev => [...prev, msg]);

  // Initialize Pyodide
  useEffect(() => {
    const initPython = async () => {
        try {
            if (!window.loadPyodide) {
                return;
            }
            addLog("Initializing Pyodide runtime...");
            const pyodide = await window.loadPyodide();
            addLog("Python WASM loaded successfully");
            
            addLog("Loading NumPy package...");
            await pyodide.loadPackage("numpy");
            addLog("NumPy library loaded");
            
            window.pyodide = pyodide;
            setPythonStatus('ready');
            addLog("Kernel ready for execution");
        } catch (e: any) {
            console.error("Failed to load Python:", e);
            setPythonStatus('error');
            addLog(`Critical Error: ${e.message}`);
        }
    };
    
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        if (window.loadPyodide) {
            clearInterval(interval);
            initPython();
        } else if (attempts > 20) {
            clearInterval(interval);
            setPythonStatus('error');
            addLog("Timeout: Pyodide script failed to load from CDN");
        }
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
      const el = document.getElementById('log-end');
      if (el && showLogs) el.scrollIntoView({ behavior: 'smooth' });
  }, [pythonLogs, showLogs]);

  // Handle Scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- PYTHON INTEGRATION LOGIC ---
  
  // 1. Run Forecast Model (with Scenario Analysis)
  useEffect(() => {
    const runForecast = async () => {
        if (pythonStatus === 'ready' && window.pyodide) {
            try {
                addLog(`Starting forecast job for ${forecastMetric} (Sensitivity: ±${forecastSensitivity}%)...`);
                const script = `
import numpy as np
import json

data = ${JSON.stringify(data)}
metric = "${forecastMetric}"
horizon = ${forecastHorizon}
sensitivity = ${forecastSensitivity} / 100.0

years = [float(d['Year']) for d in data]
values = [float(d[metric]) for d in data if metric in d]

if len(values) > 1:
    coef = np.polyfit(years, values, 1)
    slope, intercept = coef

    last_year = int(years[-1])
    future_years = list(range(last_year + 1, last_year + horizon + 1))
    
    # Base Forecast
    predictions = [slope * y + intercept for y in future_years]
    
    # Scenario Analysis (Bull/Bear)
    predictions_high = []
    predictions_low = []
    
    for i, pred in enumerate(predictions):
        # Uncertainty grows over time (widening cone)
        # At horizon, spread is full sensitivity
        ratio = (i + 1) / len(predictions)
        current_spread_pct = sensitivity * ratio 
        
        high = pred * (1 + current_spread_pct)
        low = pred * (1 - current_spread_pct)
        predictions_high.append(int(high))
        predictions_low.append(int(low))
    
    result = {
        "success": True,
        "future": [
            {"Year": y, "Forecast": int(p), "High": h, "Low": l} 
            for y, p, h, l in zip(future_years, predictions, predictions_high, predictions_low)
        ]
    }
else:
    result = {"success": False, "error": "Insufficient data"}

json.dumps(result)
`;
                const rawOutput = await window.pyodide.runPythonAsync(script);
                const output = JSON.parse(rawOutput);
                
                if (output.success) {
                    const lastYear = data[data.length - 1].Year;
                    const lastVal = data[data.length - 1][forecastMetric];
                    
                    const merged = [
                        ...data.map(d => ({ 
                            Year: d.Year, 
                            Historical: d[forecastMetric], 
                            Forecast: null, 
                            High: null, 
                            Low: null,
                            Confidence: null 
                        })),
                        { 
                            Year: lastYear, 
                            Historical: lastVal, 
                            Forecast: lastVal, 
                            High: lastVal, 
                            Low: lastVal,
                            Confidence: [lastVal, lastVal] 
                        }, 
                        ...output.future.map((p: any) => ({ 
                            Year: p.Year, 
                            Historical: null, 
                            Forecast: p.Forecast, 
                            High: p.High, 
                            Low: p.Low,
                            Confidence: [p.Low, p.High] // Range Tuple for Area Chart
                        }))
                    ];
                    setForecastData(merged);
                    setComputeSource('Python/NumPy');
                    addLog("Forecast & Scenario Analysis completed via NumPy");
                }
            } catch (e: any) {
                console.error("Python Forecast Error:", e);
                addLog(`Execution Error: ${e.message}. Switching to Fallback.`);
                runJSForecast();
            }
        } else {
            if (pythonStatus !== 'loading') {
                 if (pythonStatus === 'error') addLog("Kernel unavailable. Running JS Fallback.");
                 runJSForecast();
            }
        }
    };
    
    const runJSForecast = () => {
        const n = data.length;
        const x = data.map(d => d.Year);
        const y = data.map(d => d[forecastMetric] as number);
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumXX = x.reduce((a, b) => a + b * b, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const futurePoints = [];
        const lastYear = x[x.length - 1];
        
        for (let i = 1; i <= forecastHorizon; i++) {
            const year = lastYear + i;
            const val = slope * year + intercept;
            
            // Widening spread logic for JS fallback
            const ratio = i / forecastHorizon;
            const currentSpreadPct = (forecastSensitivity / 100) * ratio;
            
            const high = val * (1 + currentSpreadPct);
            const low = val * (1 - currentSpreadPct);
            
            futurePoints.push({ 
                Year: year, 
                Forecast: Math.round(val),
                High: Math.round(high),
                Low: Math.round(low)
            });
        }

        const lastVal = data[data.length-1][forecastMetric];
        const chartData = [
            ...data.map(d => ({ 
                Year: d.Year, 
                Historical: d[forecastMetric], 
                Forecast: null, 
                High: null, 
                Low: null,
                Confidence: null
            })),
            { 
                Year: lastYear, 
                Historical: lastVal, 
                Forecast: lastVal, 
                High: lastVal, 
                Low: lastVal,
                Confidence: [lastVal, lastVal] 
            }, 
            ...futurePoints.map(p => ({ 
                Year: p.Year, 
                Historical: null, 
                Forecast: p.Forecast, 
                High: p.High, 
                Low: p.Low,
                Confidence: [p.Low, p.High] 
            }))
        ];
        setForecastData(chartData);
        setComputeSource('JS Fallback');
    };

    const timeout = setTimeout(runForecast, 200);
    return () => clearTimeout(timeout);

  }, [data, forecastMetric, forecastHorizon, forecastSensitivity, pythonStatus]);


  // 2. Run Valuation Model (DCF)
  useEffect(() => {
      const runValuation = async () => {
          if (pythonStatus === 'ready' && window.pyodide) {
              try {
                  addLog("Starting DCF valuation job...");
                  const script = `
import numpy as np
import json

data = ${JSON.stringify(data)}
wacc = ${wacc} / 100.0
term_growth = ${termGrowth} / 100.0
net_debt = ${netDebt}
shares = ${shares}

years = [float(d['Year']) for d in data]
fcf = [float(d.get('Free Cash Flow', 0)) for d in data]

if len(fcf) > 1:
    coef = np.polyfit(years, fcf, 1)
    slope, intercept = coef
    last_year = int(years[-1])
    
    future_fcf = []
    discounted_sum = 0
    
    for i in range(1, 6):
        proj_fcf = slope * (last_year + i) + intercept
        future_fcf.append(proj_fcf)
        discounted_sum += proj_fcf / ((1 + wacc) ** i)
        
    if wacc > term_growth:
        terminal_value = (future_fcf[-1] * (1 + term_growth)) / (wacc - term_growth)
    else:
        terminal_value = future_fcf[-1] * 15 
        
    discounted_tv = terminal_value / ((1 + wacc) ** 5)
    
    enterprise_value = discounted_sum + discounted_tv
    equity_value = enterprise_value - net_debt
    share_price = equity_value / shares if shares > 0 else 0
    
    result = {
        "success": True,
        "sharePrice": share_price,
        "sumFCF": discounted_sum,
        "terminalValue": discounted_tv,
        "enterpriseValue": enterprise_value
    }
else:
    result = {"success": False, "error": "Insufficient data"}

json.dumps(result)
`;
                const rawOutput = await window.pyodide.runPythonAsync(script);
                const output = JSON.parse(rawOutput);
                
                if (output.success) {
                    setValuationResult({
                        sharePrice: output.sharePrice,
                        waterfall: [
                            { 
                                name: 'Sum of FCFs', 
                                value: Math.round(output.sumFCF),
                                contribution: ((output.sumFCF / output.enterpriseValue) * 100).toFixed(1)
                            },
                            { 
                                name: 'Terminal Value', 
                                value: Math.round(output.terminalValue),
                                contribution: ((output.terminalValue / output.enterpriseValue) * 100).toFixed(1)
                            },
                            { 
                                name: 'Enterprise Value', 
                                value: Math.round(output.enterpriseValue), 
                                isTotal: true,
                                contribution: '100.0'
                            }
                        ]
                    });
                    setValuationSource('Python/NumPy');
                    addLog("DCF Valuation completed via NumPy");
                }
              } catch (e: any) {
                  console.error("Python Valuation Error:", e);
                  addLog(`Valuation Error: ${e.message}. Switching to JS Fallback.`);
                  runJSValuation();
              }
          } else {
               if (pythonStatus !== 'loading') {
                   runJSValuation();
               }
          }
      };

      const runJSValuation = () => {
          if (!data.length) return;
          
          const n = data.length;
          const x = data.map(d => d.Year);
          const y = data.map(d => d['Free Cash Flow']);
          const sumX = x.reduce((a, b) => a + b, 0);
          const sumY = y.reduce((a, b) => a + b, 0);
          const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
          const sumXX = x.reduce((a, b) => a + b * b, 0);
          const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
          const intercept = (sumY - slope * sumX) / n;

          const lastYear = x[x.length - 1];
          let futureFCFs = [];
          let discountedSum = 0;
          const r = wacc / 100;
          const g = termGrowth / 100;

          for (let i = 1; i <= 5; i++) {
              const fcf = slope * (lastYear + i) + intercept;
              futureFCFs.push(fcf);
              discountedSum += fcf / Math.pow(1 + r, i);
          }

          let terminalValue = 0;
          if (r > g) {
              terminalValue = (futureFCFs[4] * (1 + g)) / (r - g);
          } else {
              terminalValue = futureFCFs[4] * 15; 
          }
          
          const discountedTV = terminalValue / Math.pow(1 + r, 5);
          const enterpriseValue = discountedSum + discountedTV;
          const equityValue = enterpriseValue - netDebt;
          const sharePrice = equityValue / shares;

          setValuationResult({
            sharePrice,
            waterfall: [
                { 
                  name: 'Sum of FCFs', 
                  value: Math.round(discountedSum),
                  contribution: ((discountedSum / enterpriseValue) * 100).toFixed(1)
                },
                { 
                  name: 'Terminal Value', 
                  value: Math.round(discountedTV),
                  contribution: ((discountedTV / enterpriseValue) * 100).toFixed(1)
                },
                { 
                  name: 'Enterprise Value', 
                  value: Math.round(enterpriseValue), 
                  isTotal: true,
                  contribution: '100.0'
                }
            ]
        });
        setValuationSource('JS Fallback');
      };

      const timeout = setTimeout(runValuation, 250); 
      return () => clearTimeout(timeout);

  }, [data, wacc, termGrowth, netDebt, shares, pythonStatus]);


  // --- CALCULATIONS (JS for Instant Feedback) ---

  // 1. Market Metrics
  const marketMetrics = useMemo(() => {
    if (!data.length) return { roe: '0%', rateBase: '$0', avgRev: '$0', maxRev: '$0' };
    const avgEquity = data.reduce((acc, curr) => acc + (curr['Free Cash Flow'] || 0), 0) / data.length * 5; 
    const avgNetIncome = data.reduce((acc, curr) => acc + (curr['Net Income'] || 0), 0) / data.length;
    const roe = avgEquity ? (avgNetIncome / avgEquity) * 100 : 0;
    
    return {
      roe: roe.toFixed(2) + '%',
      rateBase: '$' + (avgEquity * 1.5).toLocaleString(undefined, { maximumFractionDigits: 0 }),
      avgRev: '$' + (data.reduce((acc, c) => acc + (c.Revenue || 0), 0) / data.length).toLocaleString(undefined, { maximumFractionDigits: 0 }),
      maxRev: '$' + Math.max(...data.map(d => d.Revenue || 0)).toLocaleString()
    };
  }, [data]);

  // 2. Sensitivity Heatmap
  const sensitivityData = useMemo(() => {
    const revChanges = [0.9, 0.95, 1.0, 1.05, 1.1];
    const costChanges = [0.9, 0.95, 1.0, 1.05, 1.1];
    const grid = [];
    for (let r of revChanges) {
        const row = [];
        for (let c in costChanges) {
             const costMult = costChanges[c];
             const profit = (baseRev * r) - (baseCost * costMult);
             row.push(profit);
        }
        grid.push(row);
    }
    return grid; 
  }, [baseRev, baseCost]);

  // --- HANDLERS ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              const text = e.target?.result as string;
              try {
                  const parsed = parseCSV(text);
                  if (parsed.length > 0) {
                    setData(parsed);
                    setBaseRev(parsed[parsed.length-1].Revenue);
                    
                    // DATA INTEGRITY CHECK
                    addLog("--------------------------------");
                    addLog(`Initiating Data Integrity Scan on ${file.name}...`);
                    let integrityScore = 100;
                    const checkCols = ['Revenue', 'Net Income'];
                    let nullCount = 0;
                    
                    parsed.forEach((row, idx) => {
                        checkCols.forEach(col => {
                            if (row[col] === undefined || row[col] === null || isNaN(row[col])) {
                                nullCount++;
                                integrityScore -= 5;
                                addLog(`Integrity Warn: Null value in row ${idx+1}, col ${col}`);
                            }
                        });
                        if (row['Year'] < 2000 || row['Year'] > 2030) {
                             addLog(`Integrity Note: Unusual Fiscal Year detected: ${row['Year']}`);
                        }
                    });
                    
                    if (integrityScore === 100) {
                         addLog("Data Quality: EXCELLENT (No anomalies detected)");
                    } else {
                         addLog(`Data Quality: WARNING (Score: ${integrityScore}%)`);
                    }
                    addLog(`${parsed.length} records successfully indexed.`);
                    addLog("--------------------------------");
                  }
              } catch (err) {
                  console.error("CSV Parse Error", err);
                  addLog("Error parsing CSV file");
              }
          };
          reader.readAsText(file);
      }
  };

  const handleExcelExport = () => {
      if (!window.XLSX) {
          alert("Excel generator is still loading. Please wait.");
          return;
      }
      
      const wb = window.XLSX.utils.book_new();

      // --- SHEET 1: EXECUTIVE SUMMARY ---
      const summaryData = [
          ["FINANCIAL INTELLIGENCE REPORT"],
          ["Generated by FinMetrics"],
          ["Date", new Date().toLocaleDateString()],
          [],
          ["KEY METRICS"],
          ["Implied ROE", marketMetrics.roe],
          ["Estimated Rate Base", marketMetrics.rateBase],
          ["Peak Revenue", marketMetrics.maxRev],
          ["Fair Value per Share", `$${valuationResult.sharePrice.toFixed(2)}`]
      ];
      const wsSummary = window.XLSX.utils.aoa_to_sheet(summaryData);
      window.XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");

      // --- SHEET 2: HISTORICAL DATA ---
      const wsData = window.XLSX.utils.json_to_sheet(data);
      window.XLSX.utils.book_append_sheet(wb, wsData, "Historical Data");

      // --- SHEET 3: FORECAST ---
      // Flatten forecast data for Excel
      const flatForecast = forecastData.map(item => ({
          Year: item.Year,
          Historical: item.Historical || "",
          Forecast: item.Forecast || "",
          Optimistic_High: item.High || "",
          Pessimistic_Low: item.Low || ""
      }));
      const wsForecast = window.XLSX.utils.json_to_sheet(flatForecast);
      window.XLSX.utils.book_append_sheet(wb, wsForecast, "Neural Forecast");

      // --- SHEET 4: VALUATION MODEL ---
      const valData = [
          ["DCF VALUATION MODEL"],
          [],
          ["ASSUMPTIONS"],
          ["WACC", `${wacc}%`],
          ["Terminal Growth", `${termGrowth}%`],
          ["Net Debt", `$${netDebt}M`],
          ["Shares Outstanding", `${shares}M`],
          [],
          ["OUTPUTS"],
          ["Sum of FCFs (PV)", Math.round(valuationResult.waterfall[0].value)],
          ["Terminal Value (PV)", Math.round(valuationResult.waterfall[1].value)],
          ["Enterprise Value", Math.round(valuationResult.waterfall[2].value)],
          ["Equity Value", Math.round(valuationResult.waterfall[2].value - netDebt)],
          ["Implied Share Price", valuationResult.sharePrice.toFixed(2)]
      ];
      const wsVal = window.XLSX.utils.aoa_to_sheet(valData);
      window.XLSX.utils.book_append_sheet(wb, wsVal, "Valuation Detail");

      // Export
      window.XLSX.writeFile(wb, "FinMetrics_Report.xlsx");
      addLog("Excel Report generated successfully");
  };

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white font-sans pb-12">
      
      <SystemConsole logs={pythonLogs} status={pythonStatus} expanded={showLogs} setExpanded={setShowLogs} />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4 border-b border-stone-100' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center shadow-none">
                 <div className="text-white font-serif font-bold text-sm">FM</div>
            </div>
            <span className={`font-serif font-bold text-lg tracking-wide ${scrolled ? 'text-black' : 'text-black'}`}>
              FIN<span className="font-light text-stone-500">METRICS</span>
            </span>
          </div>
          
          <div className="hidden xl:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-stone-500">
            <button onClick={() => setActiveTab('market')} className={`hover:text-black transition-colors ${activeTab === 'market' ? 'text-black border-b border-black pb-1' : ''}`}>Market Vision</button>
            <button onClick={() => setActiveTab('forecast')} className={`hover:text-black transition-colors ${activeTab === 'forecast' ? 'text-black border-b border-black pb-1' : ''}`}>Neural Forecast</button>
            <button onClick={() => setActiveTab('risk')} className={`hover:text-black transition-colors ${activeTab === 'risk' ? 'text-black border-b border-black pb-1' : ''}`}>Risk Control</button>
            <button onClick={() => setActiveTab('valuation')} className={`hover:text-black transition-colors ${activeTab === 'valuation' ? 'text-black border-b border-black pb-1' : ''}`}>Valuation</button>
          </div>

          <div className="flex gap-3">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex items-center gap-2 bg-white">
                <Upload size={14} /> Upload Data
              </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-[80vh] md:min-h-[800px] pt-32 flex flex-col items-center justify-center overflow-hidden bg-white">
        <HeroScene />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.0)_0%,rgba(255,255,255,1)_70%)]" />

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-2 mb-6 px-4 py-1 border border-black text-black text-xs tracking-[0.2em] uppercase font-bold rounded-full bg-white cursor-pointer hover:bg-stone-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
            onClick={() => setShowLogs(!showLogs)}
          >
            {pythonStatus === 'loading' && (
                <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Initializing Python Engine...
                </>
            )}
            {pythonStatus === 'ready' && (
                <>
                    <div className="w-2 h-2 rounded-full bg-black animate-pulse"></div> Python Engine Online
                </>
            )}
            {pythonStatus === 'error' && (
                <>
                    <div className="w-2 h-2 rounded-full bg-stone-400"></div> Engine Offline
                </>
            )}
          </motion.div>
          
          <h1 className="font-serif text-6xl md:text-8xl font-medium leading-tight mb-8 text-black">
            Financial Intelligence <br/><span className="italic font-normal text-stone-500 text-4xl md:text-6xl block mt-4">Redefined for the Modern Era</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-stone-600 font-light leading-relaxed mb-12">
            Automated valuation models, neural forecasting, and variance control systems powered by an integrated Python runtime.
          </p>
          
          <button onClick={() => document.getElementById('dashboard')?.scrollIntoView({behavior: 'smooth'})} className="group flex flex-col items-center gap-2 text-sm font-medium text-black hover:text-stone-600 transition-colors cursor-pointer mx-auto">
              <span>INITIALIZE DASHBOARD</span>
              <span className="p-2 border border-black rounded-full group-hover:bg-black group-hover:text-white transition-colors bg-white">
                  <ArrowDown size={16} />
              </span>
          </button>
        </div>
      </header>

      <main id="dashboard" className="bg-white min-h-screen py-24 relative z-10">
        <div className="container mx-auto px-6">
            
            {/* TABS */}
            <div className="flex flex-wrap justify-center gap-4 mb-20 border-b border-stone-200 pb-8">
                 {[
                    {id: 'market', icon: Activity, label: 'Market Vision'},
                    {id: 'forecast', icon: TrendingUp, label: 'Neural Forecast'},
                    {id: 'risk', icon: AlertTriangle, label: 'Risk Control'},
                    {id: 'valuation', icon: DollarSign, label: 'Valuation Model'},
                 ].map((tab) => (
                     <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-none transition-all duration-300 border ${activeTab === tab.id ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                     >
                        <tab.icon size={18} />
                        <span className="font-serif text-lg tracking-wide">{tab.label}</span>
                     </button>
                 ))}
            </div>

            {/* CONTENT AREA */}
            <div className="min-h-[600px]">
                <AnimatePresence mode="wait">
                    
                    {/* TAB 1: MARKET VISION */}
                    {activeTab === 'market' && (
                        <motion.div 
                            key="market" 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <SectionHeading title="Descriptive Analytics" subtitle="Market Vision" />
                            
                            <ToolDescription 
                                context="This module visualizes historical financial data to identify core performance trends. It processes your uploaded datasets (CSV) to extract key metrics like Revenue, Net Income, and ROE." 
                                utility="For analysts, establishing a baseline of past performance is critical before modeling future scenarios. The 'Revenue Trajectory' chart specifically highlights growth patterns or cyclicality, providing an instant health-check of the entity." 
                            />

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                                <MetricCard title="Implied ROE" value={marketMetrics.roe} subtext="Return on Equity" delay="0s" />
                                <MetricCard title="Rate Base (Est)" value={marketMetrics.rateBase} subtext="Regulatory Asset Value" delay="0.1s" />
                                <MetricCard title="Avg Revenue" value={marketMetrics.avgRev} subtext="Historical Mean" delay="0.2s" />
                                <MetricCard title="Peak Revenue" value={marketMetrics.maxRev} subtext="Historical High" delay="0.3s" />
                            </div>

                            <div className="bg-white rounded-none border border-stone-200 p-10 shadow-none">
                                <div className="flex justify-between items-center mb-8 border-b border-stone-100 pb-6">
                                    <h3 className="font-serif text-3xl text-black">Revenue Trajectory</h3>
                                    <div className="px-4 py-1 bg-black text-white rounded-none text-xs font-bold uppercase tracking-widest">Year-over-Year</div>
                                </div>
                                <MarketTrendChart data={data} dataKey="Revenue" />
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 2: NEURAL FORECAST */}
                    {activeTab === 'forecast' && (
                        <motion.div 
                            key="forecast"
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <SectionHeading title="Predictive Intelligence" subtitle="Machine Learning" />
                            
                            <ToolDescription 
                                context="The engine projects future financial metrics by executing linear regression algorithms directly within your browser. It now includes Scenario Analysis to model 'Bull' and 'Bear' cases." 
                                utility="Essential for FP&A teams to set forward-looking guidance. The 'Cone of Uncertainty' visualizes risk, demonstrating to stakeholders that the future is a range of possibilities, not a single number." 
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-black text-white p-8 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="font-serif text-2xl text-white">Configuration</h3>
                                            <div className={`text-[10px] px-2 py-px rounded-sm font-mono flex items-center gap-1 border ${pythonStatus === 'ready' ? 'bg-white text-black border-white' : 'bg-stone-800 text-stone-400 border-stone-700'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${pythonStatus === 'ready' ? 'bg-black animate-pulse' : 'bg-stone-500'}`} />
                                                {pythonStatus === 'ready' ? 'KERNEL ACTIVE' : 'OFFLINE'}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-8">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Target Metric</label>
                                                <div className="relative">
                                                    <select 
                                                        value={forecastMetric} 
                                                        onChange={(e) => setForecastMetric(e.target.value)}
                                                        className="w-full bg-black border border-stone-800 text-white rounded-none px-4 py-3 pr-10 focus:outline-none focus:border-white transition-colors appearance-none"
                                                    >
                                                        <option value="Revenue">Revenue</option>
                                                        <option value="Net Income">Net Income</option>
                                                        <option value="Free Cash Flow">Free Cash Flow</option>
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
                                                        <ChevronDown size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Forecast Horizon</label>
                                                <div className="relative pt-2">
                                                    <input 
                                                        type="range" 
                                                        min="1" max="10" 
                                                        value={forecastHorizon} 
                                                        onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
                                                        style={{ accentColor: 'white' }}
                                                        className="w-full h-1 bg-stone-800 rounded-none appearance-none cursor-pointer focus:outline-none focus:ring-0"
                                                    />
                                                </div>
                                                <div className="text-right text-white font-mono mt-2 border-b border-stone-800 inline-block float-right pb-1 text-sm">{forecastHorizon} Years</div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Scenario Sensitivity (Risk)</label>
                                                <div className="relative pt-2">
                                                    <input 
                                                        type="range" 
                                                        min="5" max="30" step="5"
                                                        value={forecastSensitivity} 
                                                        onChange={(e) => setForecastSensitivity(parseInt(e.target.value))}
                                                        style={{ accentColor: 'white' }}
                                                        className="w-full h-1 bg-stone-800 rounded-none appearance-none cursor-pointer focus:outline-none focus:ring-0"
                                                    />
                                                </div>
                                                <div className="text-right text-white font-mono mt-2 border-b border-stone-800 inline-block float-right pb-1 text-sm">±{forecastSensitivity}% Spread</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 bg-stone-50 border border-stone-200 rounded-none">
                                        <p className="text-sm text-stone-600 italic leading-relaxed mb-4">
                                            "The engine utilizes {pythonStatus === 'ready' ? 'NumPy (Python)' : 'Linear Regression'} to project future performance trends. The shaded region represents the Confidence Interval based on your sensitivity input."
                                        </p>
                                        {pythonStatus === 'loading' && (
                                            <div className="flex items-center gap-2 text-xs text-stone-400">
                                                <Loader2 className="animate-spin" size={12} /> Booting Python Environment...
                                            </div>
                                        )}
                                         <button 
                                            onClick={() => setShowLogs(true)} 
                                            className="text-xs text-black underline hover:text-stone-600 flex items-center gap-1 mt-2 font-bold uppercase tracking-wider"
                                        >
                                            <Terminal size={10} /> View Execution Logs
                                        </button>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 bg-white border border-stone-200 rounded-none p-10 shadow-none flex flex-col">
                                    <div className="flex justify-between items-start mb-8">
                                        <h3 className="font-serif text-3xl text-black">Scenario Analysis</h3>
                                        {computeSource && (
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${computeSource.includes('Python') ? 'bg-black text-white border-black' : 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                                                {computeSource.includes('Python') ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                                                Powered by {computeSource}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {forecastData.length > 0 ? (
                                        <ForecastChart data={forecastData} targetCol={forecastMetric} />
                                    ) : (
                                        <div className="h-72 flex items-center justify-center text-stone-300 font-mono text-xs uppercase tracking-widest">Initializing Model...</div>
                                    )}
                                    <div className="mt-8 flex justify-center gap-8 text-xs font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-none bg-black"></div> Historical</div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-stone-400 bg-stone-100"></div> Forecast</div>
                                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-none bg-stone-200"></div> Uncertainty Cone</div>
                                    </div>

                                    <StrategicInsight metric={forecastMetric} data={forecastData} horizon={forecastHorizon} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 3: RISK & VARIANCE */}
                    {activeTab === 'risk' && (
                        <motion.div 
                            key="risk"
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <SectionHeading title="Operational Stability" subtitle="Risk & Variance" />

                            <ToolDescription 
                                context="Quantifies operational volatility through Budget vs. Actuals analysis and multivariate sensitivity testing. It detects where the organization has deviated from its financial plan." 
                                utility="CFOs and Controllers use this module to stress-test the P&L against market shocks. The Sensitivity Matrix visualizes how simultaneous changes in Revenue and Cost assumptions impact Net Income, highlighting the 'break-even' zones." 
                            />
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Variance Chart */}
                                <div className="bg-white border border-stone-200 rounded-none p-10">
                                    <h3 className="font-serif text-2xl text-black mb-2">Budget Variance Analysis</h3>
                                    <p className="text-xs text-stone-400 uppercase tracking-widest mb-8">Actuals vs Budget (Gray = Unfavorable)</p>
                                    
                                    <VarianceChart 
                                        data={data.map(d => ({ Year: d.Year, Variance: (d.Revenue || 0) - (d.Budget || 0) }))} 
                                        metric="Revenue" 
                                    />
                                </div>

                                {/* Sensitivity Matrix */}
                                <div className="bg-black rounded-none p-10 text-white shadow-none border border-black">
                                    <h3 className="font-serif text-2xl text-white mb-2">Sensitivity Matrix</h3>
                                    <p className="text-xs text-stone-500 uppercase tracking-widest mb-8">Net Income Impact (Rev vs Cost)</p>
                                    
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between text-xs text-stone-500 font-mono uppercase tracking-widest">
                                            <span>COST SCENARIO →</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-5 gap-1">
                                            {sensitivityData.flat().map((val, i) => {
                                                 // Grayscale heat coloring logic
                                                 const maxVal = Math.max(...sensitivityData.flat());
                                                 const minVal = Math.min(...sensitivityData.flat());
                                                 const normalized = (val - minVal) / (maxVal - minVal);
                                                 // 0 = Dark Gray, 1 = White
                                                 const lightness = 20 + (normalized * 80);
                                                 
                                                 return (
                                                    <div 
                                                        key={i} 
                                                        className="aspect-square flex items-center justify-center text-[10px] font-bold text-black transition-transform hover:scale-105 cursor-default border border-black/10"
                                                        style={{ backgroundColor: `hsl(0, 0%, ${lightness}%)`, color: lightness < 50 ? 'white' : 'black' }}
                                                        title={`Profit: $${val.toLocaleString()}`}
                                                    >
                                                        {(val/1000).toFixed(0)}k
                                                    </div>
                                                 )
                                            })}
                                        </div>
                                        
                                        <div className="flex justify-between text-xs text-stone-500 mt-2 font-mono">
                                            <span>-10%</span>
                                            <span>BASE</span>
                                            <span>+10%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TAB 4: VALUATION */}
                    {activeTab === 'valuation' && (
                        <motion.div 
                            key="valuation"
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                             <SectionHeading title="Intrinsic Valuation" subtitle="DCF Model" />

                             <ToolDescription 
                                context="Determines the intrinsic enterprise value of the entity using a 2-Stage Discounted Cash Flow (DCF) model. It projects Free Cash Flows into the future and discounts them back to present value using the Weighted Average Cost of Capital (WACC)." 
                                utility="Investment bankers and Equity Researchers rely on this to justify target share prices. The 'Valuation Bridge' visualizes how much of the company's value is derived from near-term cash flows versus the long-term Terminal Value." 
                            />

                             <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                {/* Controls */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-white border border-stone-200 rounded-none p-8 shadow-none">
                                        <div className="flex justify-between items-start mb-6">
                                            <h3 className="font-serif text-xl text-black">Model Assumptions</h3>
                                            {valuationSource && (
                                                <div className={`flex items-center gap-2 px-2 py-0.5 rounded-sm text-[10px] font-bold border ${valuationSource.includes('Python') ? 'bg-black text-white border-black' : 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                                                    {valuationSource.includes('Python') ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                                                    {valuationSource === 'Python/NumPy' ? 'NUMPY ENGINE' : 'JS FALLBACK'}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-5">
                                            <div>
                                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">WACC (%)</label>
                                                <input 
                                                    type="number" 
                                                    value={wacc} 
                                                    onChange={e => setWacc(Number(e.target.value))} 
                                                    className="w-full mt-2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-none font-mono text-sm text-black focus:outline-none focus:ring-0 focus:border-black transition-all placeholder-stone-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Terminal Growth (%)</label>
                                                <input 
                                                    type="number" 
                                                    value={termGrowth} 
                                                    onChange={e => setTermGrowth(Number(e.target.value))} 
                                                    className="w-full mt-2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-none font-mono text-sm text-black focus:outline-none focus:ring-0 focus:border-black transition-all placeholder-stone-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Net Debt ($M)</label>
                                                <input 
                                                    type="number" 
                                                    value={netDebt} 
                                                    onChange={e => setNetDebt(Number(e.target.value))} 
                                                    className="w-full mt-2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-none font-mono text-sm text-black focus:outline-none focus:ring-0 focus:border-black transition-all placeholder-stone-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Shares Outstanding (M)</label>
                                                <input 
                                                    type="number" 
                                                    value={shares} 
                                                    onChange={e => setShares(Number(e.target.value))} 
                                                    className="w-full mt-2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-none font-mono text-sm text-black focus:outline-none focus:ring-0 focus:border-black transition-all placeholder-stone-400"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black border border-black rounded-none p-8 text-center">
                                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Fair Value per Share</p>
                                        <div className="font-serif text-5xl text-white">${valuationResult.sharePrice.toFixed(2)}</div>
                                    </div>
                                </div>

                                {/* Visualization */}
                                <div className="lg:col-span-8">
                                     <div className="bg-white rounded-none p-10 border border-stone-200 text-black h-full relative">
                                        <h3 className="font-serif text-3xl text-black mb-2">Valuation Bridge</h3>
                                        <p className="text-xs text-stone-400 uppercase tracking-widest mb-8">Contribution to Enterprise Value</p>
                                        <WaterfallChart data={valuationResult.waterfall} />
                                     </div>
                                </div>
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Export CTA */}
            <div className="mt-24 border-t border-stone-200 pt-12 text-center">
                 <h4 className="font-serif text-3xl text-black mb-4">Ready to finalize?</h4>
                 <button 
                    onClick={handleExcelExport}
                    className="px-8 py-4 bg-black text-white rounded-none hover:bg-stone-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] inline-flex items-center gap-3 uppercase font-bold tracking-widest text-xs"
                 >
                    <FileSpreadsheet size={16} /> Generate Excel Report
                 </button>
            </div>

        </div>
      </main>

      <footer className="bg-black text-stone-500 py-16 border-t border-stone-900">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
                <div className="text-white font-serif font-bold text-2xl mb-2">Model Dashboard</div>
                <p className="text-sm">Powered by Gemini</p>
            </div>
            <div className="text-xs font-mono text-stone-600">
                SYSTEM VERSION 1.1 • {pythonStatus === 'ready' ? 'PYTHON KERNEL ACTIVE' : 'KERNEL LOADING'}
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;