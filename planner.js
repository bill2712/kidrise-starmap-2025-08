// planner.js (v6.0 - 新增智能觀星建議)

document.addEventListener("DOMContentLoaded", function() {
    // --- UI 元素定義 ---
    const ui = {
        stationSelect: document.getElementById('station-select'),
        realtimeContainer: document.getElementById('realtime-weather-container'),
        realtimePlaceholder: document.getElementById('realtime-placeholder'),
        forecastContainer: document.getElementById('forecast-container'),
        forecastPlaceholder: document.getElementById('forecast-placeholder'),
        recommendationCard: document.getElementById('recommendation-card'),
        recoPlaceholder: document.getElementById('reco-placeholder')
    };

    // --- API URLs (全部使用官方文件端點) ---
    const API_WEATHER_BASE = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php";
    const API_OPENDATA_BASE = "https://data.weather.gov.hk/weatherAPI/opendata/opendata.php";
    const LANG = "tc";

    const API_URLS = {
        realtime: `${API_WEATHER_BASE}?dataType=rhrread&lang=${LANG}`,
        forecast: `${API_WEATHER_BASE}?dataType=fnd&lang=${LANG}`,
        visibility: `${API_OPENDATA_BASE}?dataType=LTMV&lang=${LANG}`
    };

    // --- 觀星地點數據 ---
    // 我們內建香港主要觀星地點及其對應的最近天氣站名稱
    const DARK_SKY_LOCATIONS = [
        { name: "西貢萬宜水庫東壩", station: "西貢" },
        { name: "大嶼山南部 (例如：水口)", station: "長洲" },
        { name: "船灣淡水湖主壩", station: "大埔" },
        { name: "石澳", station: "黃竹坑" },
        { name: "大帽山", station: "荃灣" }
    ];

    /**
     * 核心分析函式：綜合所有數據生成建議
     */
    function analyzeStargazingConditions(forecastData, realtimeData, visibilityData) {
        const tonightForecast = forecastData.weatherForecast[0];
        let recommendation = {
            status: "不建議",
            summary: "",
            details: `今晚整體天氣預測：${tonightForecast.forecastWeather}`,
            cssClass: "reco-bad"
        };

        // 1. 檢查整體天氣，如果預測有雨或雷暴，直接不建議
        if (tonightForecast.forecastWeather.includes("雨") || tonightForecast.forecastWeather.includes("雷")) {
            recommendation.summary = "今晚預測有雨或雷暴，雲層將完全遮蔽天空，非常不適合觀星。";
        }
        // 2. 檢查雲量，如果多雲，則觀測條件差
        else if (tonightForecast.forecastWeather.includes("多雲")) {
            recommendation.summary = "今晚預測多雲，大部分時間天空將被雲層覆蓋，觀測條件不佳。";
            recommendation.status = "不建議";
        }
        // 3. 如果天氣大致良好，則進一步分析最佳地點
        else if (tonightForecast.forecastWeather.includes("晴") || tonightForecast.forecastWeather.includes("良好")) {
            let bestLocation = null;
            let bestScore = -1;

            DARK_SKY_LOCATIONS.forEach(loc => {
                const temp = realtimeData.temperature.data.find(s => s.place === loc.station);
                const humidity = realtimeData.humidity.data.find(s => s.place === loc.station);
                const vis = visibilityData.data.find(s => s[1] === loc.station);

                if (temp && humidity && vis) {
                    const humidityValue = humidity.value;
                    const visibilityValue = vis[2]; // 能見度數據在陣列的第三個位置
                    
                    // 簡單評分：能見度越高、濕度越低，分數越高
                    const score = visibilityValue - humidityValue;

                    if (score > bestScore) {
                        bestScore = score;
                        bestLocation = {
                            name: loc.name,
                            temp: temp.value,
                            humidity: humidity.value,
                            visibility: visibilityValue
                        };
                    }
                }
            });

            if (bestLocation) {
                recommendation.status = "建議";
                recommendation.cssClass = "reco-good";
                recommendation.summary = `今晚天氣大致良好，適合觀星！根據即時數據，目前觀測條件最佳的地點是「${bestLocation.name}」。`;
                recommendation.details += `\n推薦地點即時天氣：溫度 ${bestLocation.temp}°C，相對濕度 ${bestLocation.humidity}%，能見度 ${bestLocation.visibility} 公里。`;
            } else {
                recommendation.status = "可以考慮";
                recommendation.cssClass = "reco-ok";
                recommendation.summary = "今晚天氣大致良好，但主要觀星地點的即時數據不完整，無法精準推薦。您可以碰碰運氣。";
            }
        } else {
            recommendation.summary = "今晚天氣預測一般，可能有雲層干擾，觀測條件存在不確定性。";
            recommendation.status = "可以考慮";
            recommendation.cssClass = "reco-ok";
        }
        
        // 渲染結果到卡片
        ui.recommendationCard.className = recommendation.cssClass;
        ui.recommendationCard.innerHTML = `
            <h3 class="status">${recommendation.status}</h3>
            <p class="summary">${recommendation.summary}</p>
            <p class="details">${recommendation.details.replace(/\n/g, '<br>')}</p>
        `;
    }

    /**
     * 初始化函式：頁面載入時執行
     */
    function initializePlanner() {
        // 使用 Promise.all 來確保所有 API 請求都完成後才進行分析
        Promise.all([
            fetch(API_URLS.forecast).then(res => res.json()),
            fetch(API_URLS.realtime).then(res => res.json()),
            fetch(API_URLS.visibility).then(res => res.json())
        ]).then(([forecastData, realtimeData, visibilityData]) => {
            // 所有數據都已成功獲取
            analyzeStargazingConditions(forecastData, realtimeData, visibilityData);
            
            // 數據載入成功後，再初始化互動式下拉選單
            populateStationSelect(realtimeData);

        }).catch(error => {
            console.error("一個或多個 API 請求失敗:", error);
            ui.recoPlaceholder.innerText = "無法載入所有天文台數據，無法生成建議。請檢查網路連線或稍後再試。";
            ui.realtimePlaceholder.innerText = "載入失敗。";
            ui.forecastPlaceholder.innerText = "載入失敗。";
        });
    }

    /**
     * 填充分區天氣的下拉選單
     */
    function populateStationSelect(realtimeData) {
        if (realtimeData && realtimeData.temperature && realtimeData.temperature.data) {
            ui.stationSelect.innerHTML = '<option value="">-- 請選擇地區 --</option>';
            realtimeData.temperature.data.forEach(station => {
                const option = document.createElement('option');
                option.value = station.place;
                option.textContent = station.place;
                ui.stationSelect.appendChild(option);
            });
            ui.realtimePlaceholder.innerText = '請選擇一個地區以載入即時天氣狀況。';

            ui.stationSelect.addEventListener('change', function() {
                displayRealtimeWeather(this.value, realtimeData);
            });
        } else {
            ui.realtimePlaceholder.innerText = '無法獲取天氣站點列表。';
        }
    }
    
    /**
     * 根據選擇顯示單個站點的詳細天氣
     */
    function displayRealtimeWeather(stationName, realtimeDataStore) {
        // (此函數邏輯與之前版本類似，但現在作為輔助功能)
        if (!realtimeDataStore || !stationName) { /* ... */ return; }
        // ... (省略內部實作以保持簡潔)
    }

    // --- 頁面啟動 ---
    initializePlanner();
});
