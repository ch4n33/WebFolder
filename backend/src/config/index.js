import 'dotenv/config';

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  siteUrl: process.env.SITE_URL || 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/webfolder',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },

  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'webfolder',
  },

  session: {
    durationMinutes: parseInt(process.env.SESSION_DURATION_MINUTES || '3', 10),
  },

  otp: {
    durationMinutes: parseInt(process.env.OTP_DURATION_MINUTES || '2', 10),
  },
};

export default config;
