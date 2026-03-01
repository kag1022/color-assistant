import { DEFAULT_UPLOAD_MODE } from '@/src/config/env';

describe('env defaults', () => {
  it('uses supported upload mode', () => {
    expect(['generated', 'manual']).toContain(DEFAULT_UPLOAD_MODE);
  });
});

