import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
}

export async function uploadTeamLogoBuffer(
  uid: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const client = getCloudinary();
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const result = await client.uploader.upload(dataUri, {
    folder: "sufaraa-teams",
    public_id: `${uid}/logo`,
    overwrite: true,
    resource_type: "image",
  });

  if (!result.secure_url) {
    throw new Error("Cloudinary upload returned no URL.");
  }

  return result.secure_url;
}
