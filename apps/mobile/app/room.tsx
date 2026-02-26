import { useEffect, useRef, useState } from 'react';
import { FlatList, Image, View, Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import {
	Avatar,
	Button,
	Card,
	Text,
	TextInput,
	Icon,
	ActivityIndicator,
	IconButton,
	Menu,
	Portal,
	Dialog,
	ProgressBar,
	Chip,
	Divider,
} from 'react-native-paper';
import { useUser } from '~/app/providers';
import { ChatMessage } from '~/lib/types';
import { setActiveRoomId, setLoadingMore, setOfflineMode } from '~/redux/chatSlice';
import {
	sendMessageToServer,
	loadChatHistory,
	requestConversationSummaryAction,
	analyzeMessageSentimentAction,
	getSmartRepliesAction,
	sendAIChatRequestAction,
	loadOfflineMessagesForRoom,
	syncPendingMessages,
} from '~/redux/socketSlice';
import { useAppDispatch, useAppSelector } from '~/redux/store';
import ChatBubble from '../components/ChatBubble';
import GroupChat from '../components/GroupChat';
import ScheduleMessageDialog from '../components/ScheduleMessageDialog';
import ScheduledMessagesList from '../components/ScheduledMessagesList';
import SemanticSearchSheet from '../components/SemanticSearchSheet';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFile } from '~/lib/utils';
import { useTheme as useAppTheme } from '~/lib/themeContext';
import { useToast } from '~/components/Toast';
import GlassSurface from '~/components/GlassSurface';

export default function Room() {
	const activeChatRoomId = useAppSelector((state) => state.chat.activeChatRoomId);
	const activeRoom = useAppSelector((state) => state.chat.rooms[activeChatRoomId]);
	const userPresence = useAppSelector((state) => state.chat.userPresence);
	const isOffline = useAppSelector((state) => state.chat.isOffline);
	const textInputRef = useRef<any>(null);

	const dispatch = useAppDispatch();
	const { colors, isDark } = useAppTheme();
	const { showToast } = useToast();

	const { user, isOffline: userIsOffline } = useUser() || {};

	const [input, setInput] = useState<string>('');
	const [attachMenuVisible, setAttachMenuVisible] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [moreMenuVisible, setMoreMenuVisible] = useState(false);
	const [summaryDialogVisible, setSummaryDialogVisible] = useState(false);
	const [summary, setSummary] = useState<string>('');
	const [sentimentDialogVisible, setSentimentDialogVisible] = useState(false);
	const [sentiment, setSentiment] = useState<string>('');
	const [smartReplies, setSmartReplies] = useState<string[]>([]);
	const [testMessage, setTestMessage] = useState('');
	const [showSmartReplies, setShowSmartReplies] = useState(false);
	const [showGroupManagement, setShowGroupManagement] = useState(false);
	const [showGroupMembers, setShowGroupMembers] = useState(false);
	const [showScheduleDialog, setShowScheduleDialog] = useState(false);
	const [showScheduledMessages, setShowScheduledMessages] = useState(false);
	const [showSemanticSearch, setShowSemanticSearch] = useState(false);

	useEffect(() => {
		if (activeChatRoomId && activeRoom) {
			dispatch(setOfflineMode(userIsOffline || false));
			if (userIsOffline) {
				dispatch(loadOfflineMessagesForRoom(activeChatRoomId));
			}
		}
	}, [activeChatRoomId, userIsOffline]);

	useEffect(() => {
		if (!userIsOffline && !isOffline) {
			dispatch(syncPendingMessages());
		}
	}, [userIsOffline, isOffline]);

	if (activeChatRoomId == '' || activeRoom == null) {
		return null;
	}

	const generateId = () => {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = (Math.random() * 16) | 0,
				v = c == 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	};

	const getUserPresence = () => {
		if (!user) return '';
		if (!activeRoom) return '';
		if (activeRoom.is_group) return '';
		const otherUid = (activeRoom.members || []).find((m: any) => m.uid !== user.uid);
		if (!otherUid) return '';
		if (userPresence[otherUid]?.is_online === true) return 'Online';
		if (userPresence[otherUid]?.last_seen)
			return `Last seen ${formatLastSeen(userPresence[otherUid]?.last_seen || null)}`;
		return '';
	};

	const getMemberNames = () => {
		if (!activeRoom.is_group) return '';
		const names =
			activeRoom.members
				?.map((uid: string) => {
					if (uid === user?.uid) return 'You';
					const friend = user?.friend_list?.find((f) => f.uid === uid);
					return friend?.name?.split(' ')[0] || 'Unknown';
				})
				.slice(0, 4)
				.join(', ') || '';
		if ((activeRoom.members?.length || 0) > 4) {
			return names + ', ...';
		}
		return names;
	};

	const getMemberName = (uid: string) => {
		const friend = user?.friend_list?.find((f) => f.uid === uid);
		return friend?.name || 'Unknown User';
	};

	const formatLastSeen = (input: string | number | null) => {
		if (!input) return '';
		const date = new Date(input);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const minutes = Math.floor(diffMs / 60000);
		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes} min ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
		const days = Math.floor(hours / 24);
		return `${days} day${days > 1 ? 's' : ''} ago`;
	};

	const sendMessage = () => {
		if (input.trim() == '' || input == null) return;
		if (!user || activeChatRoomId == '') return;

		const chatMessage: ChatMessage = {
			id: generateId(),
			roomId: activeChatRoomId,
			type: 'text',
			chatInfo: input,
			userUid: user.uid,
			userName: user.name,
			userPhoto: user.photo_url,
			time: new Date(),
			isMsgEdited: false,
			isMsgSaved: false,
			fileName: '',
		};

		dispatch(sendMessageToServer(chatMessage));
		setInput('');
		setShowSmartReplies(false);
		if (textInputRef.current) textInputRef.current.blur();
	};

	function handleBackButton() {
		router.back();
		dispatch(setActiveRoomId(''));
	}

	const handleLoadMore = () => {
		if (!activeRoom.hasMoreMessages || activeRoom.isLoadingMore) return;
		dispatch(setLoadingMore({ roomId: activeChatRoomId, isLoading: true }));
		dispatch(loadChatHistory(activeChatRoomId, activeRoom.currentChatDocId));
	};

	// AI Functions
	const handleSummarizeConversation = async () => {
		setMoreMenuVisible(false);
		try {
			const response = (await dispatch(requestConversationSummaryAction(activeChatRoomId))) as any;
			if (response.success && response.summary) {
				setSummary(response.summary);
				setSummaryDialogVisible(true);
			}
		} catch (error) {
			Alert.alert('Error', 'Failed to generate conversation summary');
		}
	};

	const handleAnalyzeSentiment = () => {
		setMoreMenuVisible(false);
		const messages = activeRoom.messages;
		const textMessages = messages.filter((msg) => !msg.isDate && msg.type === 'text');
		if (textMessages.length === 0) {
			Alert.alert('No Messages', 'No text messages found to analyze');
			return;
		}
		const lastMessage = textMessages[textMessages.length - 1];
		setTestMessage(lastMessage.chatInfo || '');
		handleSentimentAnalysis();
	};

	const handleGetSmartReplies = () => {
		setMoreMenuVisible(false);
		const messages = activeRoom.messages;
		const otherUserMessages = messages.filter(
			(msg) => !msg.isDate && msg.type === 'text' && msg.userUid !== user?.uid
		);
		if (otherUserMessages.length === 0) {
			Alert.alert('No Messages', 'No messages from other users found to generate smart replies');
			return;
		}
		const latestOtherMessage = otherUserMessages[otherUserMessages.length - 1];
		setTestMessage(latestOtherMessage.chatInfo || '');
		handleSmartRepliesRequestInline();
	};

	const handleSentimentAnalysis = async () => {
		if (!testMessage.trim()) {
			Alert.alert('Error', 'Please enter a message to analyze');
			return;
		}
		setSentimentDialogVisible(true);
		setSentiment('');
		try {
			const response = (await dispatch(analyzeMessageSentimentAction(testMessage))) as any;
			if (response.success && response.sentiment) {
				setSentiment(response.sentiment);
			} else {
				Alert.alert('Error', 'Failed to analyze message sentiment');
				setSentimentDialogVisible(false);
			}
		} catch (error) {
			Alert.alert('Error', 'Failed to analyze message sentiment');
			setSentimentDialogVisible(false);
		}
	};

	const handleSmartRepliesRequestInline = async () => {
		if (!testMessage.trim()) {
			Alert.alert('Error', 'Please enter a message to get smart replies');
			return;
		}
		setShowSmartReplies(true);
		setSmartReplies([]);
		try {
			const response = (await dispatch(getSmartRepliesAction(testMessage, activeChatRoomId))) as any;
			if (response.success && response.replies) {
				setSmartReplies(response.replies);
			} else {
				Alert.alert('Error', 'Failed to get smart replies');
				setShowSmartReplies(false);
			}
		} catch (error) {
			Alert.alert('Error', 'Failed to get smart replies');
			setShowSmartReplies(false);
		}
	};

	const pickImage = async () => {
		setAttachMenuVisible(false);
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permission needed', 'Please grant camera roll permissions');
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			quality: 0.8,
			allowsEditing: false,
		});
		if (!result.canceled && result.assets[0]) {
			handleFileUpload(result.assets[0].uri, result.assets[0].fileName || 'image.jpg', 'image');
		}
	};

	const takePhoto = async () => {
		setAttachMenuVisible(false);
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== 'granted') {
			Alert.alert('Permission needed', 'Please grant camera permissions');
			return;
		}
		const result = await ImagePicker.launchCameraAsync({
			quality: 0.8,
			allowsEditing: false,
		});
		if (!result.canceled && result.assets[0]) {
			handleFileUpload(result.assets[0].uri, 'photo.jpg', 'image');
		}
	};

	const pickDocument = async () => {
		setAttachMenuVisible(false);
		const result = await DocumentPicker.getDocumentAsync({
			type: '*/*',
			copyToCacheDirectory: true,
		});
		if (!result.canceled && result.assets[0]) {
			const file = result.assets[0];
			handleFileUpload(file.uri, file.name, 'file');
		}
	};

	const handleFileUpload = async (uri: string, fileName: string, type: 'image' | 'file') => {
		if (!user) return;
		setUploading(true);
		setUploadProgress(0);
		try {
			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => Math.min(prev + 0.1, 0.9));
			}, 100);
			const downloadUrl = await uploadFile(
				user.uid,
				uri,
				fileName,
				type === 'image' ? 'image/jpeg' : 'application/octet-stream'
			);
			clearInterval(progressInterval);
			setUploadProgress(1);
			const chatMessage: ChatMessage = {
				id: generateId(),
				roomId: activeChatRoomId,
				type: type === 'image' ? 'image' : 'file',
				chatInfo: downloadUrl,
				fileName: fileName,
				userUid: user.uid,
				userName: user.name,
				userPhoto: user.photo_url,
				time: new Date(),
				isMsgEdited: false,
				isMsgSaved: false,
			};
			dispatch(sendMessageToServer(chatMessage));
		} catch (error) {
			console.error('Upload error:', error);
			Alert.alert('Upload failed', 'Failed to upload file. Please try again.');
		} finally {
			setUploading(false);
			setUploadProgress(0);
		}
	};

	const renderListHeader = () => {
		if (!activeRoom.hasMoreMessages) return null;
		return (
			<View style={styles.loadMoreContainer}>
				{activeRoom.isLoadingMore ? (
					<ActivityIndicator size="small" color={colors.primary} />
				) : (
					<Button mode="text" onPress={handleLoadMore} textColor={colors.primary}>
						Load More Messages
					</Button>
				)}
			</View>
		);
	};

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={[styles.content, { backgroundColor: colors.background }]}>
				{/* Header */}
				<View style={styles.headerOuter}>
					<GlassSurface intensity={26} rounded={22} style={styles.headerGlass}>
						<View style={styles.header}>
							<TouchableOpacity onPress={handleBackButton} style={styles.backButton}>
								<Icon source="chevron-left" size={28} color={colors.text} />
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.headerInfo}
								onPress={() => activeRoom.is_group && setShowGroupMembers(true)}
							>
								<Avatar.Image size={44} source={{ uri: activeRoom?.photo_url }} />
								<View style={styles.headerText}>
									<View style={styles.headerTitleRow}>
										<Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
											{activeRoom.name}
										</Text>
										{userIsOffline && (
											<View style={[styles.offlineBadge, { backgroundColor: colors.destructive }]}>
												<Icon source="wifi-off" size={10} color="#fff" />
											</View>
										)}
									</View>
									<Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
										{activeRoom.is_group ? getMemberNames() : getUserPresence()}
									</Text>
								</View>
							</TouchableOpacity>

							<View style={styles.headerActions}>
								<IconButton
									icon="phone"
									size={22}
									iconColor={colors.text}
									onPress={() => showToast({ message: 'Voice call coming soon!', type: 'coming-soon' })}
								/>
								<IconButton
									icon="video"
									size={22}
									iconColor={colors.text}
									onPress={() => showToast({ message: 'Video call coming soon!', type: 'coming-soon' })}
								/>
								<Menu
									visible={moreMenuVisible}
									onDismiss={() => setMoreMenuVisible(false)}
									anchor={
										<IconButton
											icon="dots-vertical"
											size={22}
											iconColor={colors.text}
											onPress={() => setMoreMenuVisible(true)}
										/>
									}
									contentStyle={[styles.menuContent, { backgroundColor: colors.surface }]}
								>
							{activeRoom.is_group && (
								<>
									<Menu.Item
										onPress={() => {
											setMoreMenuVisible(false);
											setShowGroupMembers(true);
										}}
										title="View Members"
										leadingIcon="account-multiple"
									/>
									<Divider />
								</>
							)}
							<Menu.Item
								onPress={() => {
									setMoreMenuVisible(false);
									setShowSemanticSearch(true);
								}}
								title="Search in Chat"
								leadingIcon="magnify"
							/>
							<Divider />
							<Menu.Item
								onPress={() => {
									setMoreMenuVisible(false);
									setShowScheduledMessages(true);
								}}
								title="Scheduled Messages"
								leadingIcon="clock-outline"
							/>
							<Menu.Item
								onPress={() => {
									setMoreMenuVisible(false);
									setShowScheduleDialog(true);
								}}
								title="Schedule Message"
								leadingIcon="clock-plus"
							/>
							<Divider />
							<Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>AI Features</Text>
							<Menu.Item onPress={handleSummarizeConversation} title="Summarize Chat" leadingIcon="text-box-outline" />
							<Menu.Item onPress={handleAnalyzeSentiment} title="Analyze Sentiment" leadingIcon="emoticon-outline" />
							<Menu.Item onPress={handleGetSmartReplies} title="Smart Replies" leadingIcon="lightbulb-outline" />
								</Menu>
							</View>
						</View>
					</GlassSurface>
				</View>

				{/* Messages */}
				<FlatList
					data={activeRoom.messages}
					renderItem={({ item }) => <ChatBubble message={item} isGroup={activeRoom.is_group} roomId={activeChatRoomId} />}
					ListHeaderComponent={renderListHeader}
					inverted={false}
					contentContainerStyle={styles.messageList}
					showsVerticalScrollIndicator={false}
				/>

				{/* Upload Progress */}
				{uploading && (
					<View style={[styles.uploadBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
						<Text style={[styles.uploadText, { color: colors.text }]}>Uploading...</Text>
						<ProgressBar progress={uploadProgress} color={colors.primary} style={styles.progressBar} />
					</View>
				)}

				{/* Smart Replies */}
				{showSmartReplies && (
					<View style={[styles.smartRepliesBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
						<View style={styles.smartRepliesHeader}>
							<Text style={[styles.smartRepliesTitle, { color: colors.textSecondary }]}>Smart Replies</Text>
							<IconButton icon="close" size={18} iconColor={colors.textSecondary} onPress={() => setShowSmartReplies(false)} />
						</View>
						{smartReplies.length > 0 ? (
							<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.smartRepliesScroll}>
								{smartReplies.map((reply, index) => (
									<TouchableOpacity
										key={index}
										style={[styles.smartReplyChip, { backgroundColor: isDark ? colors.muted : '#f1f5f9', borderColor: colors.border }]}
										onPress={() => {
											setInput(reply);
											setShowSmartReplies(false);
										}}
									>
										<Text style={[styles.smartReplyText, { color: colors.text }]}>{reply}</Text>
									</TouchableOpacity>
								))}
							</ScrollView>
						) : (
							<View style={styles.smartRepliesLoading}>
								<ActivityIndicator size="small" color={colors.primary} />
								<Text style={[styles.loadingText, { color: colors.textSecondary }]}>Generating replies...</Text>
							</View>
						)}
					</View>
				)}

				{/* Offline Indicator */}
				{userIsOffline && (
					<View style={[styles.offlineBar, { backgroundColor: colors.destructive }]}>
						<Icon source="wifi-off" size={16} color="#fff" />
						<Text style={styles.offlineText}>You're offline. Messages will sync when connected.</Text>
					</View>
				)}

				{/* Input Bar */}
				<View style={styles.inputOuter}>
					<GlassSurface intensity={26} rounded={26} style={styles.inputGlass}>
						<View style={styles.inputBar}>
							<Menu
								visible={attachMenuVisible}
								onDismiss={() => setAttachMenuVisible(false)}
								anchor={
									<IconButton
										icon="plus"
										size={24}
										iconColor={colors.primary}
										style={[styles.attachButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(2,6,23,0.06)' }]}
										onPress={() => setAttachMenuVisible(true)}
										disabled={uploading || userIsOffline}
									/>
								}
								contentStyle={{ backgroundColor: colors.surface }}
							>
								<Menu.Item onPress={takePhoto} title="Camera" leadingIcon="camera" />
								<Menu.Item onPress={pickImage} title="Gallery" leadingIcon="image" />
								<Menu.Item onPress={pickDocument} title="Document" leadingIcon="file" />
							</Menu>

							<View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(2,6,23,0.05)' }]}>
								<TextInput
									ref={textInputRef}
									value={input}
									mode="flat"
									onChangeText={(e) => {
										setInput(e);
										if (e.length > 0 && showSmartReplies) setShowSmartReplies(false);
									}}
									placeholder="Type here"
									style={styles.textInput}
									disabled={uploading}
									underlineColor="transparent"
									activeUnderlineColor="transparent"
									textColor={colors.text}
									placeholderTextColor={colors.textSecondary}
								/>
								<IconButton
									icon="camera-outline"
									size={22}
									iconColor={colors.textSecondary}
									onPress={takePhoto}
									disabled={uploading || userIsOffline}
								/>
							</View>

							<IconButton
								icon="send"
								size={24}
								iconColor="#fff"
								style={[styles.sendButton, { backgroundColor: input.trim() ? colors.primary : colors.textSecondary }]}
								onPress={sendMessage}
								disabled={uploading || !input.trim()}
							/>
						</View>
					</GlassSurface>
				</View>
			</View>

			{/* Dialogs */}
			<Portal>
				<Dialog visible={summaryDialogVisible} onDismiss={() => setSummaryDialogVisible(false)} style={{ backgroundColor: colors.surface }}>
					<Dialog.Title style={{ color: colors.text }}>Chat Summary</Dialog.Title>
					<Dialog.Content>
						<Text style={{ color: colors.text }}>{summary}</Text>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setSummaryDialogVisible(false)} textColor={colors.primary}>
							Close
						</Button>
					</Dialog.Actions>
				</Dialog>

				<Dialog visible={sentimentDialogVisible} onDismiss={() => setSentimentDialogVisible(false)} style={{ backgroundColor: colors.surface }}>
					<Dialog.Title style={{ color: colors.text }}>Sentiment Analysis</Dialog.Title>
					<Dialog.Content>
						<Text style={{ color: colors.textSecondary, marginBottom: 12 }}>Analyzing: "{testMessage}"</Text>
						{sentiment ? (
							<View style={[styles.sentimentResult, { backgroundColor: isDark ? colors.muted : '#f1f5f9' }]}>
								<Icon
									source={sentiment === 'positive' ? 'emoticon-happy' : sentiment === 'negative' ? 'emoticon-sad' : 'emoticon-neutral'}
									size={28}
									color={sentiment === 'positive' ? '#10b981' : sentiment === 'negative' ? '#ef4444' : '#f59e0b'}
								/>
								<Text style={[styles.sentimentText, { color: colors.text }]}>
									{sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
								</Text>
							</View>
						) : (
							<View style={styles.smartRepliesLoading}>
								<ActivityIndicator size="small" color={colors.primary} />
								<Text style={[styles.loadingText, { color: colors.textSecondary }]}>Analyzing...</Text>
							</View>
						)}
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setSentimentDialogVisible(false)} textColor={colors.primary}>
							Close
						</Button>
					</Dialog.Actions>
				</Dialog>

				<Dialog visible={showGroupMembers} onDismiss={() => setShowGroupMembers(false)} style={{ backgroundColor: colors.surface }}>
					<Dialog.Title style={{ color: colors.text }}>Group Members</Dialog.Title>
					<Dialog.Content>
						<ScrollView showsVerticalScrollIndicator={false}>
							{activeRoom.members?.map((uid) => (
								<View key={uid} style={[styles.memberItem, { borderBottomColor: colors.border }]}>
									<Text style={[styles.memberName, { color: colors.text }]}>{getMemberName(uid)}</Text>
								</View>
							))}
						</ScrollView>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setShowGroupMembers(false)} textColor={colors.textSecondary}>
							Close
						</Button>
						<Button
							onPress={() => {
								setShowGroupMembers(false);
								setShowGroupManagement(true);
							}}
							textColor={colors.primary}
						>
							Manage
						</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>

			{showGroupManagement && <GroupChat roomId={activeChatRoomId} onClose={() => setShowGroupManagement(false)} />}
			<ScheduleMessageDialog visible={showScheduleDialog} onDismiss={() => setShowScheduleDialog(false)} roomId={activeChatRoomId} initialMessage={input} />
			<ScheduledMessagesList roomId={activeChatRoomId} visible={showScheduledMessages} onClose={() => setShowScheduledMessages(false)} />
			<SemanticSearchSheet roomId={activeChatRoomId} visible={showSemanticSearch} onClose={() => setShowSemanticSearch(false)} />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	content: { flex: 1 },
	headerOuter: {
		paddingHorizontal: 10,
		paddingTop: 6,
	},
	headerGlass: {
		borderWidth: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 10,
	},
	backButton: {
		padding: 4,
	},
	headerInfo: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 8,
	},
	headerText: {
		flex: 1,
		marginLeft: 12,
	},
	headerTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 17,
		fontWeight: '600',
	},
	offlineBadge: {
		marginLeft: 6,
		paddingHorizontal: 4,
		paddingVertical: 2,
		borderRadius: 4,
	},
	headerSubtitle: {
		fontSize: 13,
		marginTop: 1,
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	menuContent: {
		borderRadius: 12,
	},
	menuSectionTitle: {
		fontSize: 12,
		fontWeight: '600',
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 4,
	},
	messageList: {
		paddingHorizontal: 8,
		paddingBottom: 8,
	},
	loadMoreContainer: {
		paddingVertical: 12,
		alignItems: 'center',
	},
	uploadBar: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderTopWidth: 1,
	},
	uploadText: {
		fontSize: 13,
		fontWeight: '500',
		marginBottom: 6,
	},
	progressBar: {
		height: 4,
		borderRadius: 2,
	},
	smartRepliesBar: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderTopWidth: 1,
	},
	smartRepliesHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	smartRepliesTitle: {
		fontSize: 12,
		fontWeight: '500',
	},
	smartRepliesScroll: {
		paddingVertical: 8,
		gap: 8,
	},
	smartReplyChip: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 16,
		borderWidth: 1,
		marginRight: 8,
	},
	smartReplyText: {
		fontSize: 14,
	},
	smartRepliesLoading: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		gap: 10,
	},
	loadingText: {
		fontSize: 13,
	},
	offlineBar: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		gap: 8,
	},
	offlineText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '500',
	},
	inputOuter: {
		paddingHorizontal: 10,
		paddingBottom: 10,
	},
	inputGlass: {
		borderWidth: 1,
	},
	inputBar: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 10,
		gap: 6,
	},
	attachButton: {
		margin: 0,
		borderRadius: 24,
	},
	inputWrapper: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 24,
		paddingLeft: 16,
	},
	textInput: {
		flex: 1,
		backgroundColor: 'transparent',
		fontSize: 16,
		paddingVertical: 8,
	},
	sendButton: {
		margin: 0,
		borderRadius: 24,
	},
	sentimentResult: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		gap: 12,
	},
	sentimentText: {
		fontSize: 18,
		fontWeight: '600',
	},
	memberItem: {
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	memberName: {
		fontSize: 16,
	},
});
