import { useState } from 'react'
import { View, FlatList, ScrollView } from 'react-native'
import { Button, Icon, Modal, Snackbar, Text, TextInput, Portal, Searchbar, IconButton, Card, Avatar, Chip } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TUser } from '~/lib/types';
import { customFetch } from '~/lib/utils';
import FetchedUser from '../FetchedUser';
import { useUser } from '~/app/providers';
import FriendRequest from '../FriendRequest';
import CustomSnackbar from '../CustomSnackbar';
import { useAppSelector } from '~/redux/store';
import { useTheme } from '~/lib/themeContext';

export default function Friends() {
	const { user } = useUser();
	const { colors } = useTheme();
	const userPresence = useAppSelector(state => state.chat.userPresence);

	const [searchUser, setSearchUser] = useState<string>("");
	const [fetchedUsers, setFetchedUsers] = useState<TUser[]>([]);
	const [openFetchedUsersModal, setOpenFetchedUsersModal] = useState(false);
	const [snackbarMsg, setSnackbarMsg] = useState("");

	// Helper functions for presence
	const getUserPresence = (uid: string) => {
		return userPresence[uid];
	};

	const formatLastSeen = (lastSeen: number | null) => {
		if (!lastSeen) return 'Never';
		
		const now = Date.now();
		const diff = now - lastSeen;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	};

	function handleSubmitSearch() {
		if (searchUser.trim().length == 0) return;

		customFetch({
			pathName: 'users/search-user?searchuser=' + searchUser
		}).then(res => {
			if (res.requiredUsers) {
				setFetchedUsers(res.requiredUsers);
				if (res.requiredUsers.length > 0) setOpenFetchedUsersModal(true);
				else setSnackbarMsg("No users found")
			}
		})
	}

	function closeModal() {
		setOpenFetchedUsersModal(false);
	}

	const renderEmptyState = () => (
		<View className="justify-center items-center px-8 py-16">
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
				<Icon source="account-multiple" size={48} color={colors.primary} />
			</View>
			<Text
				style={{
					fontSize: 22,
					fontWeight: '700',
					color: colors.text,
					textAlign: 'center',
					marginBottom: 8,
				}}
			>
				No Friend Requests
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
				When someone sends you a friend request, it will appear here
			</Text>
			<View
				style={{
					backgroundColor: colors.surface,
					borderRadius: 14,
					padding: 16,
					borderWidth: 1,
					borderColor: colors.border,
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
					💡 Use the search bar above to find and add new friends!
				</Text>
			</View>
		</View>
	);

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			<SafeAreaView className="flex-1">
				{/* Header */}
				<View
					style={{
						paddingHorizontal: 16,
						paddingVertical: 16,
						backgroundColor: colors.background,
						borderBottomWidth: 1,
						borderBottomColor: colors.border,
					}}
				>
					<Text
						style={{
							fontSize: 26,
							fontWeight: '700',
							color: colors.text,
							marginBottom: 16,
							letterSpacing: -0.3,
						}}
					>
						Friends
					</Text>
					<View className="flex-row items-center gap-3 mb-4">
						<View
							style={{
								flex: 1,
								backgroundColor: colors.muted,
								borderRadius: 14,
								paddingHorizontal: 4,
								paddingVertical: 4,
								borderWidth: 1,
								borderColor: colors.border,
							}}
						>
							<Searchbar
								placeholder="Search for a friend"
								value={searchUser}
								onChangeText={setSearchUser}
								style={{ backgroundColor: 'transparent', elevation: 0 }}
								placeholderTextColor={colors.textSecondary}
							/>
						</View>
						<IconButton
							icon="magnify"
							mode="contained"
							size={24}
							iconColor="#fff"
							onPress={handleSubmitSearch}
							style={{ backgroundColor: colors.primary, borderRadius: 12 }}
						/>
					</View>
					<View className="flex-row items-center gap-6">
						<View className="flex-row items-center gap-2">
							<View
								style={{
									width: 8,
									height: 8,
									borderRadius: 4,
									backgroundColor: colors.primary,
								}}
							/>
							<Text style={{ fontSize: 14, color: colors.textSecondary }}>
								{user?.friend_list?.length || 0} friends
							</Text>
						</View>
						<View className="flex-row items-center gap-2">
							<View
								style={{
									width: 8,
									height: 8,
									borderRadius: 4,
									backgroundColor: colors.accent,
								}}
							/>
							<Text style={{ fontSize: 14, color: colors.textSecondary }}>
								{user?.received_friend_requests?.length || 0} requests
							</Text>
						</View>
					</View>
				</View>

				{/* Friend List */}
				{user?.friend_list && user.friend_list.length > 0 && (
					<View className="flex-1 mb-4">
						<View
							style={{
								paddingHorizontal: 16,
								paddingVertical: 12,
								backgroundColor: colors.background,
								borderBottomWidth: 1,
								borderBottomColor: colors.border,
							}}
						>
							<Text
								style={{
									fontSize: 14,
									fontWeight: '600',
									color: colors.textSecondary,
								}}
							>
								Friends ({user.friend_list.length})
							</Text>
						</View>
						{/* <FlatList
							data={user.friend_list}
							renderItem={({ item }) => {
								const presence = getUserPresence(item.uid);
								return (
									<Card
										style={{
											marginHorizontal: 16,
											marginVertical: 4,
											backgroundColor: colors.surface,
											borderRadius: 14,
											borderWidth: 1,
											borderColor: colors.border,
										}}
									>
										<View className="flex-row items-center p-3">
											<View className="relative">
												<Avatar.Image size={48} source={{ uri: item.photo_url }} />
												<View
													style={{
														position: 'absolute',
														bottom: 0,
														right: 0,
														width: 14,
														height: 14,
														borderRadius: 7,
														borderWidth: 2,
														borderColor: colors.surface,
														backgroundColor: presence?.is_online ? colors.primary : colors.textSecondary,
													}}
												/>
											</View>
											<View className="flex-1 ml-3">
												<Text
													style={{
														fontSize: 16,
														fontWeight: '600',
														color: colors.text,
													}}
												>
													{item.name}
												</Text>
												<Text
													style={{
														fontSize: 12,
														color: colors.textSecondary,
														marginTop: 2,
													}}
												>
													{presence?.is_online
														? 'Online'
														: `Last seen ${formatLastSeen(presence?.last_seen || null)}`}
												</Text>
											</View>
										</View>
									</Card>
								);
							}}
							showsVerticalScrollIndicator={false}
						/> */}
					</View>
				)}

				{/* Friend Requests */}
				{user?.received_friend_requests?.length === 0 ? (
					renderEmptyState()
				) : (
					<View className="flex-1">
						<View
							style={{
								paddingHorizontal: 16,
								paddingVertical: 12,
								backgroundColor: colors.background,
								borderBottomWidth: 1,
								borderBottomColor: colors.border,
							}}
						>
							<Text
								style={{
									fontSize: 14,
									fontWeight: '600',
									color: colors.textSecondary,
								}}
							>
								Friend Requests ({user?.received_friend_requests?.length})
							</Text>
						</View>
						<FlatList
							data={user?.received_friend_requests}
							renderItem={({ item, index }) => (
								<FriendRequest
									invitedUser={item}
									key={index}
								/>
							)}
							className=""
							showsVerticalScrollIndicator={false}
						/>
					</View>
				)}

				{/* Search Results Modal */}
				<Portal>
					<Modal
						contentContainerStyle={{
							backgroundColor: colors.surface,
							padding: 20,
							margin: 20,
							borderRadius: 18,
							maxHeight: '80%',
							borderWidth: 1,
							borderColor: colors.border,
						}}
						visible={openFetchedUsersModal}
						onDismiss={closeModal}
					>
						<View className="flex-row items-center justify-between mb-4">
							<View>
								<Text
									style={{
										fontSize: 20,
										fontWeight: '700',
										color: colors.text,
									}}
								>
									Search Results
								</Text>
								<Text
									style={{
										fontSize: 14,
										color: colors.textSecondary,
										marginTop: 2,
									}}
								>
									Found {fetchedUsers.length} users
								</Text>
							</View>
							<IconButton
								icon="close"
								onPress={closeModal}
								iconColor={colors.textSecondary}
							/>
						</View>
						
						<ScrollView showsVerticalScrollIndicator={false}>
							{fetchedUsers.map((user, index) => (
								<FetchedUser 
									closeModal={closeModal} 
									fetchedUser={user} 
									key={index} 
								/>
							))}
						</ScrollView>
					</Modal>
				</Portal>
			</SafeAreaView>
			<CustomSnackbar setSnackbarMsg={setSnackbarMsg} snackbarMsg={snackbarMsg}/>
		</View>
	)
}
