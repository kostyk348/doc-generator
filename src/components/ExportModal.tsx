import React, { useState, useRef } from 'react';
import { DocumentData } from '../types';
import { generateMainDocumentPdfArrayBuffer, mergeMainPdfWithAttachments, fileToBase64 } from '../utils/pdfMergeUtils';
import { downloadDocumentAsEml, ExtraPdfAttachment } from '../utils/emlUtils';
import { downloadSvgFile } from '../utils/stampUtils';
import { 
  X, 
  Paperclip, 
  FileText, 
  Download, 
  Mail, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  FileCheck2,
  Sparkles,
  Printer
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  docData: DocumentData;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, docData }) => {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      if (selectedFiles.length < e.target.files.length) {
        setErrorMessage('Разрешена загрузка только файлов в формате PDF.');
      } else {
        setErrorMessage(null);
      }
      setAttachments(prev => [...prev, ...selectedFiles]);
    }
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      if (droppedFiles.length < e.dataTransfer.files.length) {
        setErrorMessage('Разрешена загрузка только файлов в формате PDF.');
      } else {
        setErrorMessage(null);
      }
      setAttachments(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 1. Export Merged PDF File
  const handleExportMergedPdf = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setStatusMessage('Формирование основного документа и объединение приложений...');

      const mainPdfResult = await generateMainDocumentPdfArrayBuffer(docData);
      if (!mainPdfResult) {
        throw new Error('Не удалось сформировать основной документ PDF. Убедитесь, что бланк отображен на экране.');
      }

      let finalPdfBytes: Uint8Array;
      if (attachments.length > 0) {
        setStatusMessage(`Объединение ${attachments.length} приложение(й) в единый PDF...`);
        finalPdfBytes = await mergeMainPdfWithAttachments(mainPdfResult.buffer, attachments);
      } else {
        finalPdfBytes = new Uint8Array(mainPdfResult.buffer);
      }

      // Download PDF
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const cleanDocType = (docData.docType || 'Документ').trim().replace(/[\\/:*?"<>|]/g, '_');
      const cleanSubject = (docData.docSubject || '').trim().slice(0, 30).replace(/[\\/:*?"<>|]/g, '_');
      const dateStr = (docData.date || new Date().toLocaleDateString('ru-RU')).replace(/\./g, '_');
      
      const filename = attachments.length > 0
        ? `${cleanDocType}_с_приложениями_${dateStr}.pdf`
        : `${cleanDocType}_${cleanSubject || dateStr}.pdf`;

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setStatusMessage('Файл PDF успешно сохранен!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Error generating merged PDF:', err);
      setErrorMessage(err?.message || 'Ошибка при генерации единого PDF файла.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Export EML Email Package
  const handleExportEmlWithAttachments = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setStatusMessage('Подготовка письма .EML с вложениями...');

      const extraPdfAttachments: ExtraPdfAttachment[] = [];
      for (const file of attachments) {
        const base64Data = await fileToBase64(file);
        extraPdfAttachments.push({
          filename: file.name,
          base64Data
        });
      }

      await downloadDocumentAsEml(docData, extraPdfAttachments);

      setStatusMessage('Письмо .EML успешно сформировано и загружено!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Error generating EML email package:', err);
      setErrorMessage(err?.message || 'Ошибка при создании EML пакета.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Paperclip className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Добавление вложений и экспорт</h2>
              <p className="text-xs text-slate-300">Объединение PDF файлов или экспорт в формат почтового сообщения .EML</p>
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Main Document Summary Card */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-lg p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Основной бланк документа
              </div>
              <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
                {docData.docType || 'СЛУЖЕБНАЯ ЗАПИСКА'}
                {docData.docSubject ? `: ${docData.docSubject}` : ''}
              </div>
              <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                <span>Дата: <strong>{docData.date || 'Текущая'}</strong></span>
                <span>Исх. №: <strong>{docData.refNumber || 'без №'}</strong></span>
                <span>Получатель: <strong>{docData.recipient.name || docData.recipient.organization || 'Не указан'}</strong></span>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-indigo-600" />
                <span>Приложения в формате .PDF ({attachments.length})</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded border border-indigo-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить PDF</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAddFiles}
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
            />

            {/* Drag and Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 rounded-lg p-5 text-center cursor-pointer transition-all space-y-1.5 group"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 group-hover:border-indigo-300 flex items-center justify-center mx-auto text-slate-500 group-hover:text-indigo-600 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-slate-700 group-hover:text-indigo-900">
                Перетащите сюда файлы .PDF или нажмите для выбора
              </div>
              <p className="text-[11px] text-slate-400">
                Сметы, чертежи, технические задания, приложения к письму
              </p>
            </div>

            {/* Attached Files List */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Загруженные файлы приложений:
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold text-xs shrink-0">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-800 truncate">{file.name}</div>
                          <div className="text-[11px] text-slate-400">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Удалить вложение"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status and Error Messages */}
          {statusMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2.5 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2.5 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Варианты экспортной обработки:</span>
            </div>
            <p>
              • <strong>Объединить в один PDF:</strong> Сформирует единый документ, где на первых страницах размещен бланк, а следом идут прикрепленные файлы приложений.
            </p>
            <p>
              • <strong>Экспорт в .EML:</strong> Создаст стандартный почтовый файл сообщения, где бланк и все .PDF прикреплены как отдельные вложения к телу письма.
            </p>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Отмена
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Download SVG Stamp/Header Button */}
            {(docData.header.imageUrl || docData.signature.stampImageUrl) && (
              <button
                type="button"
                onClick={() => {
                  if (docData.signature.stampImageUrl) {
                    downloadSvgFile(docData.signature.stampImageUrl, 'pechat-teplomash.svg');
                  }
                  if (docData.header.imageUrl && docData.header.imageUrl.includes('svg')) {
                    downloadSvgFile(docData.header.imageUrl, 'shapka-teplomash.svg');
                  }
                  setStatusMessage('Файлы .SVG успешно сохранены!');
                  setTimeout(() => setStatusMessage(null), 2500);
                }}
                disabled={isProcessing}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-300"
                title="Скачать элементы (шапку и печать) в векторе (.svg)"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Скачать .SVG</span>
              </button>
            )}

            {/* EML Button */}
            <button
              type="button"
              onClick={handleExportEmlWithAttachments}
              disabled={isProcessing}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
            >
              <Mail className="w-4 h-4" />
              <span>{isProcessing ? 'Обработка...' : 'Экспорт в .EML с вложениями'}</span>
            </button>

            {/* Merged PDF Button */}
            <button
              type="button"
              onClick={handleExportMergedPdf}
              disabled={isProcessing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>{isProcessing ? 'Формирование PDF...' : attachments.length > 0 ? 'Объединить в один PDF' : 'Скачать PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
