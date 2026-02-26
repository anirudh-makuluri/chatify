import React, { useState, useMemo } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconButton, Button } from 'react-native-paper';
import RoomDisplayItem from '../RoomDisplayItem';
import StatusRow from '../StatusRow';
import FilterTabs, { FilterType } from '../FilterTabs';
import { useUser } from '~/app/providers';
import { useTheme } from '~/lib/themeContext';
import { useToast } from '../Toast';

interface RoomListProps {
	onCreateGroup?: () => void;
}

export default function RoomList({ onCreateGroup }: RoomListProps) {
	const { user } = useUser();
	const { colors, isDark } = useTheme();
	const { showToast } = useToast();
	const [activeFilter, setActiveFilter] = useState<FilterType>('all');

	const insets = useSafeAreaInsets();

	const filteredRooms = useMemo(() => {
		if (!user?.rooms) return [];
		
		let rooms = user.rooms;
		
		// Apply filter
		if (activeFilter === 'groups') {
			rooms = rooms.filter((room) => room.is_group === true);
		}
		
		return rooms;
	}, [user?.rooms, activeFilter]);

	const handleComingSoon = () => {
		showToast({ message: 'This feature is coming soon!', type: 'coming-soon' });
	};

	const renderEmptyState = () => (
		<View style={styles.emptyContainer}>
			<View style={[styles.emptyIcon, { backgroundColor: isDark ? colors.surface : colors.muted }]}>
				<Icon source="chat" size={48} color={colors.primary} />
			</View>
			<Text style={[styles.emptyTitle, { color: colors.text }]}>No Chats Yet</Text>
			<Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
				Start a conversation by adding friends or creating a group chat
			</Text>
			<View style={[styles.tipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
				<Text style={[styles.tipText, { color: colors.primary }]}>
					💡 Go to Friends tab to add new friends and start chatting!
				</Text>
			</View>
			{onCreateGroup && (
				<Button
					mode="contained"
					onPress={onCreateGroup}
					icon="account-multiple-plus"
					style={[styles.createButton, { backgroundColor: colors.primary }]}
				>
					Create Group Chat
				</Button>
			)}
		</View>
	);

	const renderNoResults = () => (
		<View style={styles.emptyContainer}>
			<View style={[styles.emptyIcon, { backgroundColor: isDark ? colors.surface : colors.muted }]}>
				<Icon
					source={activeFilter === 'groups' ? 'account-group' : 'magnify'}
					size={40}
					color={colors.textSecondary}
				/>
			</View>
			<Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
				{activeFilter === 'groups' ? 'No Groups Yet' : 'No Results Found'}
			</Text>
			<Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
				{activeFilter === 'groups'
					? 'Create a group to start chatting with multiple friends'
					: 'Try a different filter'}
			</Text>
			{activeFilter === 'groups' && onCreateGroup && (
				<Button
					mode="contained"
					onPress={onCreateGroup}
					icon="account-multiple-plus"
					style={[styles.createButton, { backgroundColor: colors.primary }]}
				>
					Create Group
				</Button>
			)}
		</View>
	);

	const ListHeader = () => (
		<>
			{/* Stories/Status Row */}
			<StatusRow onAddStatusPress={handleComingSoon} />

			{/* Filter Tabs */}
			<FilterTabs
				activeFilter={activeFilter}
				onFilterChange={setActiveFilter}
				onComingSoon={handleComingSoon}
			/>
		</>
	);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			{user?.rooms && user.rooms.length > 0 ? (
				<FlatList
					data={filteredRooms}
					ListHeaderComponent={ListHeader}
					renderItem={({ item }) => <RoomDisplayItem roomData={item} />}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.listContent}
					keyExtractor={(item) => item.roomId}
					ListEmptyComponent={renderNoResults}
				/>
			) : (
				<>
					<ListHeader />
					{renderEmptyState()}
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		paddingBottom: 100,
	},
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 32,
		paddingVertical: 48,
	},
	emptyIcon: {
		width: 96,
		height: 96,
		borderRadius: 48,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
	},
	emptyTitle: {
		fontSize: 22,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 8,
	},
	emptyMessage: {
		fontSize: 15,
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: 24,
	},
	tipCard: {
		borderRadius: 14,
		padding: 16,
		borderWidth: 1,
		marginBottom: 20,
	},
	tipText: {
		textAlign: 'center',
		fontWeight: '600',
		fontSize: 14,
	},
	createButton: {
		borderRadius: 12,
	},
});
