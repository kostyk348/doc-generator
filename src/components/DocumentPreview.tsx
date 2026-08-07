import React from 'react';
import { DocumentData } from '../types';
import { buildStampSvg, renderStampToCanvasPng } from '../utils/stampUtils';

interface DocumentPreviewProps {
  data: DocumentData;
  scale?: number; // Zoom level e.g. 1.0, 0.9, 1.1
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ data, scale = 1.0 }) => {
  const { header, recipient, docType, docSubject, date, refNumber, inRefNumber, city, content, signature, fontFamily, fontSize, lineSpacing, margins } = data;

  // Compute font family CSS value
  const fontStyle = {
    fontFamily: fontFamily === 'Times New Roman' ? '"Times New Roman", Times, serif' : 
                fontFamily === 'Georgia' ? 'Georgia, serif' : 
                fontFamily === 'Arial' ? 'Arial, Helvetica, sans-serif' : 
                fontFamily === 'Calibri' ? 'Calibri, sans-serif' : 'Roboto, sans-serif',
    fontSize: `${fontSize}pt`,
    lineHeight: lineSpacing
  };

  // Header alignment classes
  const getHeaderAlignClass = () => {
    switch (header.alignment) {
      case 'left': return 'justify-start';
      case 'right': return 'justify-end';
      case 'center': return 'justify-center';
      case 'stretch': default: return 'w-full';
    }
  };

  return (
    <div className="flex justify-center w-full overflow-auto py-4 print:p-0 print:m-0 print:overflow-hidden bg-slate-100/70">
      {/* A4 Sheet Container */}
      <div
        id="document-a4-sheet"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          fontFamily: fontStyle.fontFamily,
          paddingTop: `${margins.top}mm`,
          paddingBottom: `${margins.bottom}mm`,
          paddingLeft: `${margins.left}mm`,
          paddingRight: `${margins.right}mm`
        }}
        className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-xl print:shadow-none print:w-[210mm] print:h-[297mm] print:m-0 rounded-xs transition-transform duration-150 relative flex flex-col justify-start box-border overflow-hidden"
      >
        <div className="flex-1">
          {/* ================= 1. HEADER IMAGE ================= */}
          {header.imageUrl ? (
            <div 
              className="w-full flex" 
              style={{ marginBottom: `${header.marginBottom}px` }}
            >
              <div className={`flex ${getHeaderAlignClass()} w-full`}>
                <img
                  src={header.imageUrl}
                  alt="Фирменный бланк организации"
                  style={{
                    width: '100%',
                    height: 'auto'
                  }}
                  className="w-full h-auto object-contain transition-all block"
                />
              </div>
            </div>
          ) : (
            <div 
              style={{ marginBottom: `${header.marginBottom}px` }}
              className="w-full border-b-2 border-slate-900 pb-3 mb-6 text-center"
            >
              <h1 className="font-bold text-lg uppercase tracking-wider">ФИРМЕННЫЙ БЛАНК ОРГАНИЗАЦИИ</h1>
              <p className="text-xs text-slate-500">Загрузите картинку шапки бланка в панели настроек</p>
            </div>
          )}

          {header.showDividerLine && (
            <div 
              className="w-full my-3"
              style={{ borderBottom: `1.5px solid ${header.dividerColor}` }}
            />
          )}

          {/* ================= 2. RECIPIENT BLOCK ("Кому") ================= */}
          <div className="flex justify-end w-full mb-6">
            <div className="w-[48%] text-left space-y-0.5 text-slate-900 leading-snug font-sans" style={{ fontSize: `${fontSize - 1}pt` }}>
              {recipient.position && (
                <div className="whitespace-pre-line font-normal">{recipient.position}</div>
              )}
              {recipient.organization && (
                <div className="font-semibold">{recipient.organization}</div>
              )}
              {recipient.name && (
                <div className="font-bold pt-0.5">{recipient.name}</div>
              )}
              {recipient.address && (
                <div className="text-slate-600 font-normal pt-0.5 text-[10.5pt]">{recipient.address}</div>
              )}
              {recipient.inn && (
                <div className="text-slate-500 font-normal text-[10pt]">{recipient.inn}</div>
              )}
            </div>
          </div>

          {/* ================= 3. DATE & REF NUMBER LINE (STRICT SANS-SERIF GOST STYLE) ================= */}
          <div className="flex items-end justify-between w-full border-b border-slate-300 pb-2 mb-8 text-xs text-slate-900 font-sans tracking-tight">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                {date && <span className="font-semibold">{date}г.</span>}
                {refNumber && <span className="font-bold">{refNumber}</span>}
              </div>
              {inRefNumber && (
                <div className="text-[11px] text-slate-600 font-normal">{inRefNumber}</div>
              )}
            </div>

            {city && (
              <div className="font-semibold">{city}</div>
            )}
          </div>

          {/* ================= 4. DOCUMENT TYPE & SUBJECT ("Тип (заголовок)") ================= */}
          <div className="text-center mb-8 space-y-1.5">
            <h2 className="font-bold uppercase tracking-widest text-slate-950" style={{ fontSize: `${fontSize + 3}pt` }}>
              {docType || 'ДОКУМЕНТ'}
            </h2>
            {docSubject && (
              <p className="font-semibold italic text-slate-800 max-w-xl mx-auto" style={{ fontSize: `${fontSize}pt` }}>
                {docSubject.startsWith('О ') || docSubject.startsWith('Об ') ? docSubject : `О ${docSubject}`}
              </p>
            )}
          </div>

          {/* ================= 5. MAIN CONTENT BODY ================= */}
          <div 
            className="w-full text-justify text-slate-900 leading-relaxed font-normal space-y-4 font-serif"
            style={{ 
              fontSize: `${fontSize}pt`,
              lineHeight: lineSpacing
            }}
          >
            {content ? (
              <div 
                dangerouslySetInnerHTML={{ __html: content }}
                className="[&_p]:mb-3 [&_p]:indent-6 [&_p]:break-words [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-8 [&_ol]:list-decimal [&_ol]:pl-8 [&_strong]:font-bold"
              />
            ) : (
              <p className="italic text-slate-400 indent-6">
                (Текст документа появится здесь по мере ввода в левой панели...)
              </p>
            )}
          </div>
        </div>

        {/* ================= 6. SENDER & SIGNATURE BLOCK ("Кто написал письмо") ================= */}
        <div className="signature-block mt-10 pt-4 border-t border-slate-200 w-full relative z-10 shrink-0 bg-transparent">
          <div className="flex items-center justify-between gap-4 w-full relative z-10">
            {/* Sender Title and Department */}
            <div className="w-[40%] text-left leading-snug" style={{ fontSize: `${fontSize - 1}pt` }}>
              <div className="font-medium text-slate-900">
                {signature.senderPosition}
                {signature.senderDepartment && !signature.senderPosition.toLowerCase().includes(signature.senderDepartment.toLowerCase()) && (
                  <span>, {signature.senderDepartment}</span>
                )}
              </div>
              {signature.senderOrganization && (
                <div className="text-slate-600 text-xs mt-0.5 font-normal">{signature.senderOrganization}</div>
              )}
            </div>

            {/* Signature Graphic / Line */}
            <div className="w-[25%] flex items-center justify-center relative z-10 min-h-[50px] border-none bg-transparent shadow-none">
              {signature.type === 'placeholder' || !signature.imageUrl ? (
                <div className="w-full border-b border-slate-900 text-center pb-1 text-[10px] leading-tight font-sans text-slate-400 select-none">
                  (подпись)
                </div>
              ) : (
                <img
                  src={signature.imageUrl}
                  alt="Подпись"
                  className="max-h-16 max-w-full object-contain mx-auto border-none bg-transparent shadow-none"
                />
              )}
            </div>

            {/* Sender Name */}
            <div className="w-[30%] text-right font-bold text-slate-900 relative z-10" style={{ fontSize: `${fontSize - 1}pt` }}>
              {signature.senderName || 'Ф.И.О.'}
            </div>
          </div>

          {/* Stamp Block / Round Seal Overlay positioned right over/near FIO */}
          {signature.showStamp && (
            <div className="stamp-block absolute -top-10 right-2 z-20 pointer-events-none select-none">
              <div className="w-36 h-36 flex items-center justify-center opacity-90 mix-blend-multiply">
                <img
                  src={
                    signature.stampImageUrl ||
                    renderStampToCanvasPng(
                      signature.senderOrganization || 'АО «НПО «ТЕПЛОМАШ»',
                      'САНКТ-ПЕТЕРБУРГ * ОГРН 1027809212573',
                      signature.senderDepartment || 'ОТДЕЛ ПРОДАЖ',
                      signature.senderPosition || 'Сотрудник',
                      'ДЛЯ ДОКУМЕНТОВ',
                      '#1d4ed8'
                    ) ||
                    buildStampSvg(
                      signature.senderOrganization || 'АО «НПО «ТЕПЛОМАШ»',
                      'САНКТ-ПЕТЕРБУРГ * ОГРН 1027809212573',
                      signature.senderDepartment || 'ОТДЕЛ ПРОДАЖ',
                      signature.senderPosition || 'Сотрудник',
                      'ДЛЯ ДОКУМЕНТОВ',
                      '#1d4ed8'
                    )
                  }
                  alt="Печать организации"
                  className="w-36 h-36 object-contain transform -rotate-6 block border-none bg-transparent shadow-none rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
