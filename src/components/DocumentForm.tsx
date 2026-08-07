import React, { useState, useEffect } from 'react';
import { DocumentData } from '../types';
import { TEPLOMASH_EMPLOYEES, TeplomashEmployee } from '../constants/teplomashEmployees';
import { 
  DEPARTMENT_CODES, 
  generateDocumentNumber, 
  guessDepartmentCode, 
  parseRefNumber,
  extractDDMM,
  getDeptCounters,
  saveDeptCounters,
  getNextDepartmentSeq,
  incrementAndGetDepartmentSeq,
  setDepartmentSeq,
  DeptCounters,
  registerDocumentInDb,
  deleteRegisteredDocumentFromDb,
  clearDocumentRegistryDb,
  getDocumentRegistry,
  isRegistrationNumberTaken,
  RegisteredDocument
} from '../constants/departmentCodes';
import { 
  UserCheck, 
  FileText, 
  Calendar, 
  Sparkles, 
  FileCheck,
  Building2,
  Users,
  Globe,
  Briefcase,
  MapPin,
  FileSpreadsheet,
  Lock,
  Shield,
  Hash,
  Info,
  Check,
  Zap,
  Settings,
  X,
  ListOrdered,
  RotateCcw,
  CheckCircle2,
  Search,
  Trash2,
  KeyRound,
  ShieldCheck,
  Archive,
  Database,
  Send
} from 'lucide-react';

interface DocumentFormProps {
  data: DocumentData;
  onChange: (updated: DocumentData) => void;
  onOpenAiAssistant?: () => void;
  onOpenEmployeeModal?: () => void;
  employees?: TeplomashEmployee[];
  userRole?: 'admin' | 'user' | null;
  onRequestAdminAuth?: () => void;
}

const INTERNAL_DOC_TYPES = [
  'СЛУЖЕБНАЯ ЗАПИСКА',
  'РАСПОРЯЖЕНИЕ',
  'ЗАЯВЛЕНИЕ',
  'ОБЪЯСНИТЕЛЬНАЯ',
  'ПРИКАЗ',
  'УВЕДОМЛЕНИЕ',
  'АКТ',
  'ПРОТОКОЛ'
];

const EXTERNAL_DOC_TYPES = [
  'ИСХОДЯЩЕЕ ПИСЬМО',
  'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ',
  'ЗАПРОС',
  'ОТВЕТ НА ЗАПРОС',
  'ИНФОРМАЦИОННОЕ ПИСЬМО',
  'СОГЛАШЕНИЕ',
  'АКТ СВЕРКИ',
  'ПРЕТЕНЗИЯ',
  'ДОВЕРЕННОСТЬ'
];

const EXTERNAL_COMPANY_PRESETS = [
  {
    org: 'ООО «ТехноПром-Автоматизация»',
    position: 'Генеральному директору',
    name: 'Иванову Игорю Сергеевичу',
    address: '190000, г. Санкт-Петербург, Невский пр., д. 10',
    inn: 'ИНН 7801234567 / КПП 780101001'
  },
  {
    org: 'ПАО «Газпром Автоматизация»',
    position: 'Директору по закупкам',
    name: 'Петрову Петру Петровичу',
    address: '197229, г. Санкт-Петербург, Лахтинский пр., д. 2',
    inn: 'ИНН 7704028300 / КПП 781501001'
  },
  {
    org: 'АО «Завод Компрессор»',
    position: 'Главный инженеру',
    name: 'Сидорову Сергею Анатольевичу',
    address: '195009, г. Санкт-Петербург, Большой Сампсониевский пр., д. 45',
    inn: 'ИНН 7802001122'
  },
  {
    org: 'ООО «Промышленное Оборудование»',
    position: 'Начальнику отдела снабжения',
    name: 'Васильеву В. В.',
    address: '101000, г. Москва, ул. Мясницкая, д. 18',
    inn: 'ИНН 7701998877'
  }
];

// Helper to parse HTML content into editable multiline text
const htmlToText = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '');
};

// Helper to convert multiline text back into clean HTML <p> tags preserving spaces
const textToHtml = (text: string): string => {
  if (!text) return '';
  const blocks = text.split(/\n\s*\n/);
  return blocks
    .map(block => {
      if (!block) return '';
      const formatted = block.replace(/\n/g, '<br/>');
      return `<p>${formatted}</p>`;
    })
    .join('');
};

export const DocumentForm: React.FC<DocumentFormProps> = ({ 
  data, 
  onChange, 
  onOpenAiAssistant, 
  onOpenEmployeeModal, 
  employees,
  userRole,
  onRequestAdminAuth
}) => {
  const isAdmin = userRole === 'admin';
  const employeeList = employees && employees.length > 0 ? employees : TEPLOMASH_EMPLOYEES;
  const isInternal = data.recipient.recipientType !== 'external';

  const currentDocTypes = isInternal ? INTERNAL_DOC_TYPES : EXTERNAL_DOC_TYPES;

  const [customType, setCustomType] = useState(
    !currentDocTypes.includes(data.docType) ? data.docType : ''
  );

  const [rawText, setRawText] = useState(() => htmlToText(data.content));

  // Document Number Generator & Department Sequential Registry States
  const parsedRef = parseRefNumber(data.refNumber);
  const [deptCounters, setDeptCounters] = useState<DeptCounters>(() => getDeptCounters());
  const [registryList, setRegistryList] = useState<RegisteredDocument[]>(() => getDocumentRegistry());
  const [isCountersModalOpen, setIsCountersModalOpen] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<'log' | 'counters'>('log');
  const [registrySearch, setRegistrySearch] = useState<string>('');
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);

  const [selectedDeptCode, setSelectedDeptCode] = useState<string>(() => {
    if (parsedRef?.code) return parsedRef.code;
    return guessDepartmentCode(data.signature.senderDepartment, data.signature.senderPosition);
  });

  const [seqIndex, setSeqIndex] = useState<number>(() => {
    if (parsedRef?.seq) return parsedRef.seq;
    return getNextDepartmentSeq(selectedDeptCode);
  });

  // Reload counter when department code changes
  useEffect(() => {
    if (!parsedRef?.seq) {
      const nextSeq = getNextDepartmentSeq(selectedDeptCode);
      setSeqIndex(nextSeq);
    }
  }, [selectedDeptCode]);

  // Keep department code in sync with composer/sender department
  useEffect(() => {
    if (data.signature.senderDepartment || data.signature.senderPosition) {
      const guessed = guessDepartmentCode(data.signature.senderDepartment, data.signature.senderPosition);
      setSelectedDeptCode(guessed);
      setSeqIndex(getNextDepartmentSeq(guessed));
    }
  }, [data.signature.senderDepartment, data.signature.senderPosition]);

  const handlePublishAndRegisterDocument = () => {
    const todayDate = new Date().toLocaleDateString('ru-RU');
    const deptCodeToUse = guessDepartmentCode(data.signature.senderDepartment, data.signature.senderPosition);

    // Unique registration in database taking into account date & department code
    const { registeredDoc, wasAdjustedForUniqueness } = registerDocumentInDb({
      dateStr: todayDate,
      deptCode: deptCodeToUse,
      composerName: data.signature.senderName || 'Не указан',
      composerDept: data.signature.senderDepartment || data.signature.senderPosition || 'Дирекция',
      recipientName: data.recipient.name ? `${data.recipient.organization || ''} (${data.recipient.name})` : 'Внутренний адресат',
      subject: data.docSubject || data.docType || 'Официальный документ',
      role: isAdmin ? 'admin' : 'user'
    });

    const publishedTimestamp = new Date().toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    onChange({
      ...data,
      date: todayDate,
      refNumber: registeredDoc.regNumber,
      isPublished: true,
      publishedAt: publishedTimestamp
    });

    setDeptCounters(getDeptCounters());
    setRegistryList(getDocumentRegistry());
    setSelectedDeptCode(deptCodeToUse);
    setSeqIndex(registeredDoc.seq + 1);

    if (wasAdjustedForUniqueness) {
      setNotifyMsg(`ОПУБЛИКОВАНО! Уникальный № ${registeredDoc.regNumber} зафиксирован в базе (присвоен следующий свободный №)`);
    } else {
      setNotifyMsg(`ОПУБЛИКОВАНО! Письмо зарегистрировано под № ${registeredDoc.regNumber} и занесено в реестр.`);
    }
    setTimeout(() => setNotifyMsg(null), 5000);
  };

  // Sync raw text when external content changes (e.g. AI or preset load)
  useEffect(() => {
    const currentGeneratedHtml = textToHtml(rawText);
    if (data.content !== currentGeneratedHtml) {
      setRawText(htmlToText(data.content));
    }
  }, [data.content]);

  const handleTextareaChange = (val: string) => {
    setRawText(val);
    const newHtml = textToHtml(val);
    onChange({ ...data, content: newHtml });
  };

  const handleRecipientChange = (field: keyof typeof data.recipient, value: string) => {
    onChange({
      ...data,
      recipient: {
        ...data.recipient,
        [field]: value
      }
    });
  };

  const handleDocTypeSelect = (type: string) => {
    if (type === 'CUSTOM') {
      onChange({ ...data, docType: customType || 'ДОКУМЕНТ' });
    } else {
      onChange({ ...data, docType: type });
    }
  };

  const handleInsertTag = (tagText: string) => {
    const updatedContent = data.content ? `${data.content}\n<p>${tagText}</p>` : `<p>${tagText}</p>`;
    onChange({ ...data, content: updatedContent });
  };

  return (
    <div className="space-y-6">
      {/* PUBLISHED & REGISTERED STATUS BANNER */}
      {data.isPublished && (
        <div className="bg-emerald-900 text-white p-4 rounded-xl shadow-md border border-emerald-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800/80 rounded-lg shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm tracking-wide text-white">ДОКУМЕНТ ОФИЦИАЛЬНО ОПУБЛИКОВАН И ЗАРЕГИСТРИРОВАН</h3>
                <span className="px-2.5 py-0.5 bg-emerald-400/20 text-emerald-200 text-xs font-mono font-bold rounded uppercase tracking-wider border border-emerald-400/30">
                  № {data.refNumber}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1 leading-normal">
                Зафиксирован в Едином реестре {data.publishedAt || data.date}. Редактирование текста и реквизитов заблокировано.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onChange({ ...data, isPublished: false })}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Снять с публикации (Админ)</span>
            </button>
          )}
        </div>
      )}

      {/* 1. Recipient Block ("Кому") */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <div className="w-5 h-5 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <span>1. Кому адресуется документ</span>
          </div>

          {isInternal && onOpenEmployeeModal && (
            <button
              type="button"
              onClick={onOpenEmployeeModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 rounded transition-colors border border-slate-200"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              База сотрудников
            </button>
          )}
        </div>

        {/* MODE SELECTOR: Internal Employee vs External Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-slate-100/90 rounded-lg border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              onChange({
                ...data,
                recipient: {
                  ...data.recipient,
                  recipientType: 'internal',
                  organization: 'АО «НПО «Тепломаш»'
                },
                docType: data.docType === 'ИСХОДЯЩЕЕ ПИСЬМО' || data.docType === 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ' ? 'СЛУЖЕБНАЯ ЗАПИСКА' : data.docType
              });
            }}
            className={`flex items-start gap-2.5 p-2.5 rounded-md text-left transition-all ${
              isInternal
                ? 'bg-white text-indigo-950 shadow-sm font-bold border border-indigo-200/80 ring-1 ring-indigo-500/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium'
            }`}
          >
            <div className={`p-2 rounded-md shrink-0 mt-0.5 ${isInternal ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">Сотруднику компании</div>
              <div className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                Внутренняя служебная записка или заявление работнику предприятия
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onChange({
                ...data,
                recipient: {
                  ...data.recipient,
                  recipientType: 'external',
                  organization: data.recipient.organization === 'АО «НПО «Тепломаш»' ? 'ООО «ТехноПром»' : data.recipient.organization
                },
                docType: data.docType === 'СЛУЖЕБНАЯ ЗАПИСКА' ? 'ИСХОДЯЩЕЕ ПИСЬМО' : data.docType
              });
            }}
            className={`flex items-start gap-2.5 p-2.5 rounded-md text-left transition-all ${
              !isInternal
                ? 'bg-white text-indigo-950 shadow-sm font-bold border border-indigo-200/80 ring-1 ring-indigo-500/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium'
            }`}
          >
            <div className={`p-2 rounded-md shrink-0 mt-0.5 ${!isInternal ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">Сторонней организации</div>
              <div className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                Исходящее деловое письмо, запрос или коммерческое предложение
              </div>
            </div>
          </button>
        </div>

        {/* PRESET CHIPS & FUNCTIONALITY ACCORDING TO RECIPIENT TYPE */}
        {isInternal ? (
          /* Internal Employee Quick Chips */
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-md p-2.5 space-y-2">
            <div className="text-[11px] font-semibold text-indigo-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Быстрый выбор сотрудника предприятия («Кому»):</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {employeeList.slice(0, 6).map(emp => {
                const pos = emp.dativePosition || emp.position;
                const formattedPos = (emp.department && !pos.toLowerCase().includes(emp.department.toLowerCase()))
                  ? `${pos} (${emp.department})`
                  : pos;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      onChange({
                        ...data,
                        recipient: {
                          ...data.recipient,
                          recipientType: 'internal',
                          position: formattedPos,
                          organization: emp.organization,
                          name: emp.dativeName || emp.shortName,
                          email: emp.email
                        }
                      });
                    }}
                    className="px-2 py-1 text-[11px] bg-white hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 font-medium rounded border border-indigo-200 transition-colors shadow-2xs"
                  >
                    {emp.shortName} ({emp.department})
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* External Organization Presets */
          <div className="bg-amber-50/50 border border-amber-200/70 rounded-md p-2.5 space-y-2">
            <div className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-600" />
              <span>Быстрые шаблоны сторонних организаций и контрагентов:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXTERNAL_COMPANY_PRESETS.map((comp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange({
                      ...data,
                      recipient: {
                        recipientType: 'external',
                        organization: comp.org,
                        position: comp.position,
                        name: comp.name,
                        address: comp.address,
                        inn: comp.inn
                      }
                    });
                  }}
                  className="px-2 py-1 text-[11px] bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-medium rounded border border-amber-200 transition-colors shadow-2xs"
                >
                  {comp.org}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* INPUT FIELDS TAILORED FOR RECIPIENT TYPE */}
        <div className="space-y-3">
          {isInternal ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Должность сотрудника (в дательном падеже)
                </label>
                <input
                  type="text"
                  value={data.recipient.position}
                  onChange={(e) => handleRecipientChange('position', e.target.value)}
                  placeholder="Например: Начальнику бюро автоматики"
                  className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Организация / Подразделение
                </label>
                <input
                  type="text"
                  value={data.recipient.organization}
                  onChange={(e) => handleRecipientChange('organization', e.target.value)}
                  placeholder="Например: АО «НПО «Тепломаш»"
                  className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-sans font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  ФИО сотрудника (в дательном падеже)
                </label>
                <input
                  type="text"
                  value={data.recipient.name}
                  onChange={(e) => handleRecipientChange('name', e.target.value)}
                  placeholder="Например: Романову А. А."
                  className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-sans"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Название сторонней компании / Организации
                </label>
                <input
                  type="text"
                  value={data.recipient.organization}
                  onChange={(e) => handleRecipientChange('organization', e.target.value)}
                  placeholder="Например: ООО «ТехноПром» или ПАО «Газпром»"
                  className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-sans font-bold text-indigo-950"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Должность адресата
                  </label>
                  <input
                    type="text"
                    value={data.recipient.position}
                    onChange={(e) => handleRecipientChange('position', e.target.value)}
                    placeholder="Например: Генеральному директору"
                    className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    ФИО адресата (в дательном падеже)
                  </label>
                  <input
                    type="text"
                    value={data.recipient.name}
                    onChange={(e) => handleRecipientChange('name', e.target.value)}
                    placeholder="Например: Петрову П. В."
                    className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Почтовый / Юридический адрес (опционально)</span>
                </label>
                <input
                  type="text"
                  value={data.recipient.address || ''}
                  onChange={(e) => handleRecipientChange('address', e.target.value)}
                  placeholder="Например: 190000, г. Санкт-Петербург, Невский пр., д. 10"
                  className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  ИНН / КПП организации (опционально)
                </label>
                <input
                  type="text"
                  value={data.recipient.inn || ''}
                  onChange={(e) => handleRecipientChange('inn', e.target.value)}
                  placeholder="Например: ИНН 7801234567 / КПП 780101001"
                  className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-sans text-slate-600"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Document Type & Subject ("Тип (заголовок)") */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5">
          <div className="w-5 h-5 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span>2. Вид документа и тема</span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Рекомендуемые виды документов ({isInternal ? 'Внутренние' : 'Внешние'})
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {currentDocTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleDocTypeSelect(type)}
                  className={`px-2.5 py-1 text-[11px] rounded border font-semibold transition-all ${
                    data.docType === type
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={data.docType}
                onChange={(e) => onChange({ ...data, docType: e.target.value.toUpperCase() })}
                placeholder="Или введите свой заголовок (например: УВЕДОМЛЕНИЕ)"
                className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-semibold uppercase tracking-wide"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Тема / Заголовок к тексту документа
            </label>
            <input
              type="text"
              value={data.docSubject}
              onChange={(e) => onChange({ ...data, docSubject: e.target.value })}
              placeholder={isInternal ? "Например: О согласовании отпуска / закупки оборудования" : "Например: О поставке оборудования по договору №12/26"}
              className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. Date & Number Details */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <div className="w-5 h-5 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span>3. Дата, номер и место составления</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isAdmin ? (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-600" />
                Админ: Ручное редактирование разрешено
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                Пользователь: Ручное редактирование заблокировано
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <span>Дата документа</span>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold">
                  🔒 Фиксированная
                </span>
              </label>
            </div>
            <input
              type="text"
              value={data.date || new Date().toLocaleDateString('ru-RU')}
              readOnly
              disabled
              placeholder={new Date().toLocaleDateString('ru-RU')}
              className="w-full text-xs p-2.5 rounded border border-slate-200 bg-slate-100 text-slate-700 font-bold cursor-not-allowed select-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Дата устанавливается автоматически равной текущей дате ({new Date().toLocaleDateString('ru-RU')}). Редактирование даты закрыто.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <span>Исходящий / Регистрационный №</span>
                {!isAdmin && <span title="Присваивается автоматически при публикации"><Lock className="w-3 h-3 text-amber-600" /></span>}
              </label>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={data.refNumber || (data.isPublished ? '' : 'Присваивается при публикации')}
                readOnly
                disabled
                className="w-full text-xs p-2.5 rounded border border-indigo-200 bg-indigo-50/50 text-indigo-950 font-mono font-bold tracking-wide select-none cursor-not-allowed"
              />
              <div className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4 text-indigo-600/70" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {data.isPublished 
                ? `Зафиксирован уникальный № ${data.refNumber} в Едином реестре`
                : 'Номер генерируется автоматически из базы сотрудников и единого реестра при публикации'
              }
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Ссылка на входящий №</label>
            <input
              type="text"
              value={data.inRefNumber || ''}
              onChange={(e) => !data.isPublished && onChange({ ...data, inRefNumber: e.target.value })}
              readOnly={data.isPublished && !isAdmin}
              placeholder="На № 11/07 от 28.07.2026г."
              className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Город / Место</label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => !data.isPublished && onChange({ ...data, city: e.target.value })}
              readOnly={data.isPublished && !isAdmin}
              placeholder="г. Санкт-Петербург"
              className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* AUTOMATIC DOCUMENT NUMBER GENERATOR PANEL */}
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3.5 space-y-3 mt-2 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
            <div>
              <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-indigo-600" />
                <span>Автоматический генератор и реестр уникальных номеров</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-normal mt-0.5">
                Код подразделения и сквозной порядковый номер автоматически определяются из базы сотрудников
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeptCounters(getDeptCounters());
                setRegistryList(getDocumentRegistry());
                setIsCountersModalOpen(true);
              }}
              className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>Единый реестр писем ({registryList.length})</span>
            </button>
          </div>

          {/* COMPOSER / SENDER DETECTED INFO BAR */}
          <div className="bg-white/90 border border-indigo-100 rounded-md p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-600">Составитель из базы:</span>
              <span className="font-bold text-slate-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {data.signature.senderName || 'Не указан'} ({data.signature.senderDepartment || data.signature.senderPosition || 'Дирекция'})
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-600">Авто-код подразделения:</span>
              <span className="font-bold text-indigo-950 bg-indigo-100 px-2.5 py-0.5 rounded border border-indigo-200 font-mono">
                [{selectedDeptCode}] — {DEPARTMENT_CODES.find(d => d.code === selectedDeptCode)?.name.split(',')[0]}
              </span>
            </div>
          </div>

          {/* NOTIFICATION FEEDBACK */}
          {notifyMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold p-2.5 rounded-md flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notifyMsg}</span>
            </div>
          )}

          {/* Action & Result Preview Bar */}
          <div className="pt-2 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Прогноз уникального регистрационного №:</span>
              <span className="px-2.5 py-1 bg-indigo-950 text-indigo-100 font-mono text-xs font-bold rounded tracking-wider shadow-2xs">
                {generateDocumentNumber(data.date || new Date().toLocaleDateString('ru-RU'), seqIndex, selectedDeptCode)}
              </span>
            </div>

            {!data.isPublished && (
              <button
                type="button"
                onClick={handlePublishAndRegisterDocument}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>Опубликовать и занести в базу писем</span>
              </button>
            )}
          </div>
        </div>

        {/* REGISTRY / COUNTERS MODAL */}
        {isCountersModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="bg-indigo-950 text-white p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">Единый реестр писем АО «НПО «Тепломаш»</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wide border ${
                        isAdmin 
                          ? 'bg-amber-400/20 text-amber-300 border-amber-400/40' 
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {isAdmin ? 'Администратор' : 'Пользователь (Просмотр)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-300 font-normal mt-0.5">
                      База данных выданных регистрационных номеров и сквозных счетчиков
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCountersModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 pt-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('log')}
                    className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
                      activeModalTab === 'log'
                        ? 'bg-white text-indigo-950 border-slate-200 shadow-2xs'
                        : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Archive className="w-3.5 h-3.5 text-indigo-600" />
                      Журнал регистраций ({registryList.length})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isAdmin) {
                        if (confirm('Редактирование сквозных номеров доступно только Администратору. Авторизоваться?')) {
                          setIsCountersModalOpen(false);
                          onRequestAdminAuth?.();
                        }
                        return;
                      }
                      setActiveModalTab('counters');
                    }}
                    className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x ${
                      activeModalTab === 'counters'
                        ? 'bg-white text-indigo-950 border-slate-200 shadow-2xs'
                        : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isAdmin ? (
                        <Settings className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      Редактор счетчиков {isAdmin ? '(Админ)' : '🔒'}
                    </span>
                  </button>
                </div>

                {!isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCountersModalOpen(false);
                      onRequestAdminAuth?.();
                    }}
                    className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-white px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors"
                  >
                    <KeyRound className="w-3 h-3 text-indigo-600" />
                    <span>Войти как Администратор</span>
                  </button>
                )}
              </div>

              {/* Modal Content Body */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {activeModalTab === 'log' ? (
                  <div className="space-y-3">
                    {/* Search & Stats Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={registrySearch}
                          onChange={(e) => setRegistrySearch(e.target.value)}
                          placeholder="Поиск по №, дате, составителю или теме..."
                          className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      {isAdmin && registryList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Вы уверены, что хотите полностью очистить весь журнал писем?')) {
                              clearDocumentRegistryDb();
                              setRegistryList([]);
                            }
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Очистить базу</span>
                        </button>
                      )}
                    </div>

                    {/* Registry Entries Table / List */}
                    {registryList.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-1">
                        <Archive className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-semibold text-slate-600">В базе пока нет зарегистрированных писем</p>
                        <p className="text-[11px] text-slate-400">Нажмите «Присвоить и зарегистрировать уникальный №», чтобы внести первое письмо в реестр</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {registryList
                          .filter(doc => {
                            if (!registrySearch.trim()) return true;
                            const query = registrySearch.toLowerCase();
                            return (
                              doc.regNumber.toLowerCase().includes(query) ||
                              doc.date.toLowerCase().includes(query) ||
                              doc.composerName.toLowerCase().includes(query) ||
                              doc.composerDept.toLowerCase().includes(query) ||
                              doc.subject.toLowerCase().includes(query) ||
                              doc.recipientName.toLowerCase().includes(query)
                            );
                          })
                          .map((doc) => (
                            <div key={doc.id} className="p-3 bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 rounded-lg transition-colors flex flex-wrap items-center justify-between gap-2">
                              <div className="space-y-1 flex-1 min-w-[240px]">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-100 font-mono font-bold text-xs rounded tracking-wider">
                                    № {doc.regNumber}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-700">
                                    от {doc.date}
                                  </span>
                                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                    {doc.deptName}
                                  </span>
                                </div>

                                <div className="text-xs text-slate-800 font-medium">
                                  <span className="text-slate-500 font-normal">Тема:</span> {doc.subject}
                                </div>

                                <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                                  <span>Составитель: <strong className="text-slate-700">{doc.composerName}</strong> ({doc.composerDept})</span>
                                  <span>Получатель: <strong className="text-slate-700">{doc.recipientName}</strong></span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">
                                  {doc.registeredAt}
                                </span>

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Удалить регистрационный № ${doc.regNumber} из базы?`)) {
                                        deleteRegisteredDocumentFromDb(doc.id);
                                        setRegistryList(getDocumentRegistry());
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Удалить номер из реестра"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* TAB 2: COUNTER EDITOR (ADMIN ONLY) */
                  <div className="space-y-4">
                    {!isAdmin ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3">
                        <Lock className="w-8 h-8 text-amber-600 mx-auto" />
                        <div>
                          <h4 className="font-bold text-amber-950 text-sm">Доступ ограничен</h4>
                          <p className="text-xs text-amber-800 mt-1 max-w-md mx-auto">
                            Редактирование счетчиков сквозной нумерации писем доступно только Администратору. Обычные пользователи могут регистрировать письма в автоматическом режиме.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCountersModalOpen(false);
                            onRequestAdminAuth?.();
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Войти как Администратор</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-900 flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Режим Администратора:</strong> Вы можете вручную изменить следующий порядковый сквозной номер для любого структурного подразделения. Номер автоматически зафиксируется в реестре.
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {DEPARTMENT_CODES.map((dept) => {
                            const currentSeq = deptCounters[dept.code] || 1;
                            return (
                              <div key={dept.code} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-950 font-mono font-bold text-xs rounded border border-indigo-200">
                                      [{dept.code}]
                                    </span>
                                    <span className="font-bold text-xs text-slate-800">{dept.name.split(',')[0]}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">{dept.description}</div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="9999"
                                    value={currentSeq}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                      setDepartmentSeq(dept.code, val);
                                      setDeptCounters(getDeptCounters());
                                    }}
                                    className="w-16 text-xs p-1.5 rounded border border-slate-300 bg-white font-bold text-center text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
                {activeModalTab === 'counters' && isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Сбросить все сквозные счетчики подразделений на №1?')) {
                        DEPARTMENT_CODES.forEach(d => setDepartmentSeq(d.code, 1));
                        setDeptCounters(getDeptCounters());
                      }
                    }}
                    className="px-3 py-1.5 text-xs text-red-600 hover:text-red-800 font-semibold bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Сбросить все счетчики на №1</span>
                  </button>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCountersModalOpen(false)}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Document Body Text */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <div className="w-5 h-5 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
            <span>4. Текст документа</span>
          </div>
        </div>

        {/* Quick Snippets & Editor */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mb-1">
            <span>Официальные клише ({isInternal ? 'для внутренних документов' : 'для внешних писем'}):</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {isInternal ? (
              <>
                <button
                  type="button"
                  onClick={() => handleInsertTag('Довожу до Вашего сведения, что...')}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded border border-slate-200 transition-colors"
                >
                  «Довожу до Вашего сведения...»
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('Прошу Вас согласовать проведение работ по...')}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded border border-slate-200 transition-colors"
                >
                  «Прошу Вас согласовать...»
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('Направляю на рассмотрение проект документа...')}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded border border-slate-200 transition-colors"
                >
                  «Направляю на рассмотрение...»
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleInsertTag('Выражаем Вам свое уважение и настоящим информируем о том, что...')}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded border border-slate-200 transition-colors"
                >
                  «Выражаем Вам свое уважение...»
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('В ответ на Ваш запрос №... направляем сведения по контракту.')}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded border border-slate-200 transition-colors"
                >
                  «В ответ на Ваш запрос №...»
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('Просим Вас рассмотреть коммерческое предложение на поставку продукции.')}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded border border-slate-200 transition-colors"
                >
                  «Просим Вас рассмотреть предложение...»
                </button>
              </>
            )}
          </div>

          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => !data.isPublished && handleTextareaChange(e.target.value)}
            readOnly={data.isPublished && !isAdmin}
            placeholder="Введите основной текст документа. Обычный перенос строки (Enter) сохраняет абзац, а пустая строка между абзацами разделяет блоки."
            className="w-full text-xs p-3 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all leading-relaxed font-sans disabled:bg-slate-50"
          />
          <p className="text-[11px] text-slate-400">
            Подсказка: разделяйте абзацы пустой строкой (двойной Enter). В предпросмотре ГОСТ абзацы автоматически оформляются красной строкой (отступом).
          </p>
        </div>
      </div>

      {/* 5. PUBLISH DOCUMENT ACTION CARD */}
      <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4 shadow-lg border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">5. Публикация и регистрация документа в базе</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              При нажатии «Опубликовать» письму автоматически присваивается уникальный регистрационный номер из Единого реестра (учитывая текущую дату и код подразделения), и оно сохраняется в базу писем. Редактирование после публикации закрыто.
            </p>
          </div>

          {!data.isPublished ? (
            <button
              type="button"
              onClick={handlePublishAndRegisterDocument}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Опубликовать и занести в базу писем</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs bg-emerald-950/80 px-4 py-2.5 rounded-xl border border-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Документ зарегистрирован под № {data.refNumber}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

