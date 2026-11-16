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
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { getApiErrorMessage } from "@/src/services/api/client";
import { fetchCities } from "@/src/services/api/properties";
import { submitPropertyRequest } from "@/src/services/api/requests";
import { useAuthStore } from "@/src/store/authStore";
import { colors, radii, spacing, typography } from "@/src/theme";

const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "LAND",
  "COMMERCIAL",
] as const;

export default function CreateRequestScreen() {
  const user = useAuthStore((s) => s.user);
  const cities = useQuery({ queryKey: ["cities"], queryFn: fetchCities });

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [propertyType, setPropertyType] =
    useState<(typeof PROPERTY_TYPES)[number]>("HOUSE");
  const [bedrooms, setBedrooms] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cityOptions = useMemo(() => cities.data ?? [], [cities.data]);

  async function onSubmit() {
    setError(null);
    if (name.trim().length < 2) {
      setError("Enter your name");
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
      setError("Enter your budget");
      return;
    }

    setLoading(true);
    try {
      await submitPropertyRequest({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city,
        budget: budgetNum,
        propertyType,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        additionalDetails: details.trim() || undefined,
      });
      Alert.alert(
        "Request submitted",
        "Manzil will review your property request and follow up.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit request"));
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
        <Text style={styles.title}>Request a property</Text>
        <Text style={styles.subtitle}>
          Tell us what you are looking for and we will help match verified inventory.
        </Text>

        <Field label="Name" value={name} onChangeText={setName} />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="Phone"
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
          label="Bedrooms"
          value={bedrooms}
          onChangeText={setBedrooms}
          keyboardType="numeric"
        />
        <Field
          label="Additional details"
          value={details}
          onChangeText={setDetails}
          multiline
        />

        <Text style={styles.label}>Property type</Text>
        <View style={styles.rowWrap}>
          {PROPERTY_TYPES.map((value) => (
            <Chip
              key={value}
              label={value}
              active={propertyType === value}
              onPress={() => setPropertyType(value)}
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

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Submit request" loading={loading} onPress={onSubmit} />
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
  error: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
  },
});
