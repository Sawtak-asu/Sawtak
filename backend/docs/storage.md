# Public Evidence Storage (Cloudflare R2)

The backend uses **Cloudflare R2** (S3-compatible object storage) to store evidence files for **public identified complaints**. This ensures high availability and zero egress fees for public access.

## Configuration

The storage is configured in `src/config/storage.config.ts` and relies on the following environment variables in `.env`:

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=sawtak-public-evidence
R2_PUBLIC_URL=https://pub-....r2.dev
```

## Validation Rules

The service enforces the following validation rules for uploads:
- **Max File Size**: 300 MB per file.
- **Allowed File Types**:
  - **Images**: JPEG, PNG, WEBP, GIF
  - **Videos**: MP4, WEBM, QuickTime (MOV)
  - **Documents**: PDF

## Usage

The `PublicEvidenceStorageService` handles the upload process.

### Uploading a Single File

```typescript
import { PublicEvidenceStorageService } from "./services/public-evidence-storage.service";

const storageService = new PublicEvidenceStorageService();

try {
  // File must be a Blob or File object
  const publicUrl = await storageService.uploadFile(file, "complaints");
  console.log(publicUrl); 
  // Output: https://pub-....r2.dev/complaints/1701234567890-evidence.jpg
} catch (error) {
  console.error(error.message); // e.g., "File size exceeds limit..."
}
```

### Uploading Multiple Files

```typescript
const files = [file1, file2, file3];
const urls = await storageService.uploadFiles(files, "complaints");
console.log(urls);
// Output: ['https://...', 'https://...']
```

## Integration with Complaints

1.  **Frontend Upload**: The frontend uploads files to the backend endpoint (e.g., `/api/upload`).
2.  **Backend Processing**: The backend uses `PublicEvidenceStorageService` to upload files to R2 and get public URLs.
3.  **Database Storage**: The returned URLs are stored in the `evidence_urls` array (JSONB column) of the `IdentifiedComplaint` record in PostgreSQL.
4.  **Frontend Display**:
    - When fetching a complaint, the frontend receives the `evidence_urls` array.
    - **Images**: Render using `<img>` tags.
    - **Videos**: Render using `<video>` tags.
    - **PDFs**: Render using `<embed>` or provide a download link.

## Architecture

1.  **Upload**: Backend receives file -> Validates (Size/Type) -> Uploads to R2 Bucket.
2.  **Storage**: File stored in `sawtak-public-evidence` bucket.
3.  **Access**: Public URL returned (via R2.dev subdomain or custom domain).
4.  **Database**: The returned URL is stored in the `evidence_urls` array of the `IdentifiedComplaint` record.
