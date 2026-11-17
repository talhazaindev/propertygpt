import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";

type BrandMarkProps = {
  size?: "sm" | "md" | "lg" | "hero";
  showWordmark?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

const SIZES = {
  sm: 40,
  md: 72,
  lg: 120,
  hero: 168,
} as const;

/**
 * Official Manzil logo mark for splash, auth, and branded surfaces.
 */
export function BrandMark({
  size = "md",
  showWordmark = false,
  style,
  imageStyle,
}: BrandMarkProps) {
  const dimension = SIZES[size];

  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="image"
      accessibilityLabel="Manzil by AlWahabCo"
    >
      <Image
        source={require("../../../assets/images/manzil-logo.png")}
        style={[
          {
            width: dimension,
            height: dimension,
          },
          styles.image,
          imageStyle,
        ]}
        resizeMode="contain"
      />
      {showWordmark ? (
        <Text style={styles.wordmark} accessibilityElementsHidden>
          Manzil
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    backgroundColor: "transparent",
  },
  wordmark: {
    marginTop: 8,
    color: "#195b3b",
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    letterSpacing: 1,
  },
});
