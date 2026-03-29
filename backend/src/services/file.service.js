import fileRepository from '../repositories/file.repository.js';
import storageRepository from '../repositories/storage.repository.js';
import { NotFoundError } from '../utils/errors.js';

const fileService = {
  async list(userId) {
    return fileRepository.findByUserId(userId);
  },

  async getDownloadStream(fileId, userId) {
    const file = await fileRepository.findByIdAndUserId(fileId, userId);
    if (!file) {
      throw new NotFoundError('File not found');
    }
    const s3Response = await storageRepository.getObject(file.s3_key);
    return {
      stream: s3Response.Body,
      fileName: file.original_name,
      contentType: file.mime_type,
      contentLength: file.size_bytes,
    };
  },
};

export default fileService;
