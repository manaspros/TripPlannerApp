import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { fetchTravelPlan } from '../../services/api';
import { TravelPlanRequest } from '../../types';
import LottieView from 'lottie-react-native';

const QUESTIONS = [
	{
		key: 'city',
		question: 'Which city do you want to visit?',
		type: 'input',
		placeholder: 'e.g., Delhi',
	},
	{
		key: 'days',
		question: 'How many days will you stay?',
		type: 'options',
		options: ['1', '2', '3', '5', '7'],
	},
	{
		key: 'place_type',
		question: 'What type of places do you want to explore?',
		type: 'options',
		options: ['Historical Sites', 'Nature', 'Nightlife', 'Shopping', 'Adventure'],
	},
	{
		key: 'food_type',
		question: 'What kind of food do you prefer?',
		type: 'options',
		options: ['Local Cuisine', 'Street Food', 'Fine Dining', 'Vegetarian', 'Any'],
	},
	{
		key: 'budget',
		question: 'What is your budget?',
		type: 'options',
		options: ['Low', 'Mid-range', 'Luxury'],
	},
];

// Helper to parse the backend response
function parsePlan(planText: string) {
	const days: any[] = [];
	const lines = planText.split('\n').map(l => l.trim());
	let currentDay: any = null;
	let currentItems: any[] = [];
	let travelInsights: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (/^\*\*DAY \d+:/.test(line)) {
			if (currentDay) {
				currentDay.items = currentItems;
				days.push(currentDay);
			}
			currentDay = {
				title: line.replace(/\*\*/g, ''),
				items: [],
			};
			currentItems = [];
		} else if (line.startsWith('📝 TRAVEL INSIGHTS')) {
			// Collect travel insights
			let insights = line;
			while (i + 1 < lines.length && lines[i + 1]) {
				i++;
				insights += '\n' + lines[i];
			}
			travelInsights.push(insights);
		} else if (line.startsWith('⏰') || line.startsWith('🍽️')) {
			// Activity or Meal
			let item: any = { type: line.startsWith('⏰') ? 'visit' : 'meal', main: line };
			// Collect following lines until next activity/meal/day/insight or empty
			let j = i + 1;
			while (
				j < lines.length &&
				!/^\*\*DAY \d+:/.test(lines[j]) &&
				!lines[j].startsWith('⏰') &&
				!lines[j].startsWith('🍽️') &&
				!lines[j].startsWith('📝 TRAVEL INSIGHTS') &&
				lines[j]
			) {
				if (!item.details) item.details = [];
				item.details.push(lines[j]);
				j++;
			}
			currentItems.push(item);
			i = j - 1;
		}
	}
	if (currentDay) {
		currentDay.items = currentItems;
		days.push(currentDay);
	}
	return { days, travelInsights };
}

// Creative rendering component
function CreativePlan({ planText }: { planText: string }) {
	const { days, travelInsights } = parsePlan(planText);

	return (
		<View>
			{days.map((day, idx) => (
				<View key={idx} style={styles.dayContainer}>
					<Text style={styles.dayTitle}>{day.title}</Text>
					{day.items.map((item: any, i: number) => (
						<View key={i} style={item.type === 'visit' ? styles.visitItem : styles.mealItem}>
							<Text style={styles.itemMain}>{item.main}</Text>
							{item.details && item.details.map((d: string, di: number) => (
								<Text key={di} style={styles.itemDetail}>{d}</Text>
							))}
						</View>
					))}
				</View>
			))}
			{travelInsights.length > 0 && (
				<View style={styles.insightsContainer}>
					<Text style={styles.insightsTitle}>Travel Insights</Text>
					{travelInsights.map((insight, i) => (
						<Text key={i} style={styles.insightsText}>{insight.replace('📝 ', '')}</Text>
					))}
				</View>
			)}
		</View>
	);
}

export default function HomeScreen() {
	const [answers, setAnswers] = useState({});
	const [step, setStep] = useState(0);
	const [plan, setPlan] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [inputValue, setInputValue] = useState('');

	const currentQ = QUESTIONS[step];

	const handleOptionSelect = (option: string) => {
		setAnswers({ ...answers, [currentQ.key]: option });
		setInputValue('');
		if (step < QUESTIONS.length - 1) {
			setStep(step + 1);
		}
	};

	const handleInputSubmit = () => {
		if (!inputValue.trim()) return;
		setAnswers({ ...answers, [currentQ.key]: inputValue.trim() });
		setInputValue('');
		if (step < QUESTIONS.length - 1) {
			setStep(step + 1);
		}
	};

	const handleGeneratePlan = async () => {
		setLoading(true);
		setError('');
		setPlan('');
		const request: TravelPlanRequest = {
			city: answers['city'],
			place_type: answers['place_type'].toLowerCase(),
			food_type: answers['food_type'].toLowerCase(),
			budget: answers['budget'].toLowerCase(),
			days: parseInt(answers['days'], 10),
		};
		try {
			const result = await fetchTravelPlan(request);
			setPlan(result);
		} catch (err) {
			if (
				err?.message &&
				(
					err.message.includes('Unable to connect to the server') ||
					err.message.includes('Network request failed') ||
					err.message.includes('Network Error')
				)
			) {
				setError('Unable to connect to the server. Please check your internet connection or try again later.');
			} else {
				setError(err.message || 'An unexpected error occurred. Please try again.');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleRestart = () => {
		setAnswers({});
		setStep(0);
		setPlan('');
		setError('');
		setInputValue('');
	};

	return (
		<ThemedView style={styles.container}>
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
				<ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
					<View style={styles.header}>
						<ThemedText type="title" style={styles.title}>Travel Planner</ThemedText>
					</View>
					{!plan && !loading && (
						<View style={styles.questionCard}>
							<ThemedText type="subtitle" style={styles.questionText}>{currentQ.question}</ThemedText>
							{currentQ.type === 'options' ? (
								<View style={styles.optionsContainer}>
									{currentQ.options.map((option: string) => (
										<TouchableOpacity
											key={option}
											style={styles.optionBtn}
											onPress={() => handleOptionSelect(option)}
										>
											<Text style={styles.optionText}>{option}</Text>
										</TouchableOpacity>
									))}
								</View>
							) : (
								<View style={styles.inputRow}>
									<TextInput
										style={styles.input}
										placeholder={currentQ.placeholder}
										value={inputValue}
										onChangeText={setInputValue}
										onSubmitEditing={handleInputSubmit}
										returnKeyType="done"
									/>
									<TouchableOpacity style={styles.nextBtn} onPress={handleInputSubmit}>
										<Text style={styles.nextBtnText}>Next</Text>
									</TouchableOpacity>
								</View>
							)}
							{step === QUESTIONS.length - 1 && (
								<TouchableOpacity style={styles.generateBtn} onPress={handleGeneratePlan}>
									<Text style={styles.generateBtnText}>Generate Plan</Text>
								</TouchableOpacity>
							)}
						</View>
					)}
					{loading && (
						<View style={styles.loaderContainer}>
							<LottieView
								source={require('../../assets/crazy-loader.json')}
								autoPlay
								loop
								style={{width: 180, height: 180}}
							/>
							<Text style={styles.loadingText}>Crafting your adventure...</Text>
						</View>
					)}
					{plan && (
						<View style={styles.planContainer}>
							<ThemedText type="subtitle" style={styles.planTitle}>Your Travel Plan</ThemedText>
							{/* Creative rendering */}
							<CreativePlan planText={plan} />
						</View>
					)}
					{error ? <Text style={styles.error}>{error}</Text> : null}
				</ScrollView>
			</KeyboardAvoidingView>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f3f6fa',
	},
	scrollContainer: {
		padding: 24,
		flexGrow: 1,
		justifyContent: 'center',
	},
	header: {
		alignItems: 'center',
		marginBottom: 24,
	},
	title: {
		fontSize: 30,
		fontWeight: 'bold',
		color: '#2d3142',
		letterSpacing: 1,
	},
	questionCard: {
		backgroundColor: '#fff',
		borderRadius: 18,
		padding: 28,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 4,
	},
	questionText: {
		fontSize: 20,
		marginBottom: 18,
		color: '#22223b',
		textAlign: 'center',
		fontWeight: '600',
	},
	optionsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 12,
	},
	optionBtn: {
		backgroundColor: '#e0e7ff',
		borderRadius: 12,
		paddingVertical: 12,
		paddingHorizontal: 22,
		margin: 6,
		minWidth: 100,
		alignItems: 'center',
		elevation: 2,
	},
	optionText: {
		color: '#22223b',
		fontSize: 16,
		fontWeight: '500',
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
	},
	input: {
		flex: 1,
		height: 48,
		borderColor: '#bfc9da',
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 16,
		backgroundColor: '#f8fafc',
		fontSize: 16,
	},
	nextBtn: {
		marginLeft: 10,
		backgroundColor: '#7c3aed',
		borderRadius: 10,
		paddingVertical: 12,
		paddingHorizontal: 18,
	},
	nextBtnText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 16,
	},
	generateBtn: {
		marginTop: 22,
		backgroundColor: '#22223b',
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	generateBtnText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '700',
		letterSpacing: 1,
	},
	loaderContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 40,
	},
	loadingText: {
		marginTop: 18,
		fontSize: 18,
		color: '#7c3aed',
		fontWeight: '600',
		textAlign: 'center',
	},
	planContainer: {
		backgroundColor: '#fff',
		borderRadius: 18,
		padding: 28,
		marginTop: 30,
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 4 },
		elevation: 4,
		alignItems: 'center',
	},
	planTitle: {
		marginBottom: 16,
		fontSize: 22,
		fontWeight: 'bold',
		color: '#2d3142',
		textAlign: 'center',
	},
	dayContainer: {
		marginBottom: 25,
		backgroundColor: '#f0f8ff',
		borderRadius: 10,
		padding: 12,
		shadowColor: '#000',
		shadowOpacity: 0.08,
		shadowRadius: 2,
		elevation: 2,
	},
	dayTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2a4d69',
		marginBottom: 8,
	},
	visitItem: {
		marginBottom: 10,
		padding: 8,
		backgroundColor: '#e6f2ff',
		borderRadius: 8,
	},
	mealItem: {
		marginBottom: 10,
		padding: 8,
		backgroundColor: '#fffbe6',
		borderRadius: 8,
	},
	itemMain: {
		fontWeight: 'bold',
		fontSize: 15,
		marginBottom: 2,
	},
	itemDetail: {
		fontSize: 13,
		color: '#444',
		marginLeft: 8,
	},
	insightsContainer: {
		marginTop: 20,
		backgroundColor: '#e8f5e9',
		borderRadius: 10,
		padding: 12,
	},
	insightsTitle: {
		fontWeight: 'bold',
		fontSize: 16,
		color: '#388e3c',
		marginBottom: 6,
	},
	insightsText: {
		fontSize: 13,
		color: '#333',
	},
	error: {
		color: 'red',
		marginTop: 18,
		textAlign: 'center',
		fontSize: 16,
	},
});
