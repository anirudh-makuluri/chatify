import { ReactNode } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle, UIManager } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '~/lib/themeContext';

type Props = {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
	intensity?: number;
	rounded?: number;
	border?: boolean;
};

export default function GlassSurface({
	children,
	style,
	intensity = 30,
	rounded = 18,
	border = true,
}: Props) {
	const { isDark } = useTheme();

	// A subtle tinted overlay to keep contrast consistent
	const overlayColor = isDark ? 'rgba(15, 23, 42, 0.35)' : 'rgba(255, 255, 255, 0.35)';
	const borderColor = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(2, 6, 23, 0.08)';

	// If the native view isn't present in the current binary, don't attempt to render it.
	// This avoids warnings like "ExpoBlurView isn't exported" when the dev client hasn't been rebuilt yet.
	const blurAvailable =
		Platform.OS === 'web' ? false : Boolean(UIManager.getViewManagerConfig?.('ExpoBlurView'));

	return (
		<View
			style={[
				styles.wrap,
				border ? { borderColor, borderWidth: 1 } : { borderWidth: 0 },
				{ borderRadius: rounded },
				style,
			]}
		>
			{/* Blur layer */}
			{blurAvailable ? (
				<BlurView
					intensity={intensity}
					tint={isDark ? 'dark' : 'light'}
					style={[StyleSheet.absoluteFill, { borderRadius: rounded }]}
				/>
			) : null}
			{/* Tint overlay */}
			<View
				pointerEvents="none"
				style={[
					StyleSheet.absoluteFill,
					{
						backgroundColor: overlayColor,
						borderRadius: rounded,
					},
				]}
			/>
			<View style={styles.inner}>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		overflow: 'hidden',
		// iOS: more natural glass shadow; Android: keep light to avoid heavy perf cost
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0.06,
		shadowRadius: 24,
		elevation: Platform.OS === 'android' ? 6 : 0,
	},
	inner: {
		// children layout lives here
	},
});

