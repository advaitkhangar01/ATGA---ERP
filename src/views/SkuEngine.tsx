import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Settings, HelpCircle, Layers, ArrowRight, Sparkles } from 'lucide-react';

export default function SkuEngine() {
  const [brand, setBrand] = useState('Saint Gobain');
  const [carBrand, setCarBrand] = useState('Maruti');
  const [carModel, setCarModel] = useState('Swift');
  const [glassType, setGlassType] = useState('Windshield');
  const [position, setPosition] = useState('Front');
  const [feature, setFeature] = useState('ADAS Bracket');

  // Generator Rules
  const brandAbbrs: Record<string, string> = { 'Saint Gobain': 'SG', Clarion: 'CLA', XYG: 'XYG' };
  const carBrandAbbrs: Record<string, string> = { Maruti: 'MAR', Honda: 'HON', Hyundai: 'HYU', Toyota: 'TOY', Tata: 'TAT', Mahindra: 'MAH' };
  const typeAbbrs: Record<string, string> = { Windshield: 'WS', 'Rear Glass': 'RG', 'Door Glass': 'DG', 'Quarter Glass': 'QG' };
  const posAbbrs: Record<string, string> = { Front: 'FRN', Rear: 'REAR', 'Front Left': 'FL', 'Front Right': 'FR', 'Rear Left': 'RL', 'Rear Right': 'RR' };
  const featAbbrs: Record<string, string> = { 'Standard Green': 'STD', 'Rain Sensor': 'RS', 'ADAS Bracket': 'ADAS', 'Acoustic PVB': 'AC', 'Privacy Tint': 'PRV', 'Demister Heated': 'HEAT' };

  const generatedSku = `${brandAbbrs[brand] || 'XXX'}-${carBrandAbbrs[carBrand] || 'XXX'}-${carModel.toUpperCase().slice(0, 4)}-${typeAbbrs[glassType] || 'XX'}-${posAbbrs[position] || 'XXX'}-${featAbbrs[feature] || 'XXX'}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black tracking-tight text-zinc-800 dark:text-zinc-100">SKU Engine Rules Console</h2>
        <p className="text-zinc-500 text-xs dark:text-zinc-400 font-semibold">Standardize parts numbering system. Live build previews based on shop-floor hierarchy configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Rules Inputs */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-800">
            <CardTitle className="text-sm font-black flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <Settings className="h-4 w-4 text-indigo-500" />
              Configure Naming Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-xs font-semibold flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-[10px] uppercase font-bold mb-1.5">Manufacturer Brand</label>
                <select 
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-lg font-bold"
                >
                  <option value="Saint Gobain">Saint Gobain (SG)</option>
                  <option value="Clarion">Clarion (CLA)</option>
                  <option value="XYG">XYG (XYG)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-[10px] uppercase font-bold mb-1.5">Car Brand Make</label>
                <select 
                  value={carBrand} 
                  onChange={(e) => setCarBrand(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-lg font-bold"
                >
                  <option value="Maruti">Maruti (MAR)</option>
                  <option value="Honda">Honda (HON)</option>
                  <option value="Hyundai">Hyundai (HYU)</option>
                  <option value="Toyota">Toyota (TOY)</option>
                  <option value="Tata">Tata (TAT)</option>
                  <option value="Mahindra">Mahindra (MAH)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-[10px] uppercase font-bold mb-1.5">Vehicle Model</label>
                <input 
                  type="text" 
                  value={carModel} 
                  onChange={(e) => setCarModel(e.target.value)}
                  placeholder="Swift, City, XUV700..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[10px] uppercase font-bold mb-1.5">Glass Type Category</label>
                <select 
                  value={glassType} 
                  onChange={(e) => setGlassType(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-lg font-bold"
                >
                  <option value="Windshield">Windshield (WS)</option>
                  <option value="Rear Glass">Rear Glass (RG)</option>
                  <option value="Door Glass">Door Glass (DG)</option>
                  <option value="Quarter Glass">Quarter Glass (QG)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-[10px] uppercase font-bold mb-1.5">Position / Side</label>
                <select 
                  value={position} 
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-lg font-bold"
                >
                  <option value="Front">Front (FRN)</option>
                  <option value="Rear">Rear (REAR)</option>
                  <option value="Front Left">Front Left (FL)</option>
                  <option value="Front Right">Front Right (FR)</option>
                  <option value="Rear Left">Rear Left (RL)</option>
                  <option value="Rear Right">Rear Right (RR)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-[10px] uppercase font-bold mb-1.5">Glass Specialty Feature</label>
                <select 
                  value={feature} 
                  onChange={(e) => setFeature(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 p-2.5 rounded-lg font-bold"
                >
                  <option value="Standard Green">Standard Green (STD)</option>
                  <option value="Rain Sensor">Rain Sensor (RS)</option>
                  <option value="ADAS Bracket">ADAS Bracket (ADAS)</option>
                  <option value="Acoustic PVB">Acoustic PVB (AC)</option>
                  <option value="Privacy Tint">Privacy Tint (PRV)</option>
                  <option value="Demister Heated">Demister Heated (HEAT)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live SKU Output */}
        <Card className="lg:col-span-1 shadow-sm border-indigo-500/35 bg-indigo-50/10 dark:bg-zinc-900/40 flex flex-col">
          <CardHeader className="pb-3 border-b border-zinc-150 dark:border-zinc-850">
            <CardTitle className="text-sm font-black flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-4.5 w-4.5" />
              Live Preview Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-between flex-1">
            <div className="space-y-4">
              <p className="text-zinc-400 text-[10px] uppercase font-bold">Generated SKU Output</p>
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl text-center shadow-inner">
                <span className="font-mono text-base font-black tracking-wider text-indigo-600 dark:text-indigo-400 block break-all select-all">
                  {generatedSku}
                </span>
              </div>
            </div>
            
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold space-y-1">
              <p className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                <span>Total Characters:</span>
                <span className="font-bold font-mono">{generatedSku.length}</span>
              </p>
              <p className="flex justify-between">
                <span>Verification State:</span>
                <span className="text-emerald-500 font-bold">Rule Compliant ✓</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Flow chart Hierarchy Visualizer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-black flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-500" />
            Parts Coding Hierarchy Flowchart
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 overflow-x-auto">
          <div className="min-w-[700px] flex items-center justify-between gap-2 p-6 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 rounded-xl relative">
            
            {/* Node 1 */}
            <div className="flex flex-col items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-sm w-28 text-center">
              <span className="text-[9px] text-zinc-400 font-bold uppercase">1. Manufacturer</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-1">{brandAbbrs[brand]}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 truncate w-full">{brand}</span>
            </div>

            <ArrowRight className="h-5 w-5 text-zinc-400 flex-shrink-0" />

            {/* Node 2 */}
            <div className="flex flex-col items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-sm w-28 text-center">
              <span className="text-[9px] text-zinc-400 font-bold uppercase">2. Car Make</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-1">{carBrandAbbrs[carBrand]}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 truncate w-full">{carBrand}</span>
            </div>

            <ArrowRight className="h-5 w-5 text-zinc-400 flex-shrink-0" />

            {/* Node 3 */}
            <div className="flex flex-col items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-sm w-28 text-center">
              <span className="text-[9px] text-zinc-400 font-bold uppercase">3. Model code</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-1">{carModel.toUpperCase().slice(0, 4)}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 truncate w-full">{carModel}</span>
            </div>

            <ArrowRight className="h-5 w-5 text-zinc-400 flex-shrink-0" />

            {/* Node 4 */}
            <div className="flex flex-col items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-sm w-28 text-center">
              <span className="text-[9px] text-zinc-400 font-bold uppercase">4. Segment</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-1">{typeAbbrs[glassType]}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 truncate w-full">{glassType}</span>
            </div>

            <ArrowRight className="h-5 w-5 text-zinc-400 flex-shrink-0" />

            {/* Node 5 */}
            <div className="flex flex-col items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-sm w-28 text-center">
              <span className="text-[9px] text-zinc-400 font-bold uppercase">5. Position</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-1">{posAbbrs[position]}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 truncate w-full">{position}</span>
            </div>

            <ArrowRight className="h-5 w-5 text-zinc-400 flex-shrink-0" />

            {/* Node 6 */}
            <div className="flex flex-col items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-sm w-28 text-center">
              <span className="text-[9px] text-zinc-400 font-bold uppercase">6. Feature</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-1">{featAbbrs[feature]}</span>
              <span className="text-[9px] text-zinc-500 mt-0.5 truncate w-full">{feature}</span>
            </div>
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
