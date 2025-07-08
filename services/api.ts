import { TravelPlanRequest } from '../types';

// Update API base URL to your machine's LAN IP address for mobile access
const API_BASE_URL = 'http://192.168.31.206:8000/api'; // <-- Replace 192.168.x.x with your computer's IP

export const fetchTravelPlan = async (request: TravelPlanRequest): Promise<string> => {
  const url = `${API_BASE_URL}/plan`;
  console.log('--- Calling API ---');
  console.log('URL:', url);
  console.log('Method: POST');

  // Prepare the request body to match the backend API
  const body = JSON.stringify({
    city: request.city,
    place_type: request.place_type,
    food_type: request.food_type,
    budget: request.budget,
    days: request.days, // Use 'days' instead of 'number_of_days'
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    console.log('--- API Response Status ---');
    console.log('Status:', response.status);
    console.log('OK:', response.ok);


    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to generate plan. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.plan;
  } catch (err: any) {
    // Network or fetch error
    if (err.message && err.message.includes('Network request failed')) {
      throw new Error('Unable to connect to the server. Please check your network or try again later.');
    }
    throw err;
  }
};
