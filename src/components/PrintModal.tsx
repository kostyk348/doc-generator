import React, { useState, useEffect } from 'react';
import { DocumentData } from '../types';
import { generateMainDocumentPdfArrayBuffer } from '../utils/pdfMergeUtils';
import { triggerSystemPrint } from '../utils/printUtils';
import { Printer, ExternalLink, Download, X, Check, FileCheck, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  docData: DocumentData;
}

export const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, docData }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [printSuccess, setPrintSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handlePreparePdf();
    } else {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      setErrorMessage(null);
      setPrintSuccess(false);
    }
  }, [isOpen]);

  const handlePreparePdf = async () => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);

      const result = await generateMainDocumentPdfArrayBuffer(docData);
      if (!result) {
        throw new Error('Не удалось сформировать бланк. Убедитесь, что бланк отображен на экране.');
      }

      const blob = new Blob([result.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err: any) {
      console.error('Print PDF generation error:', err);
      setErrorMessage(err?.message || 'Ошибка при подготовке файла для печати.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTriggerDirectPrint = () => {
    const success = triggerSystemPrint(docData);
    if (success) {
      setPrintSuccess(true);
    }
  };

  const handleOpenPdfInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfBlobUrl) return;
    const cleanDocType = (docData.docType || 'Документ').trim().replace(/[\\/:*?"<>|]/g, '_');
    const cleanSubject = (docData.docSubject || '').trim().slice(0, 30).replace(/[\\/:*?"<>|]/g, '_');
    const dateStr = (docData.date || new Date().toLocaleDateString('ru-RU')).replace(/\./g, '_');
    const filename = `${cleanDocType}_${cleanSubject || dateStr}_для_печати.pdf`;

    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBrowserNativePrint = () => {
    onClose();
    setTimeout(() => {
      window.focus();
      window.print();
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Печать документа (А4)</h2>
              <p className="text-xs text-slate-300">Вызов системного диалога и подготовка файлов</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">

          {/* Document Overview Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">
                {docData.docType || 'Документ'} {docData.docSubject ? `— ${docData.docSubject}` : ''}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                <span>Дата: <strong>{docData.date || 'Текущая'}</strong></span>
                <span>№: <strong>{docData.refNumber || 'б/н'}</strong></span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Вызов системного принтера:
            </div>

            {/* Primary Action Button: Direct System Print */}
            <button
              type="button"
              onClick={handleTriggerDirectPrint}
              className="w-full p-4 rounded-xl border-2 border-indigo-600 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold transition-all text-left flex items-center justify-between group shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    Открыть диалог печати принтера
                    <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  </div>
                  <div className="text-xs text-indigo-100 font-normal mt-0.5">
                    Запустить печать бланка А4 со всеми печатями
                  </div>
                </div>
              </div>
              {printSuccess && (
                <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-1 rounded shadow-2xs flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Готово
                </span>
              )}
            </button>

            {/* Secondary Option: Open PDF in New Tab */}
            <button
              type="button"
              onClick={handleOpenPdfInNewTab}
              disabled={isGenerating || !pdfBlobUrl}
              className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-800 font-bold transition-all text-left flex items-center justify-between group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <ExternalLink className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Открыть в новой вкладке (PDF)</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    {isGenerating ? 'Формирование файла...' : 'Просмотр и печать (Ctrl+P) через браузер'}
                  </div>
                </div>
              </div>
            </button>

            {/* Option 3: Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating || !pdfBlobUrl}
              className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-800 font-bold transition-all text-left flex items-center justify-between group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Скачать PDF для печати</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    Сохранить готовый документ A4 в высоком качестве
                  </div>
                </div>
              </div>
            </button>

            {/* Option 4: Browser window.print fallback */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleBrowserNativePrint}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline font-medium transition-colors"
              >
                Альтернативная печать текущей вкладки (window.print)
              </button>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};

