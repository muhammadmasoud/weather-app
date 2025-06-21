const API_KEY = "cb301aa38e9dbd9559f4f7bf62688659";
const predefinedCities = [
  { city: "New York", country: "US" },
  { city: "Los Angeles", country: "US" },
  { city: "Chicago", country: "US" },
  { city: "London", country: "GB" },
  { city: "Paris", country: "FR" },
  { city: "Berlin", country: "DE" },
  { city: "Madrid", country: "ES" },
  { city: "Rome", country: "IT" },
  { city: "Amsterdam", country: "NL" },
  { city: "Moscow", country: "RU" },
  { city: "Beijing", country: "CN" },
  { city: "Shanghai", country: "CN" },
  { city: "Tokyo", country: "JP" },
  { city: "Seoul", country: "KR" },
  { city: "Bangkok", country: "TH" },
  { city: "Jakarta", country: "ID" },
  { city: "Mumbai", country: "IN" },
  { city: "New Delhi", country: "IN" },
  { city: "Dubai", country: "AE" },
  { city: "Riyadh", country: "SA" },
  { city: "Istanbul", country: "TR" },
  { city: "Cairo", country: "EG" },
  { city: "Johannesburg", country: "ZA" },
  { city: "Sydney", country: "AU" },
  { city: "Melbourne", country: "AU" },
  { city: "São Paulo", country: "BR" },
  { city: "Buenos Aires", country: "AR" },
  { city: "Mexico City", country: "MX" },
  { city: "Toronto", country: "CA" },
  { city: "Vancouver", country: "CA" }
];

// Temperature unit state
let isMetric = true;
let is24HourFormat = false;

// Add dashboard settings management
let dashboardSettings = {
  showHourlyForecast: true,
  showDailyForecast: true,
  showWindInfo: true,
  showHumidity: true,
  showPrecipitation: true,
  showWeatherNews: true,
  showAdditionalInfo: true,
  showClothingRecs: true,
  showActivitySuggestions: true,
  showWeatherMaps: true,
  favorites: [],
  timeFormat: '12h'
};

// Map functionality
let weatherMap;
let currentMapLayer = null;
const mapLayers = {
  radar: {
    url: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png',
    attribution: '© OpenWeatherMap',
    opacity: 0.9,
    legend: {
      title: 'Precipitation',
      items: [
        { color: '#0000ff', label: 'Light Rain (0-2mm/h)' },
        { color: '#00ffff', label: 'Moderate Rain (2-5mm/h)' },
        { color: '#00ff00', label: 'Heavy Rain (5-10mm/h)' },
        { color: '#ffff00', label: 'Very Heavy Rain (10-20mm/h)' },
        { color: '#ff0000', label: 'Extreme Rain (>20mm/h)' }
      ]
    }
  },
  wind: {
    url: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png',
    attribution: '© OpenWeatherMap',
    opacity: 0.7,
    legend: {
      title: 'Wind Speed',
      items: [
        { color: '#ffffff', label: 'Calm (<5 km/h)' },
        { color: '#00ff00', label: 'Light (5-15 km/h)' },
        { color: '#ffff00', label: 'Moderate (15-30 km/h)' },
        { color: '#ff0000', label: 'Strong (30-50 km/h)' },
        { color: '#800000', label: 'Very Strong (>50 km/h)' }
      ]
    }
  },
  temperature: {
    url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png',
    attribution: '© OpenWeatherMap',
    opacity: 0.7,
    legend: {
      title: 'Temperature',
      items: [
        { color: '#0000ff', label: 'Very Cold (<0°C)' },
        { color: '#00ffff', label: 'Cold (0-10°C)' },
        { color: '#00ff00', label: 'Mild (10-20°C)' },
        { color: '#ffff00', label: 'Warm (20-30°C)' },
        { color: '#ff0000', label: 'Hot (>30°C)' }
      ]
    }
  }
};

function updateTheme() {
  const isDark = document.body.classList.contains('dark');
  document.body.style.backgroundImage = isDark ? 
    'url("https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=3840&auto=format&fit=crop")'
    : 'url("https://images.unsplash.com/photo-1419833173245-f59e1b93f9ee?q=80&w=2070&auto=format&fit=crop")';

  const alpha = isDark ? '0.2' : '0.9';
  const textColor = isDark ? '#fff' : '#333';
  
  document.querySelectorAll('.weather-card, .daily-forecast-card').forEach(card => {
    card.style.backgroundColor = isDark ? `rgba(0, 0, 0, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
    card.style.color = textColor;
  });
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
  updateTheme();
}

function toggleUnits() {
  isMetric = !isMetric;
  localStorage.setItem('units', isMetric ? 'metric' : 'imperial');
  
  const tempUnitSpan = document.querySelector('.temp-unit span');
  const unitLabel = document.querySelector('.unit-label');
  tempUnitSpan.textContent = isMetric ? '°C' : '°F';
  unitLabel.textContent = isMetric ? 'METRIC' : 'IMPERIAL';
  
  const recentCity = localStorage.getItem('recent');
  if (recentCity) {
    fetchWeatherByCity(recentCity);
  }
}

function convertTemp(temp, toMetric = true) {
  return toMetric ? (temp - 32) * 5/9 : (temp * 9/5) + 32;
}

function convertSpeed(speed, toMetric = true) {
  return toMetric ? speed * 1.60934 : speed / 1.60934;
}

function formatTemp(temp) {
  return `${Math.round(temp)}°${isMetric ? 'C' : 'F'}`;
}

function formatSpeed(speed) {
  return `${Math.round(isMetric ? speed : convertSpeed(speed, false))} ${isMetric ? 'km/h' : 'mph'}`;
}

function createCityDropdown() {
  const searchContainer = document.querySelector('.search-container');
  const dropdown = document.createElement('div');
  dropdown.className = 'city-dropdown';
  
  const select = document.createElement('select');
  select.id = 'citySelect';
  
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select a city';
  select.appendChild(defaultOption);
  
  predefinedCities.forEach(({ city, country }) => {
    const option = document.createElement('option');
    option.value = `${city},${country}`;
    option.textContent = `${city}, ${country}`;
    select.appendChild(option);
  });
  
  select.addEventListener('change', (e) => {
    if (e.target.value) {
      fetchWeatherByCity(e.target.value);
      document.getElementById('manualCity').value = e.target.value;
    }
  });
  
  dropdown.appendChild(select);
  searchContainer.appendChild(dropdown);
}

// Initialize the app when DOM is loaded
window.addEventListener("DOMContentLoaded", async () => {
  // Load dark mode preference first
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark');
  }
  updateTheme(); // Apply the theme immediately
  
  // Create city dropdown first
  createCityDropdown();
  
  // Setup the UI
  setupUserInterface();
  
  // Initialize the map
  initializeMap();
  
  // Try to get location immediately
  try {
    // Show loading state
    document.getElementById('loadingWeather').style.display = 'block';
    document.getElementById('weatherDisplay').style.display = 'none';
    document.getElementById('weatherError').style.display = 'none';
    
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    weatherMap.setView([latitude, longitude], 6); // Center map on user's location
    const locationData = await reverseGeocode(latitude, longitude);
    await fetchWeatherByCoordinates(latitude, longitude, locationData);
  } catch (error) {
    // If location access fails, fall back to last searched city
    console.log('Could not get initial location:', error);
    showLastCity();
  }
});

function setupUserInterface() {
  // Display username
  const userNameSpan = document.getElementById("userName");
  const username = localStorage.getItem("loggedInUser");
  if (userNameSpan && username) {
    userNameSpan.textContent = username;
  }

  // Setup logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("recent");
      window.location.href = "login.html";
    });
  }

  // Setup search functionality
  const searchBtn = document.getElementById("searchBtn");
  const manualCityInput = document.getElementById("manualCity");
  const citySelect = document.getElementById('citySelect');
  
  if (searchBtn && citySelect) {
    searchBtn.addEventListener("click", () => {
      const city = manualCityInput.value.trim();
      if (city) {
        fetchWeatherByCity(city);
        citySelect.selectedIndex = 0; // Reset dropdown
      }
    });
  }

  if (manualCityInput && citySelect) {
    manualCityInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const city = manualCityInput.value.trim();
        if (city) {
          fetchWeatherByCity(city);
          citySelect.selectedIndex = 0; // Reset dropdown to "Select a city"
        }
    }
  });
}

  // Update current date and time
  updateDateTime();
  setInterval(updateDateTime, 60000); // Update every minute

  // Setup dark mode
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark');
  }
  updateTheme();

  // Setup units preference
  const savedUnits = localStorage.getItem('units') || 'metric';
  isMetric = savedUnits === 'metric';
  const tempUnitDiv = document.querySelector('.temp-unit');
  if (tempUnitDiv) {
    tempUnitDiv.addEventListener('click', toggleUnits);
    tempUnitDiv.querySelector('span').textContent = isMetric ? '°C' : '°F';
  }

  // Setup location button
  const locationBtn = document.getElementById('locationBtn');
  if (locationBtn) {
    locationBtn.addEventListener('click', getLocationWeather);
  }

  // Initialize dashboard settings
  loadDashboardSettings();
  setupSettingsModal();

  // Populate the add favorite select with predefined cities
  const addFavoriteSelect = document.getElementById('addFavoriteSelect');
  if (addFavoriteSelect) {
    predefinedCities.forEach(({ city, country }) => {
      const option = document.createElement('option');
      option.value = `${city},${country}`;
      option.textContent = `${city}, ${country}`;
      addFavoriteSelect.appendChild(option);
    });
  }

  // Setup favorite toggle button
  const favoriteToggle = document.getElementById('favoriteToggle');
  favoriteToggle.addEventListener('click', () => {
    const currentLocation = document.getElementById('weatherLocation').textContent;
    const [city, country] = currentLocation.split(', ');
    const location = `${city},${country}`;
    
    if (dashboardSettings.favorites.includes(location)) {
      removeFromFavorites(location);
    } else {
      addToFavorites(city, country);
    }
    // Update button state after toggle
    updateFavoriteToggle(city, country);
  });

  // Setup time format toggle
  const timeFormatDiv = document.querySelector('.time-format');
  if (timeFormatDiv) {
    timeFormatDiv.addEventListener('click', toggleTimeFormat);
    const savedFormat = localStorage.getItem('timeFormat') || '12h';
    is24HourFormat = savedFormat === '24h';
    updateTimeFormatDisplay();
  }
}

function toggleTimeFormat() {
  is24HourFormat = !is24HourFormat;
  localStorage.setItem('timeFormat', is24HourFormat ? '24h' : '12h');
  updateTimeFormatDisplay();
  updateDateTime();
}

function updateTimeFormatDisplay() {
  const timeFormatDiv = document.querySelector('.time-format');
  if (timeFormatDiv) {
    timeFormatDiv.querySelector('span').textContent = is24HourFormat ? '24h' : '12h';
    timeFormatDiv.querySelector('.format-label').textContent = is24HourFormat ? '24-HOUR' : '12-HOUR';
  }
}

function updateDateTime() {
  const now = new Date();
  const dayEl = document.getElementById("currentDay");
  const timeEl = document.getElementById("currentTime");
  
  if (dayEl) {
    dayEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  
  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: !is24HourFormat
    });
  }
}

function showLastCity() {
  const recentCity = localStorage.getItem('recent');
  if (recentCity) {
    fetchWeatherByCity(recentCity);
  } else {
    // If no recent city, show a welcome message
    document.getElementById('loadingWeather').style.display = 'none';
    document.getElementById('weatherDisplay').style.display = 'none';
    document.getElementById('weatherError').style.display = 'block';
    document.getElementById('weatherErrorText').textContent = 
      "Welcome! Please allow location access or search for a city to see the weather.";
  }
}

// Function to generate weather news based on current conditions
function generateWeatherNews(weatherData) {
  const newsItems = [];
  const city = weatherData.city;
  const temp = weatherData.temp;
  const desc = weatherData.desc.toLowerCase();
  const wind = weatherData.wind;
  const humidity = weatherData.humidity;

  // Generate news based on temperature
  if (temp > 30) {
    newsItems.push({
      title: `Heatwave Alert in ${city}`,
      description: `Temperatures are soaring above 30°C in ${city}. Authorities advise staying hydrated and avoiding outdoor activities during peak hours.`,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      source: 'Local Weather Authority'
    });
  } else if (temp < 10) {
    newsItems.push({
      title: `Cold Snap Hits ${city}`,
      description: `Temperatures have dropped below 10°C in ${city}. Residents are advised to dress warmly and check heating systems.`,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      source: 'Local Weather Authority'
    });
  }

  // Generate news based on weather description
  if (desc.includes('rain')) {
    newsItems.push({
      title: `Rainfall Expected in ${city}`,
      description: `Weather forecasts predict continued rainfall in ${city}. Commuters are advised to plan for wet conditions and potential delays.`,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      source: 'Local Weather Authority'
    });
  } else if (desc.includes('snow')) {
    newsItems.push({
      title: `Snowfall Reported in ${city}`,
      description: `Snow has been reported in ${city}. Road conditions may be hazardous, and residents are advised to drive with caution.`,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      source: 'Local Weather Authority'
    });
  } else if (desc.includes('clear')) {
    newsItems.push({
      title: `Perfect Weather in ${city}`,
      description: `Clear skies and pleasant conditions are expected in ${city} today. Perfect weather for outdoor activities.`,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      source: 'Local Weather Authority'
    });
  }

  // Generate news based on wind speed
  if (wind > 20) {
    newsItems.push({
      title: `Strong Winds in ${city}`,
      description: `Wind speeds exceeding 20 km/h have been recorded in ${city}. Secure loose objects and exercise caution when driving.`,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      source: 'Local Weather Authority'
    });
  }

  // Generate news based on humidity
  if (humidity > 80) {
    newsItems.push({
      title: `High Humidity Levels in ${city}`,
      description: `Humidity levels are unusually high in ${city}. Residents with respiratory conditions should take necessary precautions.`,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      source: 'Local Weather Authority'
    });
  }

  // Add a general weather update
  newsItems.push({
    title: `Current Weather Update: ${city}`,
    description: `Current conditions in ${city}: ${desc}, temperature at ${temp}°${isMetric ? 'C' : 'F'}, wind speed ${wind} ${isMetric ? 'km/h' : 'mph'}.`,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    source: 'Local Weather Authority'
  });

  return newsItems;
}

// Function to display weather news
function displayWeatherNews(articles) {
  const newsContainer = document.getElementById('weatherNews');
  newsContainer.innerHTML = articles.length ? articles.map(article => `
    <div class="news-item">
      <h4>${article.title}</h4>
      <p>${article.description}</p>
      <div class="news-date">${article.date}</div>
      <div class="news-source">Source: ${article.source}</div>
    </div>
  `).join('') : '<p class="no-news">No weather news available at the moment.</p>';
}

// Update the fetchWeatherByCity function to use the new news generator
async function fetchWeatherByCity(city) {
  const UNITS = isMetric ? "metric" : "imperial";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${UNITS}`;

  document.getElementById('weatherDisplay').style.display = 'none';
  document.getElementById('weatherError').style.display = 'none';
  document.getElementById('loadingWeather').style.display = 'block';

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("City not found. Please check spelling.");
    
    const data = await response.json();
    const weatherData = {
      temp: Math.round(data.main.temp),
      city: data.name,
      country: data.sys.country,
      desc: data.weather[0].description,
      wind: data.wind.speed.toFixed(1),
      humidity: data.main.humidity,
      iconURL: `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`,
      lat: data.coord.lat,
      lon: data.coord.lon
    };
    
    if (weatherMap) {
      weatherMap.setView([weatherData.lat, weatherData.lon], 8);
    }
    
    displayWeatherData(weatherData);
    localStorage.setItem('recent', weatherData.city);
    document.getElementById('manualCity').value = '';
    
    await Promise.all([
      fetchHourlyForecast(weatherData.city, weatherData.country),
      fetchDailyForecast(weatherData.city, weatherData.country)
    ]);

    const news = generateWeatherNews(weatherData);
    displayWeatherNews(news);
  } catch (error) {
    showError(error.message);
  }
}

async function fetchHourlyForecast(city, country) {
  const UNITS = isMetric ? "metric" : "imperial";
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city},${country}&appid=${API_KEY}&units=${UNITS}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Hourly forecast data unavailable");
    
    const data = await response.json();
    displayHourlyForecast(data.list.slice(0, 8));
  } catch (error) {
    console.error("Error fetching hourly forecast:", error);
  }
}

async function fetchDailyForecast(city, country) {
  const UNITS = isMetric ? "metric" : "imperial";
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city},${country}&appid=${API_KEY}&units=${UNITS}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Daily forecast data unavailable");
    
    const data = await response.json();
    const dailyData = processForecastToDaily(data.list);
    displayDailyForecast(dailyData);
  } catch (error) {
    console.error("Error fetching daily forecast:", error);
  }
}

function processForecastToDaily(forecastList) {
  const dailyData = {};
  const today = new Date().setHours(0, 0, 0, 0);
  
  forecastList.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.setHours(0, 0, 0, 0);
    
    // Skip today as we already have current weather
    if (day === today) return;
    
    if (!dailyData[day]) {
      dailyData[day] = {
        date: new Date(day),
        temps: [],
        weather: [],
        icons: []
      };
    }
    
    dailyData[day].temps.push(item.main.temp);
    dailyData[day].weather.push(item.weather[0].main);
    dailyData[day].icons.push(item.weather[0].icon);
  });
  
  // Convert to array and find min/max temps and most common weather
  return Object.values(dailyData).map(day => {
    return {
      date: day.date,
      minTemp: Math.floor(Math.min(...day.temps)),
      maxTemp: Math.ceil(Math.max(...day.temps)),
      // Get most frequent weather condition and icon
      weather: getMostFrequent(day.weather),
      icon: getMostFrequent(day.icons)
    };
  }).slice(0, 3); // Just get the next 3 days
}

function getMostFrequent(arr) {
  return arr.sort((a, b) => 
    arr.filter(v => v === a).length - arr.filter(v => v === b).length
  ).pop();
}

function displayWeatherData(weatherData) {
  const iconCode = weatherData.iconURL.split('/').pop().replace('@4x.png', '');
  
  document.getElementById('weatherIcon').outerHTML = 
    `<div id="weatherIcon" class="weather-icon-container">${getWeatherIcon(iconCode)}</div>`;
  
  document.getElementById('weatherTemp').textContent = formatTemp(weatherData.temp);
  document.getElementById('weatherDesc').textContent = weatherData.desc;
  document.getElementById('weatherLocation').textContent = `${weatherData.city}, ${weatherData.country}`;
  document.getElementById('weatherWind').textContent = formatSpeed(weatherData.wind);
  document.getElementById('weatherHumidity').textContent = `${weatherData.humidity}%`;
  document.getElementById('weatherPrecip').textContent = `${Math.floor(Math.random() * 100)}%`;
  
  updateFavoriteToggle(weatherData.city, weatherData.country);
  
  document.getElementById('loadingWeather').style.display = 'none';
  document.getElementById('weatherError').style.display = 'none';
  document.getElementById('weatherDisplay').style.display = 'block';
  
  displayEnhancedFeatures(weatherData);
}

// Add new function to handle favorite toggle
function updateFavoriteToggle(city, country) {
  const favoriteToggle = document.getElementById('favoriteToggle');
  const location = `${city},${country}`;
  const isFavorite = dashboardSettings.favorites.includes(location);
  
  // Update button state
  favoriteToggle.classList.toggle('active', isFavorite);
  favoriteToggle.innerHTML = `<i class="bi bi-star${isFavorite ? '-fill' : ''}"></i>`;
}

function displayHourlyForecast(hourlyData) {
  const hourlyForecastContainer = document.getElementById('hourlyDisplay');
  hourlyForecastContainer.innerHTML = '';
  
  hourlyData.forEach((forecast) => {
    const forecastTime = new Date(forecast.dt * 1000);
    const time = forecastTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !is24HourFormat
    });
    
    const hourlyItem = document.createElement('div');
    hourlyItem.className = 'hourly-item';
    hourlyItem.innerHTML = `
      <div class="hourly-time">${time}</div>
      <div class="hourly-icon small">${getWeatherIcon(forecast.weather[0].icon)}</div>
      <div class="hourly-temp">${formatTemp(forecast.main.temp)}</div>
    `;
    
    hourlyForecastContainer.appendChild(hourlyItem);
  });
}

function displayDailyForecast(dailyData) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  dailyData.forEach((day, index) => {
    const cardEl = document.getElementById(`dayForecast${index + 1}`);
    if (cardEl) {
      cardEl.innerHTML = `
        <div class="day-name">${days[day.date.getDay()]}</div>
        <div class="day-date">${day.date.getDate()} ${months[day.date.getMonth()]}</div>
        <div class="day-icon small">${getWeatherIcon(day.icon)}</div>
        <div class="day-temp">
          <span>${formatTemp(day.minTemp)}</span>
          <span>—</span>
          <span>${formatTemp(day.maxTemp)}</span>
        </div>
      `;
    }
  });
  
  for (let i = dailyData.length + 1; i <= 3; i++) {
    const cardEl = document.getElementById(`dayForecast${i}`);
    if (cardEl) {
      cardEl.innerHTML = '<div class="day-name">Loading...</div>';
    }
  }
}

// Add geolocation functions
async function getLocationWeather() {
  const locationBtn = document.getElementById('locationBtn');
  locationBtn.classList.add('loading');
  
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const locationData = await reverseGeocode(latitude, longitude);
    await fetchWeatherByCoordinates(latitude, longitude, locationData);
  } catch (error) {
    showError("Could not get your location. Please make sure location services are enabled.");
  } finally {
    locationBtn.classList.remove('loading');
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
}

async function reverseGeocode(lat, lon) {
  const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to get location data');
    const data = await response.json();
    return data[0];
  } catch (error) {
    throw new Error('Could not determine your location name');
  }
}

// Update the fetchWeatherByCoordinates function to use the new news generator
async function fetchWeatherByCoordinates(lat, lon, locationData) {
  const UNITS = isMetric ? "metric" : "imperial";
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${UNITS}`;

  document.getElementById('weatherDisplay').style.display = 'none';
  document.getElementById('weatherError').style.display = 'none';
  document.getElementById('loadingWeather').style.display = 'block';

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather data unavailable");
    
    const data = await response.json();
    const weatherData = {
      temp: Math.round(data.main.temp),
      city: locationData.name,
      country: locationData.country,
      desc: data.weather[0].description,
      wind: data.wind.speed.toFixed(1),
      humidity: data.main.humidity,
      iconURL: `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`
    };

    displayWeatherData(weatherData);
    localStorage.setItem('recent', `${locationData.name},${locationData.country}`);
    document.getElementById('manualCity').value = '';
    document.getElementById('citySelect').selectedIndex = 0;
    
    await Promise.all([
      fetchHourlyForecast(locationData.name, locationData.country),
      fetchDailyForecast(locationData.name, locationData.country)
    ]);

    const news = generateWeatherNews(weatherData);
    displayWeatherNews(news);
  } catch (error) {
    showError(error.message);
  }
}

function showError(message) {
  document.getElementById('loadingWeather').style.display = 'none';
  document.getElementById('weatherDisplay').style.display = 'none';
  document.getElementById('weatherError').style.display = 'block';
  document.getElementById('weatherErrorText').textContent = message;
}

// Load settings from localStorage
function loadDashboardSettings() {
  const savedSettings = localStorage.getItem('dashboardSettings');
  if (savedSettings) {
    dashboardSettings = { ...dashboardSettings, ...JSON.parse(savedSettings) };
  }
  applyDashboardSettings();
  updateFavoritesBar();
}

// Save settings to localStorage
function saveDashboardSettings() {
  localStorage.setItem('dashboardSettings', JSON.stringify(dashboardSettings));
}

// Apply dashboard settings to UI
function applyDashboardSettings() {
  // Update checkboxes
  Object.keys(dashboardSettings).forEach(key => {
    const checkbox = document.getElementById(key);
    if (checkbox) {
      checkbox.checked = dashboardSettings[key];
    }
  });

  // Apply visibility settings
  const hourlyForecast = document.getElementById('hourlyDisplay');
  if (hourlyForecast) {
    hourlyForecast.style.display = dashboardSettings.showHourlyForecast ? 'flex' : 'none';
  }

  const dailyForecast = document.querySelector('.daily-forecast-container');
  if (dailyForecast) {
    dailyForecast.style.display = dashboardSettings.showDailyForecast ? 'grid' : 'none';
  }

  // Update weather conditions visibility
  document.querySelectorAll('.condition-row').forEach(row => {
    const type = row.querySelector('span').textContent.toLowerCase();
    if (type.includes('wind')) {
      row.style.display = dashboardSettings.showWindInfo ? 'flex' : 'none';
    } else if (type.includes('humidity')) {
      row.style.display = dashboardSettings.showHumidity ? 'flex' : 'none';
    } else if (type.includes('precip')) {
      row.style.display = dashboardSettings.showPrecipitation ? 'flex' : 'none';
    }
  });

  // Update weather news visibility
  const weatherNews = document.querySelector('.weather-news-container');
  if (weatherNews) {
    weatherNews.style.display = dashboardSettings.showWeatherNews ? 'block' : 'none';
  }

  // Update additional information visibility
  const additionalInfo = document.querySelector('.miscellaneous-container');
  if (additionalInfo) {
    additionalInfo.style.display = dashboardSettings.showAdditionalInfo ? 'block' : 'none';
  }

  // Update recommendations visibility
  const recommendations = document.getElementById('weatherRecommendations');
  if (recommendations) {
    recommendations.style.display = dashboardSettings.showClothingRecs || dashboardSettings.showActivitySuggestions ? 'block' : 'none';
    
    // Update individual sections within recommendations
    const clothingSection = recommendations.querySelector('.recommendation-section:first-child');
    const activitiesSection = recommendations.querySelector('.recommendation-section:last-child');
    
    if (clothingSection) {
      clothingSection.style.display = dashboardSettings.showClothingRecs ? 'block' : 'none';
    }
    if (activitiesSection) {
      activitiesSection.style.display = dashboardSettings.showActivitySuggestions ? 'block' : 'none';
    }
  }

  // Update maps visibility
  const maps = document.querySelector('.map-container');
  if (maps) {
    maps.style.display = dashboardSettings.showWeatherMaps ? 'block' : 'none';
  }
}

// Handle favorites
function addToFavorites(city, country) {
  const location = `${city},${country}`;
  if (!dashboardSettings.favorites.includes(location)) {
    dashboardSettings.favorites.push(location);
    saveDashboardSettings();
    updateFavoritesBar();
    updateFavoritesList();
  }
}

function removeFromFavorites(location) {
  dashboardSettings.favorites = dashboardSettings.favorites.filter(fav => fav !== location);
  saveDashboardSettings();
  updateFavoritesBar();
  updateFavoritesList();
  
  // Reset star button if the removed location is the current one
  const currentLocation = document.getElementById('weatherLocation').textContent;
  const [city, country] = location.split(',');
  const formattedLocation = `${city}, ${country}`;
  
  if (currentLocation.trim() === formattedLocation.trim()) {
    const favoriteToggle = document.getElementById('favoriteToggle');
    favoriteToggle.classList.remove('active');
    favoriteToggle.innerHTML = '<i class="bi bi-star"></i>';
  }
}

function updateFavoritesBar() {
  const favoritesScroll = document.getElementById('favoritesScroll');
  if (!favoritesScroll) return;

  favoritesScroll.innerHTML = '';
  dashboardSettings.favorites.forEach(location => {
    const [city, country] = location.split(',');
    const button = document.createElement('button');
    button.className = 'favorite-location';
    button.innerHTML = `
      <i class="bi bi-star-fill"></i>
      ${city}
    `;
    button.addEventListener('click', () => fetchWeatherByCity(location));
    favoritesScroll.appendChild(button);
  });
}

function updateFavoritesList() {
  const favoritesList = document.getElementById('favoritesList');
  if (!favoritesList) return;

  favoritesList.innerHTML = '';
  dashboardSettings.favorites.forEach(location => {
    const [city, country] = location.split(',');
    const item = document.createElement('div');
    item.className = 'favorite-item';
    item.innerHTML = `
      <span>${city}, ${country}</span>
      <button class="remove-favorite" onclick="removeFromFavorites('${location}')">
        <i class="bi bi-trash"></i>
      </button>
    `;
    favoritesList.appendChild(item);
  });
}

// Modal management
function setupSettingsModal() {
  const modal = document.getElementById('settingsModal');
  const settingsToggle = document.querySelector('.settings-toggle');
  const closeModal = document.querySelector('.close-modal');

  settingsToggle.addEventListener('click', () => {
    modal.style.display = 'block';
    updateFavoritesList();
  });

  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Setup checkbox listeners
  document.querySelectorAll('.layout-options input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      dashboardSettings[e.target.id] = e.target.checked;
      saveDashboardSettings();
      applyDashboardSettings();
    });
  });

  // Setup add favorite button
  const addFavoriteBtn = document.getElementById('addFavoriteBtn');
  const addFavoriteSelect = document.getElementById('addFavoriteSelect');

  addFavoriteBtn.addEventListener('click', () => {
    const [city, country] = addFavoriteSelect.value.split(',');
    if (city && country) {
      addToFavorites(city, country);
      addFavoriteSelect.value = '';
    }
  });
}

function initializeMap() {
  // Initialize the map centered on the user's location or a default location
  const defaultLocation = [0, 0]; // Will be updated with user's location
  weatherMap = L.map('weatherMap').setView(defaultLocation, 2);

  // Add the base map layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(weatherMap);

  // Add map tab event listeners
  document.querySelectorAll('.map-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      document.querySelectorAll('.map-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Switch map layer
      const mapType = tab.dataset.map;
      switchMapLayer(mapType);
    });
  });

  // Initialize with radar layer
  switchMapLayer('radar');
}

function switchMapLayer(mapType) {
  if (currentMapLayer) {
    weatherMap.removeLayer(currentMapLayer);
  }

  const layerConfig = mapLayers[mapType];
  const layerUrl = `${layerConfig.url}?appid=${API_KEY}`;
  
  currentMapLayer = L.tileLayer(layerUrl, {
    attribution: layerConfig.attribution,
    opacity: layerConfig.opacity,
    maxZoom: 10,
    minZoom: 1
  }).addTo(weatherMap);

  updateMapLegend(mapType);
}

function updateMapLegend(mapType) {
  const legend = document.getElementById('mapLegend');
  const layerConfig = mapLayers[mapType];
  
  let legendContent = `<h4>${layerConfig.legend.title}</h4>`;
  
  layerConfig.legend.items.forEach(item => {
    legendContent += `
      <div class="legend-item">
        <span class="legend-color" style="background: ${item.color}"></span>
        <span>${item.label}</span>
      </div>
    `;
  });

  legend.innerHTML = legendContent;
}

// Add new functions for enhanced user experience
function checkWeatherAlerts(weatherData) {
  const alerts = [];
  
  // Convert temperature to Celsius for consistent alert thresholds
  const tempInCelsius = isMetric ? weatherData.temp : convertTemp(weatherData.temp, true);
  
  // Check for severe weather conditions
  if (weatherData.wind > 30) {
    alerts.push({
      type: 'wind',
      message: 'High Wind Warning: Strong winds detected. Secure loose objects and exercise caution.',
      severity: 'high'
    });
  }
  
  if (tempInCelsius < 0) {
    alerts.push({
      type: 'cold',
      message: 'Freezing Temperature Alert: Extreme cold conditions. Take precautions against frostbite.',
      severity: 'high'
    });
  }
  
  if (tempInCelsius > 35) {
    alerts.push({
      type: 'heat',
      message: 'Heat Warning: Extreme heat conditions. Stay hydrated and avoid prolonged exposure.',
      severity: 'high'
    });
  }
  
  if (weatherData.desc.toLowerCase().includes('thunder')) {
    alerts.push({
      type: 'storm',
      message: 'Thunderstorm Alert: Seek shelter indoors and avoid open areas.',
      severity: 'high'
    });
  }
  
  return alerts;
}

function getClothingRecommendations(weatherData) {
  const recommendations = [];
  
  if (weatherData.temp < 5) {
    recommendations.push('Heavy coat', 'Warm gloves', 'Winter hat', 'Scarf', 'Thermal layers');
  } else if (weatherData.temp < 15) {
    recommendations.push('Jacket', 'Sweater', 'Long pants', 'Closed-toe shoes');
  } else if (weatherData.temp < 25) {
    recommendations.push('Light jacket', 'T-shirt', 'Comfortable pants');
  } else {
    recommendations.push('Light clothing', 'Sunglasses', 'Sunscreen', 'Hat');
  }
  
  if (weatherData.desc.toLowerCase().includes('rain')) {
    recommendations.push('Raincoat', 'Umbrella', 'Waterproof shoes');
  }
  
  return recommendations;
}

function getActivitySuggestions(weatherData) {
  const suggestions = [];
  
  if (weatherData.temp > 20 && !weatherData.desc.toLowerCase().includes('rain')) {
    suggestions.push('Outdoor activities', 'Picnic', 'Hiking', 'Beach visit', 'Cycling');
  } else if (weatherData.temp > 10 && weatherData.temp < 20) {
    suggestions.push('Walking', 'Jogging', 'City exploration', 'Outdoor dining');
  } else if (weatherData.temp < 10) {
    suggestions.push('Indoor activities', 'Museum visit', 'Shopping', 'Café visit');
  }
  
  if (weatherData.desc.toLowerCase().includes('rain')) {
    suggestions.push('Indoor activities', 'Movie watching', 'Reading', 'Cooking');
  }
  
  return suggestions;
}

function displayEnhancedFeatures(weatherData) {
  const alerts = checkWeatherAlerts(weatherData);
  const alertsContainer = document.getElementById('weatherAlerts') || createAlertsContainer();
  const recommendationsContainer = document.getElementById('weatherRecommendations') || createRecommendationsContainer();
  
  if (alerts.length) {
    alertsContainer.innerHTML = `
      <h3>Weather Alerts</h3>
      <div class="alerts-list">
        ${alerts.map(alert => `
          <div class="alert-item ${alert.severity}">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>${alert.message}</span>
          </div>
        `).join('')}
      </div>
    `;
    alertsContainer.style.display = 'block';
  } else {
    alertsContainer.style.display = 'none';
  }
  
  const clothing = getClothingRecommendations(weatherData);
  const activities = getActivitySuggestions(weatherData);
  
  recommendationsContainer.innerHTML = `
    <div class="recommendations-grid">
      <div class="recommendation-section">
        <h3>Recommended Clothing</h3>
        <div class="recommendation-list">
          ${clothing.map(item => `
            <div class="recommendation-item">
              <i class="bi bi-check-circle-fill"></i>
              <span>${item}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="recommendation-section">
        <h3>Suggested Activities</h3>
        <div class="recommendation-list">
          ${activities.map(item => `
            <div class="recommendation-item">
              <i class="bi bi-check-circle-fill"></i>
              <span>${item}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  updateMoonPhase();
  updateLocalTips(weatherData);
}

function createAlertsContainer() {
  const container = document.createElement('div');
  container.id = 'weatherAlerts';
  container.className = 'weather-alerts';
  document.querySelector('.map-container').insertAdjacentElement('beforebegin', container);
  return container;
}

function createRecommendationsContainer() {
  const container = document.createElement('div');
  container.id = 'weatherRecommendations';
  container.className = 'weather-recommendations';
  document.querySelector('.map-container').insertAdjacentElement('beforebegin', container);
  return container;
}

// Moon Phase Functions
function updateMoonPhase() {
  const now = new Date();
  const moonPhase = calculateMoonPhase(now);
  
  document.getElementById('moonPhaseIcon').innerHTML = getMoonPhaseIcon(moonPhase.phase);
  document.getElementById('moonPhaseText').textContent = moonPhase.name;
  document.getElementById('moonPhaseDate').textContent = `Next phase: ${moonPhase.nextPhaseDate}`;
}

function calculateMoonPhase(date) {
  // Simplified moon phase calculation
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // This is a simplified calculation - for more accuracy, you'd want to use a proper astronomical algorithm
  const phase = ((year * 12 + month) * 29.53 + day) % 29.53;
  
  const phases = [
    { name: "New Moon", icon: "🌑", next: 7.4 },
    { name: "Waxing Crescent", icon: "🌒", next: 7.4 },
    { name: "First Quarter", icon: "🌓", next: 7.4 },
    { name: "Waxing Gibbous", icon: "🌔", next: 7.4 },
    { name: "Full Moon", icon: "🌕", next: 7.4 },
    { name: "Waning Gibbous", icon: "🌖", next: 7.4 },
    { name: "Last Quarter", icon: "🌗", next: 7.4 },
    { name: "Waning Crescent", icon: "🌘", next: 7.4 }
  ];
  
  const currentPhase = Math.floor(phase / 3.7);
  const nextPhaseDate = new Date(date.getTime() + (phases[currentPhase].next * 24 * 60 * 60 * 1000));
  
  return {
    phase: currentPhase,
    name: phases[currentPhase].name,
    nextPhaseDate: nextPhaseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  };
}

function getMoonPhaseIcon(phase) {
  const icons = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  return icons[phase];
}

// Local Tips Functions
function updateLocalTips(weatherData) {
  // Pollen information
  const pollenLevel = calculatePollenLevel(weatherData);
  document.getElementById('pollenInfo').innerHTML = `
    <i class="bi bi-flower1"></i>
    <span>Pollen Level: ${pollenLevel}</span>
  `;
  
  // UV information
  const uvLevel = calculateUVLevel(weatherData);
  document.getElementById('uvInfo').innerHTML = `
    <i class="bi bi-sun"></i>
    <span>UV Index: ${uvLevel}</span>
  `;
  
  // Air quality
  const airQuality = calculateAirQuality(weatherData);
  document.getElementById('airQuality').innerHTML = `
    <i class="bi bi-wind"></i>
    <span>Air Quality: ${airQuality}</span>
  `;
}

function calculatePollenLevel(weatherData) {
  // Convert temperature to Celsius for consistent thresholds
  const tempInCelsius = isMetric ? weatherData.temp : convertTemp(weatherData.temp, true);
  const humidity = weatherData.humidity;
  
  if (tempInCelsius > 20 && humidity > 60) {
    return "High - Consider taking allergy medication";
  } else if (tempInCelsius > 15 && humidity > 40) {
    return "Moderate - May affect sensitive individuals";
  } else {
    return "Low - Minimal impact expected";
  }
}

function calculateUVLevel(weatherData) {
  // Convert temperature to Celsius for consistent thresholds
  const tempInCelsius = isMetric ? weatherData.temp : convertTemp(weatherData.temp, true);
  const cloudCover = weatherData.clouds || 0;
  
  if (tempInCelsius > 25 && cloudCover < 30) {
    return "High - Use sunscreen and limit sun exposure";
  } else if (tempInCelsius > 20 && cloudCover < 50) {
    return "Moderate - Use sunscreen";
  } else {
    return "Low - Minimal protection needed";
  }
}

function calculateAirQuality(weatherData) {
  const windSpeed = weatherData.wind;
  const humidity = weatherData.humidity;
  
  if (windSpeed > 20 && humidity < 40) {
    return "Good - Fresh air conditions";
  } else if (windSpeed > 10 && humidity < 60) {
    return "Moderate - Normal conditions";
  } else {
    return "Fair - Consider limiting outdoor activities";
  }
}