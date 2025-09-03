import { encodeContactCode, decodeContactCode, generateContactBundle } from '../src/contact';

describe('contact codes', () => {
  it('encodes and decodes a contact bundle', () => {
    const bundle = generateContactBundle();
    const code = encodeContactCode(bundle);
    const out = decodeContactCode(code);
    expect(out.identityKey).toBe(bundle.identityKey);
    expect(out.pqIdentityKey).toBe(bundle.pqIdentityKey);
    expect(out.suites[0]).toBe('VELI-DEFAULT-2025');
  });

  it('rejects invalid codes', () => {
    expect(() => decodeContactCode('aW52YWxpZA')).toThrow();
  });
});


