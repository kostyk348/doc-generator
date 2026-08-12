import React from 'react';
import { DocumentData } from '../types';
import { Type, Layout, Lock } from 'lucide-react';

interface StyleControlsProps {
  data: DocumentData;
  onChange: (data: DocumentData) => void;
  isAdmin?: boolean;
}

export const StyleControls: React.FC<StyleControlsProps> = ({ data, onChange, isAdmin }) => {
  if (!isAdmin) {
    return (
      <div className="bg-slate-900 text-white border border-slate-700 rounded-xl p-5 text-xs leading-relaxed flex items-start gap-3 shadow-md">
        <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-400">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-amber-300 uppercase tracking-wider block mb-1">
            Настройка шрифтов и полей недоступна
          </span>
          <p className="text-slate-300 text-[11.5px] leading-relaxed">
            Шрифт бланка и размеры ГОСТ-полей страницы А4 задаются централизованно Администратором.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Font Family Selector */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5">
          <div className="w-5 h-5 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Type className="w-3 h-3" />
          </div>
          <span>Шрифт и типографика бланка</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Гарнитура шрифта</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Times New Roman', font: 'Times New Roman' },
                { name: 'Arial (Без засечек)', font: 'Arial' },
                { name: 'Georgia (Элегантный)', font: 'Georgia' },
                { name: 'Calibri (Современный)', font: 'Calibri' }
              ].map((item) => (
                <button
                  key={item.font}
                  type="button"
                  onClick={() => onChange({ ...data, fontFamily: item.font as any })}
                  className={`p-2.5 rounded border text-xs text-left transition-all ${
                    data.fontFamily === item.font
                      ? 'border-indigo-600 bg-indigo-50/50 font-bold text-indigo-900 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                  style={{ fontFamily: item.font }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-700 mb-1">
              <span className="font-semibold">Размер кегля шрифта</span>
              <span className="font-bold">{data.fontSize} pt</span>
            </div>
            <input
              type="range"
              min={11}
              max={16}
              step={0.5}
              value={data.fontSize}
              onChange={(e) => onChange({ ...data, fontSize: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Line Spacing */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-700 mb-1">
              <span className="font-semibold">Межстрочный интервал</span>
              <span className="font-bold">{data.lineSpacing}x</span>
            </div>
            <input
              type="range"
              min={1.0}
              max={1.75}
              step={0.05}
              value={data.lineSpacing}
              onChange={(e) => onChange({ ...data, lineSpacing: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Page Margins (ГОСТ margins) */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5">
          <div className="w-5 h-5 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layout className="w-3 h-3" />
          </div>
          <span>Поля страницы A4 (мм)</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Верхнее поле</label>
            <input
              type="number"
              min={10}
              max={50}
              value={data.margins.top}
              onChange={(e) => onChange({ ...data, margins: { ...data.margins, top: Number(e.target.value) } })}
              className="w-full text-xs p-2 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Нижнее поле</label>
            <input
              type="number"
              min={10}
              max={50}
              value={data.margins.bottom}
              onChange={(e) => onChange({ ...data, margins: { ...data.margins, bottom: Number(e.target.value) } })}
              className="w-full text-xs p-2 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Левое поле (подшивка)</label>
            <input
              type="number"
              min={15}
              max={50}
              value={data.margins.left}
              onChange={(e) => onChange({ ...data, margins: { ...data.margins, left: Number(e.target.value) } })}
              className="w-full text-xs p-2 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Правое поле</label>
            <input
              type="number"
              min={10}
              max={40}
              value={data.margins.right}
              onChange={(e) => onChange({ ...data, margins: { ...data.margins, right: Number(e.target.value) } })}
              className="w-full text-xs p-2 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="pt-1">
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
            <span className="font-semibold text-slate-700">ГОСТ Р 7.0.97–2025 (до 10 лет):</span>
            <span className="font-mono text-[11px] font-bold text-slate-900">20 / 10 / 20 / 20 мм</span>
          </div>
        </div>
      </div>
    </div>
  );
};
