import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '~/lib/themeContext';

export type FilterType = 'all' | 'favorites' | 'work' | 'groups' | 'communities';

interface FilterTabsProps {
	activeFilter: FilterType;
	onFilterChange: (filter: FilterType) => void;
	onComingSoon?: () => void;
}

export default function FilterTabs({ activeFilter, onFilterChange, onComingSoon }: FilterTabsProps) {
	const { colors, isDark } = useTheme();

	const filters: { id: FilterType; label: string; implemented: boolean }[] = [
		{ id: 'all', label: 'All', implemented: true },
		{ id: 'favorites', label: 'Favorites', implemented: false },
		{ id: 'work', label: 'Work', implemented: false },
		{ id: 'groups', label: 'Groups', implemented: true },
		{ id: 'communities', label: 'Communities', implemented: false },
	];

	const handlePress = (filter: { id: FilterType; implemented: boolean }) => {
		if (filter.implemented) {
			onFilterChange(filter.id);
		} else if (onComingSoon) {
			onComingSoon();
		}
	};

	return (
		<View style={[styles.container, { borderBottomColor: colors.border }]}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{filters.map((filter) => {
					const isActive = activeFilter === filter.id;
					return (
						<TouchableOpacity
							key={filter.id}
							style={[
								styles.tab,
								{
									backgroundColor: isActive
										? colors.primary
										: isDark
											? 'rgba(255,255,255,0.08)'
											: 'rgba(0,0,0,0.05)',
									borderColor: isActive ? colors.primary : 'transparent',
								},
							]}
							onPress={() => handlePress(filter)}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.tabText,
									{
										color: isActive ? '#fff' : colors.text,
										fontWeight: isActive ? '600' : '400',
									},
								]}
							>
								{filter.label}
							</Text>
						</TouchableOpacity>
					);
				})}
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
		gap: 8,
	},
	tab: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		borderWidth: 1,
	},
	tabText: {
		fontSize: 14,
	},
});
