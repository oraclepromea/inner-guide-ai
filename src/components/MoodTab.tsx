import React, { useState, useMemo } from 'react';
import { Heart, Plus, Loader2, TrendingUp, Filter, Calendar, BarChart3, Award, Zap } from 'lucide-react';
import { useAppStore } from '../stores';
import type { MoodValue } from '../types';
import { MoodChart } from './MoodChart.tsx';
import { useNotificationHelpers } from './NotificationSystem';

const moodOptions = [
	{
		value: 1 as MoodValue,
		label: 'Terrible',
		emoji: '😢',
		color: 'from-red-500 to-red-600',
		bgColor: 'bg-red-500/10',
		borderColor: 'border-red-500/30',
	},
	{
		value: 2 as MoodValue,
		label: 'Bad',
		emoji: '😞',
		color: 'from-orange-500 to-orange-600',
		bgColor: 'bg-orange-500/10',
		borderColor: 'border-orange-500/30',
	},
	{
		value: 3 as MoodValue,
		label: 'Okay',
		emoji: '😐',
		color: 'from-yellow-500 to-yellow-600',
		bgColor: 'bg-yellow-500/10',
		borderColor: 'border-yellow-500/30',
	},
	{
		value: 4 as MoodValue,
		label: 'Good',
		emoji: '😊',
		color: 'from-green-500 to-green-600',
		bgColor: 'bg-green-500/10',
		borderColor: 'border-green-500/30',
	},
	{
		value: 5 as MoodValue,
		label: 'Great',
		emoji: '😄',
		color: 'from-emerald-500 to-emerald-600',
		bgColor: 'bg-emerald-500/10',
		borderColor: 'border-emerald-500/30',
	},
];

interface MoodStreak {
	current: number;
	longest: number;
	type: 'positive' | 'negative' | 'neutral';
}

interface MoodPattern {
	dayOfWeek: string;
	averageMood: number;
	count: number;
}

export const MoodTab: React.FC = () => {
	const { moodEntries, isLoadingMood, addMoodEntry, deleteMoodEntry } = useAppStore();
	const { success, error } = useNotificationHelpers();
	const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
	const [notes, setNotes] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [filterPeriod, setFilterPeriod] = useState<'7d' | '30d' | 'all'>('30d');
	const [showAnalytics, setShowAnalytics] = useState(false);

	const handleAddMood = async () => {
		if (!selectedMood) return;

		setIsSubmitting(true);
		try {
			const moodOption = moodOptions.find(opt => opt.value === selectedMood);
			await addMoodEntry(selectedMood, moodOption?.label || '', notes);
			setSelectedMood(null);
			setNotes('');
			success('Mood tracked successfully!', `Added ${moodOption?.label} to your mood history`);
		} catch (err) {
			console.error('Failed to add mood entry:', err);
			error('Failed to save mood', 'Please try again');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteMood = async (id: number) => {
		if (window.confirm('Are you sure you want to delete this mood entry?')) {
			try {
				await deleteMoodEntry(id);
				success('Mood entry deleted', 'Entry removed from your history');
			} catch (err) {
				console.error('Failed to delete mood entry:', err);
				error('Failed to delete mood', 'Please try again');
			}
		}
	};

	const filteredEntries = useMemo(() => {
		const now = new Date();
		const cutoff = new Date();

		switch (filterPeriod) {
			case '7d':
				cutoff.setDate(now.getDate() - 7);
				break;
			case '30d':
				cutoff.setDate(now.getDate() - 30);
				break;
			case 'all':
				return moodEntries;
		}

		return moodEntries.filter(entry => new Date(entry.createdAt) >= cutoff);
	}, [moodEntries, filterPeriod]);

	const moodAnalytics = useMemo(() => {
		if (filteredEntries.length === 0) return null;

		// Calculate streaks
		const calculateStreak = (): MoodStreak => {
			const sortedEntries = [...filteredEntries].sort((a, b) => 
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);
			
			let currentStreak = 0;
			let longestStreak = 0;
			let streakType: 'positive' | 'negative' | 'neutral' = 'neutral';
			
			for (let i = 0; i < sortedEntries.length; i++) {
				const mood = sortedEntries[i].mood;
				const type = mood >= 4 ? 'positive' : mood <= 2 ? 'negative' : 'neutral';
				
				if (i === 0) {
					currentStreak = 1;
					streakType = type;
				} else if (type === streakType) {
					currentStreak++;
				} else {
					longestStreak = Math.max(longestStreak, currentStreak);
					currentStreak = 1;
					streakType = type;
				}
			}
			
			return {
				current: currentStreak,
				longest: Math.max(longestStreak, currentStreak),
				type: streakType
			};
		};

		// Calculate patterns by day of week
		const dayPatterns: MoodPattern[] = [
			'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
		].map(day => {
			const dayEntries = filteredEntries.filter(entry => {
				const entryDay = new Date(entry.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
				return entryDay === day;
			});
			
			const avgMood = dayEntries.length > 0 
				? dayEntries.reduce((sum, entry) => sum + entry.mood, 0) / dayEntries.length
				: 0;
			
			return {
				dayOfWeek: day,
				averageMood: avgMood,
				count: dayEntries.length
			};
		});

		const avgMood = filteredEntries.reduce((sum, entry) => sum + entry.mood, 0) / filteredEntries.length;
		const moodCounts = moodOptions.map(option => ({
			...option,
			count: filteredEntries.filter(entry => entry.mood === option.value).length,
		}));

		const mostCommonMood = moodCounts.reduce((prev, current) => (prev.count > current.count ? prev : current));
		const streak = calculateStreak();

		// Calculate improvement trend
		const recentEntries = filteredEntries.slice(-7);
		const olderEntries = filteredEntries.slice(-14, -7);
		const recentAvg = recentEntries.length > 0 
			? recentEntries.reduce((sum, entry) => sum + entry.mood, 0) / recentEntries.length
			: 0;
		const olderAvg = olderEntries.length > 0 
			? olderEntries.reduce((sum, entry) => sum + entry.mood, 0) / olderEntries.length
			: 0;
		const trend = recentAvg - olderAvg;

		return {
			average: avgMood.toFixed(1),
			mostCommon: mostCommonMood,
			total: filteredEntries.length,
			streak,
			dayPatterns,
			trend,
			positiveRatio: (moodCounts.filter(m => m.value >= 4).reduce((sum, m) => sum + m.count, 0) / filteredEntries.length * 100).toFixed(1)
		};
	}, [filteredEntries]);

	const renderMoodAnalytics = () => {
		if (!moodAnalytics) return null;

		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* Mood Streak */}
				<div className="glass-dark rounded-xl p-6 border border-primary-500/30">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-white">Current Streak</h3>
						<Zap className={`w-5 h-5 ${
							moodAnalytics.streak.type === 'positive' ? 'text-green-400' :
							moodAnalytics.streak.type === 'negative' ? 'text-red-400' : 'text-yellow-400'
						}`} />
					</div>
					<div className="text-2xl font-bold text-white mb-2">
						{moodAnalytics.streak.current} days
					</div>
					<div className="text-sm text-gray-400">
						{moodAnalytics.streak.type === 'positive' ? 'Good mood streak! 🎉' :
						 moodAnalytics.streak.type === 'negative' ? 'Hang in there 💪' : 'Steady mood'}
					</div>
					<div className="mt-2 text-xs text-gray-500">
						Longest: {moodAnalytics.streak.longest} days
					</div>
				</div>

				{/* Mood Trend */}
				<div className="glass-dark rounded-xl p-6 border border-primary-500/30">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-white">Weekly Trend</h3>
						<TrendingUp className={`w-5 h-5 ${
							moodAnalytics.trend > 0 ? 'text-green-400' :
							moodAnalytics.trend < 0 ? 'text-red-400' : 'text-gray-400'
						}`} />
					</div>
					<div className="text-2xl font-bold text-white mb-2">
						{moodAnalytics.trend > 0 ? '+' : ''}{moodAnalytics.trend.toFixed(1)}
					</div>
					<div className="text-sm text-gray-400">
						{moodAnalytics.trend > 0 ? 'Improving! 📈' :
						 moodAnalytics.trend < 0 ? 'Declining 📉' : 'Stable'}
					</div>
				</div>

				{/* Positive Ratio */}
				<div className="glass-dark rounded-xl p-6 border border-primary-500/30">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-white">Positive Days</h3>
						<Award className="w-5 h-5 text-yellow-400" />
					</div>
					<div className="text-2xl font-bold text-white mb-2">
						{moodAnalytics.positiveRatio}%
					</div>
					<div className="text-sm text-gray-400">
						Days with good/great mood
					</div>
				</div>

				{/* Best Day Pattern */}
				<div className="glass-dark rounded-xl p-6 border border-primary-500/30 md:col-span-2 lg:col-span-3">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-white">Weekly Pattern</h3>
						<BarChart3 className="w-5 h-5 text-primary-400" />
					</div>
					<div className="grid grid-cols-7 gap-2">
						{moodAnalytics.dayPatterns.map((pattern) => {
							const moodOption = moodOptions.find(opt => Math.round(pattern.averageMood) === opt.value);
							return (
								<div key={pattern.dayOfWeek} className="text-center">
									<div className="text-xs text-gray-400 mb-1">
										{pattern.dayOfWeek.slice(0, 3)}
									</div>
									<div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
										moodOption?.bgColor || 'bg-gray-500/10'
									}`}>
										<span className="text-sm">
											{pattern.count > 0 ? (moodOption?.emoji || '😐') : '—'}
										</span>
									</div>
									<div className="text-xs text-gray-500">
										{pattern.averageMood > 0 ? pattern.averageMood.toFixed(1) : '—'}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		);
	};

	if (isLoadingMood) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="text-center">
					<Loader2 className="w-12 h-12 animate-spin text-primary-400 mx-auto mb-4" />
					<p className="text-gray-400">Loading your mood entries...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Add Mood Section */}
			<div className="glass-dark rounded-2xl p-8 border border-primary-500/30">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center space-x-3">
						<div className="p-2 bg-secondary-500/20 rounded-xl">
							<Heart className="w-6 h-6 text-secondary-400" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-white">Track Your Mood</h2>
							<p className="text-gray-400 text-sm">How are you feeling today?</p>
						</div>
					</div>
					<button
						onClick={() => setShowAnalytics(!showAnalytics)}
						className="flex items-center space-x-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 rounded-lg transition-colors"
					>
						<BarChart3 className="w-4 h-4" />
						<span className="text-sm">Analytics</span>
					</button>
				</div>

				{/* Mood Selection */}
				<div className="grid grid-cols-5 gap-4 mb-6">
					{moodOptions.map((option) => (
						<button
							key={option.value}
							onClick={() => setSelectedMood(option.value)}
							className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
								selectedMood === option.value
									? `${option.borderColor} ${option.bgColor} scale-105`
									: 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
							}`}
						>
							<div className="text-center">
								<div className="text-2xl mb-2">{option.emoji}</div>
								<div className="text-sm font-medium text-white">{option.label}</div>
							</div>
						</button>
					))}
				</div>

				{/* Notes Input */}
				<div className="mb-6">
					<label className="block text-sm font-medium text-gray-300 mb-2">
						Notes (optional)
					</label>
					<textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="What's influencing your mood today?"
						className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-500 resize-none"
						rows={3}
					/>
				</div>

				{/* Submit Button */}
				<button
					onClick={handleAddMood}
					disabled={!selectedMood || isSubmitting}
					className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 font-medium text-white"
				>
					{isSubmitting ? (
						<Loader2 className="w-5 h-5 animate-spin" />
					) : (
						<Plus className="w-5 h-5" />
					)}
					<span>{isSubmitting ? 'Saving...' : 'Track Mood'}</span>
				</button>
			</div>

			{/* Analytics Section */}
			{showAnalytics && moodAnalytics && (
				<div className="glass-dark rounded-2xl p-8 border border-primary-500/30">
					<div className="flex items-center space-x-3 mb-6">
						<div className="p-2 bg-primary-500/20 rounded-xl">
							<BarChart3 className="w-6 h-6 text-primary-400" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-white">Mood Analytics</h2>
							<p className="text-gray-400 text-sm">Insights into your mood patterns</p>
						</div>
					</div>
					{renderMoodAnalytics()}
				</div>
			)}

			{/* Filter Controls */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<Filter className="w-5 h-5 text-gray-400" />
					<span className="text-sm text-gray-400">Filter by:</span>
					<select
						value={filterPeriod}
						onChange={(e) => setFilterPeriod(e.target.value as '7d' | '30d' | 'all')}
						className="px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
					>
						<option value="7d">Last 7 days</option>
						<option value="30d">Last 30 days</option>
						<option value="all">All time</option>
					</select>
				</div>
				{moodAnalytics && (
					<div className="text-sm text-gray-400">
						{moodAnalytics.total} entries • Avg: {moodAnalytics.average}/5
					</div>
				)}
			</div>

			{/* Mood Chart */}
			{filteredEntries.length > 0 && (
				<div className="glass-dark rounded-2xl p-8 border border-primary-500/30">
					<div className="flex items-center space-x-3 mb-6">
						<div className="p-2 bg-primary-500/20 rounded-xl">
							<TrendingUp className="w-6 h-6 text-primary-400" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-white">Mood Trends</h2>
							<p className="text-gray-400 text-sm">Your mood over time</p>
						</div>
					</div>
					<MoodChart entries={filteredEntries} />
				</div>
			)}

			{/* Recent Mood Entries */}
			{filteredEntries.length > 0 && (
				<div className="glass-dark rounded-2xl p-8 border border-primary-500/30">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center space-x-3">
							<div className="p-2 bg-secondary-500/20 rounded-xl">
								<Calendar className="w-6 h-6 text-secondary-400" />
							</div>
							<div>
								<h2 className="text-xl font-bold text-white">Recent Entries</h2>
								<p className="text-gray-400 text-sm">Your mood history</p>
							</div>
						</div>
					</div>
					<div className="space-y-4">
						{filteredEntries.slice(0, 10).map((entry) => {
							const moodOption = moodOptions.find(opt => opt.value === entry.mood);
							return (
								<div
									key={entry.id}
									className={`p-4 rounded-xl border ${moodOption?.borderColor} ${moodOption?.bgColor} hover:bg-opacity-80 transition-all duration-200`}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-4">
											<div className="text-2xl">{moodOption?.emoji}</div>
											<div>
												<div className="font-semibold text-white">
													{moodOption?.label} ({entry.mood}/5)
												</div>
												<div className="text-sm text-gray-400">
													{new Date(entry.createdAt).toLocaleDateString('en-US', {
														weekday: 'long',
														year: 'numeric',
														month: 'long',
														day: 'numeric',
														hour: '2-digit',
														minute: '2-digit'
													})}
												</div>
											</div>
										</div>
										<button
											onClick={() => handleDeleteMood(entry.id!)}
											className="text-red-400 hover:text-red-300 transition-colors"
										>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
									{entry.notes && (
										<div className="mt-3 text-sm text-gray-300 bg-black/20 rounded-lg p-3">
											{entry.notes}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Empty State */}
			{filteredEntries.length === 0 && (
				<div className="glass-dark rounded-2xl p-12 border border-primary-500/30 text-center">
					<Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
					<h3 className="text-xl font-semibold text-white mb-2">No mood entries yet</h3>
					<p className="text-gray-400 mb-6">Start tracking your mood to see patterns and insights</p>
					<button
						onClick={() => setSelectedMood(3)}
						className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 rounded-lg transition-all duration-200 font-medium text-white"
					>
						Track Your First Mood
					</button>
				</div>
			)}
		</div>
	);
};