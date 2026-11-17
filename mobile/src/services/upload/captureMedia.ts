/**
 * Camera / library capture helpers that upload through UploadThing.
 */

import * as ImagePicker from "expo-image-picker";
import {
  detectMediaKind,
  uploadFiles,
  type MediaKind,
  type UploadedMedia,
} from "@/src/services/upload/uploadthing";

export type CaptureMode = "photo" | "video";
export type CaptureSource = "camera" | "library";

type CaptureResult =
  | { status: "uploaded"; files: UploadedMedia[] }
  | { status: "cancelled" }
  | { status: "permission_denied" }
  | { status: "error"; message: string };

function toUploaded(file: {
  ufsUrl?: string;
  url?: string;
  appUrl?: string;
  key?: string;
  name?: string;
  type?: string;
  serverData?: { url?: string; key?: string; name?: string; type?: string };
}): UploadedMedia | null {
  const url =
    file.ufsUrl ||
    file.url ||
    file.appUrl ||
    file.serverData?.url ||
    "";
  if (!url && !file.key && !file.serverData?.key) return null;
  return {
    url: url || "",
    key: file.key || file.serverData?.key,
    name: file.name || file.serverData?.name || "file",
    kind: detectMediaKind({
      url,
      name: file.name || file.serverData?.name,
      type: file.type || file.serverData?.type,
    }),
  };
}

async function ensurePermission(
  source: CaptureSource
): Promise<"granted" | "denied"> {
  if (source === "camera") {
    const current = await ImagePicker.getCameraPermissionsAsync();
    if (current.granted) return "granted";
    if (current.canAskAgain) {
      const next = await ImagePicker.requestCameraPermissionsAsync();
      return next.granted ? "granted" : "denied";
    }
    return "denied";
  }

  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return "granted";
  if (current.canAskAgain) {
    const next = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return next.granted ? "granted" : "denied";
  }
  return "denied";
}

/**
 * Capture or pick media, then upload to the propertyImages UploadThing route.
 */
export async function captureAndUploadMedia(input: {
  mode: CaptureMode;
  source: CaptureSource;
}): Promise<CaptureResult> {
  try {
    const permission = await ensurePermission(input.source);
    if (permission === "denied") {
      return { status: "permission_denied" };
    }

    const mediaTypes =
      input.mode === "video"
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.Images;

    const launch =
      input.source === "camera"
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

    const response = await launch({
      mediaTypes,
      quality: 0.85,
      allowsEditing: false,
      videoMaxDuration: 60,
      allowsMultipleSelection: input.source === "library" && input.mode === "photo",
      selectionLimit: input.mode === "photo" ? 5 : 1,
    });

    if (response.canceled || !response.assets?.length) {
      return { status: "cancelled" };
    }

    const rnFiles = await Promise.all(
      response.assets.map(async (asset) => {
        const blob = await fetch(asset.uri).then((res) => res.blob());
        const fallbackExt = input.mode === "video" ? "mp4" : "jpg";
        const name =
          asset.fileName ||
          asset.uri.split("/").pop() ||
          `capture.${fallbackExt}`;
        const type =
          asset.mimeType ||
          (input.mode === "video" ? "video/mp4" : "image/jpeg");
        const file = new File([blob], name, { type });
        return Object.assign(file, { uri: asset.uri });
      })
    );

    const uploaded = await uploadFiles("propertyImages", {
      files: rnFiles as unknown as File[],
    });

    const files = (uploaded || [])
      .map((file) => toUploaded(file as never))
      .filter((item): item is UploadedMedia => Boolean(item))
      .map((item) => ({
        ...item,
        kind: item.kind === "video" ? ("video" as MediaKind) : ("image" as const),
      }));

    if (!files.length) {
      return { status: "error", message: "Upload completed but no media URL returned" };
    }

    return { status: "uploaded", files };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Could not capture or upload media",
    };
  }
}
