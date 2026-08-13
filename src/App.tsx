import React, { useState, useEffect } from 'react';
import { DocumentData, DocumentPreset, DocumentVersion } from './types';
import { INITIAL_DOCUMENT, TEPLOMASH_OFFICIAL_HEADER_URL } from './constants/presets';
import { DocumentForm } from './components/DocumentForm';
import { SignatureSettings } from './components/SignatureSettings';
import { StyleControls } from './components/StyleControls';
import { DocumentPreview } from './components/DocumentPreview';
import { TemplatesModal } from './components/TemplatesModal';
import { DraftsModal, SavedDraft } from './components/DraftsModal';
import { TeplomashEmployeeSelectorModal } from './components/TeplomashEmployeeSelectorModal';
import { AuthModal } from './components/AuthModal';
import { ExportModal } from './components/ExportModal';
import { PrintModal } from './components/PrintModal';
import { RegistryModal } from './components/RegistryModal';
import { PortalAuthGate } from './components/PortalAuthGate';
import { usePortalAuth } from './hooks/usePortalAuth';
import { triggerSystemPrint } from './utils/printUtils';
import { validateDocument, ValidationError } from './utils/validationUtils';
import { ValidationModal } from './components/ValidationModal';
import { TeplomashEmployee, TEPLOMASH_EMPLOYEES, sanitizeEmployeeDepartments } from './constants/teplomashEmployees';
import { SAMPLE_STAMPS } from './constants/presets';
import { useMicroserviceBridge } from './hooks/useMicroserviceBridge';
import { microserviceBridge } from './services/microserviceBridge';
import { buildStampSvg } from './utils/stampUtils';
import { downloadDocumentAsEml } from './utils/emlUtils';
import { 
  guessDepartmentCode, 
  getNextDepartmentSeq, 
  generateDocumentNumber 
} from './constants/departmentCodes';
import { 
  FileText, 
  Printer, 
  UserCheck, 
  PenTool, 
  Palette, 
  FolderOpen, 
  Plus, 
  Save, 
  History,
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  Download,
  Copy,
  Check,
  FileCheck,
  Users,
  Building2,
  Shield,
  User,
  LogIn,
  LogOut,
  KeyRound,
  Mail,
  Paperclip,
  ArrowLeft,
  Globe,
  Home
} from 'lucide-react';

const STORAGE_KEY = 'official_doc_builder_data';
const DRAFTS_KEY = 'official_doc_drafts_history';
const EMPLOYEES_KEY = 'teplomash_employees_db';
const ROLE_KEY = 'doc_gen_user_role';

export default function App() {
  // Portal JWT Auth Gate Hook
  const portalAuthState = usePortalAuth('DOC_GENERATOR_ACCESS');

  // Auth & User Role State
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(() => {
    const saved = localStorage.getItem(ROLE_KEY);
    if (saved === 'admin' || saved === 'user') return saved;
    return null; // triggers AuthModal on initial load if no role selected
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => !userRole);

  const handleSelectRole = (role: 'admin' | 'user') => {
    setUserRole(role);
    localStorage.setItem(ROLE_KEY, role);
  };

  const handleLogoutRole = () => {
    setUserRole(null);
    localStorage.removeItem(ROLE_KEY);
    setIsAuthModalOpen(true);
  };

  const [employees, setEmployees] = useState<TeplomashEmployee[]>(() => {
    const saved = localStorage.getItem(EMPLOYEES_KEY);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return sanitizeEmployeeDepartments(parsed);
        }
      } catch {
        return [];
      }
    }
    return sanitizeEmployeeDepartments(TEPLOMASH_EMPLOYEES);
  });

  useEffect(() => {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  }, [employees]);

  const [docData, setDocData] = useState<DocumentData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Always enforce official locked Teplomash header and GOST R 7.0.97-2025 default margins
        parsed.header = {
          ...parsed.header,
          type: 'preset',
          imageUrl: TEPLOMASH_OFFICIAL_HEADER_URL
        };
        parsed.margins = {
          top: 20,
          bottom: 20,
          left: 20,
          right: 10
        };
        return parsed;
      } catch { return INITIAL_DOCUMENT; }
    }
    return INITIAL_DOCUMENT;
  });

  const [activeTab, setActiveTab] = useState<'fields' | 'signature' | 'style'>('fields');
  const isAdmin = userRole === 'admin';
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState<boolean>(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState<boolean>(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [savedNotification, setSavedNotification] = useState<boolean>(false);

  const handleApplyEmployeeRecipient = (emp: TeplomashEmployee) => {
    let formattedPosition = emp.dativePosition || emp.position;
    if (emp.department && !formattedPosition.toLowerCase().includes(emp.department.toLowerCase())) {
      formattedPosition = `${formattedPosition} (${emp.department})`;
    }

    setDocData(prev => ({
      ...prev,
      recipient: {
        recipientType: 'internal',
        position: formattedPosition,
        organization: emp.organization,
        name: emp.dativeName || emp.shortName,
        email: emp.email
      }
    }));
  };

  const handleApplyEmployeeSender = (emp: TeplomashEmployee) => {
    const stampSvg = buildStampSvg(
      'АКЦИОНЕРНОЕ ОБЩЕСТВО «НПО «ТЕПЛОМАШ»',
      'САНКТ-ПЕТЕРБУРГ * ОГРН 1027809212573',
      emp.department,
      emp.position,
      'ДЛЯ ДОКУМЕНТОВ',
      '#1d4ed8'
    );

    const deptCode = guessDepartmentCode(emp.department, emp.position);
    const seq = getNextDepartmentSeq(deptCode);
    const newRefNumber = generateDocumentNumber(docData.date, seq, deptCode);

    setDocData(prev => ({
      ...prev,
      refNumber: newRefNumber,
      signature: {
        ...prev.signature,
        senderPosition: emp.position,
        senderDepartment: emp.department,
        senderOrganization: emp.organization,
        senderName: emp.shortName,
        senderEmail: emp.email,
        showStamp: false,
        stampImageUrl: null
      }
    }));
  };

  const [draftsList, setDraftsList] = useState<SavedDraft[]>(() => {
    const saved = localStorage.getItem(DRAFTS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  // Auto-save active document to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docData));
    microserviceBridge.emit('DOCUMENT_CHANGED', docData);
  }, [docData]);

  // Microfrontend / Microservice PostMessage Bridge Listener
  useMicroserviceBridge({
    onInitDocument: (incomingData) => {
      setDocData(prev => ({
        ...prev,
        ...incomingData
      }));
    },
    onGetDocumentRequest: () => docData
  });

  const handleReturnToPortal = () => {
    // Dispatch postMessage event to host container / 1C / Portal
    microserviceBridge.emit('RETURN_TO_PORTAL', {
      action: 'close_microservice',
      document: docData
    });

    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        service: 'generator-doc-gost',
        type: 'RETURN_TO_PORTAL',
        payload: { action: 'close' }
      }, '*');
    } else {
      // Открыто обычной ссылкой (не iframe) на том же origin, что и портал —
      // document.referrer ненадёжен (пуст при обновлении страницы/переходе по
      // закладке), портал всегда на корне этого же origin.
      window.location.href = '/';
    }
  };

  const handleSaveCurrentAsDraft = (
    title: string, 
    bumpType: 'none' | 'minor' | 'major' = 'minor', 
    comment: string = ''
  ) => {
    const nowStr = new Date().toLocaleString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const currentVersion = docData.version || '1.0';
    let newVersion = currentVersion;
    if (bumpType === 'minor') {
      const parts = currentVersion.split('.').map(p => parseInt(p, 10) || 0);
      newVersion = `${parts[0] || 1}.${(parts[1] || 0) + 1}`;
    } else if (bumpType === 'major') {
      const parts = currentVersion.split('.').map(p => parseInt(p, 10) || 0);
      newVersion = `${(parts[0] || 1) + 1}.0`;
    }

    const currentSnapshot: DocumentData = JSON.parse(JSON.stringify(docData));
    currentSnapshot.version = newVersion;

    const newVersionRecord: DocumentVersion = {
      id: `ver-${Date.now()}`,
      version: newVersion,
      timestamp: nowStr,
      createdAt: nowStr,
      updatedBy: docData.signature.senderName || 'Пользователь',
      author: docData.signature.senderName || 'Пользователь',
      comment: comment || (bumpType === 'major' ? 'Новая редакция документа' : bumpType === 'minor' ? 'Корректировка документа' : 'Сохранение копии'),
      dataSnapshot: currentSnapshot
    };

    const existingHistory = docData.versionHistory || [];
    const updatedHistory = [newVersionRecord, ...existingHistory];

    const updatedDocData: DocumentData = {
      ...docData,
      version: newVersion,
      versionHistory: updatedHistory
    };

    setDocData(updatedDocData);

    const newDraft: SavedDraft = {
      id: `draft-${Date.now()}`,
      title: title,
      savedAt: nowStr,
      version: newVersion,
      versionHistory: updatedHistory,
      data: updatedDocData
    };

    const updatedDrafts = [newDraft, ...draftsList];
    setDraftsList(updatedDrafts);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));

    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleDeleteDraft = (id: string) => {
    const updated = draftsList.filter(d => d.id !== id);
    setDraftsList(updated);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
  };

  const handleLoadDraft = (draftData: DocumentData) => {
    setDocData(draftData);
  };

  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const handleSelectPreset = (preset: DocumentPreset) => {
    const todayStr = new Date().toLocaleDateString('ru-RU');
    setDocData({
      ...docData,
      ...preset.data,
      date: todayStr,
      recipient: {
        ...docData.recipient,
        ...preset.data.recipient
      },
      signature: {
        ...docData.signature,
        ...preset.data.signature
      }
    });
  };

  const [validationModalState, setValidationModalState] = useState<{
    isOpen: boolean;
    errors: ValidationError[];
    actionName: string;
  }>({ isOpen: false, errors: [], actionName: '' });

  const handleNewBlank = () => {
    const todayStr = new Date().toLocaleDateString('ru-RU');
    setDocData({
      ...INITIAL_DOCUMENT,
      id: `doc-${Date.now()}`,
      date: todayStr,
      content: ``,
      docType: 'СЛУЖЕБНАЯ ЗАПИСКА',
      docSubject: ''
    });
  };

  const handlePrint = () => {
    const errs = validateDocument(docData);
    if (errs.length > 0) {
      setValidationModalState({
        isOpen: true,
        errors: errs,
        actionName: 'печати документа'
      });
      return;
    }
    triggerSystemPrint(docData);
    setIsPrintModalOpen(true);
  };

  const handleOpenExportModal = () => {
    const errs = validateDocument(docData);
    if (errs.length > 0) {
      setValidationModalState({
        isOpen: true,
        errors: errs,
        actionName: 'экспорта в .EML'
      });
      return;
    }
    setIsExportModalOpen(true);
  };

  const [isExportingEml, setIsExportingEml] = useState(false);

  const handleExportEml = async () => {
    try {
      setIsExportingEml(true);
      await downloadDocumentAsEml(docData);
    } catch (err) {
      console.error('Failed to export EML file:', err);
    } finally {
      setIsExportingEml(false);
    }
  };

  const handleCopyText = () => {
    const plainText = `
${docData.recipient.position}
${docData.recipient.organization}
${docData.recipient.name}

${docData.docType}
${docData.docSubject}

${docData.date}г.  ${docData.refNumber}  ${docData.city}

${docData.content.replace(/<[^>]+>/g, '\n')}

${docData.signature.senderPosition} __________ ${docData.signature.senderName}
    `.trim();

    navigator.clipboard.writeText(plainText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <PortalAuthGate authState={portalAuthState} onLogin={() => setIsAuthModalOpen(true)}>
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans antialiased text-slate-800 selection:bg-indigo-500 selection:text-white">
      {/* ================= HEADER NAVBAR (NO-PRINT) ================= */}
      <header className="no-print h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 flex items-center justify-between shrink-0">
        <div className="max-w-[1700px] w-full mx-auto flex items-center justify-between gap-4">
          
          {/* Return to Portal + Logo & Branding */}
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={handleReturnToPortal}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm group border border-slate-700 cursor-pointer"
              title="Вернуться на портал / в Корпоративную Систему / 1С"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
              <span>Вернуться на портал</span>
            </button>

            <div className="h-7 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center rounded-sm text-white font-bold shadow-xs">
                L
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight uppercase text-slate-900 flex items-center gap-2">
                  Генератор Документов на Бланке
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-sm">
                    ГОСТ Р 7.0.97–2025
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400">Официальные письма, служебные записки и бланки АО «НПО «Тепломаш»</p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* User Role Indicator & Switcher */}
            {userRole === 'admin' ? (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 rounded text-xs font-bold border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Режим администратора активен. Нажмите, чтобы сменить роль"
              >
                <Shield className="w-3.5 h-3.5 text-amber-600 fill-amber-200" />
                <span>Администратор</span>
                <span className="text-[10px] text-amber-700 font-normal ml-0.5">(Сменить)</span>
              </button>
            ) : userRole === 'user' ? (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 rounded text-xs font-semibold border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Нажмите для смены роли или входа под Администратором"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Обычный пользователь</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 rounded text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Войти / Выбрать роль</span>
              </button>
            )}

            <div className="h-5 w-px bg-slate-200 my-auto" />

            {/* Registry Button on Main Top Panel */}
            <button
              type="button"
              onClick={() => setIsRegistryOpen(true)}
              className="px-3.5 py-1.5 rounded text-xs font-semibold border border-indigo-300 text-indigo-900 bg-indigo-100/80 hover:bg-indigo-200 flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Единый реестр исходящих писем АО «НПО «Тепломаш»"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-700" />
              <span>Реестр писем</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEmployeeModalOpen(true)}
              className="px-3.5 py-1.5 rounded text-xs font-semibold border border-indigo-200 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>База Тепломаш</span>
            </button>

            <button
              type="button"
              onClick={handleNewBlank}
              className="px-3.5 py-1.5 rounded text-xs font-medium border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Новый бланк</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDraftsOpen(true)}
              className="px-3.5 py-1.5 rounded text-xs font-semibold border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Документы ({draftsList.length})</span>
            </button>

            <div className="h-5 w-px bg-slate-200 my-auto" />

            {/* Single Unified EML Export Button */}
            <button
              type="button"
              onClick={handleOpenExportModal}
              className="px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              title="Экспортировать документ в файл .EML для отправки по электронной почте"
            >
              <Mail className="w-4 h-4 text-emerald-200" />
              <span>Сохранить в .EML</span>
            </button>

            {/* Single Unified Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Распечатать бланк на принтере (Ctrl+P)"
            >
              <Printer className="w-4 h-4 text-slate-200" />
              <span>Печать</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN SPLIT WORKSPACE ================= */}
      <div className="flex-1 max-w-[1700px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        
        {/* LEFT COLUMN: CONTROLS & FORM INPUTS (NO-PRINT) */}
        <div className="no-print lg:col-span-5 flex flex-col space-y-4">
          
          {/* Tabs Navigation */}
          <div className="bg-white p-1 rounded border border-slate-200 shadow-xs flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('fields')}
              className={`flex-1 py-2 px-2.5 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'fields'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Реквизиты</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('signature')}
              className={`flex-1 py-2 px-2.5 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'signature'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Подпись</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`flex-1 py-2 px-2.5 rounded text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'style'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Оформление</span>
              </button>
            )}
          </div>

          {/* Active Tab Panel Container */}
          <div className="flex-1 bg-white border border-slate-200 rounded p-5 shadow-xs overflow-y-auto max-h-[calc(100vh-180px)]">
            {activeTab === 'fields' && (
              <DocumentForm
                data={docData}
                onChange={setDocData}
                onOpenEmployeeModal={() => setIsEmployeeModalOpen(true)}
                employees={employees}
                userRole={userRole}
                onRequestAdminAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {activeTab === 'signature' && (
              <SignatureSettings
                signature={docData.signature}
                onChange={(signature) => setDocData({ ...docData, signature })}
                onOpenEmployeeModal={() => setIsEmployeeModalOpen(true)}
                employees={employees}
                isAdmin={isAdmin}
                docData={docData}
                onDocDataChange={setDocData}
              />
            )}

            {activeTab === 'style' && (
              <StyleControls
                data={docData}
                onChange={setDocData}
                isAdmin={isAdmin}
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME A4 DOCUMENT PREVIEW */}
        <div className="lg:col-span-7 flex flex-col space-y-3 items-center">
          
          {/* Zoom & View Toolbar (NO-PRINT) */}
          <div className="no-print w-full bg-white border border-slate-200 rounded px-4 py-2 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Интерактивный предпросмотр бланка</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors flex items-center gap-1 border border-slate-200"
                title="Копировать текст документа в буфер"
              >
                {copiedNotification ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Скопировать текст</span>
                  </>
                )}
              </button>

              <div className="h-4 w-px bg-slate-200" />

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded border border-slate-200">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.05))}
                  className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
                  title="Уменьшить масштаб"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-semibold text-slate-700 px-1.5 w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(1.3, prev + 0.05))}
                  className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
                  title="Увеличить масштаб"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Render A4 Sheet */}
          <div className="w-full flex-1 flex justify-center items-start overflow-hidden">
            <DocumentPreview data={docData} scale={zoomLevel} />
          </div>
        </div>

      </div>

      {/* Bottom Status Bar (Geometric Balance footer) */}
      <footer className="no-print h-8 bg-white border-t border-slate-200 px-6 fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest shrink-0">
        <div>Статус: Все изменения сохранены в реальном времени</div>
        <div className="flex gap-4">
          <span>Масштаб: {Math.round(zoomLevel * 100)}%</span>
          <span>A4: 210 × 297 мм</span>
        </div>
      </footer>

      {/* Modals */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectPreset={handleSelectPreset}
        onNewBlank={handleNewBlank}
      />

      <DraftsModal
        isOpen={isDraftsOpen}
        onClose={() => setIsDraftsOpen(false)}
        drafts={draftsList}
        currentDoc={docData}
        onLoadDraft={handleLoadDraft}
        onSaveCurrentAsDraft={handleSaveCurrentAsDraft}
        onDeleteDraft={handleDeleteDraft}
      />

      <TeplomashEmployeeSelectorModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        employees={employees}
        onUpdateEmployees={setEmployees}
        onSelectRecipient={handleApplyEmployeeRecipient}
        onSelectSender={handleApplyEmployeeSender}
        userRole={userRole}
        onRequestAdminAuth={() => setIsAuthModalOpen(true)}
      />

      <RegistryModal
        isOpen={isRegistryOpen}
        onClose={() => setIsRegistryOpen(false)}
        userRole={userRole}
        onRequestAdminAuth={() => setIsAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentRole={userRole}
        onSelectRole={handleSelectRole}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        docData={docData}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        docData={docData}
      />

      <ValidationModal
        isOpen={validationModalState.isOpen}
        onClose={() => setValidationModalState(prev => ({ ...prev, isOpen: false }))}
        errors={validationModalState.errors}
        actionName={validationModalState.actionName}
        onFixField={() => {
          setActiveTab('fields');
        }}
      />
    </div>
    </PortalAuthGate>
  );
}
