import React, { useRef, useState, useEffect } from 'react';
import { SignatureConfig, SavedSignatureItem } from '../types';
import { SignatureCanvasModal } from './SignatureCanvasModal';
import { SAMPLE_STAMPS } from '../constants/presets';
import { TEPLOMASH_EMPLOYEES } from '../constants/teplomashEmployees';
import { buildStampSvg, downloadSvgFile } from '../utils/stampUtils';
import { UserCheck, PenTool, Upload, Trash2, CheckCircle2, ShieldCheck, Building2, Users, BookmarkCheck, Plus, Check, FolderHeart, Sparkles, Download } from 'lucide-react';

const SAVED_SIGNATURES_KEY = 'doc_gen_saved_signatures_v2';

const SAMPLE_SAVED_SIGNATURES: SavedSignatureItem[] = [
  {
    id: 'sig-sample-1',
    title: 'Факсимиле: Орлов Д.С. (Генеральный директор)',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="80" viewBox="0 0 220 80"><path d="M 20,50 Q 30,10 45,40 T 70,30 T 90,60 T 120,20 T 150,50 T 180,35" fill="none" stroke="%231e3a8a" stroke-width="3" stroke-linecap="round"/><path d="M 35,45 Q 60,65 100,55 T 160,40" fill="none" stroke="%231e3a8a" stroke-width="2" stroke-linecap="round"/><path d="M 110,25 Q 130,15 140,30" fill="none" stroke="%231e3a8a" stroke-width="2.5" stroke-linecap="round"/></svg>',
    createdAt: '01.08.2026',
    senderName: 'Орлов Д.С.',
    senderPosition: 'Генеральный директор',
    senderDepartment: 'Дирекция'
  },
  {
    id: 'sig-sample-2',
    title: 'Факсимиле: Смирнов А.В. (Главный инженер)',
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="80" viewBox="0 0 220 80"><path d="M 15,40 C 30,10 40,65 55,30 C 70,10 80,55 95,35 L 125,50 M 110,30 C 130,20 150,45 175,30" fill="none" stroke="%231d4ed8" stroke-width="2.8" stroke-linecap="round"/><path d="M 40,55 Q 90,20 160,50" fill="none" stroke="%231d4ed8" stroke-width="2" stroke-linecap="round"/></svg>',
    createdAt: '03.08.2026',
    senderName: 'Смирнов А.В.',
    senderPosition: 'Главный инженер',
    senderDepartment: 'Служба главного инженера'
  }
];

interface SignatureSettingsProps {
  signature: SignatureConfig;
  onChange: (signature: SignatureConfig) => void;
  onOpenEmployeeModal?: () => void;
  employees?: typeof TEPLOMASH_EMPLOYEES;
}

export const SignatureSettings: React.FC<SignatureSettingsProps> = ({ signature, onChange, onOpenEmployeeModal, employees }) => {
  const employeeList = employees && employees.length > 0 ? employees : TEPLOMASH_EMPLOYEES;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [showStampEditor, setShowStampEditor] = useState(false);

  // Saved Signatures state & localStorage syncing
  const [savedSignaturesList, setSavedSignaturesList] = useState<SavedSignatureItem[]>(() => {
    const saved = localStorage.getItem(SAVED_SIGNATURES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { return SAMPLE_SAVED_SIGNATURES; }
    }
    return SAMPLE_SAVED_SIGNATURES;
  });

  useEffect(() => {
    localStorage.setItem(SAVED_SIGNATURES_KEY, JSON.stringify(savedSignaturesList));
  }, [savedSignaturesList]);

  const [newSigTitle, setNewSigTitle] = useState('');
  const [saveSuccessNotify, setSaveSuccessNotify] = useState(false);

  const handleSaveCurrentSignatureToGallery = (customTitle?: string) => {
    if (!signature.imageUrl) return;

    const title = customTitle || newSigTitle.trim() || `Подпись: ${signature.senderName || 'Сотрудник'} (${new Date().toLocaleDateString('ru-RU')})`;
    const newSavedItem: SavedSignatureItem = {
      id: `saved-sig-${Date.now()}`,
      title,
      imageUrl: signature.imageUrl,
      createdAt: new Date().toLocaleDateString('ru-RU'),
      senderName: signature.senderName,
      senderPosition: signature.senderPosition,
      senderDepartment: signature.senderDepartment
    };

    const updated = [newSavedItem, ...savedSignaturesList];
    setSavedSignaturesList(updated);
    setNewSigTitle('');
    setSaveSuccessNotify(true);
    setTimeout(() => setSaveSuccessNotify(false), 2500);
  };

  const handleDeleteSavedSignature = (id: string) => {
    const updated = savedSignaturesList.filter(item => item.id !== id);
    setSavedSignaturesList(updated);
  };

  const handleApplySavedSignature = (item: SavedSignatureItem) => {
    onChange({
      ...signature,
      type: 'image',
      imageUrl: item.imageUrl,
      senderName: item.senderName || signature.senderName,
      senderPosition: item.senderPosition || signature.senderPosition,
      senderDepartment: item.senderDepartment || signature.senderDepartment
    });
  };

  // Custom stamp form states
  const [stampOrg, setStampOrg] = useState('АКЦИОНЕРНОЕ ОБЩЕСТВО «НПО «ТЕПЛОМАШ»');
  const [stampCityOgrn, setStampCityOgrn] = useState('САНКТ-ПЕТЕРБУРГ * ОГРН 1027809212573');
  const [stampDepartment, setStampDepartment] = useState(signature.senderDepartment || 'Бюро автоматики');
  const [stampPosition, setStampPosition] = useState(signature.senderPosition || 'Ведущий инженер-программист');
  const [stampCenterSub, setStampCenterSub] = useState('ДЛЯ ДОКУМЕНТОВ');
  const [stampColor, setStampColor] = useState('#1d4ed8');

  // Auto-sync stamp department & position when sender info is updated from employee selector
  useEffect(() => {
    if (signature.senderDepartment) {
      setStampDepartment(signature.senderDepartment);
    }
    if (signature.senderPosition) {
      setStampPosition(signature.senderPosition);
    }
  }, [signature.senderDepartment, signature.senderPosition]);

  const handleApplyCustomStamp = () => {
    const customSvg = buildStampSvg(stampOrg, stampCityOgrn, stampDepartment, stampPosition, stampCenterSub, stampColor);
    onChange({
      ...signature,
      showStamp: true,
      stampImageUrl: customSvg
    });
  };

  const handleSignatureImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const uploadedUrl = evt.target.result as string;
          onChange({
            ...signature,
            type: 'image',
            imageUrl: uploadedUrl
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          onChange({
            ...signature,
            showStamp: true,
            stampImageUrl: evt.target.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sender Details ("Кто написал письмо") */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <div className="w-5 h-5 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserCheck className="w-3 h-3" />
            </div>
            <span>Кто написал письмо (Составитель / Подписант)</span>
          </div>

          {onOpenEmployeeModal && (
            <button
              type="button"
              onClick={onOpenEmployeeModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 rounded transition-colors border border-slate-200"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              База Тепломаш
            </button>
          )}
        </div>

        {/* Quick Teplomash employee selection for Sender */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-2">
          <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-slate-500" />
              <span>Выбрать подписанта из базы (отдел, должность, ФИО):</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {employeeList.slice(0, 6).map(emp => (
              <button
                key={emp.id}
                type="button"
                onClick={() => {
                  const stampSvg = buildStampSvg(
                    stampOrg,
                    stampCityOgrn,
                    emp.department,
                    emp.position,
                    stampCenterSub,
                    stampColor
                  );
                  onChange({
                    ...signature,
                    senderPosition: emp.position,
                    senderDepartment: emp.department,
                    senderOrganization: emp.organization,
                    senderName: emp.shortName,
                    senderEmail: emp.email,
                    showStamp: true,
                    stampImageUrl: stampSvg
                  });
                }}
                className="px-2 py-1 text-[11px] bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-medium rounded border border-slate-200 hover:border-indigo-200 transition-colors shadow-2xs text-left"
              >
                <span className="font-bold">{emp.shortName}</span>
                <span className="text-slate-400 mx-1">•</span>
                <span className="text-indigo-600 font-semibold">{emp.department}</span>
                <span className="text-slate-500"> ({emp.position})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Отдел / Подразделение</label>
              <input
                type="text"
                value={signature.senderDepartment || ''}
                onChange={(e) => onChange({ ...signature, senderDepartment: e.target.value })}
                placeholder="Например: Бюро автоматики, Лаборатория, Бухгалтерия"
                className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-sans font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Должность подписанта</label>
              <input
                type="text"
                value={signature.senderPosition}
                onChange={(e) => onChange({ ...signature, senderPosition: e.target.value })}
                placeholder="Например: Ведущий инженер-программист"
                className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Инициалы и фамилия (ФИО)</label>
              <input
                type="text"
                value={signature.senderName}
                onChange={(e) => onChange({ ...signature, senderName: e.target.value })}
                placeholder="Например: Д.С. Орлов"
                className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Наименование организации</label>
              <input
                type="text"
                value={signature.senderOrganization}
                onChange={(e) => onChange({ ...signature, senderOrganization: e.target.value })}
                placeholder="Например: АО «НПО «Тепломаш»"
                className="w-full text-xs p-2.5 rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-sans"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Signature Graphic Settings */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5">
          <div className="w-5 h-5 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PenTool className="w-3 h-3" />
          </div>
          <span>Вид подписи в документе</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...signature, type: 'placeholder' })}
            className={`p-3 rounded border text-center transition-all flex flex-col items-center gap-1.5 ${
              signature.type === 'placeholder'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="w-full border-b border-dashed border-slate-400 py-1 text-[11px] text-slate-400">________</div>
            <span className="text-xs font-semibold text-slate-800">Место для личной подписи</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCanvasOpen(true)}
            className={`p-3 rounded border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
              signature.type === 'canvas' || (signature.type === 'image' && signature.imageUrl)
                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <PenTool className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-800">Нарисовать на экране</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded border border-slate-200 hover:border-slate-300 bg-white text-center transition-all flex flex-col items-center justify-center gap-1.5"
          >
            <Upload className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-800">Загрузить сканированную PNG</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleSignatureImageUpload}
          className="hidden"
        />

        {/* Display Current Signature Graphic & Save to Library Option */}
        {signature.imageUrl && (
          <div className="space-y-3">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-24 h-12 bg-white rounded border border-slate-200 p-1 flex items-center justify-center shrink-0">
                  <img src={signature.imageUrl} alt="Электронная подпись" className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Подпись добавлена в документ
                  </span>
                  <p className="text-[11px] text-slate-500">Появится в нижней части бланка</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...signature, imageUrl: null, type: 'placeholder' })}
                  className="text-red-600 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-xs font-semibold transition-colors flex items-center gap-1"
                  title="Удалить подпись"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Удалить
                </button>
              </div>
            </div>

            {/* Save current signature to gallery box */}
            <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                  Сохранить эту подпись в базу для многократного использования
                </span>
                {saveSuccessNotify && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1 animate-fadeIn">
                    <Check className="w-3 h-3" /> Сохранено!
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSigTitle}
                  onChange={(e) => setNewSigTitle(e.target.value)}
                  placeholder={`Название (например: Подпись ${signature.senderName || 'Орлова Д.С.'})`}
                  className="flex-1 text-xs p-2 rounded border border-indigo-200 bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSaveCurrentSignatureToGallery()}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded transition-all flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Сохранить в базу
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Saved Signatures Gallery Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <div className="w-5 h-5 rounded-sm bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderHeart className="w-3.5 h-3.5" />
            </div>
            <span>База сохраненных подписей ({savedSignaturesList.length})</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Выберите сохраненную подпись в 1 клик</span>
        </div>

        {savedSignaturesList.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            У вас пока нет сохраненных подписей. Нарисуйте или загрузите подпись выше и нажмите «Сохранить в базу».
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedSignaturesList.map((saved) => (
              <div
                key={saved.id}
                className={`border rounded-xl p-3 transition-all flex flex-col justify-between bg-white hover:shadow-xs ${
                  signature.imageUrl === saved.imageUrl
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]" title={saved.title}>
                      {saved.title}
                    </span>
                    <span className="text-[10px] text-slate-400">{saved.createdAt}</span>
                  </div>

                  <div className="h-16 bg-slate-50 rounded-lg border border-slate-200 p-1.5 flex items-center justify-center mb-2 overflow-hidden">
                    <img src={saved.imageUrl} alt={saved.title} className="max-h-full max-w-full object-contain" />
                  </div>

                  {saved.senderName && (
                    <div className="text-[11px] text-slate-500 mb-2">
                      <span className="font-semibold text-slate-700">{saved.senderName}</span>
                      {saved.senderPosition && <span> ({saved.senderPosition})</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleApplySavedSignature(saved)}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                      signature.imageUrl === saved.imageUrl
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200'
                    }`}
                  >
                    {signature.imageUrl === saved.imageUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Активна в документе
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Подставить в документ
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSavedSignature(saved.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Удалить подпись из базы"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stamp / Seal Options */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span>Печать организации (Опционально)</span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={signature.showStamp}
              onChange={(e) => onChange({ ...signature, showStamp: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {signature.showStamp && (
          <div className="space-y-4 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {SAMPLE_STAMPS.map((stamp) => (
                <button
                  key={stamp.id}
                  type="button"
                  onClick={() => {
                    setShowStampEditor(false);
                    onChange({ ...signature, stampImageUrl: stamp.url });
                  }}
                  className={`p-2 rounded-lg border transition-all flex items-center gap-2 ${
                    signature.stampImageUrl === stamp.url && !showStampEditor
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <img src={stamp.url} alt={stamp.name} className="w-7 h-7 object-contain" />
                  <span className="text-xs font-semibold text-slate-800">{stamp.name}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowStampEditor(!showStampEditor)}
                className={`p-2 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  showStampEditor 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                {showStampEditor ? 'Скрыть редактор' : 'Редактировать текст печати'}
              </button>

              <button
                type="button"
                onClick={() => stampInputRef.current?.click()}
                className="p-2 rounded-lg border border-dashed border-slate-300 hover:border-indigo-500 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Загрузить сканированную печать
              </button>

              {signature.stampImageUrl && (
                <button
                  type="button"
                  onClick={() => downloadSvgFile(signature.stampImageUrl!, 'pechat-teplomash.svg')}
                  className="p-2 rounded-lg border border-indigo-200 hover:border-indigo-400 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 transition-all flex items-center gap-1.5 shadow-2xs"
                  title="Скачать печать в векторе (.svg)"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  Скачать печать в .SVG
                </button>
              )}
            </div>

            {/* Interactive Stamp Editor Panel */}
            {showStampEditor && (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Конструктор текста печати организации
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Название организации (по верхнему кругу)</label>
                    <input
                      type="text"
                      value={stampOrg}
                      onChange={(e) => setStampOrg(e.target.value)}
                      placeholder="АКЦИОНЕРНОЕ ОБЩЕСТВО «НПО «ТЕПЛОМАШ»"
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Город и ОГРН (по нижнему кругу)</label>
                    <input
                      type="text"
                      value={stampCityOgrn}
                      onChange={(e) => setStampCityOgrn(e.target.value)}
                      placeholder="САНКТ-ПЕТЕРБУРГ * ОГРН 1027809212573"
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Отдел / Подразделение (в центре)</label>
                    <input
                      type="text"
                      value={stampDepartment}
                      onChange={(e) => setStampDepartment(e.target.value)}
                      placeholder="Например: Бюро автоматики, Лаборатория"
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Должность (в центре)</label>
                    <input
                      type="text"
                      value={stampPosition}
                      onChange={(e) => setStampPosition(e.target.value)}
                      placeholder="Например: Инженер-программист, Ведущий специалист"
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Назначение печати (центр)</label>
                    <input
                      type="text"
                      value={stampCenterSub}
                      onChange={(e) => setStampCenterSub(e.target.value)}
                      placeholder="ДЛЯ ДОКУМЕНТОВ"
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Цвет штампа</label>
                    <select
                      value={stampColor}
                      onChange={(e) => setStampColor(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                    >
                      <option value="#1d4ed8">Синий классический (#1d4ed8)</option>
                      <option value="#1e3a8a">Темно-синий строго (#1e3a8a)</option>
                      <option value="#4c1d95">Фиолетовый гербовый (#4c1d95)</option>
                      <option value="#18181b">Черный графит (#18181b)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const customSvg = buildStampSvg(stampOrg, stampCityOgrn, stampDepartment, stampPosition, stampCenterSub, stampColor);
                      downloadSvgFile(customSvg, `pechat-${stampDepartment || 'teplomash'}.svg`);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-300 hover:border-indigo-300 rounded text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    Скачать созданный .SVG
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyCustomStamp}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Применить обновленную печать
                  </button>
                </div>
              </div>
            )}

            <input
              ref={stampInputRef}
              type="file"
              accept="image/*"
              onChange={handleStampUpload}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Signature Canvas Modal */}
      <SignatureCanvasModal
        isOpen={isCanvasOpen}
        defaultTitle={signature.senderName ? `Факсимиле: ${signature.senderName}` : ''}
        onClose={() => setIsCanvasOpen(false)}
        onSave={(drawnDataUrl, title) => {
          const updatedSig = {
            ...signature,
            type: 'canvas' as const,
            imageUrl: drawnDataUrl
          };
          onChange(updatedSig);
          if (title) {
            handleSaveCurrentSignatureToGallery(title);
          }
        }}
      />
    </div>
  );
};
