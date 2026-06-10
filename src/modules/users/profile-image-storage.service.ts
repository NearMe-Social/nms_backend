import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

const PROFILE_IMAGE_TYPES = {
  'image/jpeg': {
    extension: 'jpg',
    matches: (buffer: Buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  'image/png': {
    extension: 'png',
    matches: (buffer: Buffer) =>
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    extension: 'webp',
    matches: (buffer: Buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  },
} as const;

type SupportedProfileImageType = keyof typeof PROFILE_IMAGE_TYPES;

interface R2Config {
  bucket: string;
  publicUrl: string;
}

@Injectable()
export class ProfileImageStorageService {
  private client: S3Client | null = null;

  constructor(private readonly configService: ConfigService) {}

  async upload(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ key: string; url: string }> {
    const mimeType = file.mimetype as SupportedProfileImageType;
    const imageType = PROFILE_IMAGE_TYPES[mimeType];

    if (!imageType || !imageType.matches(file.buffer)) {
      throw new BadRequestException(
        'Profile image must be a valid JPEG, PNG, or WebP file.',
      );
    }

    const { bucket, publicUrl } = this.getR2Config();
    const key = `profile-images/${userId}/${randomUUID()}.${imageType.extension}`;

    await this.getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return {
      key,
      url: `${publicUrl}/${key}`,
    };
  }

  async deleteByPublicUrl(url: string | null | undefined): Promise<void> {
    if (!url) return;

    const { bucket, publicUrl } = this.getR2Config();
    const prefix = `${publicUrl}/`;
    if (!url.startsWith(prefix)) return;

    const key = decodeURIComponent(url.slice(prefix.length));
    if (!key.startsWith('profile-images/')) return;

    await this.getClient().send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  private getClient(): S3Client {
    if (this.client) return this.client;

    const accountId = this.requiredConfig('R2_ACCOUNT_ID');
    const accessKeyId = this.requiredConfig('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.requiredConfig('R2_SECRET_ACCESS_KEY');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return this.client;
  }

  private getR2Config(): R2Config {
    return {
      bucket: this.requiredConfig('R2_BUCKET_NAME'),
      publicUrl: this.requiredConfig('R2_PUBLIC_URL').replace(/\/+$/, ''),
    };
  }

  private requiredConfig(name: string): string {
    const value = this.configService.get<string>(name)?.trim();
    if (!value) {
      throw new ServiceUnavailableException(
        `Image storage is not configured: missing ${name}.`,
      );
    }
    return value;
  }
}
