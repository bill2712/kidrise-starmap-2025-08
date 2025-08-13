// compass.js
document.addEventListener("DOMContentLoaded", function() {
    if (typeof Celestial === "undefined") { return console.error("核心星圖函式庫 Celestial 未能成功載入。"); }

    const ui = {
        compassRose: document.getElementById('compass-rose'),
        compassReading: document.getElementById('compass-reading'),
        currentTime: document.getElementById('current-time'),
        currentLocation: document.getElementById('current-location'),
        visibleStarsList: document.getElementById('visible-stars-list'),
        starsPlaceholder: document.getElementById('stars-placeholder'),
        permissionButton: document.getElementById('permission-button'),
        permissionRequestDiv: document.getElementById('permission-request')
    };

    let state = {
        location: null, // [lat, lon]
        lastUpdate: 0,
        celestialData: [],
        azimuth: 0 // 當前朝向
    };

    // --- 初始化函式 ---
    function init() {
        updateTime();
        setInterval(updateTime, 1000); // 每秒更新時間
        getLocation();
        
        // 僅在第一次載入時呼叫一次 display()，以初始化天文數據
        Celestial.display({
            datapath: "/kidrise-starmap-2025-08/data/",
            planets: { show: true, which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"] },
            callback: function(err) {
                if (err) return;
                buildCelestialIndex();
            }
        });

        ui.permissionButton.addEventListener('click', requestSensorPermission);
    }
    
    // --- 功能函式 ---

    function updateTime() {
        ui.currentTime.textContent = new Date().toLocaleTimeString('zh-HK');
    }

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                const { latitude, longitude } = pos.coords;
                state.location = [latitude, longitude];
                ui.currentLocation.textContent = `緯度: ${latitude.toFixed(2)}°, 經度: ${longitude.toFixed(2)}°`;
                // 獲取位置後，再更新可見星體
                updateVisibleStars();
            }, err => {
                ui.currentLocation.textContent = "無法獲取位置";
            });
        } else {
            ui.currentLocation.textContent = "瀏覽器不支援定位";
        }
    }

    function requestSensorPermission() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', orientationHandler, true);
                    ui.permissionRequestDiv.style.display = 'none'; // 隱藏按鈕
                } else {
                    alert('您拒絕了感測器權限，指南針功能無法使用。');
                }
            }).catch(console.error);
        } else {
            // 對於 Android 或已授權的裝置
            window.addEventListener('deviceorientation', orientationHandler, true);
            ui.permissionRequestDiv.style.display = 'none';
        }
    }

    function orientationHandler(event) {
        const now = performance.now();
        if (now - state.lastUpdate < 100) return; // 節流，每秒最多更新10次
        state.lastUpdate = now;

        let alpha = event.webkitCompassHeading || event.alpha; // 優先使用 webkitCompassHeading
        if (alpha === null) return;
        
        state.azimuth = alpha;

        // 更新 UI
        ui.compassRose.style.transform = `rotate(${-alpha}deg)`;
        ui.compassReading.textContent = `${Math.round(alpha)}°`;
        
        updateVisibleStars();
    }

    function buildCelestialIndex() {
        if (Celestial.constellations) { Celestial.constellations.forEach(c => state.celestialData.push({ name: c.name, type: "constellation" })); }
        if (Celestial.data?.stars?.features) { Celestial.data.stars.features.forEach(f => { const nm = f.properties?.name; if (nm && f.properties.mag < 2.5) state.celestialData.push({ name: nm, type: "star" }); }); }
        ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune"].forEach(p => state.celestialData.push({ name: p, type: "planet" }));
    }

    function updateVisibleStars() {
        if (!state.location || state.celestialData.length === 0) return;

        Celestial.date(new Date());
        
        const visibleObjects = [];
        const viewAzimuth = state.azimuth;
        const viewAltitude = 30; // 假設使用者平視前方偏上
        const viewRadius = 45; // 搜尋前方 90 度夾角內的目標

        // 將螢幕中心點（方位角/高度角）轉換為天球座標（赤經/赤緯）
        const centerCoords = Celestial.azimuthalToEquatorial({az: viewAzimuth, alt: viewAltitude}, state.location);

        state.celestialData.forEach(item => {
            const itemCoords = Celestial.search({ type: item.type, name: item.name });
            if (itemCoords) {
                const distance = Celestial.distance(centerCoords, itemCoords);
                
                // 檢查天體是否在地平線以上，並且在視野範圍內
                const currentPos = Celestial.equatorialToAzimuthal(itemCoords, state.location);
                if (currentPos.alt > 0 && distance <= viewRadius) {
                    visibleObjects.push(item);
                }
            }
        });

        // 更新列表 UI
        if (visibleObjects.length > 0) {
            ui.visibleStarsList.innerHTML = visibleObjects
                .slice(0, 5) // 最多顯示 5 個
                .map(item => `
                    <li>
                        <span class="star-type star-type-${item.type.toLowerCase()}">${getTypeName(item.type)}</span>
                        ${item.name}
                    </li>
                `).join('');
        } else {
            ui.visibleStarsList.innerHTML = `<li>當前方向無顯著目標</li>`;
        }
    }
    
    function getTypeName(type) {
        const names = {
            "constellation": "星座",
            "star": "恆星",
            "planet": "行星"
        };
        return names[type] || type;
    }

    // --- 啟動 App ---
    init();
});
