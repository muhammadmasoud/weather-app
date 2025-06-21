// Weather Icons Mapping
const weatherIcons = {
  // Clear sky
  '01d': 'day.svg',
  '01n': 'night.svg',

  // Few clouds
  '02d': 'cloudy-day-1.svg',
  '02n': 'cloudy-night-1.svg',

  // Scattered clouds
  '03d': 'cloudy-day-2.svg',
  '03n': 'cloudy-night-2.svg',
  
  // Broken clouds
  '04d': 'cloudy-day-3.svg',
  '04n': 'cloudy-night-3.svg',
  
  // Shower rain
  '09d': 'rainy-1.svg',
  '09n': 'rainy-1.svg',

  // Rain
  '10d': 'rainy-2.svg',
  '10n': 'rainy-2.svg',

  // Thunderstorm
  '11d': 'thunder.svg',
  '11n': 'thunder.svg',

  // Snow
  '13d': 'snowy-1.svg',
  '13n': 'snowy-1.svg',

  // Mist
  '50d': 'cloudy.svg',
  '50n': 'cloudy.svg'
};

// Function to get weather icon SVG
function getWeatherIcon(iconCode) {
  const iconFile = weatherIcons[iconCode] || 'day.svg'; // Default to day icon if not found
  return `<img src="animated/${iconFile}" alt="Weather icon" class="weather-icon">`;
} 