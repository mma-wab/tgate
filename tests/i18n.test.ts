import { describe, expect, it } from 'vitest';
import { dictionaries } from '../src/i18n/translations';

const PLACEHOLDER = /\{[a-zA-Z]+\}/g;

describe('translation dictionaries', () => {
  const ar = dictionaries.ar as Record<string, string>;
  const en = dictionaries.en as Record<string, string>;

  it('cover exactly the same keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ar).sort());
  });

  it('contain no empty or whitespace-only values', () => {
    for (const [lang, dictionary] of Object.entries(dictionaries)) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value.trim(), `${lang}:${key}`).not.toBe('');
      }
    }
  });

  it('use the same placeholders in both languages', () => {
    for (const key of Object.keys(ar)) {
      const arPlaceholders = (ar[key]!.match(PLACEHOLDER) ?? []).sort();
      const enPlaceholders = (en[key]!.match(PLACEHOLDER) ?? []).sort();
      expect(enPlaceholders, key).toEqual(arPlaceholders);
    }
  });
});
