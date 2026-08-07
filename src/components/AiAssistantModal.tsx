import React, { useState } from 'react';
import { X, Sparkles, Check, RefreshCw, Wand2 } from 'lucide-react';
import { getApiBaseUrl } from '../config/microserviceConfig';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
  docType: string;
  onApplyText: (newTextHtml: string) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentContent,
  docType,
  onApplyText
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultText, setResultText] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/ai-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || `Составь грамотный текст для официального документа типа "${docType}"`,
          currentContent: currentContent.replace(/<[^>]+>/g, ''),
          docType
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResultText(data.text);
      } else {
        // Fallback generator if server API is offline or key not provided
        generateFallbackText();
      }
    } catch {
      generateFallbackText();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackText = () => {
    const rawPrompt = prompt.toLowerCase();
    let text = '';

    if (rawPrompt.includes('закупк') || rawPrompt.includes('оборуд')) {
      text = `<p>Настоящим доводят до Вашего сведения необходимость обновления материально-технической базы организации в связи с плановым расширением производственных мощностей.</p>
<p>Просим Вас согласовать закупку специализированного оборудования и выделить необходимые финансовые средства согласно приложенной смете.</p>`;
    } else if (rawPrompt.includes('отпуск') || rawPrompt.includes('заявлен')) {
      text = `<p>Прошу предоставить мне ежегодный оплачиваемый отпуск продолжительностью 14 календарных дней в соответствии с утвержденным графиком отпусков.</p>`;
    } else {
      text = `<p>Довожу до Вашего сведения информацию касательно функционирования профильного подразделения организации. В рамках выполнения поставленных задач просим рассмотреть данные предложения по оптимизации процессов.</p>
<p>Гарантируем соблюдение установленных сроков и стандартов качества при реализации вышеуказанных мероприятий.</p>`;
    }

    setResultText(text);
  };

  const handleApply = () => {
    if (resultText) {
      onApplyText(resultText);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white text-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">ИИ-Помощник делового стиля</h3>
              <p className="text-[11px] text-slate-500">Генерация и улучшение текста официальных бланков</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Что должен содержать документ? (Опишите тезисно)
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Например: Запросить 3 ноутбука для новых дизайнеров отдела маркетинга..."
              className="w-full text-xs p-3 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium uppercase tracking-wider rounded shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Составляю текст...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-amber-300" />
                Сформировать деловой текст
              </>
            )}
          </button>

          {resultText && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Результат генерации:</label>
              <div 
                className="p-3 bg-slate-50 border border-slate-200 rounded text-xs leading-relaxed text-slate-800 max-h-48 overflow-y-auto space-y-2"
                dangerouslySetInnerHTML={{ __html: resultText }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={!resultText}
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded shadow-xs transition-all"
          >
            <Check className="w-4 h-4" />
            Вставить в документ
          </button>
        </div>
      </div>
    </div>
  );
};
