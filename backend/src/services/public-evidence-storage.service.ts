import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { STORAGE_CONFIG } from "../config/storage.config";

/**
 * Handles evidence file uploads for public complaints using Cloudflare R2.
 * R2 is S3-compatible, offers free egress, and is ideal for public evidence.
 */
export class PublicEvidenceStorageService {
  private s3: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const config = STORAGE_CONFIG.R2;

    this.bucketName = config.BUCKET_NAME;
    this.publicUrl = config.PUBLIC_URL;

    console.log(`[R2] Initializing storage service for bucket: ${this.bucketName}`);
    console.log(`[R2] Endpoint: https://${config.ACCOUNT_ID}.r2.cloudflarestorage.com`);
    
    if (!config.ACCOUNT_ID || config.ACCOUNT_ID.length !== 32) {
      console.warn(`[R2] WARNING: R2_ACCOUNT_ID '${config.ACCOUNT_ID}' appears to be invalid (length ${config.ACCOUNT_ID?.length || 0}). expected 32 characters.`);
    }

    this.s3 = new S3Client({
      region: "auto",
      endpoint: `https://${config.ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.ACCESS_KEY_ID || '',
        secretAccessKey: config.SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Uploads multiple files to Cloudflare R2.
   * @param files Array of files to upload
   * @param folder The folder path (default: 'uploads')
   */
  async uploadFiles(files: Blob[], folder: string = 'uploads'): Promise<string[]> {
    if (files.length > 10) {
      throw new Error(`Too many files. Maximum allowed is 10, but received ${files.length}.`);
    }
    const uploadPromises = files.map(file => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Uploads a file to Cloudflare R2 and returns the public URL.
   * @param file The file to upload (Blob/File)
   * @param folder The folder path (default: 'uploads')
   */
  async uploadFile(file: Blob, folder: string = 'uploads'): Promise<string> {
    // 1. Validate File Size (Max 300MB)
    const MAX_SIZE_BYTES = 314572800; // 300MB
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error(`File size exceeds limit of 300MB. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
    }

    // 2. Validate File Type
    const ALLOWED_TYPES = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', // Images
      'video/mp4', 'video/webm', 'video/quicktime',         // Videos
      'application/pdf'                                     // Documents
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type not allowed: ${file.type}. Allowed types: Images, Videos, PDF.`);
    }

    const timestamp = Date.now();
    const fileName = (file as any).name || 'file';
    // Sanitize filename
    const safeName = `${folder}/${timestamp}-${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    // Convert Blob to ArrayBuffer then to Uint8Array/Buffer for S3
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    try {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: safeName,
        Body: buffer,
        ContentType: file.type,
        // ACL: 'public-read' // R2 buckets are usually private by default, public access via worker/domain
      }));

      // Return the constructed public URL
      // If R2_PUBLIC_URL is set (e.g. https://pub-xxx.r2.dev), use it.
      // Otherwise, fallback to a constructed URL (which might not work without custom domain)
      if (this.publicUrl) {
        // Remove trailing slash if present
        const baseUrl = this.publicUrl.endsWith('/') ? this.publicUrl.slice(0, -1) : this.publicUrl;
        return `${baseUrl}/${safeName}`;
      } else {
        return `https://${this.bucketName}.r2.dev/${safeName}`; // Fallback for testing
      }

    } catch (error: any) {
      console.error("R2 Upload Error:", error);
      throw new Error(`Failed to upload to R2: ${error.message}`);
    }
  }
}
