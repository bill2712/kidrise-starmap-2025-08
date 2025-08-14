// map.js (基於您的成功版本，重構 + 加入 geolocation 錯誤處理)

document.addEventListener("DOMContentLoaded", function() {

    if (typeof Celestial === "undefined") {
        console.error("核心星圖函式庫 Celestial 未能成功載入。");
        document.getElementById("starmap-container").innerHTML = "<h1>抱歉，星圖核心元件載入失敗</h1>";
        return;
    }

    const ui = {
        messageElement: document.getElementById('message'),
        locationButton: document.getElementById('locationButton'),
        skyviewToggleButton: document.getElementById('skyview-toggle'),
        toggleArtButton: document.getElementById('toggle-art-button'),
        zoomInButton: document.getElementById('zoom-in'),
        zoomOutButton: document.getElementById('zoom-out'),
        searchInput: document.getElementById('search-input'),
        searchButton: document.getElementById('search-button'),
        clearButton: document.getElementById('clear-button'),
        datalist: document.getElementById('celestial-objects')
    };

    let state = {
        isSkyviewActive: false,
        isArtActive: false,
        celestialData: [],
        orientationLastUpdate: 0
    };

    const constellationArtConfig = {
        images: true, imageStyle: { width: 0.8, opacity: 0.4 },
        imageList: [
            {c:"ori", f:"/kidrise-starmap/images/constellations/ori.png"},
            {c:"uma", f:"/kidrise-starmap/images/constellations/uma.png"},
            {c:"cas", f:"/kidrise-starmap/images/constellations/cas.png"},
            {c:"sco", f:"/kidrise-starmap/images/constellations/sco.png"}
        ]
    };

    const celestialConfig = {
        width: 0, 
        projection: "stereographic",
        transform: "equatorial",
        background: { fill: "#000", stroke: "#000" },
        datapath: "/kidrise-starmap-2025-08/data/",
        interactive: true,
        zoombuttons: false,
        controls: true,
        horizon: { show: true, stroke: "#3a8fb7", width: 1.5, cardinal: true, cardinalstyle: { fill: "#87CEEB", font: "bold 18px 'Helvetica', Arial, sans-serif", offset: 12 } },
        stars: { show: true, limit: 6, colors: true, style: { fill: "#ffffff", opacity: 1 }, names: true, proper: true, namelimit: 2.5, namestyle: { fill: "#ddddff", font: "13px 'Helvetica', Arial, sans-serif" } },
        planets: {
            show: true, 
            which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"],
            symbolType: "disk",
            symbols: {
                "sol": {symbol: "☉", fill: "#ffcc00"},
                "lun": {symbol: "☽", fill: "#f0f0f0"},
                "mer": {symbol: "☿", fill: "#a9a9a9"},
                "ven": {symbol: "♀", fill: "#f0e68c"},
                "mar": {symbol: "♂", fill: "#ff4500"},
                "jup": {symbol: "♃", fill: "#c2b280"},
                "sat": {symbol: "♄", fill: "#f5deb3"},
                "ura": {symbol: "♅", fill: "#afeeee"},
                "nep": {symbol: "♆", fill: "#4169e1"},
                "ter": {symbol: "♁", fill: "#0077be"}
            },
            namestyle: { fill: "#f0f0f0" }
        },
        constellations: { show: true, names: true, namestyle: { fill: "#87CEEB", font: "14px 'Lucida Sans Unicode', sans-serif" }, lines: true, linestyle: { stroke: "#3a8fb7", width: 1, opacity: 0.8 }, images: false },
        mw: { show: true, style: { fill: "#ffffff", opacity: 0.15 } },
        callback: function(error) {
            if (error) return console.warn(error);
            buildSearchIndex();
            const savedLocation = localStorage.getItem('plannerLocation');
            if (savedLocation) {
                const loc = JSON.parse(savedLocation);
                showMessage(`正在顯示 ${loc.name} 的星空...`, 3000);
                Celestial.apply({ location: loc.location, local: true });
                localStorage.removeItem('plannerLocation');
            } else {
                setTimeout(getLocation, 500);
            }
        }
    };

    Celestial.display(celestialConfig);

    ui.locationButton.addEventListener('click', getLocation);
    ui.zoomInButton.addEventListener('click', () => zoomBy(0.8));
    ui.zoomOutButton.addEventListener('click', () => zoomBy(1.25));
    ui.skyviewToggleButton.addEventListener('click', toggleSkyView);
    ui.toggleArtButton.addEventListener('click', toggleConstellationArt);
    ui.searchButton.addEventListener('click', searchNow);
    ui.searchInput.addEventListener('keyup', (evt) => { if (evt.key === 'Enter') searchNow(); });
    ui.clearButton.addEventListener('click', clearSearch);

    function showMessage(message, duration = 2000) {
        ui.messageElement.innerText = message;
        if (duration > 0) setTimeout(() => { ui.messageElement.innerText = ''; }, duration);
    }

    function buildSearchIndex() {
        state.celestialData = [];
        if (Celestial.constellations) {
            Celestial.constellations.forEach(c => state.celestialData.push({ name: c.name, type: "constellation", id: c.id }));
        }
        if (Celestial.data?.stars?.features) {
            Celestial.data.stars.features.forEach(f => {
                const nm = f.properties?.name;
                if (nm) state.celestialData.push({ name: nm, type: "star", id: f.id });
            });
        }
        ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune"].forEach(p => state.celestialData.push({ name: p, type: "planet" }));
        ui.datalist.innerHTML = state.celestialData.map(item => `<option value="${item.name}"></option>`).join("");
    }

    function searchNow() {
        const query = ui.searchInput.value.trim();
        if (!query) return;
        const item = state.celestialData.find(x => x.name.toLowerCase() === query.toLowerCase());
        if (!item) { showMessage(`抱歉，資料庫中沒有 "${query}"。`); return; }
        const res = Celestial.search({ type: item.type, name: item.name, id: item.id });
        if (!res) { showMessage(`抱歉，找不到 ${item.name} 的座標。`); return; }
        Celestial.remove("search-target");
        Celestial.add({ type: "Point", id: "search-target", geometry: { type: "Point", coordinates: [res.ra, res.dec] }, properties: { size: 20, style: { class: "target-indicator" } } });
        Celestial.redraw();
        ui.clearButton.classList.remove("hidden");
        showMessage(`為您標示 ${item.name}...`, 3000);
    }

    function clearSearch() {
        Celestial.remove("search-target");
        Celestial.redraw();
        ui.searchInput.value = "";
        ui.clearButton.classList.add("hidden");
        showMessage("");
    }

    function zoomBy(factor) {
        const currentScale = Celestial.zoom.scale();
        const center = [window.innerWidth / 2, window.innerHeight / 2];
        Celestial.zoom.to(currentScale * factor, center);
    }

    function toggleConstellationArt() {
        state.isArtActive = !state.isArtActive;
        ui.toggleArtButton.classList.toggle('active', state.isArtActive);
        Celestial.apply({ constellations: state.isArtActive ? constellationArtConfig : { images: false } });
    }

    function toggleSkyView() {
        state.isSkyviewActive = !state.isSkyviewActive;
        const button = ui.skyviewToggleButton;
        button.textContent = state.isSkyviewActive ? '🛑 關閉陀螺儀' : '🔭 開啟陀螺儀';
        button.classList.toggle('active', state.isSkyviewActive);
        if (state.isSkyviewActive) {
            showMessage("正在開啟陀螺儀...", 0);
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', orientationHandler, { passive: true });
                        Celestial.skyview({ "follow": "center" });
                        showMessage("陀螺儀已開啟！");
                    } else { 
                        showMessage('方向感測器權限遭拒。');
                        state.isSkyviewActive = false;
                        button.textContent = '🔭 開啟陀螺儀';
                        button.classList.remove('active');
                    }
                }).catch(console.error);
            } else {
                if (!('ondeviceorientation' in window)) {
                    console.warn("此瀏覽器不支援 DeviceOrientationEvent。");
                    showMessage("此瀏覽器不支援陀螺儀。");
                    state.isSkyviewActive = false;
                    button.textContent = '🔭 開啟陀螺儀';
                    button.classList.remove('active');
                    return;
                }
                window.addEventListener('deviceorientation', orientationHandler, { passive: true });
                Celestial.skyview({ "follow": "center" });
                showMessage("陀螺儀已開啟！");
            }
        } else {
            showMessage("陀螺儀已關閉。");
            window.removeEventListener('deviceorientation', orientationHandler);
            Celestial.skyview({ "follow": "none" });
        }
    }

    function orientationHandler(evt) {
        const now = performance.now();
        if (now - state.orientationLastUpdate < 50) return;
        state.orientationLastUpdate = now;
        Celestial.skyview(evt);
    }

    function getLocation() {
        if (!navigator.geolocation) {
            showMessage("❌ 您的瀏覽器不支援地理定位。");
            console.error("Geolocation not supported.");
            return;
        }

        showMessage("📍 正在嘗試獲取您的位置...", 0);

        navigator.geolocation.getCurrentPosition(
            showPosition,
            showError,
            { timeout: 10000, enableHighAccuracy: true }
        );
    }

    function showPosition(position) {
        const { latitude, longitude } = position.coords;
        console.log("✅ 取得位置成功:", latitude, longitude);

        Celestial.apply({
            location: [latitude, longitude],
            local: true
        });

        showMessage(`✅ 已根據您的位置顯示星空`);
    }

    function showError(error) {
        const errors = {
            1: '❌ 使用者拒絕了位置請求。',
            2: '❌ 無法取得您目前的位置。',
            3: '❌ 位置取得逾時。',
        };
        console.error("Geolocation Error:", error.code, error.message);
        showMessage(errors[error.code] || `❌ 發生錯誤：${error.message}`);
    }
});
