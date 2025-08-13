// planner.js (v4.2 - 新增 CORS 代理來解決 API 請求問題)

document.addEventListener("DOMContentLoaded", function() {
    // --- UI 元素定義 ---
    const districtSelect = document.getElementById('district-select');
    const weatherContainer = document.getElementById('weather-display-container');
    const weatherPlaceholder = document.getElementById('weather-placeholder');
    const astroContainer = document.getElementById('astro-phenomena-container');
    const astroPlaceholder = document.getElementById('astro-placeholder');

    // --- API URLs (關鍵修改) ---
    // 1. 定義代理伺服器
    const PROXY_URL = 'https://corsproxy.io/?';

    // 2. 定義原始的 API URLs
    const ORIGINAL_HKO_REGIONAL_URL = 'https://data.weather.gov.hk/weatherAPI/opendata/latestWeatherElements.php';
    const ORIGINAL_HKO_ASTRO_URL = 'https://data.weather.gov.hk/weatherAPI/opendata/astroInfo.php';

    // 3. 將原始 URL 編碼後，與代理伺服器組合
    const HKO_REGIONAL_API_URL = PROXY_URL + encodeURIComponent(ORIGINAL_HKO_REGIONAL_URL);
    const HKO_ASTRO_API_URL = PROXY_URL + encodeURIComponent(ORIGINAL_HKO_ASTRO_URL);
    
    let weatherDataStore = null;

    // =============================================
    //  功能一：分區天氣
    // =============================================
    function displayWeatherData(stationCode) {
        if (!weatherDataStore || !stationCode) {
            weatherContainer.innerHTML = '<p id="weather-placeholder">請選擇一個地區以載入即時天氣狀況。</p>';
            return;
        }
        const stationData = {
            temp: weatherDataStore.temperature.data.find(s => s.station === stationCode),
            humidity: weatherDataStore.humidity.data.find(s => s.station === stationCode),
        };
        const generalInfo = {
            icon: weatherDataStore.icon[0],
            updateTime: new Date(weatherDataStore.updateTime).toLocaleString('zh-HK')
        };
        weatherContainer.innerHTML = `
            <div class="weather-display-card visible">
                <div class="weather-header">
                    <div class="location">
                        <h3>${stationData.temp ? stationData.temp.place : '未知地區'}</h3>
                        <p>更新時間: ${generalInfo.updateTime}</p>
                    </div>
                    <div class="icon">
                        <img src="https://www.hko.gov.hk/images/wxicon/pic${generalInfo.icon}.png" alt="Weather Icon">
                    </div>
                </div>
                <div class="weather-body">
                    <div class="weather-metric">
                        <div class="label">溫度</div>
                        <div class="value">${stationData.temp ? stationData.temp.value : 'N/A'} °C</div>
                    </div>
                    <div class="weather-metric">
                        <div class="label">相對濕度</div>
                        <div class="value">${stationData.humidity ? stationData.humidity.value : 'N/A'} %</div>
                    </div>
                </div>
            </div>`;
    }

    function initRegionalWeather() {
        weatherPlaceholder.innerText = '正在從香港天文台獲取站點列表...';
        fetch(HKO_REGIONAL_API_URL) // 使用加上代理的 URL
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                weatherDataStore = data;
                if (data && data.temperature && data.temperature.data) {
                    data.temperature.data.forEach(station => {
                        const option = document.createElement('option');
                        option.value = station.station;
                        option.textContent = station.place;
                        districtSelect.appendChild(option);
                    });
                    weatherPlaceholder.innerText = '請選擇一個地區以載入即時天氣狀況。';
                } else {
                    weatherPlaceholder.innerText = '無法解析天氣站點列表。';
                }
            })
            .catch(error => {
                console.error('分區天氣 API 錯誤:', error);
                weatherPlaceholder.innerText = '載入天氣數據失敗，請檢查網路或稍後再試。';
            });
        districtSelect.addEventListener('change', function() {
            displayWeatherData(this.value);
        });
    }

    // =============================================
    //  功能二：今日天文現象
    // =============================================
    function initAstroPhenomena() {
        fetch(HKO_ASTRO_API_URL) // 使用加上代理的 URL
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                astroContainer.innerHTML = ''; // 清空 placeholder

                // 1. 日出日落卡片
                const sunCard = document.createElement('div');
                sunCard.className = 'astro-card';
                sunCard.innerHTML = `
                    <h4><span class="icon">☀️</span>日出日落</h4>
                    <ul>
                        <li><span class="label">日出時間</span><span class="value">${data.sunrise}</span></li>
                        <li><span class="label">中天時間</span><span class="value">${data.sunTransit}</span></li>
                        <li><span class="label">日落時間</span><span class="value">${data.sunset}</span></li>
                    </ul>
                `;
                astroContainer.appendChild(sunCard);

                // 2. 月出月落與月相卡片
                const moonCard = document.createElement('div');
                moonCard.className = 'astro-card';
                moonCard.innerHTML = `
                    <h4><span class="icon">🌕</span>月出月落與月相</h4>
                    <ul>
                        <li><span class="label">月出時間</span><span class="value">${data.moonrise}</span></li>
                        <li><span class="label">中天時間</span><span class="value">${data.moonTransit}</span></li>
                        <li><span class="label">月落時間</span><span class="value">${data.moonset}</span></li>
                        <li><span class="label">今日月相</span><span class="value">${data.moonPhase}</span></li>
                    </ul>
                `;
                astroContainer.appendChild(moonCard);

                // 3. 行星可見時間卡片 (動態生成)
                const planetCard = document.createElement('div');
                planetCard.className = 'astro-card';
                let planetListHTML = '<ul>';
                data.planetVisibility.forEach(planet => {
                    planetListHTML += `<li><span class="label">${planet.name}</span><span class="value">${planet.visible}</span></li>`;
                });
                planetListHTML += '</ul>';
                planetCard.innerHTML = `<h4><span class="icon">🪐</span>行星可見時間</h4>${planetListHTML}`;
                astroContainer.appendChild(planetCard);

            })
            .catch(error => {
                console.error('天文現象 API 錯誤:', error);
                astroPlaceholder.innerText = '載入天文現象數據失敗。';
            });
    }

    // --- 頁面初始化 ---
    initRegionalWeather();
    initAstroPhenomena();
});
