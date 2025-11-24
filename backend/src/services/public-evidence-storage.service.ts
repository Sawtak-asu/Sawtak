import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

/**
 * Handles evidence file uploads for identified (public) complaints.
 * Uploads to Supabase Storage and returns public URLs.
 */
export class PublicEvidenceStorageService {
  private bucketName = 'evidence-files';
  private supabase = createClient(supabaseUrl || '', supabaseKey || '');

  async uploadFile(file: Blob, folder: string = 'uploads'): Promise<string> {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('DB not configured');
    }

    // Generate a unique safe filename
    const timestamp = Date.now();
    const fileName = (file as any).name || 'file';
    const safeName = `${folder}/${timestamp}-${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    // Upload to Supabase
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(safeName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get Public URL
    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(safeName);

    return publicUrlData.publicUrl;
  }
}
