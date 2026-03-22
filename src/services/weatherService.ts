export interface WeatherData {
  weatherForecast: string;
  etData: string;
  soilData: string;
  chartData: {
    date: string;
    maxTemp: number;
    minTemp: number;
    precip: number;
    et0: number;
    soilMoisture: number;
  }[];
}

export async function fetchFarmData(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration&hourly=soil_moisture_0_to_7cm,soil_temperature_0_to_7cm&timezone=auto`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    const data = await response.json();
    
    // Format the data for the prompt
    const daily = data.daily;
    const hourly = data.hourly;
    
    let weatherForecast = "Date | Max Temp (°C) | Min Temp (°C) | Precipitation (mm)\n";
    weatherForecast += "---|---|---|---\n";
    for (let i = 0; i < daily.time.length; i++) {
      weatherForecast += `${daily.time[i]} | ${daily.temperature_2m_max[i]} | ${daily.temperature_2m_min[i]} | ${daily.precipitation_sum[i]}\n`;
    }
    
    let etData = "Date | ET₀ (mm)\n";
    etData += "---|---\n";
    for (let i = 0; i < daily.time.length; i++) {
      etData += `${daily.time[i]} | ${daily.et0_fao_evapotranspiration[i]}\n`;
    }
    
    // Just take a daily average or the first few hours for soil data to keep it concise
    let soilData = "Date | Soil Moisture (m³/m³) | Soil Temp (°C)\n";
    soilData += "---|---|---\n";
    
    const chartData = [];
    
    for (let i = 0; i < daily.time.length; i++) {
      // Get the noon value for each day (approx index i * 24 + 12)
      const noonIndex = i * 24 + 12;
      let moisture = 0;
      if (noonIndex < hourly.time.length) {
        moisture = hourly.soil_moisture_0_to_7cm[noonIndex];
        soilData += `${daily.time[i]} | ${moisture} | ${hourly.soil_temperature_0_to_7cm[noonIndex]}\n`;
      }
      
      chartData.push({
        date: daily.time[i],
        maxTemp: daily.temperature_2m_max[i],
        minTemp: daily.temperature_2m_min[i],
        precip: daily.precipitation_sum[i],
        et0: daily.et0_fao_evapotranspiration[i],
        soilMoisture: moisture
      });
    }
    
    return {
      weatherForecast,
      etData,
      soilData,
      chartData
    };
  } catch (error) {
    console.error("Error fetching farm data:", error);
    return {
      weatherForecast: "Data unavailable",
      etData: "Data unavailable",
      soilData: "Data unavailable",
      chartData: []
    };
  }
}
