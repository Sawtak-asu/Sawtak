export const STORAGE_CONFIG = {
    R2: {
        ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
        ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
        SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
        BUCKET_NAME: process.env.R2_BUCKET_NAME || 'sawtak-public-evidence',
        PUBLIC_URL: process.env.R2_PUBLIC_URL || '',
    }
};
