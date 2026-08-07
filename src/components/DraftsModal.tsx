import React, { useState } from 'react';
import { DocumentData } from '../types';
import { 
  History, 
  Trash2, 
  FileText, 
  Clock, 
  Check, 
  Plus, 
  FolderOpen, 
  X, 
  Edit3, 
  Copy, 
  Download, 
  Upload,
  ArrowRight
} from 'lucide-react';

export interface SavedDraft {
  id: string;
  title: string;
  savedAt: string;
  data: DocumentData;
}

interface DraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: SavedDraft[];
  currentDoc: DocumentData;
  onLoadDraft: (draft: DocumentData) => void;
  onSaveCurrentAsDraft: (title: string) => void;
  onDeleteDraft: (id: string) => void;
}

export const DraftsModal: React.FC<DraftsModalProps> = ({
  isOpen,
  onClose,
  drafts,
  currentDoc,
  onLoadDraft,
  onSaveCurrentAsDraft,
  onDeleteDraft,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || `${currentDoc.docType || 'Документ'} (${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })})`;
    onSaveCurrentAsDraft(title);
    setNewTitle('');
    setIsSaving(false);
  };

  const filteredDrafts = drafts.filter(draft => 
    draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    draft.data.docType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    draft.data.recipient.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">История черновиков и сохраненных документов</h3>
              <p className="text-xs text-slate-500">Быстрый доступ к предыдущим версиям и сохраненным бланкам</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Action bar: Save Current Document as Draft */}
          {!isSaving ? (
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">Текущий открытый документ</span>
                <p className="text-xs text-indigo-900 truncate font-medium">
                  {currentDoc.docType}: {currentDoc.recipient.organization || currentDoc.recipient.position || 'Без наименования'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSaving(true)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-xs transition-all shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Сохранить текущий в черновики
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="bg-indigo-50 border border-indigo-300 rounded-xl p-3.5 space-y-3">
              <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">Название для сохранения черновика</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={`Например: ${currentDoc.docType} от ${new Date().toLocaleDateString('ru-RU')}`}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaving(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Сохранить
                </button>
              </div>
            </form>
          )}

          {/* Search Input */}
          {drafts.length > 0 && (
            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по черновикам..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          {/* Drafts List */}
          {filteredDrafts.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Нет сохраненных черновиков</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {searchQuery ? 'По вашему запросу ничего не найдено' : 'Нажмите «Сохранить текущий в черновики», чтобы зафиксировать копию'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                        {draft.data.docType || 'Документ'}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {draft.savedAt}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{draft.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Адресат: {draft.data.recipient.organization || draft.data.recipient.position || '—'} ({draft.data.recipient.name || '—'})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadDraft(draft.data);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <span>Загрузить</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteDraft(draft.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить черновик"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Всего сохраненных черновиков: {drafts.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
