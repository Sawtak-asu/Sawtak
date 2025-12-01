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

## Usage

The `PublicEvidenceStorageService` handles the upload process.

### Uploading a File

```typescript
import { PublicEvidenceStorageService } from "./services/public-evidence-storage.service";

const storageService = new PublicEvidenceStorageService();

// File must be a Blob or File object
const publicUrl = await storageService.uploadFile(file, "complaints");

console.log(publicUrl); 
// Output: https://pub-....r2.dev/complaints/1701234567890-evidence.jpg
```

## Architecture

1.  **Upload**: Backend receives file -> Uploads to R2 Bucket.
2.  **Storage**: File stored in `sawtak-public-evidence` bucket.
3.  **Access**: Public URL returned (via R2.dev subdomain or custom domain).
4.  **Database**: The returned URL is stored in the `evidence_urls` array of the `IdentifiedComplaint` record.
