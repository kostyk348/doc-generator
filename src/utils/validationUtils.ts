import { DocumentData } from '../types';

export interface ValidationError {
  field: 'content' | 'sender' | 'recipient';
  title: string;
  message: string;
}

/**
 * Validates mandatory document fields according to business rules:
 * 1. Text content must not be empty.
 * 2. Sender (составитель) must be specified (name or position).
 * 3. Recipient (кому адресовано) must be specified.
 *    EXCEPTION: If addressed to all company employees or all partners.
 */
export function validateDocument(doc: DocumentData): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Text field check (содержание документа)
  const cleanContent = (doc.content || '').replace(/<[^>]+>/g, '').trim();
  if (!cleanContent) {
    errors.push({
      field: 'content',
      title: 'Не заполнено поле текста',
      message: 'Поле текста документа не может быть пустым. Введите текст обращения, письма или записки.'
    });
  }

  // 2. Sender check (составитель / подписант)
  const senderName = (doc.signature.senderName || '').trim();
  const senderPosition = (doc.signature.senderPosition || '').trim();

  const isSenderEmpty =
    (!senderName || senderName === 'Не указан') && !senderPosition;

  if (isSenderEmpty) {
    errors.push({
      field: 'sender',
      title: 'Не указан составитель документа',
      message: 'Необходимо указать ФИО или должность составителя/подписанта в блоке подписи.'
    });
  }

  // 3. Recipient check (кому адресовано)
  const recOrg = (doc.recipient.organization || '').trim();
  const recPos = (doc.recipient.position || '').trim();
  const recName = (doc.recipient.name || '').trim();
  const fullRecipientText = `${recOrg} ${recPos} ${recName}`.toLowerCase();

  // EXCEPTION KEYWORDS ("письмо адресовано всем сотрудникам компании либо всем партнерам"):
  const massKeywords = [
    'всем сотрудникам',
    'всем работникам',
    'все сотрудники',
    'все работники',
    'всем подразделениям',
    'все подразделения',
    'всем партнерам',
    'все партнеры',
    'все партнеры компании',
    'всем партнерам компании',
    'руководителям подразделений',
    'всем филиалам',
    'всем контрагентам'
  ];

  const isMassRecipient = massKeywords.some(kw => fullRecipientText.includes(kw));

  if (!isMassRecipient) {
    const isInternal = doc.recipient.recipientType !== 'external';
    if (isInternal) {
      // Internal recipient: requires position OR name
      if (!recPos && !recName) {
        errors.push({
          field: 'recipient',
          title: 'Не указан адресат («Кому»)',
          message: 'Укажите должность или ФИО сотрудника-получателя (или выберите «Всем сотрудникам компании»).'
        });
      }
    } else {
      // External recipient: requires organization AND (position OR name)
      if (!recOrg && !recPos && !recName) {
        errors.push({
          field: 'recipient',
          title: 'Не указан адресат («Кому»)',
          message: 'Укажите наименование сторонней организации, должность или ФИО адресата (или выберите «Всем партнерам»).'
        });
      } else if (!recOrg) {
        errors.push({
          field: 'recipient',
          title: 'Не указана организация адресата',
          message: 'Укажите наименование сторонней компании/организации получателя.'
        });
      } else if (!recPos && !recName) {
        errors.push({
          field: 'recipient',
          title: 'Не указано должностное лицо или ФИО адресата',
          message: 'Укажите должность или ФИО получателя в сторонней компании (или выберите «Всем партнерам»).'
        });
      }
    }
  }

  return errors;
}

export function isDocumentValid(doc: DocumentData): boolean {
  return validateDocument(doc).length === 0;
}
