import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v2 as cloudinary } from "cloudinary";
import type { SignedUploadRequest, SignedUploadResponse, ApiResponse } from "@myskillora/types";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request): Promise<NextResponse<ApiResponse<SignedUploadResponse>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as SignedUploadRequest;
  const timestamp = Math.round(new Date().getTime() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: body.folder },
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    success: true,
    data: {
      signature,
      timestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      folder: body.folder,
    },
  });
}
