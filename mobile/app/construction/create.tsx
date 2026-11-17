import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  HardHat,
  Ruler,
  ShieldCheck,
} from "lucide-react-native";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { getApiErrorMessage } from "@/src/services/api/client";
import { fetchCities } from "@/src/services/api/properties";
import { submitConstructionRequest } from "@/src/services/api/requests";
import { useAuthStore } from "@/src/store/authStore";
import { colors, elevation, radii, spacing, typography } from "@/src/theme";

const PROJECT_TYPES = [
  "RESIDENTIAL_HOUSE",
  "APARTMENT_BUILDING",
  "COMMERCIAL",
  "MIXED_USE",
  "VILLA",
  "INDUSTRIAL",
] as const;

const TIMELINES = [
  "3-6 MONTHS",
  "6-12 MONTHS",
  "1-2 YEARS",
  "MORE_THAN_2_YEARS",
] as const;

const HIGHLIGHTS = [
  {
    title: "Plot to finished home",
    body: "Guided construction with the same Manzil trust standard.",
    Icon: HardHat,
  },
  {
    title: "Clear scope & timeline",
    body: "Tell us your land, floors, and budget — we plan around them.",
    Icon: Ruler,
  },
  {
    title: "Verified process",
    body: "Our advisors follow up personally after you submit this form.",
    Icon: ShieldCheck,
  },
] as const;

function labelize(value: string): string {
  return value.replace(/_/g, " ");
}

export default function ConstructionCreateScreen() {
  const user = useAuthStore((s) => s.user);
  const cities = useQuery({ queryKey: ["cities"], queryFn: fetchCities });

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [projectType, setProjectType] =
    useState<(typeof PROJECT_TYPES)[number]>("RESIDENTIAL_HOUSE");
  const [landArea, setLandArea] = useState("");
  const [floors, setFloors] = useState("1");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [hasBlueprint, setHasBlueprint] = useState(false);
  const [timeline, setTimeline] =
    useState<(typeof TIMELINES)[number] | "">("6-12 MONTHS");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cityOptions = useMemo(() => cities.data ?? [], [cities.data]);

  async function onSubmit() {
    setError(null);
    if (name.trim().length < 2) {
      setError("Enter your full name");
      return;
    }
    if (!email.trim().includes("@")) {
      setError("Enter a valid email");
      return;
    }
    if (phone.trim().length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    if (!city) {
      setError("Select a city");
      return;
    }
    const budgetNum = Number(budget);
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      setError("Enter your construction budget");
      return;
    }
    const landAreaNum = Number(landArea);
    if (!Number.isFinite(landAreaNum) || landAreaNum < 0) {
      setError("Enter land area in sq ft");
      return;
    }

    setLoading(true);
    try {
      await submitConstructionRequest({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city,
        budget: budgetNum,
        projectType,
        landArea: landAreaNum,
        floors: floors ? Number(floors) : undefined,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        hasBlueprint,
        timeline: timeline || undefined,
        additionalDetails: details.trim() || undefined,
      });
      Alert.alert(
        "Request submitted",
        "Our construction experts will review your project and get in touch.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)") }]
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit construction request"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll atmosphere="hero" testID="construction-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrap}
      >
        <View style={styles.hero}>
          <View style={styles.iconBadge}>
            <HardHat size={22} color={colors.primary} />
          </View>
          <Text style={styles.title}>Hire us to construct</Text>
          <Text style={styles.subtitle}>
            Let Manzil build your dream property. Share your plot details and
            our construction experts will follow up.
          </Text>
        </View>

        <View style={styles.highlightStack}>
          {HIGHLIGHTS.map((item) => (
            <View key={item.title} style={styles.highlightCard}>
              <item.Icon size={18} color={colors.primary} />
              <View style={styles.highlightCopy}>
                <Text style={styles.highlightTitle}>{item.title}</Text>
                <Text style={styles.highlightBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formHeading}>Construction request</Text>

          <Field label="Full name" value={name} onChangeText={setName} />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Field
            label="Budget (PKR)"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />
          <Field
            label="Land area (sq ft)"
            value={landArea}
            onChangeText={setLandArea}
            keyboardType="numeric"
          />
          <Field
            label="Number of floors"
            value={floors}
            onChangeText={setFloors}
            keyboardType="numeric"
          />
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
          <Field
            label="Additional details"
            value={details}
            onChangeText={setDetails}
            multiline
          />

          <Text style={styles.label}>Project type</Text>
          <View style={styles.rowWrap}>
            {PROJECT_TYPES.map((value) => (
              <Chip
                key={value}
                label={labelize(value)}
                active={projectType === value}
                onPress={() => setProjectType(value)}
              />
            ))}
          </View>

          <Text style={styles.label}>Timeline</Text>
          <View style={styles.rowWrap}>
            {TIMELINES.map((value) => (
              <Chip
                key={value}
                label={labelize(value)}
                active={timeline === value}
                onPress={() => setTimeline(value)}
              />
            ))}
          </View>

          <Text style={styles.label}>City</Text>
          <View style={styles.rowWrap}>
            {cityOptions.slice(0, 30).map((item) => (
              <Chip
                key={item.id}
                label={item.name}
                active={city === item.name}
                onPress={() => setCity(item.name)}
              />
            ))}
          </View>

          <Pressable
            onPress={() => setHasBlueprint((v) => !v)}
            style={styles.checkboxRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: hasBlueprint }}
          >
            <View
              style={[
                styles.checkbox,
                hasBlueprint ? styles.checkboxChecked : null,
              ]}
            >
              {hasBlueprint ? (
                <CheckCircle2 size={16} color={colors.primaryForeground} />
              ) : null}
            </View>
            <Text style={styles.checkboxLabel}>I already have a blueprint</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label="Submit construction request"
            loading={loading}
            onPress={onSubmit}
            testID="construction-submit"
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences";
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
        autoCapitalize={props.autoCapitalize}
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
      <Text
        style={[styles.chipLabel, props.active ? styles.chipLabelActive : null]}
      >
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
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
    textAlign: "center",
  },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    textAlign: "center",
  },
  highlightStack: {
    gap: spacing.sm,
  },
  highlightCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...elevation.card,
  },
  highlightCopy: {
    flex: 1,
    gap: 2,
  },
  highlightTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
  highlightBody: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
  formCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevation.card,
  },
  formHeading: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes.xl,
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
    backgroundColor: colors.background,
    fontFamily: typography.fonts.sans,
  },
  multiline: {
    minHeight: 96,
    paddingVertical: spacing.md,
    textAlignVertical: "top",
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
    backgroundColor: colors.background,
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkboxLabel: {
    color: colors.foreground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  error: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
  },
});
