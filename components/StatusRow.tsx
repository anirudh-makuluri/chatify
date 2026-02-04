import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Text, Avatar, Icon } from 'react-native-paper';
import { useTheme } from '~/lib/themeContext';
import { useUser } from '~/app/providers';
import { TUser } from '~/lib/types';

interface StatusRowProps {
	onStatusPress?: (user: TUser | null) => void;
	onAddStatusPress?: () => void;
}

export default function StatusRow({ onStatusPress, onAddStatusPress }: StatusRowProps) {
	const { colors, isDark } = useTheme();
	const { user } = useUser();

	const showComingSoon = () => {
		if (onAddStatusPress) onAddStatusPress();
	};

	// Get friends with potential "statuses" (for now, we'll show friends as having stories)
	const friendsWithStatus = user?.friend_list?.slice(0, 8) || [];

	return (
		<View style={[styles.container, { borderBottomColor: colors.border }]}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{/* Your Story */}
				<TouchableOpacity
					style={styles.statusItem}
					onPress={showComingSoon}
					activeOpacity={0.7}
				>
					<View style={[styles.avatarContainer, styles.addStoryContainer]}>
						<Avatar.Image
							size={60}
							source={{ uri: user?.photo_url || 'https://ui-avatars.com/api/?name=You' }}
						/>
						<View
							style={[
								styles.addButton,
								{ backgroundColor: colors.primary, borderColor: isDark ? colors.surface : '#fff' },
							]}
						>
							<Icon source="plus" size={14} color="#fff" />
						</View>
					</View>
					<Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
						You
					</Text>
				</TouchableOpacity>

				{/* Friends' Stories */}
				{friendsWithStatus.map((friend, index) => (
					<TouchableOpacity
						key={friend.uid}
						style={styles.statusItem}
						onPress={showComingSoon}
						activeOpacity={0.7}
					>
						<View
							style={[
								styles.avatarContainer,
								styles.storyRing,
								{ borderColor: colors.primary },
							]}
						>
							<Avatar.Image
								size={56}
								source={{ uri: friend.photo_url || 'https://ui-avatars.com/api/?name=' + friend.name }}
							/>
							{/* Mini images overlay for multiple stories */}
							{index < 2 && (
								<View style={[styles.miniImages, { backgroundColor: colors.surface }]}>
									<Text style={{ fontSize: 8, color: colors.textSecondary }}>
										{Math.floor(Math.random() * 3) + 1}
									</Text>
								</View>
							)}
						</View>
						<Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
							{friend.name.split(' ')[0]}
						</Text>
					</TouchableOpacity>
				))}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	scrollContent: {
		paddingHorizontal: 16,
		gap: 16,
	},
	statusItem: {
		alignItems: 'center',
		width: 70,
	},
	avatarContainer: {
		position: 'relative',
		marginBottom: 6,
	},
	addStoryContainer: {
		position: 'relative',
	},
	addButton: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		width: 22,
		height: 22,
		borderRadius: 11,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
	},
	storyRing: {
		borderWidth: 2,
		borderRadius: 32,
		padding: 2,
	},
	miniImages: {
		position: 'absolute',
		bottom: -2,
		right: -2,
		width: 18,
		height: 18,
		borderRadius: 9,
		alignItems: 'center',
		justifyContent: 'center',
	},
	name: {
		fontSize: 12,
		textAlign: 'center',
	},
});
