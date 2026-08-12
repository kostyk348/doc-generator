export interface TeplomashEmployee {
  id: string;
  fullName: string;
  shortName: string;
  dativeName: string;
  position: string;
  dativePosition: string;
  department: string;
  organization: string;
  email: string;
  phone: string;
}

export function sanitizeEmployeeDepartments(employees: TeplomashEmployee[]): TeplomashEmployee[] {
  return employees.map(emp => ({
    ...emp,
    department: emp.department ? emp.department.trim() : 'Общий отдел',
    organization: emp.organization ? emp.organization.trim() : 'АО «НПО «Тепломаш»'
  }));
}

export const DEFAULT_TEPLOMASH_EMPLOYEES: TeplomashEmployee[] = [
  {
    id: 'emp-1',
    fullName: 'Романов Александр Сергеевич',
    shortName: 'А.С. Романов',
    dativeName: 'Романову А. С.',
    position: 'Генеральный директор',
    dativePosition: 'Генеральному директору',
    department: 'Руководство',
    organization: 'АО «НПО «Тепломаш»',
    email: 'romanov@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 101)'
  },
  {
    id: 'emp-2',
    fullName: 'Кузнецов Дмитрий Анатольевич',
    shortName: 'Д.А. Кузнецов',
    dativeName: 'Кузнецову Д. А.',
    position: 'Технический директор',
    dativePosition: 'Техническому директору',
    department: 'Техническая служба',
    organization: 'АО «НПО «Тепломаш»',
    email: 'kuznetsov@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 102)'
  },
  {
    id: 'emp-3',
    fullName: 'Смирнов Алексей Владимирович',
    shortName: 'А.В. Смирнов',
    dativeName: 'Смирнову А. В.',
    position: 'Начальник отдела продаж',
    dativePosition: 'Начальнику отдела продаж',
    department: 'Отдел продаж',
    organization: 'АО «НПО «Тепломаш»',
    email: 'smirnov@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 201)'
  },
  {
    id: 'emp-4',
    fullName: 'Васильева Елена Игоревна',
    shortName: 'Е.И. Васильева',
    dativeName: 'Васильевой Е. И.',
    position: 'Главный бухгалтер',
    dativePosition: 'Главному бухгалтеру',
    department: 'Бухгалтерия',
    organization: 'АО «НПО «Тепломаш»',
    email: 'vasilieva@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 105)'
  },
  {
    id: 'emp-5',
    fullName: 'Иванов Сергей Петрович',
    shortName: 'С.П. Иванов',
    dativeName: 'Иванову С. П.',
    position: 'Начальник бюро автоматики',
    dativePosition: 'Начальнику бюро автоматики',
    department: 'Бюро автоматики',
    organization: 'АО «НПО «Тепломаш»',
    email: 'ivanov@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 310)'
  },
  {
    id: 'emp-6',
    fullName: 'Петрова Анна Сергеевна',
    shortName: 'А.С. Петрова',
    dativeName: 'Петровой А. С.',
    position: 'Специалист по кадрам',
    dativePosition: 'Специалисту по кадрам',
    department: 'Отдел кадров',
    organization: 'АО «НПО «Тепломаш»',
    email: 'petrova@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 106)'
  },
  {
    id: 'emp-7',
    fullName: 'Соколов Михаил Николаевич',
    shortName: 'М.Н. Соколов',
    dativeName: 'Соколову М. Н.',
    position: 'Начальник испытательной лаборатории',
    dativePosition: 'Начальнику испытательной лаборатории',
    department: 'Лаборатория',
    organization: 'АО «НПО «Тепломаш»',
    email: 'sokolov@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 401)'
  }
];

export const TEPLOMASH_EMPLOYEES: TeplomashEmployee[] = DEFAULT_TEPLOMASH_EMPLOYEES;
