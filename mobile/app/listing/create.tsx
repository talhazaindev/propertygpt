import { useMemo, useState } from "react";
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
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { apiClient, getApiErrorMessage } from "@/src/services/api/client";
import { fetchCities } from "@/src/services/api/properties";
import {
  useDocumentUploader,
  useImageUploader,
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

function uploadedUrl(file: {
  ufsUrl?: string;
  url?: string;
  appUrl?: string;
  key?: string;
  name?: string;
  serverData?: { url?: string; key?: string; name?: string };
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
  };
}

export default function CreateListingScreen() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const cities = useQuery({
    queryKey: ["cities"],
    queryFn: fetchCities,
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
  const [images, setImages] = useState<UploadedMedia[]>([]);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [pendingDocType, setPendingDocType] = useState<DocType>("CNIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { openImagePicker, isUploading: uploadingImages } = useImageUploader(
    "propertyImages",
    {
      onClientUploadComplete: (files) => {
        const next = (files || [])
          .map((file) => uploadedUrl(file as never))
          .filter((item): item is UploadedMedia => Boolean(item));
        if (next.length) {
          setImages((prev) => [...prev, ...next].slice(0, 10));
        }
      },
      onUploadError: (err) => {
        setError(err.message || "Image upload failed");
      },
    }
  );

  const { openDocumentPicker, isUploading: uploadingDocs } = useDocumentUploader(
    "verificationDocuments",
    {
      onClientUploadComplete: (files) => {
        const uploaded = (files || [])
          .map((file) => uploadedUrl(file as never))
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
  const busy = loading || uploadingImages || uploadingDocs;

  if (!user) {
    return (
      <ScreenContainer>
        <Text style={styles.body}>Sign in to submit a listing.</Text>
        <PrimaryButton label="Sign in" onPress={() => router.push("/login")} />
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
    if (images.length === 0) {
      setError("Add at least one property photo");
      return;
    }
    if (docs.length === 0) {
      setError("Add at least one verification document");
      return;
    }

    setLoading(true);
    try {
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
        imageUrls: images.map((item) => item.url).filter(Boolean),
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
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit listing"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrap}
      >
        <Text style={styles.title}>List a property</Text>
        <Text style={styles.subtitle}>
          Photos and ownership documents are required before review.
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

        <Text style={styles.label}>Photos ({images.length}/10)</Text>
        <View style={styles.row}>
          <PrimaryButton
            label={uploadingImages ? "Uploading…" : "Add from library"}
            disabled={busy || images.length >= 10}
            onPress={() => {
              void openImagePicker({
                source: "library",
                onInsufficientPermissions: () => {
                  Alert.alert(
                    "Photos permission needed",
                    "Allow photo library access to upload listing images.",
                    [
                      { text: "Dismiss" },
                      { text: "Open Settings", onPress: () => void openSettings() },
                    ]
                  );
                },
              });
            }}
          />
        </View>
        <View style={styles.previewRow}>
          {images.map((item) => (
            <Image key={item.url || item.key} source={{ uri: item.url }} style={styles.preview} />
          ))}
        </View>

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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label="Submit for verification"
          loading={busy}
          onPress={onSubmit}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
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
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  preview: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.muted,
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
});
