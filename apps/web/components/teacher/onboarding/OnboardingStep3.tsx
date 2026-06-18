"use client";

import { useState } from "react";
import { Upload, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import type { TeacherProfile, SampleVideo, Category } from "@myskillora/types";

interface Props {
  teacherProfile: TeacherProfile | null;
  videos: SampleVideo[];
  categories: Category[];
  userId: string;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingStep3({ teacherProfile, videos, categories, userId, onNext, onBack }: Props) {
  const supabase = createClient();
  const [videoList, setVideoList] = useState<SampleVideo[]>(videos);
  const [isUploading, setIsUploading] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: "",
    description: "",
    categoryId: categories[0]?.id ?? "",
    file: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setNewVideo((v) => ({ ...v, file }));
  };

  const uploadVideo = async () => {
    if (!newVideo.file || !newVideo.title || !teacherProfile) {
      toast({ title: "Please fill in title and select a video file", variant: "destructive" });
      return;
    }
    if (videoList.length >= 5) {
      toast({ title: "Maximum 5 videos allowed", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      // Get signed upload URL from API
      const signedRes = await fetch("/api/uploads/signed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: `teachers/${teacherProfile.id}/videos`, resourceType: "video" }),
      });
      const signed = await signedRes.json() as {
        signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string;
      };

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", newVideo.file);
      formData.append("signature", signed.signature);
      formData.append("timestamp", signed.timestamp.toString());
      formData.append("api_key", signed.apiKey);
      formData.append("folder", signed.folder);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signed.cloudName}/video/upload`,
        { method: "POST", body: formData }
      );
      const cloudData = await cloudRes.json() as {
        public_id: string; secure_url: string; duration: number;
      };

      // Save to database
      const { data: savedVideo, error } = await supabase
        .from("sample_videos")
        .insert({
          teacher_id: teacherProfile.id,
          category_id: newVideo.categoryId,
          title: newVideo.title,
          description: newVideo.description,
          cloudinary_public_id: cloudData.public_id,
          cloudinary_url: cloudData.secure_url,
          duration_seconds: Math.round(cloudData.duration),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      if (savedVideo) setVideoList((v) => [...v, savedVideo as SampleVideo]);

      setNewVideo({ title: "", description: "", categoryId: categories[0]?.id ?? "", file: null });
      toast({ title: "Video uploaded successfully!" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteVideo = async (videoId: string) => {
    await supabase.from("sample_videos").delete().eq("id", videoId);
    setVideoList((v) => v.filter((video) => video.id !== videoId));
    toast({ title: "Video removed" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3 — Sample Videos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Upload up to 5 sample teaching videos. Students will use these to evaluate your teaching style.
          Recommended: 2–10 minutes each.
        </p>

        {/* Existing Videos */}
        {videoList.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {videoList.map((video) => (
              <div key={video.id} className="relative group rounded-card border overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <Play className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium line-clamp-1">{video.title}</p>
                  {video.duration_seconds && (
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, "0")} min
                    </p>
                  )}
                </div>
                <button
                  onClick={() => void deleteVideo(video.id)}
                  className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-error text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload New Video */}
        {videoList.length < 5 && (
          <div className="rounded-card border-2 border-dashed p-5 space-y-4">
            <h4 className="font-medium text-sm">Upload a new video</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1 block">Video Title *</Label>
                <Input
                  placeholder="e.g. Introduction to Algebra"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo((v) => ({ ...v, title: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Subject</Label>
                <select
                  className="w-full rounded-input border border-input px-3 py-2 text-sm"
                  value={newVideo.categoryId}
                  onChange={(e) => setNewVideo((v) => ({ ...v, categoryId: e.target.value }))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Video File (MP4, max 500MB)</Label>
              <input
                type="file"
                accept="video/mp4,video/mov,video/avi"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-pill file:border-0 file:bg-primary file:text-white file:text-sm file:px-3 file:py-1.5 file:cursor-pointer"
              />
              {newVideo.file && (
                <p className="text-xs text-muted-foreground mt-1">{newVideo.file.name}</p>
              )}
            </div>

            <Button onClick={uploadVideo} disabled={isUploading} variant="outline">
              {isUploading ? (
                <>Uploading...</>
              ) : (
                <><Upload className="h-4 w-4" /> Upload Video</>
              )}
            </Button>
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onNext} variant="amber">Continue</Button>
        </div>
      </CardContent>
    </Card>
  );
}
