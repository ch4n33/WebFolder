import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import os from 'os';

// Mock 의존성
vi.mock('../../backend/src/db/connection.js', () => ({
  default: {
    query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
  },
}));

vi.mock('../../backend/src/repositories/storage.repository.js', () => ({
  default: {
    upload: vi.fn().mockImplementation((_key, body) => {
      // stream을 완전히 소비한 뒤 resolve (lazy open 완료 대기)
      return new Promise((resolve, reject) => {
        if (!body || typeof body.on !== 'function') return resolve('test-key');
        body.on('data', () => {}); // 데이터 소비
        body.on('end', () => resolve('test-key'));
        body.on('error', () => resolve('test-key')); // 파일 삭제 후 열릴 수 있음
      });
    }),
  },
}));

const { default: uploadService } = await import('../../backend/src/services/upload.service.js');
const { default: storageRepository } = await import('../../backend/src/repositories/storage.repository.js');
const { default: pool } = await import('../../backend/src/db/connection.js');

describe('uploadService', () => {
  let tempFile;

  beforeEach(() => {
    vi.clearAllMocks();
    // temp 파일 생성
    tempFile = join(os.tmpdir(), `test-upload-${Date.now()}`);
    writeFileSync(tempFile, 'fake-file-content');
  });

  afterEach(async () => {
    // stream이 닫힐 시간을 확보한 뒤 temp 파일 정리
    await new Promise((r) => setTimeout(r, 50));
    try { unlinkSync(tempFile); } catch {}
  });

  it('디스크 파일을 스트리밍으로 S3에 업로드한다', async () => {
    const file = {
      path: tempFile,
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      size: 17,
    };

    await uploadService.upload(file, 'user-1', 'session-1');

    // storageRepository.upload에 stream이 전달되는지 확인
    expect(storageRepository.upload).toHaveBeenCalledOnce();
    const [key, body, contentType, contentLength] = storageRepository.upload.mock.calls[0];
    expect(key).toMatch(/^user-1\/\d+_photo\.jpg$/);
    expect(body).toBeDefined();
    expect(typeof body.pipe).toBe('function'); // ReadStream인지 확인
    expect(contentType).toBe('image/jpeg');
    expect(contentLength).toBe(17);
  });

  it('업로드 후 temp 파일을 삭제한다', async () => {
    const file = {
      path: tempFile,
      originalname: 'video.mp4',
      mimetype: 'video/mp4',
      size: 100,
    };

    await uploadService.upload(file, 'user-1', 'session-1');

    expect(existsSync(tempFile)).toBe(false);
  });

  it('S3 업로드 실패 시에도 temp 파일을 삭제한다', async () => {
    storageRepository.upload.mockRejectedValueOnce(new Error('S3 error'));

    const file = {
      path: tempFile,
      originalname: 'video.mp4',
      mimetype: 'video/mp4',
      size: 100,
    };

    await expect(uploadService.upload(file, 'user-1', 'session-1')).rejects.toThrow('S3 error');
    expect(existsSync(tempFile)).toBe(false);
  });

  it('허용되지 않은 MIME 타입은 거부하고 temp 파일을 삭제한다', async () => {
    const file = {
      path: tempFile,
      originalname: 'malware.exe',
      mimetype: 'application/x-executable',
      size: 100,
    };

    await expect(uploadService.upload(file, 'user-1', 'session-1')).rejects.toThrow('not allowed');
    expect(storageRepository.upload).not.toHaveBeenCalled();
    expect(existsSync(tempFile)).toBe(false);
  });

  it('DB에 업로드 메타데이터를 기록한다', async () => {
    const file = {
      path: tempFile,
      originalname: 'song.mp3',
      mimetype: 'audio/mpeg',
      size: 5000,
    };

    await uploadService.upload(file, 'user-42', 'session-7');

    expect(pool.query).toHaveBeenCalledOnce();
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('INSERT INTO uploads');
    expect(params[0]).toBe('user-42');
    expect(params[1]).toBe('session-7');
    expect(params[3]).toBe('song.mp3');
    expect(params[4]).toBe(5000);
    expect(params[5]).toBe('audio/mpeg');
  });

  it('파일명의 특수문자를 sanitize한다', async () => {
    const file = {
      path: tempFile,
      originalname: '한글 파일 (1).png',
      mimetype: 'image/png',
      size: 100,
    };

    await uploadService.upload(file, 'user-1', 'session-1');

    const [key] = storageRepository.upload.mock.calls[0];
    // 한글+공백+괄호 → _ 치환 확인
    expect(key).toMatch(/^user-1\/\d+_[_a-zA-Z0-9.()-]+\.png$/);
    expect(key).not.toContain('한글');
  });
});
