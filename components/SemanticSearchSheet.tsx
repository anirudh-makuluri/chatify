import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import {
	Portal,
	Dialog,
	Button,
	TextInput,
	Text,
	IconButton,
	ActivityIndicator,
	useTheme,
} from 'react-native-paper';
import { semanticSearch } from '~/lib/semanticSearch';
import type { SemanticSearchResult } from '~/lib/types';

interface SemanticSearchSheetProps {
	roomId: string;
	visible: boolean;
	onClose: () => void;
}

export default function SemanticSearchSheet({
	roomId,
	visible,
	onClose,
}: SemanticSearchSheetProps) {
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<SemanticSearchResult[]>([]);
	const theme = useTheme();

	const handleSearch = async () => {
		const q = query.trim();
		if (!q) return;
		setLoading(true);
		setResults([]);
		try {
			const res = await semanticSearch(roomId, q);
			if (res.success && res.results) {
				setResults(res.results);
			}
		} catch (e) {
			// Error handled by caller if needed
		} finally {
			setLoading(false);
		}
	};

	return (
		<Portal>
			<Dialog visible={visible} onDismiss={onClose}>
				<Dialog.Title>Search by meaning</Dialog.Title>
				<Dialog.Content>
					<Text variant="bodySmall" style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}>
						Find messages by topic (e.g. dinner plans, meeting time).
					</Text>
					<View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
						<TextInput
							mode="outlined"
							placeholder="e.g. dinner plans"
							value={query}
							onChangeText={setQuery}
							style={{ flex: 1 }}
							onSubmitEditing={handleSearch}
						/>
						<Button className='flex flex-row items-center justify-center' mode="contained" onPress={handleSearch} disabled={loading || !query.trim()} loading={loading}>
							<Text className='text-white'>Search</Text>
						</Button>
					</View>
					{results.length > 0 && (
						<ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
							{results.map((r, i) => (
								<TouchableOpacity
									key={`${r.message.id}-${i}`}
									onPress={onClose}
									style={{
										paddingVertical: 10,
										paddingHorizontal: 4,
										borderBottomWidth: 1,
										borderBottomColor: theme.colors.surfaceVariant,
									}}
								>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
										<Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
											{r.message.userName}
										</Text>
										<Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
											{(r.score * 100).toFixed(0)}%
										</Text>
									</View>
									<Text variant="bodyMedium" numberOfLines={2}>
										{r.message.chatInfo}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					)}
					{loading && (
						<View style={{ paddingVertical: 16, alignItems: 'center' }}>
							<ActivityIndicator size="small" />
						</View>
					)}
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={onClose}>Close</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
}
