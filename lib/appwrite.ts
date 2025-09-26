import { Client, Storage } from 'appwrite';

const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID;

if (!endpoint) {
  throw new Error(
    'Missing NEXT_PUBLIC_APPWRITE_ENDPOINT. Set it in .env.local (no quotes, no spaces).'
  );
}

if (!projectId) {
  throw new Error(
    'Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID. Set it in .env.local (no quotes, no spaces).'
  );
}

if (!bucketId) {
  throw new Error(
    'Missing NEXT_PUBLIC_BUCKET_ID (Appwrite Storage Bucket ID). Set it in .env.local.'
  );
}

client.setEndpoint(endpoint).setProject(projectId);

export const storage = new Storage(client);

export const BUCKET_ID = bucketId;

export { client };
