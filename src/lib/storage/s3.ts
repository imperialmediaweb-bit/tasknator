import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || "tasknator-exports";

export async function uploadFile(
  key: string,
  body: Buffer | ReadableStream,
  contentType: string
): Promise<string> {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: body as any,
      ContentType: contentType,
    },
  });

  await upload.done();
  
  const publicUrl = process.env.S3_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }
  return `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`;
}

export async function getFile(key: string) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return s3.send(command);
}

export { s3, BUCKET };
