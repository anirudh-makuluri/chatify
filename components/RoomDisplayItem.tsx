import { router } from 'expo-router';
import { View } from 'react-native'
import { Avatar, Card, Text, Chip } from 'react-native-paper'
import { useUser } from '~/app/providers';
import { TRoomData } from '~/lib/types'
import { setActiveRoomId } from '~/redux/chatSlice';
import { useAppDispatch, useAppSelector } from '~/redux/store';
import { useTheme } from '~/lib/themeContext';

export default function RoomDisplayItem({ roomData }: { roomData: TRoomData }) {
	const dispatch = useAppDispatch();
	const {	user } = useUser();
	const { colors } = useTheme();
	const rooms = useAppSelector(state => state.chat.rooms);

	function changeActiveRoom() {
		if(!user) return;

		dispatch(setActiveRoomId(roomData.roomId));
		router.push('/room')
	}

	function getLastMessage() {
		if(!user || rooms[roomData.roomId] == null) return "Start a conversation"

		const currentMessages = rooms[roomData.roomId].messages;
		if(currentMessages.length == 0) return "Start a conversation";

		const lastMesage = currentMessages[currentMessages.length - 1];
		const isAIMessage = lastMesage.isAIMessage || lastMesage.userUid === 'ai-assistant';
		const senderName = lastMesage.userUid == user.uid ? "You" : (isAIMessage ? "AI" : lastMesage.userName);

		if (lastMesage.type === 'text') {
			return `${senderName}: ${lastMesage.chatInfo}`;
		} else if (lastMesage.type === 'image') {
			return `${senderName} shared an image`;
		} else if (lastMesage.type === 'file') {
			return `${senderName} shared a file`;
		} else {
			return `${senderName} shared an attachment`;
		}
	}

	function getLastMessageTime() {
		if(!user || rooms[roomData.roomId] == null) return "";

		const currentMessages = rooms[roomData.roomId].messages;
		if(currentMessages.length == 0) return "";

		const lastMesage = currentMessages[currentMessages.length - 1];
		if (!lastMesage.time) return "";

		const messageTime = new Date(lastMesage.time);
		const now = new Date();
		const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);

		if (diffInHours < 24) {
			// Show time if within 24 hours
			return messageTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
		} else if (diffInHours < 24 * 7) {
			// Show day of week if within a week
			return messageTime.toLocaleDateString([], { weekday: 'short' });
		} else {
			// Show date if older than a week
			return messageTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
		}
	}

	const isAIRoom = roomData.is_ai_room || roomData.roomId.startsWith('ai-assistant-');

	return (
		<Card
			onPress={changeActiveRoom}
			style={
				isAIRoom
					? {
							backgroundColor: colors.surface,
							borderLeftWidth: 4,
							borderLeftColor: colors.primary,
							borderRadius: 14,
							borderWidth: 1,
							borderColor: colors.border,
							shadowColor: colors.primary,
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.12,
							shadowRadius: 6,
							elevation: 3,
						}
					: {
							backgroundColor: colors.surface,
							borderRadius: 14,
							borderWidth: 1,
							borderColor: colors.border,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 1 },
							shadowOpacity: 0.06,
							shadowRadius: 4,
							elevation: 2,
						}
			}
			className="mx-4 mb-3"
		>
			<Card.Content className="flex flex-row items-center gap-4 py-4 h-[72px]">
				<View className="relative">
					<Avatar.Image
						size={52}
						source={{
							uri: isAIRoom
								? 'https://ui-avatars.com/api/?name=AI&background=3b82f6&color=ffffff'
								: roomData.photo_url,
						}}
						style={{
							borderWidth: 2,
							borderColor: isAIRoom ? colors.primary : colors.border,
						}}
					/>
					{isAIRoom && (
						<View
							style={{
								position: 'absolute',
								bottom: -2,
								right: -2,
								backgroundColor: colors.primary,
								borderRadius: 12,
								width: 24,
								height: 24,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>AI</Text>
						</View>
					)}
				</View>
				<View className="flex-1">
					<View className="flex-row items-center gap-2 mb-1">
						<Text
							style={{
								fontSize: 16,
								fontWeight: '600',
								color: colors.text,
							}}
						>
							{roomData.name}
						</Text>
						{isAIRoom && (
							<View
								style={{
									backgroundColor: colors.muted,
									paddingHorizontal: 8,
									paddingVertical: 4,
									borderRadius: 10,
									borderWidth: 1,
									borderColor: colors.border,
								}}
							>
								<Text
									style={{
										color: colors.primary,
										fontSize: 10,
										fontWeight: '600',
									}}
								>
									AI Assistant
								</Text>
							</View>
						)}
					</View>
					<Text
						style={{
							fontSize: 14,
							color: colors.textSecondary
						}}
						className='truncate h-[36px]'
					>
						{getLastMessage()}
					</Text>
				</View>
				<View className="items-end">
					<Text
						style={{
							fontSize: 12,
							color: colors.textSecondary,
						}}
					>
						{getLastMessageTime()}
					</Text>
				</View>
			</Card.Content>
		</Card>
	);
}
