import { createClient } from '@supabase/supabase-js';

// supabase client creation 
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export class StorageService {
  private bucketName = 'evidence-bucket'; 

  /** 
   Uploads a file to Supabase Storage and returns the public URL.
    @param file The file to upload (Blob/File object)
    @param folder Optional folder path within the bucket
  */
  
  async uploadFile(file: Blob, folder: string = 'uploads'): Promise<string> {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    //  Generate a unique safe filename
    const timestamp = Date.now();
    // We cast file to any to access name if it exists, or default to 'file'
    const fileName = (file as any).name || 'file';
    const safeName = `${folder}/${timestamp}-${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(safeName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // 3. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(safeName);

    return publicUrlData.publicUrl;
  }
}
