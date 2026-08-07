export interface TeplomashEmployee {
  id: string;
  fullName: string;
  shortName: string; // e.g., "Кузнецов В.А."
  dativeName: string; // e.g., "Кузнецову В. А."
  position: string;
  dativePosition: string; // e.g., "Руководителю отдела продаж"
  department: string;
  organization: string; // "АО «НПО «Тепломаш»"
  email: string;
  phone: string;
  signatureUrl?: string;
}

export const TEPLOMASH_EMPLOYEES: TeplomashEmployee[] = [
  {
    id: 'emp-1',
    fullName: 'Кузнецов Владимир Александрович',
    shortName: 'В.А. Кузнецов',
    dativeName: 'Кузнецову В. А.',
    position: 'Руководитель отдела продаж',
    dativePosition: 'Руководителю отдела продаж',
    department: 'Отдел продаж',
    organization: 'АО «НПО «Тепломаш»',
    email: 'kuznetsov@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 102)'
  },
  {
    id: 'emp-2',
    fullName: 'Орлов Дмитрий Сергеевич',
    shortName: 'Д.С. Орлов',
    dativeName: 'Орлову Д. С.',
    position: 'Ведущий инженер-программист',
    dativePosition: 'Ведущему инженеру-программисту',
    department: 'Бюро автоматики',
    organization: 'АО «НПО «Тепломаш»',
    email: 'orlov@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 205)'
  },
  {
    id: 'emp-3',
    fullName: 'Романов Александр Алексеевич',
    shortName: 'А.А. Романов',
    dativeName: 'Романову А. А.',
    position: 'Начальник отдела автоматики',
    dativePosition: 'Начальнику отдела автоматики',
    department: 'Отдел автоматики',
    organization: 'АО «НПО «Тепломаш»',
    email: 'romanov@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 201)'
  },
  {
    id: 'emp-4',
    fullName: 'Баранов Алексей Сергеевич',
    shortName: 'А.С. Баранов',
    dativeName: 'Баранову А. С.',
    position: 'Генеральный директор',
    dativePosition: 'Генеральному директору',
    department: 'Администрация',
    organization: 'АО «НПО «Тепломаш»',
    email: 'root@teplomash.ru',
    phone: '+7 (812) 301-99-40'
  },
  {
    id: 'emp-5',
    fullName: 'Соколова Елена Николаевна',
    shortName: 'Е.Н. Соколова',
    dativeName: 'Соколовой Е. Н.',
    position: 'Главный бухгалтер',
    dativePosition: 'Главному бухгалтеру',
    department: 'Бухгалтерия',
    organization: 'АО «НПО «Тепломаш»',
    email: 'buh@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 110)'
  },
  {
    id: 'emp-6',
    fullName: 'Михайлов Павел Владимирович',
    shortName: 'П.В. Михайлов',
    dativeName: 'Михайлову П. В.',
    position: 'Начальник конструкторского бюро',
    dativePosition: 'Начальнику конструкторского бюро',
    department: 'Конструкторское бюро',
    organization: 'АО «НПО «Тепломаш»',
    email: 'kb@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 301)'
  },
  {
    id: 'emp-7',
    fullName: 'Ковалев Сергей Геннадьевич',
    shortName: 'С.Г. Ковалев',
    dativeName: 'Ковалеву С. Г.',
    position: 'Начальник отдела технического контроля (ОТК)',
    dativePosition: 'Начальнику ОТК',
    department: 'ОТК',
    organization: 'АО «НПО «Тепломаш»',
    email: 'otk@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 108)'
  },
  {
    id: 'emp-8',
    fullName: 'Петрова Ольга Игоревна',
    shortName: 'О.И. Петрова',
    dativeName: 'Петровой О. И.',
    position: 'Начальник отдела кадров',
    dativePosition: 'Начальнику отдела кадров',
    department: 'Отдел кадров',
    organization: 'АО «НПО «Тепломаш»',
    email: 'hr@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 105)'
  },
  {
    id: 'emp-9',
    fullName: 'Смирнов Андрей Викторович',
    shortName: 'А.В. Смирнов',
    dativeName: 'Смирнову А. В.',
    position: 'Заместитель генерального директора по производству',
    dativePosition: 'Заместителю генерального директора по производству',
    department: 'Дирекция по производству',
    organization: 'АО «НПО «Тепломаш»',
    email: 'smirnov@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 101)'
  },
  {
    id: 'emp-10',
    fullName: 'Васильев Максим Игоревич',
    shortName: 'М.И. Васильев',
    dativeName: 'Васильеву М. И.',
    position: 'Главный инженер',
    dativePosition: 'Главному инженеру',
    department: 'Главный инженеринг',
    organization: 'АО «НПО «Тепломаш»',
    email: 'vasilieff@teplomash.ru',
    phone: '+7 (812) 301-99-40 (доб. 200)'
  }
];

export const sanitizeEmployeeDepartments = (emps: TeplomashEmployee[]): TeplomashEmployee[] => {
  return emps.map(emp => {
    let dept = (emp.department || '').trim();
    if (!dept) {
      const defaultMatch = TEPLOMASH_EMPLOYEES.find(e => e.fullName.trim().toLowerCase() === emp.fullName.trim().toLowerCase());
      if (defaultMatch && defaultMatch.department) {
        dept = defaultMatch.department;
      } else if (emp.position.toLowerCase().includes('продаж')) {
        dept = 'Отдел продаж';
      } else if (emp.position.toLowerCase().includes('автоматик')) {
        dept = 'Отдел автоматики';
      } else if (emp.position.toLowerCase().includes('бухгалтер')) {
        dept = 'Бухгалтерия';
      } else if (emp.position.toLowerCase().includes('конструктор') || emp.position.toLowerCase().includes('кб')) {
        dept = 'Конструкторское бюро';
      } else if (emp.position.toLowerCase().includes('кадр')) {
        dept = 'Отдел кадров';
      } else if (emp.position.toLowerCase().includes('производств')) {
        dept = 'Дирекция по производству';
      } else if (emp.position.toLowerCase().includes('инженер')) {
        dept = 'Инженерный отдел';
      } else if (emp.position.toLowerCase().includes('директор') || emp.position.toLowerCase().includes('руковод')) {
        dept = 'Администрация';
      } else {
        dept = 'Администрация';
      }
    }
    return { ...emp, department: dept };
  });
};
