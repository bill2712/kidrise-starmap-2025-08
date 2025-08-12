// map.js (v4.0 - 新增簡化模式)

document.addEventListener("DOMContentLoaded", function() {

    if (typeof Celestial === "undefined") {
        console.error("核心星圖函式庫 Celestial 未能成功載入。");
        document.getElementById("starmap-container").innerHTML = "<h1>抱歉，星圖核心元件載入失敗</h1>";
        return;
    }

    // --- UI 元素定義 ---
    const ui = {
        messageElement: document.getElementById('message'),
        locationButton: document.getElementById('locationButton'),
        skyviewToggleButton: document.getElementById('skyview-toggle'),
        toggleArtButton: document.getElementById('toggle-art-button'),
        simplifyToggleButton: document.getElementById('simplify-toggle'), // 新增
    };

    // --- 狀態變數 ---
    let state = {
        isSkyviewActive: false,
        isArtActive: false,
        isSimpleMode: false, // 新增
        orientationLastUpdate: 0
    };

    // --- 星座圖案設定 ---
    const constellationArtConfig = {
      images: true, imageStyle: { width: 0.8, opacity: 0.4 },
      imageList: [
        {c:"ori", f:"/kidrise-starmap/images/constellations/ori.png"},
        {c:"uma", f:"/kidrise-starmap/images/constellations/uma.png"},
        {c:"cas", f:"/kidrise-starmap/images/constellations/cas.png"},
        {c:"sco", f:"/kidrise-starmap/images/constellations/sco.png"}
      ]
    };
    
    // --- 星圖設定 (拆分為兩種模式) ---

    // 1. 專業模式設定 (我們之前的版本)
    const proConfig = {
        width: 0, projection: "stereographic", transform: "equatorial", background: { fill: "#000", stroke: "#000" }, datapath: "/kidrise-starmap-2025-08/data/", interactive: true, zoombuttons: false, controls: true,
        horizon: { show: true, stroke: "#3a8fb7", width: 1.5, cardinal: true, cardinalstyle: { fill: "#87CEEB", font: "bold 16px 'Helvetica', Arial, sans-serif", offset: 14 } },
        stars: { show: true, limit: 6, colors: true, style: { fill: "#ffffff", opacity: 1, width: 1.5 }, names: true, proper: true, namelimit: 2.5, namestyle: { fill: "#ddddff", font: "14px 'Helvetica', Arial, sans-serif" } },
        planets: { show: true, which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"], symbolType: "disk", symbols: { "sol": {symbol: "☉", fill: "#ffcc00"}, "lun": {symbol: "☽", fill: "#f0f0f0"}, "mer": {symbol: "☿", fill: "#a9a9a9"}, "ven": {symbol: "♀", fill: "#f0e68c"}, "mar": {symbol: "♂", fill: "#ff4500"}, "jup": {symbol: "♃", fill: "#c2b280"}, "sat": {symbol: "♄", fill: "#f5deb3"}, "ura": {symbol: "♅", fill: "#afeeee"}, "nep": {symbol: "♆", fill: "#4169e1"}, "ter": {symbol: "♁", fill: "#0077be"} }, style: { width: 2 }, namestyle: { fill: "#f0f0f0", font: "14px 'Helvetica', Arial, sans-serif", align: "center", baseline: "middle" } },
        constellations: { show: true, names: true, namestyle: { fill: "#87CEEB", font: "16px 'Lucida Sans Unicode', sans-serif" }, lines: true, linestyle: { stroke: "#5594b8", width: 1.5, opacity: 0.8 }, images: false },
        mw: { show: true, style: { fill: "#ffffff", opacity: 0.15 } }
    };

    // 2. 簡化模式設定 (只定義需要覆蓋的屬性)
    const simpleConfig = {
        stars: { show: true, limit: 4.5, colors: true, style: { fill: "#ffffff", opacity: 1, width: 2 }, names: true, proper: true, namelimit: 2.0, namestyle: { fill: "#ddddff", font: "15px 'Helvetica', Arial, sans-serif" } },
        planets: { show: true, style: { width: 2.5 } }, // 只保留 show 和 style，讓大小覆蓋 proConfig
        constellations: { show: true, names: true, namestyle: { fill: "#87CEEB", font: "18px 'Lucida Sans Unicode', sans-serif" }, lines: true, linestyle: { stroke: "#5594b8", width: 2, opacity: 0.8 } }
    };

    // --- 初始化 ---
    const initialConfig = Object.assign({}, proConfig, {
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
    });
    Celestial.display(initialConfig);

    // --- 事件監聽 ---
    ui.locationButton.addEventListener('click', getLocation);
    ui.skyviewToggleButton.addEventListener('click', toggleSkyView);
    ui.toggleArtButton.addEventListener('click', toggleConstellationArt);
    ui.simplifyToggleButton.addEventListener('click', toggleSimpleMode); // 新增

    // --- 功能函式 ---
    function showMessage(message, duration = 2000) { ui.messageElement.innerText = message; if (duration > 0) setTimeout(() => { ui.messageElement.innerText = ''; }, duration); }

    function toggleSimpleMode() {
        state.isSimpleMode = !state.isSimpleMode;
        ui.simplifyToggleButton.classList.toggle('active', state.isSimpleMode);
        ui.simplifyToggleButton.textContent = state.isSimpleMode ? '✨ 專業模式' : '✨ 簡化模式';
        
        // 使用 apply() 來無縫切換設定
        if (state.isSimpleMode) {
            Celestial.apply(simpleConfig);
            showMessage("已切換至簡化模式");
        } else {
            // 切換回專業模式時，需要恢復所有設定
            Celestial.apply(proConfig);
            showMessage("已切換至專業模式");
        }
    }
    
    // (其他 getLocation, toggleSkyView 等函式保持不變)
    function toggleConstellationArt() { /* ... */ }
    function toggleSkyView() { /* ... */ }
    function orientationHandler(evt) { /* ... */ }
    function getLocation() { /* ... */ }
    function showPosition(position) { /* ... */ }
    function showError(error) { /* ... */ }

});
