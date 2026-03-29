import fileRepository from '../repositories/file.repository.js';
import storageRepository from '../repositories/storage.repository.js';
import { NotFoundError } from '../utils/errors.js';

const fileService = {
  async list(userId) {
    return fileRepository.findByUserId(userId);
  },

  async getDownloadUrl(fileId, userId) {
    const file = await fileRepository.findByIdAndUserId(fileId, userId);
    if (!file) {
      throw new NotFoundError('File not found');
    }
    const url = await storageRepository.getPresignedUrl(file.s3_key, file.original_name);
    return { url, fileName: file.original_name };
  },
};

export default fileService;
