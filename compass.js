// compass.js (v2.6 - 新增手動分析與詳細介紹)

document.addEventListener("DOMContentLoaded", function() {
    if (typeof Celestial === "undefined") { return; }

    const ui = {
        compassNeedle: document.getElementById('compass-needle-img'),
        compassReading: document.getElementById('compass-reading'),
        currentTime: document.getElementById('current-time'),
        currentLocation: document.getElementById('current-location'),
        currentAltitude: document.getElementById('current-altitude'),
        visibleStarsList: document.getElementById('visible-stars-list'),
        permissionButton: document.getElementById('permission-button'),
        permissionRequestDiv: document.getElementById('permission-request'),
        mainContentDiv: document.getElementById('compass-main-content'),
        analyzeButton: document.getElementById('analyze-direction-button') // 新增
    };

    let state = { location: null, lastUpdate: 0, celestialData: [], azimuth: 0 };
    
    // 新增：天體知識庫
    const celestialDetails = {
        "Sun": "太陽是太陽系的中心恆星，觀測時必須使用專業的太陽濾鏡以保護眼睛。",
        "Moon": "月球是地球唯一的天然衛星，充滿了環形山和廣闊的月海，是初學者的最佳目標。",
        "Mars": "火星因其表面的氧化鐵而呈現紅色，在特定時間可以看到其白色的極冠。",
        "Jupiter": "木星是太陽系最大的行星，用小型望遠鏡就能看到它和它的四顆伽利略衛星。",
        "Saturn": "土星以其壯麗的光環而聞名，這是在望遠鏡中最令人驚嘆的景象之一。",
        "Orion": "獵戶座是冬季夜空中最顯眼的星座，以其腰帶上並排的三顆亮星而聞名，其內部擁有著名的獵戶座大星雲(M42)。",
        "Ursa Major": "大熊座包含了著名的北斗七星，是北天最重要的指極星座之一，可以幫助你找到北極星。",
        "Cassiopeia": "仙后座是一個呈 W 或 M 形的星座，位於北極星的另一側，與大熊座相對。",
        "Sirius": "天狼星是夜空中最亮的恆星，位於大犬座，可以順著獵戶座腰帶三星向左下方找到它。",
        "Polaris": "北極星位於小熊座的尾巴末端，非常接近天球北極，因此看起來幾乎不動，是尋找北方的重要指標。"
    };

    function init() {
        // ... (省略 updateTime, getLocation, fetchLocationName, decimalToDMS)
        const celestialConfig = {
            projection: "stereographic", width: 1, datapath: "/kidrise-starmap-2025-08/data/",
            planets: { show: true, which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"], symbols: { "sol": {}, "lun": {}, "mer": {}, "ven": {}, "mar": {}, "jup": {}, "sat": {}, "ura": {}, "nep": {}, "ter": {} }, namestyle: { fill: "#f0f0f0" } },
            callback: function(err) { if (err) return; buildCelestialIndex(); }
        };
        Celestial.display(celestialConfig);

        ui.permissionButton.addEventListener('click', requestSensorPermission);
        // 新增：為分析按鈕綁定事件
        ui.analyzeButton.addEventListener('click', analyzeDirection);
    }
    
    // --- 核心邏輯修改 ---
    
    function orientationHandler(event) {
        const now = performance.now();
        if (now - state.lastUpdate < 100) return;
        state.lastUpdate = now;
        let alpha = event.webkitCompassHeading || event.alpha;
        if (alpha === null) return;
        state.azimuth = alpha; // 持續更新當前方向
        // 只更新指南針 UI，不再觸發星體計算
        ui.compassNeedle.style.transform = `rotate(${alpha}deg)`;
        ui.compassReading.textContent = `${Math.round(alpha)}° ${getDirectionFromAzimuth(alpha)}`;
    }

    function analyzeDirection() {
        if (!state.location || state.celestialData.length === 0) {
            alert("正在等待位置和星體數據載入，請稍後再試。");
            return;
        }
        
        ui.visibleStarsList.innerHTML = `<p class="stars-placeholder">正在分析 ${Math.round(state.azimuth)}° 方向的星空...</p>`;

        // 使用 setTimeout 確保 UI 更新後再執行耗時的計算
        setTimeout(() => {
            updateVisibleStars(state.azimuth); // 將當前方向傳入計算函式
        }, 100);
    }

    function updateVisibleStars(capturedAzimuth) { // 接收傳入的固定方向
        Celestial.date(new Date());
        const visibleObjects = [];
        const centerCoords = Celestial.azimuthalToEquatorial({az: capturedAzimuth, alt: 30}, state.location);

        state.celestialData.forEach(item => {
            const searchParams = { type: item.type, name: item.name };
            if (item.type === 'constellation' && item.id) { searchParams.id = item.id; }
            const itemCoords = Celestial.search(searchParams);
            if (itemCoords) {
                const distance = Celestial.distance(centerCoords, itemCoords);
                const currentPos = Celestial.equatorialToAzimuthal(itemCoords, state.location);
                if (currentPos.alt > 0 && distance <= 45) {
                    visibleObjects.push(item);
                }
            }
        });

        if (visibleObjects.length > 0) {
            ui.visibleStarsList.innerHTML = visibleObjects
                .slice(0, 5)
                .map(item => {
                    const detail = celestialDetails[item.name] || "一個美麗的宇宙天體。";
                    const typeClass = `star-type-${item.type.toLowerCase()}`;
                    const borderColor = { constellation: '#3498db', star: '#f1c40f', planet: '#c2b280' }[item.type];
                    
                    return `
                        <div class="star-details-card" style="border-left-color: ${borderColor};">
                            <div class="star-details-header">
                                <span class="star-type ${typeClass}">${getTypeName(item.type)}</span>
                                <h4>${item.name}</h4>
                            </div>
                            <p>${detail}</p>
                        </div>
                    `;
                })
                .join('');
        } else {
            ui.visibleStarsList.innerHTML = `<p class="stars-placeholder">在 ${Math.round(capturedAzimuth)}° 方向的地平線以上，目前沒有找到顯著目標。</p>`;
        }
    }

    // --- 其他函式保持不變 ---
    // (此處省略 init, updateTime, getLocation, fetchLocationName, decimalToDMS, requestSensorPermission, getDirectionFromAzimuth, buildCelestialIndex, getTypeName 的完整定義，請使用您已有的版本)
    
    init();
});
