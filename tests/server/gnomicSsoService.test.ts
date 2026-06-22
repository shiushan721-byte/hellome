import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRedirectPath,
  resolveRedirectPath,
  validateRedirectPath,
} from '../../src/server/gnomic/gnomicRedirect';
import { GnomicSsoError } from '../../src/server/gnomic/gnomicTypes';
import { startGnomicSso } from '../../src/server/gnomic/gnomicSsoService';

test('validateRedirectPath accepts workspace template paths', () => {
  const path = validateRedirectPath('/workspace?template=smart-matting&action=experience');
  assert.equal(path, '/workspace?template=smart-matting&action=experience');
});

test('validateRedirectPath rejects external urls', () => {
  assert.throws(
    () => validateRedirectPath('https://evil.com/workspace'),
    (error: unknown) => error instanceof GnomicSsoError && error.code === 'INVALID_REDIRECT',
  );
  assert.throws(
    () => validateRedirectPath('//evil.com/workspace'),
    (error: unknown) => error instanceof GnomicSsoError && error.code === 'INVALID_REDIRECT',
  );
});

test('buildRedirectPath creates experience path', () => {
  assert.equal(
    buildRedirectPath('smart-matting', 'clone'),
    '/workspace?template=smart-matting&action=clone',
  );
});

test('resolveRedirectPath falls back to templateId and action', () => {
  const path = resolveRedirectPath({
    templateId: 'smart-matting',
    action: 'experience',
  });
  assert.equal(path, '/workspace?template=smart-matting&action=experience');
});

test('startGnomicSso returns gnomic sso redirect url in mock mode', async () => {
  const previousBase = process.env.GNOMIC_INTERNAL_API_BASE_URL;
  const previousSsoBase = process.env.GNOMIC_SSO_BASE_URL;
  process.env.GNOMIC_INTERNAL_API_BASE_URL = '';
  process.env.GNOMIC_SSO_BASE_URL = 'https://www.gnomic.cn';

  try {
    const result = await startGnomicSso({
      hellomeUserId: '13800138000',
      phone: '13800138000',
      nickname: '演示用户',
      templateId: 'smart-matting',
      action: 'experience',
    });

    assert.match(result.redirectUrl, /^https:\/\/www\.gnomic\.cn\/sso\/hellome\?ticket=/);
    assert.match(result.redirectUrl, /redirect=%2Fworkspace%3Ftemplate%3Dsmart-matting%26action%3Dexperience/);
  } finally {
    process.env.GNOMIC_INTERNAL_API_BASE_URL = previousBase;
    process.env.GNOMIC_SSO_BASE_URL = previousSsoBase;
  }
});
