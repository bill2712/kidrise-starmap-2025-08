// map.js (電腦版專用 - 最終穩定版)

document.addEventListener("DOMContentLoaded", function() {

    // 守衛 Celestial 是否存在
    if (typeof Celestial === "undefined") {
        console.error("核心星圖函式庫 Celestial 未能成功載入。");
        const mapContainer = document.getElementById("starmap-container");
        if(mapContainer) mapContainer.innerHTML = "<h1>抱歉，星圖核心元件載入失敗</h1>";
        return;
    }

    // --- UI 元素定義 ---
    const ui = {
        messageElement: document.getElementById('message'),
        locationButton: document.getElementById('locationButton'),
        skyviewToggleButton: document.getElementById('skyview-toggle'),
        toggleArtButton: document.getElementById('toggle-art-button'),
    };
    
    // --- 手動測量容器寬度以繞開函式庫 Bug ---
    const starmapContainer = document.getElementById("starmap-container");
    const containerWidth = starmapContainer ? starmapContainer.getBoundingClientRect().width : 0;


    // --- 狀態變數 ---
    let state = {
        isSkyviewActive: false,
        isArtActive: false,
        orientationLastUpdate: 0
    };
    
    // --- 星座圖案設定 ---
    const constellationArtConfig = {
      images: true, 
      imageStyle: { width: 0.8, opacity: 0.4 },
      imageList: [
        {c:"ori", f:"/kidrise-starmap-2025-08/images/constellations/ori.png"},
        {c:"uma", f:"/kidrise-starmap-2025-08/images/constellations/uma.png"},
        {c:"cas", f:"/kidrise-starmap-2025-08/images/constellations/cas.png"},
        {c:"sco", f:"/kidrise-starmap-2025-08/images/constellations/sco.png"}
      ]
    };

    // --- 星圖設定 ---
    const celestialConfig = {
        width: containerWidth, // 使用我們手動測量的寬度
        projection: "stereographic", 
        transform: "equatorial", 
        background: { fill: "#000", stroke: "#000" }, 
        datapath: "/kidrise-starmap-2025-08/data/",
        interactive: true, 
        zoombuttons: false,
        controls: true,
        // 移除 container 屬性，讓函式庫使用預設的 #celestial-map
        horizon: { show: true, stroke: "#3a8fb7", width: 1.5, cardinal: true, cardinalstyle: { fill: "#87CEEB", font: "bold 16px 'Helvetica', Arial, sans-serif", offset: 14 } },
        stars: { show: true, limit: 6, colors: true, style: { fill: "#ffffff", opacity: 1, width: 1.5 }, names: true, proper: true, namelimit: 2.5, namestyle: { fill: "#ddddff", font: "14px 'Helvetica', Arial, sans-serif" } },
        planets: { show: true, which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"], symbolType: "disk", symbols: { "sol": {symbol: "☉", fill: "#ffcc00"}, "lun": {symbol: "☽", fill: "#f0f0f0"}, "mer": {symbol: "☿", fill: "#a9a9a9"}, "ven": {symbol: "♀", fill: "#f0e68c"}, "mar": {symbol: "♂", fill: "#ff4500"}, "jup": {symbol: "♃", fill: "#c2b280"}, "sat": {symbol: "♄", fill: "#f5deb3"}, "ura": {symbol: "♅", fill: "#afeeee"}, "nep": {symbol: "♆", fill: "#4169e1"}, "ter": {symbol: "♁", fill: "#0077be"} }, style: { width: 2 }, namestyle: { fill: "#f0f0f0", font: "14px 'Helvetica', Arial, sans-serif", align: "center", baseline: "middle" } },
        constellations: { show: true, names: true, namestyle: { fill: "#87CEEB", font: "16px 'Lucida Sans Unicode', sans-serif" }, lines: true, linestyle: { stroke: "#5594b8", width: 1.5, opacity: 0.8 }, images: false },
        mw: { show: true, style: { fill: "#ffffff", opacity: 0.15 } },
        callback: function (err) {
            if (err) { return console.error("Celestial Error:", err); }
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

    // --- 初始化 ---
    Celestial.display(celestialConfig);

    // --- 事件監聽 ---
    ui.locationButton.addEventListener('click', getLocation);
    ui.skyviewToggleButton.addEventListener('click', toggleSkyView);
    ui.toggleArtButton.addEventListener('click', toggleConstellationArt);

    // --- 功能函式 ---
    function showMessage(message, duration = 2000) { 
        if (ui.messageElement) {
            ui.messageElement.innerText = message; 
            if (duration > 0) setTimeout(() => { ui.messageElement.innerText = ''; }, duration); 
        }
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
      if (now - state.orientationLastUpdate < 50) return; // ~20fps
      state.orientationLastUpdate = now;
      Celestial.skyview(evt);
    }

    function getLocation() {
        if (navigator.geolocation) {
            showMessage("正在獲取您的位置...", 0);
            navigator.geolocation.getCurrentPosition(showPosition, showError, { timeout: 10000, enableHighAccuracy: true });
        } else { 
            showMessage("您的瀏覽器不支援定位。"); 
        }
    }

    function showPosition(position) {
        const { latitude, longitude } = position.coords;
        Celestial.apply({ location: [latitude, longitude], local: true });
        showMessage(`已更新為您的位置！`);
    }

    function showError(error) {
        const errors = { 1: '您已拒絕位置請求。', 2: '無法獲取當前位置。', 3: '獲取位置超時。' };
        showMessage(errors[error.code] || '獲取位置時發生未知錯誤。');
    }
});
