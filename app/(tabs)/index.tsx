import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Button, Text, ScrollView, ActivityIndicator, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { fetchTravelPlan } from '../../services/api';
import { TravelPlanRequest } from '../../types';

export default function HomeScreen() {
  const [city, setCity] = useState('');
  const [days, setDays] = useState(''); // renamed from numberOfDays
  const [placeType, setPlaceType] = useState('');
  const [foodType, setFoodType] = useState('');
  const [budget, setBudget] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generatePlan = async () => {
    setLoading(true);
    setError('');
    setPlan('');

    // Simple validation
    if (!city || !days || !placeType || !foodType || !budget) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    // Normalize input
    const request: TravelPlanRequest = {
      city: city.trim(),
      place_type: placeType.trim().toLowerCase(),
      food_type: foodType.trim().toLowerCase(),
      budget: budget.trim().toLowerCase(),
      days: parseInt(days, 10),
    };

    console.log('--- Sending Request Body ---');
    console.log(JSON.stringify(request, null, 2));

    try {
      const result = await fetchTravelPlan(request);
      setPlan(result);
    } catch (err) {
      console.error('--- Caught Exception ---');
      console.error('Error Object:', err);
      // Improved error handling for network/server issues
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Travel Planner</ThemedText>
        </View>

        <ThemedText style={styles.instructions}>Fill in your preferences below to get a personalized travel plan.</ThemedText>

        <TextInput
          style={styles.input}
          placeholder="City (e.g., Delhi)"
          value={city}
          onChangeText={setCity}
        />
        <TextInput
          style={styles.input}
          placeholder="Number of Days (e.g., 2)"
          value={days}
          onChangeText={setDays}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Place Type (e.g., historical sites)"
          value={placeType}
          onChangeText={setPlaceType}
        />
        <TextInput
          style={styles.input}
          placeholder="Food Type (e.g., local cuisine)"
          value={foodType}
          onChangeText={setFoodType}
        />
        <TextInput
          style={styles.input}
          placeholder="Budget (e.g., mid-range)"
          value={budget}
          onChangeText={setBudget}
        />

        <Button title="Generate Plan" onPress={generatePlan} disabled={loading} />

        {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}

        {error && <Text style={styles.error}>{error}</Text>}

        {plan && (
          <View style={styles.planContainer}>
            <ThemedText type="subtitle" style={styles.planTitle}>Your Travel Plan</ThemedText>
            <Text style={styles.planText}>{plan}</Text>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  loader: {
    marginTop: 20,
  },
  error: {
    color: 'red',
    marginTop: 20,
    textAlign: 'center',
  },
  planContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  planTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  planText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
