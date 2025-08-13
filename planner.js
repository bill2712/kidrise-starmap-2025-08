// planner.js (v5.2 - 官方文件校準版)

document.addEventListener("DOMContentLoaded", function() {
    // --- UI 元素定義 ---
    const stationSelect = document.getElementById('station-select');
    const realtimeContainer = document.getElementById('realtime-weather-container');
    const realtimePlaceholder = document.getElementById('realtime-placeholder');
    const forecastContainer = document.getElementById('forecast-container');
    const forecastPlaceholder = document.getElementById('forecast-placeholder');

    // --- 根據官方文件設定 API ---
    // API 基礎位置 (文件第 6 頁)
    const API_BASE_URL = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php";
    const LANG = "tc"; // 語言：繁體中文

    // =============================================
    //  功能一：分區即時天氣 (dataType=rhrread)
    // =============================================
    function displayRealtimeWeather(stationName) {
        if (!realtimeDataStore || !stationName) {
            realtimeContainer.innerHTML = '';
            realtimeContainer.appendChild(realtimePlaceholder);
            return;
        }

        // 根據文件第 8, 10 頁，數據在 data 陣列中
        const tempData = realtimeDataStore.temperature.data.find(s => s.place === stationName);
        const humidityData = realtimeDataStore.humidity.data.find(s => s.place === stationName);
        const updateTime = new Date(realtimeDataStore.updateTime).toLocaleString('zh-HK');
        const iconId = realtimeDataStore.icon[0];

        realtimeContainer.innerHTML = `
            <div class="weather-card visible">
                <div class="weather-header">
                    <div class="location">
                        <h3>${stationName}</h3>
                        <p>更新時間: ${updateTime}</p>
                    </div>
                    <div class="icon">
                        <img src="https://www.hko.gov.hk/images/wxicon/pic${iconId}.png" alt="Weather Icon">
                    </div>
                </div>
                <div class="weather-body">
                    <div class="weather-metric">
                        <div class="label">溫度</div>
                        <div class="value">${tempData ? tempData.value : 'N/A'} °C</div>
                    </div>
                    <div class="weather-metric">
                        <div class="label">相對濕度</div>
                        <div class="value">${humidityData ? humidityData.value : 'N/A'} %</div>
                    </div>
                </div>
            </div>`;
    }

    let realtimeDataStore = null; // 用於緩存即時天氣數據

    function initRealtimeWeather() {
        // 根據文件第 6 頁，構建 rhrread 的 URL
        const realtimeApiUrl = `${API_BASE_URL}?dataType=rhrread&lang=${LANG}`;
        
        realtimePlaceholder.innerText = '正在從香港天文台獲取站點列表...';

        fetch(realtimeApiUrl) // 直接呼叫官方 API，不使用代理
            .then(response => {
                if (!response.ok) throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
                return response.json();
            })
            .then(data => {
                realtimeDataStore = data;
                // 根據文件第 10 頁，溫度數據位於 data.temperature.data
                if (data && data.temperature && data.temperature.data) {
                    stationSelect.innerHTML = '<option value="">-- 請選擇地區 --</option>';
                    data.temperature.data.forEach(station => {
                        const option = document.createElement('option');
                        option.value = station.place;
                        option.textContent = station.place;
                        stationSelect.appendChild(option);
                    });
                    realtimePlaceholder.innerText = '請選擇一個地區以載入即時天氣狀況。';
                } else {
                    realtimePlaceholder.innerText = '無法解析天氣站點列表。';
                }
            })
            .catch(error => {
                console.error('即時天氣 API 錯誤:', error);
                realtimePlaceholder.innerText = '載入即時天氣數據失敗。\n可能是 CORS 限制，請檢查開發者工具 Console。';
            });
        stationSelect.addEventListener('change', function() {
            displayRealtimeWeather(this.value);
        });
    }

    // =============================================
    //  功能二：未來九日天氣預報 (dataType=fnd)
    // =============================================
    function initForecastWeather() {
        // 根據文件第 6 頁，構建 fnd 的 URL
        const forecastApiUrl = `${API_BASE_URL}?dataType=fnd&lang=${LANG}`;
        
        fetch(forecastApiUrl) // 直接呼叫官方 API，不使用代理
            .then(response => {
                if (!response.ok) throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
                return response.json();
            })
            .then(data => {
                forecastContainer.innerHTML = '';
                // 根據文件第 7 頁，預報數據位於 data.weatherForecast
                if (data && data.weatherForecast) {
                    data.weatherForecast.forEach(day => {
                        const card = document.createElement('div');
                        card.className = 'forecast-day-card';
                        
                        const date = `${day.forecastDate.slice(0,4)}-${day.forecastDate.slice(4,6)}-${day.forecastDate.slice(6,8)}`;
                        const iconUrl = `https://www.hko.gov.hk/images/wxicon/pic${day.ForecastIcon}.png`;

                        card.innerHTML = `
                            <div class="date">${date}</div>
                            <div class="weekday">${day.week}</div>
                            <img src="${iconUrl}" alt="${day.forecastWeather}">
                            <div class="temp">${day.forecastMintemp.value}°C / ${day.forecastMaxtemp.value}°C</div>
                            <div class="humidity">${day.forecastMinrh.value}% - ${day.forecastMaxrh.value}%</div>
                            <div class="weather-desc">${day.forecastWeather}</div>
                        `;
                        forecastContainer.appendChild(card);
                    });
                } else {
                    forecastPlaceholder.innerText = '無法獲取九日天氣預報。';
                }
            })
            .catch(error => {
                console.error('九日預報 API 錯誤:', error);
                forecastPlaceholder.innerText = '載入九日天氣預報失敗。';
            });
    }

    // --- 頁面初始化 ---
    initRealtimeWeather();
    initForecastWeather();
});
