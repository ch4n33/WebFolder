import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3.js';
import config from '../config/index.js';

const storageRepository = {
  async upload(key, buffer, contentType) {
    const command = new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await s3Client.send(command);
    return key;
  },
};

export default storageRepository;
