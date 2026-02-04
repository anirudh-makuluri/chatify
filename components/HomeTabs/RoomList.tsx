import React, { useState, useMemo } from 'react'
import { FlatList, View, Text } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, Searchbar, IconButton, FAB, Button } from 'react-native-paper'
import RoomDisplayItem from '../RoomDisplayItem'
import GroupChat from '../GroupChat'
import { useUser } from '~/app/providers'
import { useTheme } from '~/lib/themeContext'

export default function RoomList() {
	const { user } = useUser();
	const { colors } = useTheme();
	const [searchQuery, setSearchQuery] = useState('');
	const [showCreateGroup, setShowCreateGroup] = useState(false);

	const insets = useSafeAreaInsets();
	const bottomPad = insets.bottom || 0; // Only use safe area bottom padding

	const filteredRooms = useMemo(() => {
		if (!user?.rooms) return [];
		if (!searchQuery.trim()) return user.rooms;
		const q = searchQuery.toLowerCase();
		return user.rooms.filter(room => {
			const nameMatch = (room.name || '').toLowerCase().includes(q);
			const messages = Array.isArray(room.messages) ? room.messages : [];
			const msgMatch = messages.some(msg =>
				!msg.isDate && msg.type === 'text' && typeof msg.chatInfo === 'string' && msg.chatInfo.toLowerCase().includes(q)
			);
			return nameMatch || msgMatch;
		});
	}, [user?.rooms, searchQuery]);

	const renderEmptyState = () => (
		<View className="justify-center items-center px-8 py-16 mt-10">
			<View
				style={{
					width: 96,
					height: 96,
					backgroundColor: colors.muted,
					borderRadius: 48,
					alignItems: 'center',
					justifyContent: 'center',
					marginBottom: 24,
				}}
			>
				<Icon source="chat" size={48} color={colors.primary} />
			</View>
			<Text
				style={{
					fontSize: 22,
					fontWeight: '700',
					textAlign: 'center',
					marginBottom: 8,
					color: colors.text,
				}}
			>
				No Chats Yet
			</Text>
			<Text
				style={{
					color: colors.textSecondary,
					textAlign: 'center',
					marginBottom: 24,
					fontSize: 15,
					lineHeight: 22,
				}}
			>
				Start a conversation by adding friends or creating a group chat
			</Text>
			<View
				style={{
					backgroundColor: colors.surface,
					borderRadius: 14,
					padding: 16,
					borderWidth: 1,
					borderColor: colors.border,
					marginBottom: 20,
				}}
			>
				<Text
					style={{
						color: colors.primary,
						textAlign: 'center',
						fontWeight: '600',
						fontSize: 14,
					}}
				>
					💡 Go to Friends tab to add new friends and start chatting!
				</Text>
			</View>
			<Button
				mode="contained"
				onPress={() => setShowCreateGroup(true)}
				icon="account-multiple-plus"
				style={{ backgroundColor: colors.primary, borderRadius: 12 }}
			>
				Create Group Chat
			</Button>
		</View>
	);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
			<View
				style={{
					paddingHorizontal: 16,
					paddingVertical: 16,
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
					backgroundColor: colors.background,
				}}
			>
				<View className="flex-row items-center justify-between mb-4">
					<Text
						style={{
							fontSize: 26,
							fontWeight: '700',
							color: colors.text,
							letterSpacing: -0.3,
						}}
					>
						Chats
					</Text>
				</View>
				<View className="flex-row items-center gap-3 mb-2">
					<View
						style={{
							flex: 1,
							backgroundColor: colors.muted,
							borderRadius: 14,
							paddingHorizontal: 4,
							paddingVertical: 2,
							borderWidth: 1,
							borderColor: colors.border,
						}}
					>
						<Searchbar
							placeholder="Search conversations..."
							value={searchQuery}
							onChangeText={setSearchQuery}
							style={{ backgroundColor: 'transparent', elevation: 0 }}
							placeholderTextColor={colors.textSecondary}
						/>
					</View>
					{searchQuery.length > 0 && (
						<IconButton
							icon="close"
							size={20}
							iconColor={colors.textSecondary}
							onPress={() => setSearchQuery('')}
							style={{ backgroundColor: colors.surface }}
						/>
					)}
				</View>
				
				<Text style={{ color: colors.textSecondary }}>
					{searchQuery ? `${filteredRooms.length} results` : `${user?.rooms?.length || 0} conversations`}
				</Text>
			</View>
			
			{(() => {
				const roomsToShow = filteredRooms;
				
				// Debug: Show test room if no rooms
				if (roomsToShow.length === 0 && !searchQuery) {
					console.log('No rooms found, showing empty state');
					return renderEmptyState();
				}
				
				if (roomsToShow.length === 0 && searchQuery) {
					return (
						<View className="flex-1 justify-center items-center px-8 py-16">
							<View
								style={{
									width: 80,
									height: 80,
									backgroundColor: colors.muted,
									borderRadius: 40,
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: 16,
								}}
							>
								<Icon source="magnify" size={40} color={colors.textSecondary} />
							</View>
							<Text style={{ 
								fontSize: 18, 
								fontWeight: '600', 
								color: colors.textSecondary, 
								textAlign: 'center', 
								marginBottom: 8 
							}}>
								No Results Found
							</Text>
							<Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
								Try searching with different keywords
							</Text>
						</View>
					);
				}
				
				return (
					<View style={{ flex: 1 }}>
						<FlatList
							data={roomsToShow}
							renderItem={({ item, index }) => <RoomDisplayItem roomData={item} key={index} />}
							showsVerticalScrollIndicator={true}
							contentContainerStyle={{ 
								paddingVertical: 8, 
								paddingBottom: Math.max(bottomPad, 16) // Ensure minimum padding
							}}
							keyExtractor={(item, index) => item.roomId || index.toString()}
							style={{ flex: 1 }}
						/>
					</View>
				);
			})()}
		

			{/* Group Creation Modal */}
			{showCreateGroup && (
				<GroupChat
					onClose={() => setShowCreateGroup(false)}
				/>
			)}
		</SafeAreaView>
	)
}
