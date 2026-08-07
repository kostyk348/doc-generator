import { DocumentData, DocumentPreset } from '../types';
import { buildStampSvg } from '../utils/stampUtils';

// Sample Header SVG Data URLs for quick testing if user hasn't uploaded their own image yet
export const SAMPLE_HEADERS = [
  {
    id: 'teplomash-official',
    name: 'АО «НПО «Тепломаш» (Официальный фирменный бланк)',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 240" width="1200" height="240"><rect width="1200" height="240" fill="%23ffffff"/><g transform="translate(10, 5)"><g transform="translate(0, 5)"><path d="M 22,0 L 44,32 L 35,32 L 35,105 L 9,105 L 9,32 L 0,32 Z" fill="%23111827"/><path d="M 22,20 L 36,44 L 29,44 L 29,98 L 15,98 L 15,44 L 8,44 Z" fill="%23ffffff"/><path d="M 22,38 L 30,56 L 25,56 L 25,92 L 19,98 L 19,56 L 14,56 Z" fill="%23111827"/><path d="M 54,0 L 76,32 L 67,32 L 67,105 L 41,105 L 41,32 L 32,32 Z" fill="%23111827"/><path d="M 54,20 L 68,44 L 61,44 L 61,98 L 47,98 L 47,44 L 40,44 Z" fill="%23ffffff"/><path d="M 54,38 L 62,56 L 57,56 L 57,92 L 51,98 L 51,56 L 46,56 Z" fill="%23111827"/><path d="M 86,0 L 108,32 L 99,32 L 99,105 L 73,105 L 73,32 L 64,32 Z" fill="%23111827"/><path d="M 86,20 L 100,44 L 93,44 L 93,98 L 79,98 L 79,44 L 72,44 Z" fill="%23ffffff"/><path d="M 86,38 L 94,56 L 89,56 L 89,92 L 83,98 L 83,56 L 78,56 Z" fill="%23111827"/></g><text x="122" y="78" font-family="'Arial Black', Arial, sans-serif" font-weight="900" font-size="80" fill="%23111827" letter-spacing="-1">Тепломаш</text><text x="698" y="32" font-family="Arial, sans-serif" font-size="20" fill="%23111827">®</text></g><g transform="translate(10, 122)"><text x="0" y="0" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="%23111827">Акционерное общество</text><text x="0" y="18" font-family="Arial, sans-serif" font-weight="bold" font-size="15" fill="%23111827">«Научно-производственное объединение «Тепломаш»</text><text x="0" y="35" font-family="Arial, sans-serif" font-size="14" fill="%23111827">АО «НПО «Тепломаш»</text><text x="0" y="51" font-family="Arial, sans-serif" font-size="14" fill="%23111827">ИНН 7806112986, КПП 780601001, ОГРН 1027809212573</text><text x="0" y="67" font-family="Arial, sans-serif" font-size="14" fill="%23111827">р/с 40702810055130177203</text><text x="0" y="83" font-family="Arial, sans-serif" font-size="14" fill="%23111827">Северо-Западный Банк ПАО «Сбербанк» г. Санкт-Петербург</text><text x="0" y="99" font-family="Arial, sans-serif" font-size="14" fill="%23111827">к/с 30101810500000000653 БИК 044030653</text></g><g transform="translate(1190, 42)" text-anchor="end"><text x="0" y="0" font-family="Arial, sans-serif" font-size="15" fill="%23111827">Адрес: 195279, Санкт-Петербург,</text><text x="0" y="18" font-family="Arial, sans-serif" font-size="15" fill="%23111827">шоссе Революции, д.90, л.А</text><text x="0" y="38" font-family="Arial, sans-serif" font-size="15" fill="%23111827">тел. +7 (812) <tspan font-weight="bold">301-99-40</tspan></text><text x="0" y="56" font-family="Arial, sans-serif" font-size="15" fill="%23111827">тел./факс +7 (812) <tspan font-weight="bold">327-63-82</tspan></text><text x="0" y="100" font-family="Arial, sans-serif" font-style="italic" font-size="15" fill="%23111827">root@teplomash.ru</text><text x="0" y="118" font-family="Arial, sans-serif" font-style="italic" font-size="15" fill="%23111827">www.teplomash.ru</text></g><line x1="0" y1="230" x2="1200" y2="230" stroke="%23111827" stroke-width="3"/><line x1="0" y1="234" x2="1200" y2="234" stroke="%23111827" stroke-width="1"/></svg>`
  },
  {
    id: 'corporate-gold',
    name: 'Строгий корпоративный (Золото и темно-синий)',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 240" width="1200" height="240"><rect width="1200" height="240" fill="%23ffffff"/><path d="M0 0 L1200 0 L1200 40 L0 10 Z" fill="%231e293b"/><path d="M0 10 L1200 40 L1200 50 L0 15 Z" fill="%23d97706"/><g transform="translate(60, 75)"><rect x="0" y="0" width="70" height="70" rx="14" fill="%231e293b"/><polygon points="35,15 55,55 15,55" fill="%23f59e0b"/><text x="90" y="42" font-family="Arial, sans-serif" font-weight="bold" font-size="34" fill="%230f172a" letter-spacing="2">ООО «ВЕКТОР ИННОВАЦИЙ»</text><text x="90" y="68" font-family="Arial, sans-serif" font-size="16" fill="%2364748b">ОФИЦИАЛЬНЫЙ БЛАНК ОРГАНИЗАЦИИ</text></g><g transform="translate(1140, 75)" text-anchor="end"><text x="0" y="25" font-family="Arial, sans-serif" font-size="14" fill="%23475569">123112, г. Москва, Пресненская наб., д. 12</text><text x="0" y="48" font-family="Arial, sans-serif" font-size="14" fill="%23475569">Тел.: +7 (495) 800-20-20 | info@vector-innovations.ru</text><text x="0" y="70" font-family="Arial, sans-serif" font-size="13" fill="%2394a3b8">ИНН 7701234567 / КПП 770101001 / ОГРН 1027700123456</text></g><line x1="60" y1="180" x2="1140" y2="180" stroke="%23cbd5e1" stroke-width="2"/></svg>`
  },
  {
    id: 'modern-blue',
    name: 'Современный технологичный (Голубой и серо-голубой)',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 220" width="1200" height="220"><rect width="1200" height="220" fill="%23ffffff"/><path d="M0 0 L1200 0 L1200 160 Q 900 220 600 180 Q 300 140 0 200 Z" fill="%23f0f9ff" opacity="0.7"/><path d="M0 0 L1200 0 L1200 20 L0 20 Z" fill="%230284c7"/><g transform="translate(70, 60)"><circle cx="35" cy="35" r="35" fill="%230284c7"/><text x="35" y="46" font-family="Arial, sans-serif" font-weight="bold" font-size="32" fill="%23ffffff" text-anchor="middle">A</text><text x="90" y="38" font-family="Arial, sans-serif" font-weight="900" font-size="36" fill="%230369a1">АЛЬФА-ГРУПП</text><text x="90" y="62" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="%230284c7" letter-spacing="3">ГРУППА КОМПАНИЙ</text></g><g transform="translate(1130, 65)" text-anchor="end"><text x="0" y="22" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="%231e293b">Россия, 191025, г. Санкт-Петербург, Невский пр., д. 50</text><text x="0" y="44" font-family="Arial, sans-serif" font-size="14" fill="%23334155">Телефон: 8 (800) 555-35-35 | Сайт: www.alpha-group.ru</text><text x="0" y="66" font-family="Arial, sans-serif" font-size="13" fill="%2364748b">ОКПО 12345678, ОГРН 1037800000000</text></g><line x1="70" y1="160" x2="1130" y2="160" stroke="%230284c7" stroke-width="3"/></svg>`
  },
  {
    id: 'classic-minimal',
    name: 'Классический академический (Черно-белый лаконичный)',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 200" width="1200" height="200"><rect width="1200" height="200" fill="%23ffffff"/><g transform="translate(600, 45)" text-anchor="middle"><text x="0" y="30" font-family="Times New Roman, serif" font-weight="bold" font-size="32" fill="%23111827" letter-spacing="2">ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ</text><text x="0" y="65" font-family="Times New Roman, serif" font-weight="bold" font-size="38" fill="%23111827">«СТОЛИЧНЫЕ СИСТЕМЫ»</text><text x="0" y="92" font-family="Times New Roman, serif" font-size="15" fill="%234b5563">ул. Тверская, д. 15, стр. 1, г. Москва, 125009 | Тел./факс: (495) 123-45-67</text><text x="0" y="112" font-family="Times New Roman, serif" font-size="14" fill="%236b7280">E-mail: doc@stolica-sys.ru | ИНН 7709998877 / КПП 770901001</text></g><line x1="100" y1="170" x2="1100" y2="170" stroke="%23111827" stroke-width="2.5"/><line x1="100" y1="175" x2="1100" y2="175" stroke="%23111827" stroke-width="1"/></svg>`
  }
];

export const SAMPLE_STAMPS = [
  {
    id: 'teplomash-stamp',
    name: 'Печать АО «НПО «Тепломаш»',
    url: buildStampSvg('АКЦИОНЕРНОЕ ОБЩЕСТВО «НПО «ТЕПЛОМАШ»', 'САНКТ-ПЕТЕРБУРГ * ОГРН 1027809212573', 'Бюро автоматики', 'Инженер-программист', 'ДЛЯ ДОКУМЕНТОВ', '#1d4ed8')
  },
  {
    id: 'stamp-vector',
    name: 'Синяя универсальная печать',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240"><circle cx="120" cy="120" r="112" stroke="%231d4ed8" stroke-width="4" fill="none" opacity="0.85"/><circle cx="120" cy="120" r="64" stroke="%231d4ed8" stroke-width="2" fill="none" opacity="0.85"/><path id="textArcTop" d="M 28,120 A 92,92 0 1,1 212,120" fill="none"/><path id="textArcBottom" d="M 28,120 A 92,92 0 0,1 28,120" fill="none"/><text fill="%231d4ed8" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" opacity="0.85"><textPath href="%23textArcTop" startOffset="50%" text-anchor="middle">ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ</textPath></text><text fill="%231d4ed8" font-family="Arial, sans-serif" font-size="10.5" font-weight="bold" opacity="0.85"><textPath href="%23textArcBottom" startOffset="50%" text-anchor="middle">МОСКВА * ОГРН 1027700123456</textPath></text><text x="120" y="112" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%231d4ed8" text-anchor="middle" opacity="0.85">ДЛЯ</text><text x="120" y="132" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%231d4ed8" text-anchor="middle" opacity="0.85">ДОКУМЕНТОВ</text></svg>`
  }
];

export const INITIAL_DOCUMENT: DocumentData = {
  id: 'doc-initial',
  updatedAt: new Date().toISOString(),
  header: {
    type: 'preset',
    imageUrl: SAMPLE_HEADERS[0].url,
    height: 140,
    alignment: 'stretch',
    marginTop: 0,
    marginBottom: 20,
    showDividerLine: false,
    dividerColor: '#cbd5e1'
  },
  recipient: {
    recipientType: 'internal',
    position: 'Начальнику бюро автоматики',
    organization: 'АО «НПО «Тепломаш»',
    name: 'Романову А. А.'
  },
  docType: 'СЛУЖЕБНАЯ ЗАПИСКА',
  docSubject: 'О предоставлении доступа к папке \\\\Electrica',
  date: new Date().toLocaleDateString('ru-RU'),
  refNumber: '0508/1И',
  inRefNumber: '',
  city: 'г. Санкт-Петербург',
  content: `<p>Прошу Вас предоставить доступ к сетевой папке \\\\Electrica сотрудникам отдела автоматики для проведения проектных и пусконаладочных работ.</p>`,
  signature: {
    type: 'placeholder',
    imageUrl: null,
    senderPosition: 'Ведущий инженер-программист',
    senderDepartment: 'Бюро автоматики',
    senderOrganization: 'АО «НПО «Тепломаш»',
    senderName: 'Д.С. Орлов',
    showStamp: true,
    stampImageUrl: SAMPLE_STAMPS[0].url
  },
  fontFamily: 'Times New Roman',
  fontSize: 14,
  lineSpacing: 1.25,
  margins: {
    top: 20,
    bottom: 20,
    left: 25,
    right: 15
  }
};

export const PRESET_TEMPLATES: DocumentPreset[] = [
  {
    id: 'memo-preset',
    title: 'Служебная записка',
    description: 'Внутренний документ для обращения к руководству или подразделениям',
    category: 'Внутренние документы',
    data: {
      docType: 'СЛУЖЕБНАЯ ЗАПИСКА',
      docSubject: 'О предоставлении доступа к информационным системам',
      recipient: {
        recipientType: 'internal',
        position: 'Руководителю департамента ИТ',
        organization: 'АО «НПО «Тепломаш»',
        name: 'Петрову П.П.'
      },
      content: `<p>Прошу предоставить доступ к корпоративной системе CRM сотруднику отдела продаж Сидорову Алексею Викторовичу в связи с вступлением в должность менеджер по работе с клиентами.</p>
<p>Необходимый уровень доступа: «Менеджер проекта» с правом чтения и редактирования базы клиентов.</p>`,
      signature: {
        type: 'placeholder',
        imageUrl: null,
        senderPosition: 'Руководитель отдела продаж',
        senderOrganization: '',
        senderName: 'В.А. Кузнецов',
        showStamp: false,
        stampImageUrl: null
      }
    }
  },
  {
    id: 'info-letter',
    title: 'Информационное письмо',
    description: 'Официальное уведомление клиентов или партнеров о событиях и изменениях',
    category: 'Внешняя переписка',
    data: {
      docType: 'ИНФОРМАЦИОННОЕ ПИСЬМО',
      docSubject: 'Об изменении реквизитов и юридического адреса',
      recipient: {
        recipientType: 'external',
        position: 'Руководителям контрагентов',
        organization: 'Партнерам и клиентам',
        name: ''
      },
      content: `<p>Настоящим извещаем Вас о том, что с 15 августа 2026 года изменяется юридический адрес и банковские реквизиты нашей компании ООО «Вектор Инноваций».</p>
<p><strong>Новый юридический адрес:</strong> 123112, г. Москва, Пресненская наб., д. 12, офис 405.</p>
<p>Все остальные реквизиты (ИНН, КПП, ОГРН) остаются без изменений. Просим учитывать данную информацию при оформлении первичных бухгалтерских документов и платежных поручений.</p>`,
      signature: {
        type: 'placeholder',
        imageUrl: null,
        senderPosition: 'Генеральный директор',
        senderOrganization: 'ООО «Вектор Инноваций»',
        senderName: 'А.В. Смирнов',
        showStamp: true,
        stampImageUrl: SAMPLE_STAMPS[0].url
      }
    }
  },
  {
    id: 'commercial-offer',
    title: 'Коммерческое предложение',
    description: 'Официальное предложение товаров, работ или услуг партнеру',
    category: 'Коммерческие',
    data: {
      docType: 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ',
      docSubject: 'Поставка лицензионного программного обеспечения и техническое сопровождение',
      recipient: {
        recipientType: 'external',
        position: 'Директору по развитию',
        organization: 'АО «ПромСвязь»',
        name: 'Николаеву С.М.'
      },
      content: `<p>Уважаемый Сергей Михайлович!</p>
<p>Наша компания предлагает комплексное решение по автоматизации бизнес-процессов Вашего предприятия на базе современных облачных систем.</p>
<p>В рамках сотрудничества мы гарантируем:</p>
<ul>
  <li>Внедрение программного комплекса в течение 14 рабочих дней;</li>
  <li>Круглосуточную техническую поддержку пользователей (24/7);</li>
  <li>Бесплатное обучение ключевых сотрудников компании.</li>
</ul>
<p>Предложение действительно до 31 августа 2026 года. Расчет стоимости и этапы работ представлены в приложении к настоящему письму.</p>`,
      signature: {
        type: 'placeholder',
        imageUrl: null,
        senderPosition: 'Коммерческий директор',
        senderOrganization: 'ООО «Вектор Инноваций»',
        senderName: 'Е.В. Морозова',
        showStamp: true,
        stampImageUrl: SAMPLE_STAMPS[0].url
      }
    }
  },
  {
    id: 'statement-preset',
    title: 'Заявление',
    description: 'Официальное заявление сотрудника или гражданина',
    category: 'Кадровые и личные',
    data: {
      docType: 'ЗАЯВЛЕНИЕ',
      docSubject: '',
      recipient: {
        position: 'Генеральному директору',
        organization: 'ООО «Вектор Инноваций»',
        name: 'Смирнову А.В.'
      },
      content: `<p>Прошу предоставить мне ежегодный оплачиваемый отпуск продолжительностью 14 (четырнадцать) календарных дней с 10 августа 2026 года по 23 августа 2026 года включительно.</p>`,
      signature: {
        type: 'placeholder',
        imageUrl: null,
        senderPosition: 'Ведущий инженер-программист',
        senderOrganization: '',
        senderName: 'Д.С. Орлов',
        showStamp: false,
        stampImageUrl: null
      }
    }
  }
];
