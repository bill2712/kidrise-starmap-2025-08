// compass.js (v2.2 - 修正 Celestial 初始化 Bug 並更換 CORS 代理)

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
        azimuth: 0
    };

    // --- 初始化函式 ---
    function init() {
        updateTime();
        setInterval(updateTime, 1000);
        getLocation();
        
        // 關鍵修正 1：加入 projection 屬性以避免初始化錯誤
        const celestialConfig = {
            width: 1, // 只需一個非零值
            projection: "stereographic", // 必需的屬性
            datapath: "/kidrise-starmap-2025-08/data/",
            planets: { 
                show: true, 
                which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"],
                symbols: { "sol": {symbol: "☉", fill: "#ffcc00"}, "lun": {symbol: "☽", fill: "#f0f0f0"}, "mer": {symbol: "☿", fill: "#a9a9a9"}, "ven": {symbol: "♀", fill: "#f0e68c"}, "mar": {symbol: "♂", fill: "#ff4500"}, "jup": {symbol: "♃", fill: "#c2b280"}, "sat": {symbol: "♄", fill: "#f5deb3"}, "ura": {symbol: "♅", fill: "#afeeee"}, "nep": {symbol: "♆", fill: "#4169e1"}, "ter": {symbol: "♁", fill: "#0077be"} },
                namestyle: { fill: "#f0f0f0" }
            },
            callback: function(err) {
                if (err) return console.error("Celestial Error:", err);
                buildCelestialIndex();
            }
        };
        Celestial.display(celestialConfig);

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
                fetchLocationName(latitude, longitude);
                updateVisibleStars();
            }, err => {
                ui.currentLocation.textContent = "無法獲取位置";
            });
        } else {
            ui.currentLocation.textContent = "瀏覽器不支援定位";
        }
    }

    function fetchLocationName(lat, lon) {
        // 關鍵修正 2：更換為更穩定的 CORS 代理 allorigins.win
        const originalApiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        const proxyApiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(originalApiUrl)}`;

        fetch(proxyApiUrl)
            .then(response => {
                if (response.ok) return response.json();
                throw new Error('Network response was not ok.');
            })
            .then(data => {
                // allorigins 會將原始數據包裝在 "contents" 屬性中
                const geoData = JSON.parse(data.contents);
                if (geoData && geoData.address) {
                    const address = geoData.address;
                    const locationName = address.city || address.town || address.village || address.country || "未知地點";
                    ui.currentLocation.textContent = `📍 ${locationName}`;
                } else {
                     ui.currentLocation.textContent = `緯度: ${lat.toFixed(2)}°, 經度: ${lon.toFixed(2)}°`;
                }
            })
            .catch(error => {
                console.error("逆地理編碼錯誤:", error);
                ui.currentLocation.textContent = `緯度: ${lat.toFixed(2)}°, 經度: ${lon.toFixed(2)}°`;
            });
    }

    function requestSensorPermission() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', orientationHandler, true);
                    ui.permissionRequestDiv.style.display = 'none';
                } else {
                    alert('您拒絕了感測器權限，指南針功能無法使用。');
                }
            }).catch(console.error);
        } else {
            window.addEventListener('deviceorientation', orientationHandler, true);
            ui.permissionRequestDiv.style.display = 'none';
        }
    }

    function orientationHandler(event) {
        const now = performance.now();
        if (now - state.lastUpdate < 100) return;
        state.lastUpdate = now;
        let alpha = event.webkitCompassHeading || event.alpha;
        if (alpha === null) return;
        state.azimuth = alpha;
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
        const viewAltitude = 30;
        const viewRadius = 45;
        const centerCoords = Celestial.azimuthalToEquatorial({az: viewAzimuth, alt: viewAltitude}, state.location);

        state.celestialData.forEach(item => {
            const itemCoords = Celestial.search({ type: item.type, name: item.name });
            if (itemCoords) {
                const distance = Celestial.distance(centerCoords, itemCoords);
                const currentPos = Celestial.equatorialToAzimuthal(itemCoords, state.location);
                if (currentPos.alt > 0 && distance <= viewRadius) {
                    visibleObjects.push(item);
                }
            }
        });

        if (visibleObjects.length > 0) {
            ui.visibleStarsList.innerHTML = visibleObjects
                .slice(0, 5)
                .map(item => `<li><span class="star-type star-type-${item.type.toLowerCase()}">${getTypeName(item.type)}</span> ${item.name}</li>`)
                .join('');
        } else {
            ui.visibleStarsList.innerHTML = `<li>當前方向無顯著目標</li>`;
        }
    }
    
    function getTypeName(type) {
        const names = { "constellation": "星座", "star": "恆星", "planet": "行星" };
        return names[type] || type;
    }

    // --- 啟動 App ---
    init();
});
