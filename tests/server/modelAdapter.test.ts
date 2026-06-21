import test from 'node:test';
import assert from 'node:assert/strict';
import { listAvailableMediaModels } from '../../src/server/adapters/modelAdapter';

test('listAvailableMediaModels exposes executable local comfy models', () => {
  process.env.MEDIA_PROVIDER = 'local-comfyui';

  const catalog = listAvailableMediaModels();

  assert.equal(catalog.provider, 'local-comfyui');
  assert.deepEqual(
    catalog.models.map((model) => [model.id, model.task]),
    [
      ['z-image-turbo', 'txt2img'],
      ['ltx-2b', 'txt2video'],
      ['wan22-5b', 'img2video'],
      ['qwen-image-edit-2511', 'edit'],
    ],
  );
});
