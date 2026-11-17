import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { openSettings } from "expo-linking";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, ImagePlus, Video } from "lucide-react-native";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { SecondaryButton } from "@/src/components/ui/SecondaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { apiClient, getApiErrorMessage } from "@/src/services/api/client";
import {
  fetchCities,
  fetchPropertyById,
  updateProperty,
} from "@/src/services/api/properties";
import { captureAndUploadMedia } from "@/src/services/upload/captureMedia";
import {
  detectMediaKind,
  useDocumentUploader,
  type UploadedMedia,
} from "@/src/services/upload/uploadthing";
import { useAuthStore } from "@/src/store/authStore";
import { colors, radii, spacing, typography } from "@/src/theme";

const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "LAND",
  "COMMERCIAL",
] as const;

const DOC_TYPES = [
  "CNIC",
  "POWER_OF_ATTORNEY",
  "REGISTRY",
  "FRD",
] as const;

type DocType = (typeof DOC_TYPES)[number];

type UploadedDoc = UploadedMedia & { type: DocType };

const MAX_IMAGES = 10;
const MAX_VIDEOS = 3;

function uploadedDoc(file: {
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

function permissionAlert(kind: "photo" | "video" | "library"): void {
  const message =
    kind === "library"
      ? "Allow photo library access to upload listing media."
      : kind === "video"
        ? "Allow camera and microphone access to record listing videos."
        : "Allow camera access to take listing photos.";
  Alert.alert("Permission needed", message, [
    { text: "Dismiss" },
    { text: "Open Settings", onPress: () => void openSettings() },
  ]);
}

export default function CreateListingScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ editId?: string }>();
  const editIdRaw = params.editId;
  const editId = Array.isArray(editIdRaw) ? editIdRaw[0] : editIdRaw;
  const isEdit = Boolean(editId);

  const cities = useQuery({
    queryKey: ["cities"],
    queryFn: fetchCities,
  });
  const existing = useQuery({
    queryKey: ["property", editId, "edit"],
    queryFn: () => fetchPropertyById(editId as string),
    enabled: Boolean(editId),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [type, setType] = useState<(typeof PROPERTY_TYPES)[number]>("HOUSE");
  const [listingType, setListingType] = useState<"SALE" | "RENTAL">("SALE");
  const [cityId, setCityId] = useState<string>("");
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [pendingDocType, setPendingDocType] = useState<DocType>("CNIC");
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!existing.data || prefilled) return;
    const property = existing.data;
    setTitle(property.title || "");
    setDescription(property.description || "");
    setPrice(String(property.price ?? ""));
    setArea(String(property.area ?? ""));
    setAddress(property.address || "");
    setBedrooms(property.bedrooms != null ? String(property.bedrooms) : "");
    setBathrooms(property.bathrooms != null ? String(property.bathrooms) : "");
    if (
      PROPERTY_TYPES.includes(property.type as (typeof PROPERTY_TYPES)[number])
    ) {
      setType(property.type as (typeof PROPERTY_TYPES)[number]);
    }
    if (property.listingType === "RENTAL" || property.listingType === "SALE") {
      setListingType(property.listingType);
    }
    if (property.city?.id) setCityId(property.city.id);
    setMedia(
      (property.images || []).map((url, index) => ({
        url,
        name: `media-${index}`,
        kind: detectMediaKind({ url }),
      }))
    );
    setPrefilled(true);
  }, [existing.data, prefilled]);

  const { openDocumentPicker, isUploading: uploadingDocs } = useDocumentUploader(
    "verificationDocuments",
    {
      onClientUploadComplete: (files) => {
        const uploaded = (files || [])
          .map((file) => uploadedDoc(file as never))
          .filter((item): item is UploadedMedia => Boolean(item));
        if (!uploaded.length) {
          setError("Document upload failed");
          return;
        }
        setDocs((prev) => [
          ...prev,
          ...uploaded.map((item) => ({ ...item, type: pendingDocType })),
        ]);
      },
      onUploadError: (err) => {
        setError(err.message || "Document upload failed");
      },
    }
  );

  const cityOptions = useMemo(() => cities.data ?? [], [cities.data]);
  const imageCount = media.filter((item) => item.kind === "image").length;
  const videoCount = media.filter((item) => item.kind === "video").length;
  const busy = loading || uploadingMedia || uploadingDocs;

  async function handleCapture(
    mode: "photo" | "video",
    source: "camera" | "library"
  ): Promise<void> {
    setError(null);
    if (mode === "photo" && imageCount >= MAX_IMAGES) {
      setError(`You can upload up to ${MAX_IMAGES} photos`);
      return;
    }
    if (mode === "video" && videoCount >= MAX_VIDEOS) {
      setError(`You can upload up to ${MAX_VIDEOS} videos`);
      return;
    }

    setUploadingMedia(true);
    try {
      const result = await captureAndUploadMedia({ mode, source });
      if (result.status === "permission_denied") {
        permissionAlert(source === "library" ? "library" : mode);
        return;
      }
      if (result.status === "cancelled") return;
      if (result.status === "error") {
        setError(result.message);
        return;
      }

      setMedia((prev) => {
        const next = [...prev];
        for (const file of result.files) {
          if (file.kind === "video") {
            if (next.filter((item) => item.kind === "video").length >= MAX_VIDEOS) {
              continue;
            }
          } else if (next.filter((item) => item.kind === "image").length >= MAX_IMAGES) {
            continue;
          }
          next.push(file);
        }
        return next;
      });
    } finally {
      setUploadingMedia(false);
    }
  }

  function removeMedia(index: number): void {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }

  if (!user) {
    return (
      <ScreenContainer>
        <Text style={styles.body}>Sign in to submit a listing.</Text>
        <PrimaryButton label="Sign in" onPress={() => router.push("/login")} />
      </ScreenContainer>
    );
  }

  if (isEdit && existing.isLoading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Edit listing" }} />
        <StateBlock loading />
      </ScreenContainer>
    );
  }

  if (isEdit && (existing.isError || !existing.data)) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Edit listing" }} />
        <StateBlock
          error={getApiErrorMessage(existing.error, "Could not load listing")}
          onRetry={() => void existing.refetch()}
        />
      </ScreenContainer>
    );
  }

  async function onSubmit() {
    setError(null);
    if (!title.trim() || !description.trim() || !address.trim()) {
      setError("Title, description, and address are required");
      return;
    }
    if (!cityId) {
      setError("Select a city");
      return;
    }
    const priceNum = Number(price);
    const areaNum = Number(area);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Enter a valid price");
      return;
    }
    if (!Number.isFinite(areaNum) || areaNum <= 0) {
      setError("Enter a valid area");
      return;
    }
    if (imageCount === 0) {
      setError("Add at least one property photo");
      return;
    }
    if (!isEdit && docs.length === 0) {
      setError("Add at least one verification document");
      return;
    }

    const imageUrls = [
      ...media.filter((item) => item.kind === "image"),
      ...media.filter((item) => item.kind === "video"),
    ]
      .map((item) => item.url)
      .filter(Boolean);

    setLoading(true);
    try {
      if (isEdit && editId) {
        await updateProperty(editId, {
          title: title.trim(),
          description: description.trim(),
          price: priceNum,
          type,
          listingType,
          bedrooms: bedrooms ? Number(bedrooms) : null,
          bathrooms: bathrooms ? Number(bathrooms) : null,
          area: areaNum,
          address: address.trim(),
          cityId,
          imageUrls,
        });
        await queryClient.invalidateQueries({ queryKey: ["properties", "mine"] });
        await queryClient.invalidateQueries({ queryKey: ["property", editId] });
        Alert.alert(
          "Saved",
          "Your listing was updated. Verified listings return to review after edits.",
          [{ text: "OK", onPress: () => router.replace("/(tabs)/sell") }]
        );
      } else {
        await apiClient.post("/api/properties", {
          title: title.trim(),
          description: description.trim(),
          price: priceNum,
          type,
          listingType,
          bedrooms: bedrooms ? Number(bedrooms) : undefined,
          bathrooms: bathrooms ? Number(bathrooms) : undefined,
          area: areaNum,
          address: address.trim(),
          cityId,
          imageUrls,
          verificationDocuments: docs.map((doc) => ({
            type: doc.type,
            url: doc.url,
            fileName: doc.name,
            ...(doc.key ? { fileKey: doc.key } : {}),
          })),
        });
        await queryClient.invalidateQueries({ queryKey: ["properties", "mine"] });
        Alert.alert(
          "Submitted",
          "Your listing was submitted for Manzil verification.",
          [{ text: "OK", onPress: () => router.replace("/(tabs)/sell") }]
        );
      }
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          isEdit ? "Could not update listing" : "Could not submit listing"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll atmosphere="hero">
      <Stack.Screen
        options={{ title: isEdit ? "Edit listing" : "List a property" }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrap}
      >
        <Text style={styles.title}>
          {isEdit ? "Edit listing" : "List a property"}
        </Text>
        <Text style={styles.subtitle}>
          {isEdit
            ? "Update details and media. Verified or active listings return to review after you save."
            : "Capture photos or short videos on site, then attach ownership documents for verification."}
        </Text>

        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Field
          label="Price (PKR)"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <Field
          label="Area (sq ft)"
          value={area}
          onChangeText={setArea}
          keyboardType="numeric"
        />
        <Field label="Address" value={address} onChangeText={setAddress} />
        <Field
          label="Bedrooms"
          value={bedrooms}
          onChangeText={setBedrooms}
          keyboardType="numeric"
        />
        <Field
          label="Bathrooms"
          value={bathrooms}
          onChangeText={setBathrooms}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Listing type</Text>
        <View style={styles.row}>
          {(["SALE", "RENTAL"] as const).map((value) => (
            <Chip
              key={value}
              label={value === "SALE" ? "Sale" : "Rent"}
              active={listingType === value}
              onPress={() => setListingType(value)}
            />
          ))}
        </View>

        <Text style={styles.label}>Property type</Text>
        <View style={styles.rowWrap}>
          {PROPERTY_TYPES.map((value) => (
            <Chip
              key={value}
              label={value}
              active={type === value}
              onPress={() => setType(value)}
            />
          ))}
        </View>

        <Text style={styles.label}>City</Text>
        <View style={styles.rowWrap}>
          {cityOptions.slice(0, 30).map((city) => (
            <Chip
              key={city.id}
              label={city.name}
              active={cityId === city.id}
              onPress={() => setCityId(city.id)}
            />
          ))}
        </View>

        <Text style={styles.label}>
          Media ({imageCount}/{MAX_IMAGES} photos · {videoCount}/{MAX_VIDEOS} videos)
        </Text>
        <View style={styles.mediaActions}>
          <MediaAction
            label={uploadingMedia ? "Uploading…" : "Take photo"}
            Icon={Camera}
            disabled={busy || imageCount >= MAX_IMAGES}
            onPress={() => void handleCapture("photo", "camera")}
          />
          <MediaAction
            label="Photo library"
            Icon={ImagePlus}
            disabled={busy || imageCount >= MAX_IMAGES}
            onPress={() => void handleCapture("photo", "library")}
          />
          <MediaAction
            label="Record video"
            Icon={Video}
            disabled={busy || videoCount >= MAX_VIDEOS}
            onPress={() => void handleCapture("video", "camera")}
          />
          <MediaAction
            label="Video library"
            Icon={Video}
            disabled={busy || videoCount >= MAX_VIDEOS}
            onPress={() => void handleCapture("video", "library")}
          />
        </View>

        <View style={styles.previewRow}>
          {media.map((item, index) => (
            <Pressable
              key={`${item.url || item.key}-${index}`}
              onLongPress={() => removeMedia(index)}
              accessibilityLabel={
                item.kind === "video"
                  ? `Video ${item.name}. Long press to remove.`
                  : `Photo ${item.name}. Long press to remove.`
              }
              style={styles.previewCard}
            >
              {item.kind === "video" ? (
                <View style={[styles.preview, styles.videoPreview]}>
                  <Video size={22} color={colors.primaryForeground} />
                  <Text style={styles.videoLabel}>Video</Text>
                </View>
              ) : (
                <Image source={{ uri: item.url }} style={styles.preview} />
              )}
            </Pressable>
          ))}
        </View>
        {media.length > 0 ? (
          <Text style={styles.hint}>Long-press a thumbnail to remove it.</Text>
        ) : null}

        {!isEdit ? (
          <>
            <Text style={styles.label}>Verification documents</Text>
            <View style={styles.rowWrap}>
              {DOC_TYPES.map((value) => (
                <Chip
                  key={value}
                  label={value}
                  active={pendingDocType === value}
                  onPress={() => setPendingDocType(value)}
                />
              ))}
            </View>
            <PrimaryButton
              label={uploadingDocs ? "Uploading…" : `Upload ${pendingDocType}`}
              disabled={busy}
              onPress={() => {
                void openDocumentPicker({});
              }}
            />
            {docs.map((doc, index) => (
              <Text key={`${doc.name}-${index}`} style={styles.docLine}>
                {doc.type}: {doc.name}
              </Text>
            ))}
          </>
        ) : (
          <Text style={styles.hint}>
            Existing verification documents stay on file. Contact support to replace them.
          </Text>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label={isEdit ? "Save changes" : "Submit for verification"}
          loading={busy}
          onPress={onSubmit}
        />
        <SecondaryButton
          label="Cancel"
          disabled={busy}
          onPress={() => router.back()}
          style={styles.cancel}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function MediaAction(props: {
  label: string;
  Icon: typeof Camera;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { Icon } = props;
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={[styles.mediaBtn, props.disabled ? styles.mediaBtnDisabled : null]}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ disabled: Boolean(props.disabled) }}
    >
      <Icon size={18} color={colors.primary} />
      <Text style={styles.mediaBtnLabel}>{props.label}</Text>
    </Pressable>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        style={[styles.input, props.multiline ? styles.multiline : null]}
        multiline={props.multiline}
        keyboardType={props.keyboardType}
        placeholderTextColor={colors.mutedForeground}
      />
    </View>
  );
}

function Chip(props: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={[styles.chip, props.active ? styles.chipActive : null]}
      accessibilityRole="button"
      accessibilityState={{ selected: props.active }}
    >
      <Text style={[styles.chipLabel, props.active ? styles.chipLabelActive : null]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingBottom: spacing["2xl"],
  },
  title: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
  },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.foreground,
    backgroundColor: colors.card,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
  },
  multiline: {
    minHeight: 96,
    paddingVertical: spacing.md,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
  },
  chipLabelActive: {
    color: colors.primaryForeground,
  },
  mediaActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  mediaBtn: {
    minWidth: "47%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  mediaBtnDisabled: {
    opacity: 0.45,
  },
  mediaBtnLabel: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  previewCard: {
    borderRadius: radii.md,
    overflow: "hidden",
  },
  preview: {
    width: 84,
    height: 84,
    borderRadius: radii.md,
    backgroundColor: colors.muted,
  },
  videoPreview: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.primaryDark,
  },
  videoLabel: {
    color: colors.primaryForeground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  hint: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
  },
  docLine: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
  },
  error: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
  },
  body: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    marginBottom: spacing.lg,
  },
  cancel: {
    marginTop: spacing.xs,
  },
});
