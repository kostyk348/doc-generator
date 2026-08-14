import { describe, it, expect } from 'vitest';
import { PRESET_TEMPLATES, INITIAL_DOCUMENT, getInitialBlankDocument } from './presets';

describe('PRESET_TEMPLATES', () => {
  it('содержит все шаблоны каталога', () => {
    const titles = PRESET_TEMPLATES.map(t => t.title);
    expect(titles).toContain('Служебная записка');
    expect(titles).toContain('Информационное письмо');
    expect(titles).toContain('Коммерческое предложение');
    expect(titles).toContain('Заявление');
    expect(titles).toContain('Запрос коммерческого предложения');
    expect(titles).toContain('Гарантийное письмо');
    expect(titles).toContain('Ответ на входящий запрос');
    expect(titles).toContain('Уведомление об изменении реквизитов');
  });

  it('уникальные id', () => {
    const ids = PRESET_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('у каждого шаблона есть docType и content', () => {
    for (const t of PRESET_TEMPLATES) {
      expect(t.data.docType, t.id).toBeTruthy();
      expect(t.data.content, t.id).toBeTruthy();
    }
  });

  it('у каждого шаблона есть подписант', () => {
    for (const t of PRESET_TEMPLATES) {
      expect(t.data.signature?.senderName, t.id).toBeTruthy();
      expect(t.data.signature?.senderPosition, t.id).toBeTruthy();
    }
  });

  it('внешние шаблоны имеют получателя-организацию', () => {
    const external = PRESET_TEMPLATES.filter(t => t.data.recipient?.recipientType === 'external');
    expect(external.length).toBeGreaterThan(0);
    for (const t of external) {
      expect(t.data.recipient?.organization, t.id).toBeTruthy();
    }
  });
});

describe('базовые документы', () => {
  it('INITIAL_DOCUMENT — полный валидный каркас', () => {
    expect(INITIAL_DOCUMENT.docType).toBeTruthy();
    expect(INITIAL_DOCUMENT.signature.senderName).toBeTruthy();
    expect(INITIAL_DOCUMENT.recipient.recipientType).toBe('internal');
  });

  it('getInitialBlankDocument создаёт новый id при каждом вызове', () => {
    const a = getInitialBlankDocument();
    const b = getInitialBlankDocument();
    expect(a.id).not.toBe(b.id);
    // Пустой бланк: content пуст по смыслу
    expect(a.content).toBe('');
    expect(a.docType).toBeTruthy();
  });
});