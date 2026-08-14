import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  Trash2, 
  Pencil, 
  Check, 
  Shield, 
  KeyRound, 
  Calendar, 
  Building2, 
  User, 
  Send,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  RegisteredDocument, 
  getDocumentRegistry, 
  updateRegisteredDocumentInDb, 
  deleteRegisteredDocumentFromDb, 
  clearDocumentRegistryDb,
  verifyRegistryIntegrity,
  rechainRegistry,
  fnv1a64Hex
} from '../constants/departmentCodes';

interface RegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'admin' | 'user' | null;
  onRequestAdminAuth?: () => void;
}

export const RegistryModal: React.FC<RegistryModalProps> = ({
  isOpen,
  onClose,
  userRole,
  onRequestAdminAuth
}) => {
  const [registryList, setRegistryList] = useState<RegisteredDocument[]>([]);
  const [search, setSearch] = useState('');
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocData, setEditingDocData] = useState<RegisteredDocument | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [chainStatus, setChainStatus] = useState<{ valid: boolean; total: number; checked: boolean }>({ valid: true, total: 0, checked: false });

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (isOpen) {
      const registry = getDocumentRegistry();
      setRegistryList(registry);
      const verdict = verifyRegistryIntegrity(registry);
      setChainStatus({ valid: verdict.valid, total: verdict.total, checked: true });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredDocs = registryList.filter(doc => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      doc.regNumber.toLowerCase().includes(q) ||
      doc.subject.toLowerCase().includes(q) ||
      doc.composerName.toLowerCase().includes(q) ||
      doc.recipientName.toLowerCase().includes(q) ||
      doc.deptCode.toLowerCase().includes(q) ||
      doc.deptName.toLowerCase().includes(q) ||
      (doc.digitalSignatureKey && doc.digitalSignatureKey.toLowerCase().includes(q))
    );
  });

  const handleDelete = (id: string, regNumber: string) => {
    if (!isAdmin) {
      if (onRequestAdminAuth) onRequestAdminAuth();
      return;
    }
    if (window.confirm(`Вы действительно хотите удалить документ № ${regNumber} из Единого реестра?`)) {
      deleteRegisteredDocumentFromDb(id);
      const updated = getDocumentRegistry();
      setRegistryList(updated);
      setStatusMsg({ type: 'success', text: `Документ № ${regNumber} удален из реестра.` });
    }
  };

  const handleClearAll = () => {
    if (!isAdmin) {
      if (onRequestAdminAuth) onRequestAdminAuth();
      return;
    }
    if (window.confirm('ВНИМАНИЕ! Вы действительно хотите ПОЛНОСТЬЮ очистить Единый реестр исходящих писем? Все записи будут удалены безвозвратно.')) {
      clearDocumentRegistryDb();
      setRegistryList([]);
      setStatusMsg({ type: 'success', text: 'Единый реестр писем полностью очищен.' });
    }
  };

  const handleSaveEdit = () => {
    if (!editingDocData) return;
    updateRegisteredDocumentInDb(editingDocData);
    setRegistryList(getDocumentRegistry());
    setEditingDocId(null);
    setEditingDocData(null);
    setStatusMsg({ type: 'success', text: `Изменения документа № ${editingDocData.regNumber} сохранены.` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300">
              <FileText className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
                Реестр зарегистрированных исходящих писем
                <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-2 py-0.5 rounded-full font-medium">
                  {registryList.length} записей
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Единая база исходящих документов АО «НПО «Тепломаш» (ГОСТ Р 7.0.97–2025)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Search Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по исходящему №, теме, составителю, адресату или ключу ЭП..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={registryList.length === 0}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Очистить весь реестр исходящих писем"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить реестр</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onRequestAdminAuth && onRequestAdminAuth()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Режим управления (Админ)</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div className={`p-3 text-xs flex items-center justify-between shrink-0 border-b ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <span className="font-bold">{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="p-0.5 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Hash-Chain Integrity Banner (tamper-evident реестр) */}
        {chainStatus.checked && (
          <div className={`p-3 text-xs flex items-center justify-between gap-3 shrink-0 border-b ${
            chainStatus.valid
              ? 'bg-emerald-50/70 text-emerald-800 border-emerald-100'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="w-4 h-4 shrink-0" />
              <span className="font-bold shrink-0">Целостность реестра:</span>
              {chainStatus.valid ? (
                <span className="flex items-center gap-1.5 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  цепочка не нарушена ({chainStatus.total} записей)
                </span>
              ) : (
                <span className="font-semibold">
                  НАРУШЕНА — записи изменялись в обход приложения!
                </span>
              )}
            </div>
            {!chainStatus.valid && isAdmin && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Перестроить хеш-цепочку реестра заново? Это подтвердит текущее состояние реестра как эталонное.')) {
                    const rebuilt = rechainRegistry(registryList);
                    localStorage.setItem('teplomash_registered_docs_registry_v3', JSON.stringify(rebuilt));
                    setRegistryList(getDocumentRegistry());
                    const verdict = verifyRegistryIntegrity(getDocumentRegistry());
                    setChainStatus({ valid: verdict.valid, total: verdict.total, checked: true });
                    setStatusMsg({ type: 'success', text: 'Хеш-цепочка реестра перестроена. Реестр снова эталонный.' });
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shrink-0"
              >
                Перестроить цепочку
              </button>
            )}
          </div>
        )}

        {/* Documents Registry List Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FileText className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-700">Реестр писем пуст или совпадений не найдено</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                При публикации и отправке новых документов на бланке Тепломаш записи автоматически фиксируются здесь с их уникальными номерами.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 transition-all shadow-2xs hover:shadow-xs space-y-3"
                >
                  {editingDocId === doc.id && editingDocData ? (
                    /* Inline Edit Mode (Admin Only) */
                    <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3.5 space-y-3 text-xs">
                      <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Редактирование записи № {doc.regNumber}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700">Исходящий номер:</label>
                          <input
                            type="text"
                            value={editingDocData.regNumber}
                            onChange={(e) => setEditingDocData({ ...editingDocData, regNumber: e.target.value })}
                            className="w-full text-xs p-2 rounded border border-slate-300 bg-white font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700">Дата регистрации:</label>
                          <input
                            type="text"
                            value={editingDocData.date}
                            onChange={(e) => setEditingDocData({ ...editingDocData, date: e.target.value })}
                            className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700">Составитель (Исполнитель):</label>
                          <input
                            type="text"
                            value={editingDocData.composerName}
                            onChange={(e) => setEditingDocData({ ...editingDocData, composerName: e.target.value })}
                            className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700">Получатель (Адресат):</label>
                          <input
                            type="text"
                            value={editingDocData.recipientName}
                            onChange={(e) => setEditingDocData({ ...editingDocData, recipientName: e.target.value })}
                            className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-700">Тема документа:</label>
                        <input
                          type="text"
                          value={editingDocData.subject}
                          onChange={(e) => setEditingDocData({ ...editingDocData, subject: e.target.value })}
                          className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-200">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDocId(null);
                            setEditingDocData(null);
                          }}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded transition-colors"
                        >
                          Отмена
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow-xs transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Сохранить
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 bg-indigo-950 text-indigo-100 font-mono font-bold text-xs rounded-md tracking-wider shadow-2xs">
                            № {doc.regNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            от {doc.date}г.
                          </span>
                          <span className="text-[11px] bg-indigo-50 text-indigo-800 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                            {doc.deptName}
                          </span>
                        </div>

                        <div className="text-xs text-slate-900 font-bold">
                          <span className="text-slate-500 font-normal">Тема:</span> {doc.subject}
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-slate-600 flex-wrap">
                          <span>Составитель: <strong className="text-slate-800">{doc.composerName}</strong> ({doc.composerDept})</span>
                          <span>Адресат: <strong className="text-slate-800">{doc.recipientName}</strong></span>
                        </div>
                      </div>

                      {/* Right side info & Actions */}
                      <div className="flex flex-col md:items-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                        {isAdmin && doc.digitalSignatureKey && (
                          <div className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-md font-mono text-[10px] font-bold text-indigo-950 shadow-2xs" title="Уникальный ключ электронной подписи (виден только администратору)">
                            Ключ ЭП: <span className="text-indigo-700">{doc.digitalSignatureKey}</span>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Зарегистрировано: {doc.registeredAt}</span>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDocId(doc.id);
                                setEditingDocData({ ...doc });
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1"
                              title="Редактировать запись"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Изменить
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(doc.id, doc.regNumber)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Удалить из реестра"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
