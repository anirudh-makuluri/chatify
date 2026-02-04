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

	// Softer overlay so it doesn't look like a solid white block in light mode
	const overlayColor = isDark
		? 'rgba(15, 23, 42, 0.40)' // slate-900 with a bit more opacity
		: 'rgba(15, 23, 42, 0.04)'; // very subtle tint on light background
	const borderColor = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(2, 6, 23, 0.08)';

	// Only render blur if the native view manager exists (avoids warnings on stale dev clients)
	const blurAvailable =
		Platform.OS !== 'web' && !!UIManager.getViewManagerConfig?.('ExpoBlurView');

	return (
		<View
			style={[
				border ? { borderColor, borderWidth: 1 } : { borderWidth: 0 },
				{ borderRadius: rounded },
				style,
			]}
		>
			{/* Blur layer where available */}
			{blurAvailable && (
				<BlurView
					intensity={intensity}
					tint={isDark ? 'dark' : 'light'}
					style={[StyleSheet.absoluteFill, { borderRadius: rounded }]}
				/>
			)}

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
			<View>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		overflow: 'hidden',
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

