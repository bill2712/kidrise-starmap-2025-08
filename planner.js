// planner.js (v3.0)
document.addEventListener("DOMContentLoaded", function() {
    const districtSelect = document.getElementById('district-select');
    const forecastContainer = document.getElementById('weather-forecast-container');
    const placeholder = document.getElementById('weather-placeholder');

    districtSelect.addEventListener('change', function() {
        if (!this.value) {
            placeholder.innerText = '請選擇地區以載入天氣預報。';
            forecastContainer.innerHTML = '';
            forecastContainer.appendChild(placeholder);
            return;
        }

        placeholder.innerText = '正在從香港天文台獲取天氣數據...';
        forecastContainer.innerHTML = '';
        forecastContainer.appendChild(placeholder);

        // 香港天文台九天天氣預報 API
        const HKO_API_URL = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=fnd&lang=tc';

        fetch(HKO_API_URL)
            .then(response => response.json())
            .then(data => {
                forecastContainer.innerHTML = ''; // 清空
                if (data && data.weatherForecast) {
                    data.weatherForecast.forEach(day => {
                        const card = document.createElement('div');
                        card.className = 'weather-card';
                        
                        const weekday = new Date(day.forecastDate).toLocaleDateString('zh-HK', { weekday: 'long' });
                        const iconUrl = `https://www.hko.gov.hk/images/wxicon/pic${day.ForecastIcon}.png`;

                        card.innerHTML = `
                            <h4>${day.forecastDate.slice(4,6)}/${day.forecastDate.slice(6,8)}</h4>
                            <p class="weekday">${weekday}</p>
                            <img src="${iconUrl}" alt="${day.forecastWeather}">
                            <p class="temp">${day.forecastMintemp.value}°C - ${day.forecastMaxtemp.value}°C</p>
                            <p class="humidity">${day.forecastMinrh.value}% - ${day.forecastMaxrh.value}%</p>
                        `;
                        forecastContainer.appendChild(card);
                    });
                } else {
                    placeholder.innerText = '無法獲取天氣數據，請稍後再試。';
                    forecastContainer.appendChild(placeholder);
                }
            })
            .catch(error => {
                console.error('天氣 API 錯誤:', error);
                placeholder.innerText = '載入天氣預報失敗。';
                forecastContainer.appendChild(placeholder);
            });
    });
});
