import React from 'react';
import { DocumentPreset, DocumentData } from '../types';
import { PRESET_TEMPLATES } from '../constants/presets';
import { X, FileText, Check, Plus, Folder, Sparkles } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: DocumentPreset) => void;
  onNewBlank: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose, onSelectPreset, onNewBlank }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">Шаблоны официальных документов</h3>
              <p className="text-xs text-slate-500">Выберите готовый образец для быстрого заполнения бланка</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* New Blank Button */}
          <button
            type="button"
            onClick={() => {
              onNewBlank();
              onClose();
            }}
            className="w-full p-4 rounded border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50 transition-all flex items-center gap-3 group text-left"
          >
            <div className="w-9 h-9 rounded-sm bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">Создать чистый документ с нуля</h4>
              <p className="text-xs text-indigo-700">Пустой бланк без предварительного текста</p>
            </div>
          </button>

          {/* Preset Templates Grid */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Готовые образцы по ГОСТу</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESET_TEMPLATES.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className="p-4 rounded border border-slate-200 hover:border-indigo-500 bg-white hover:bg-slate-50 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-sm">
                        {preset.category}
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <h5 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {preset.title}
                    </h5>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {preset.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>{preset.data.docType}</span>
                    <span className="text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                      Использовать →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
