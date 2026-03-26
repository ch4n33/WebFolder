import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3.js';
import config from '../config/index.js';

const storageRepository = {
  async upload(key, body, contentType, contentLength) {
    const command = new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ...(contentLength && { ContentLength: contentLength }),
    });
    await s3Client.send(command);
    return key;
  },
};

export default storageRepository;
