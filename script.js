document.addEventListener("DOMContentLoaded", function() {

    // --- 元素定義 ---
    const messageElement = document.getElementById('message');
    const locationButton = document.getElementById('locationButton');
    const skyviewToggleButton = document.getElementById('skyview-toggle');
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const clearButton = document.getElementById('clear-button');
    const datalist = document.getElementById('celestial-objects');
    
    // --- 狀態變數 ---
    let isSkyviewActive = false;
    let celestialData = []; // 用於儲存所有可搜尋的天體資料

    // ==========================================
    //  星圖設定 (重大更新)
    // ==========================================
    const celestialConfig = {
        // ... (width, projection, transform, background, datapath 等保持不變) ...
        width: 0, 
        projection: "stereographic",
        transform: "equatorial",
        background: { fill: "#000", stroke: "#000" },
        datapath: "data/",
        interactive: true,
        zoombuttons: false,
        controls: true,
        // ** 新增：指南針與地平線設定 **
        horizon: {
            show: true,      // 顯示地平線
            stroke: "#3a8fb7", // 地平線顏色
            width: 1.5,
            cardinal: true,  // **顯示東南西北方位點**
            cardinalstyle: {
                fill: "#87CEEB", // 方位點顏色
                font: "bold 18px 'Helvetica', Arial, sans-serif", // 加大加粗字體
                offset: 12 // 文字與邊緣的距離
            }
        },
        // ... (stars, planets, constellations, mw 等保持不變) ...
        stars: {
            show: true, limit: 6, colors: true,
            style: { fill: "#ffffff", opacity: 1 },
            names: true, proper: true, namelimit: 2.5,
            namestyle: { fill: "#ddddff", font: "13px 'Helvetica', Arial, sans-serif" }
        },
        planets: {
            show: true, symbolType: "disk"
        },
        constellations: {
            show: true, names: true,
            namestyle: { fill: "#87CEEB", font: "14px 'Lucida Sans Unicode', sans-serif" },
            lines: true,
            linestyle: { stroke: "#3a8fb7", width: 1, opacity: 0.8 }
        },
        mw: {
            show: true,
            style: { fill: "#ffffff", opacity: 0.15 }
        },
        // 回呼函數，在星圖繪製完成後執行
        callback: function(error) {
            if (error) return console.warn(error);
            // 當星圖準備好後，載入天體數據用於搜尋
            loadCelestialDataForSearch();
            // **新功能：頁面載入後自動獲取位置**
            setTimeout(getLocation, 500);
        }
    };

    // --- 初始化星圖 ---
    Celestial.display(celestialConfig);
    
    // --- 事件監聽器 ---
    locationButton.addEventListener('click', getLocation);
    zoomInButton.addEventListener('click', () => zoom(0.8));
    zoomOutButton.addEventListener('click', () => zoom(1.25));
    skyviewToggleButton.addEventListener('click', toggleSkyView);
    searchButton.addEventListener('click', findCelestialObject);
    clearButton.addEventListener('click', clearSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            findCelestialObject();
        }
    });

    // ==========================================
    //  功能函數
    // ==========================================

    // **新功能：載入並處理用於搜尋的數據**
    function loadCelestialDataForSearch() {
        // 使用 Celestial 內建的數據
        celestialData = [];
        // 載入星座
        Celestial.constellations.forEach(function(constellation) {
            celestialData.push({
                name: constellation.name,
                type: 'constellation',
                id: constellation.id
            });
        });
        // 載入恆星
        Celestial.data.stars.features.forEach(function(star) {
            if (star.properties && star.properties.name && star.properties.name.length > 0) {
                 celestialData.push({
                    name: star.properties.name,
                    type: 'star',
                    id: star.id
                });
            }
        });
        // 載入行星 (Celestial 會動態計算，我們手動加入)
        const planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
        planets.forEach(p => celestialData.push({ name: p, type: 'planet' }));

        // 將數據填入 datalist 提供搜尋建議
        let options = '';
        celestialData.forEach(function(item) {
            options += `<option value="${item.name}"></option>`;
        });
        datalist.innerHTML = options;
    }

    // **新功能：尋星**
    function findCelestialObject() {
        const query = searchInput.value.trim();
        if (query === "") return;

        const target = celestialData.find(item => item.name.toLowerCase() === query.toLowerCase());

        if (target) {
            messageElement.innerText = `正在為您標示 ${target.name}...`;
            clearSearch(true); // 清除上一個標記

            const coords = Celestial.search({ type: target.type, name: target.name });
            
            if (coords) {
                // 在地圖上新增一個會閃爍的目標指示器
                Celestial.add({
                    type: "Point",
                    id: "search-target",
                    geometry: { type: "Point", coordinates: [coords.ra, coords.dec] },
                    properties: {
                        "size": 20, // 圓圈大小
                        "style": { "class": "target-indicator" } // 套用我們在 CSS 中定義的閃爍動畫
                    }
                });
                Celestial.redraw(); // 重繪星圖以顯示指示器
                clearButton.classList.remove('hidden');
            } else {
                 messageElement.innerText = `抱歉，找不到 ${target.name} 的座標。`;
            }
        } else {
            messageElement.innerText = `抱歉，資料庫中沒有 "${query}"。`;
        }
        setTimeout(() => { messageElement.innerText = ''; }, 3000);
    }
    
    // **新功能：清除搜尋結果**
    function clearSearch(keepMessage = false) {
        Celestial.remove("search-target"); // 移除目標指示器
        Celestial.redraw();
        searchInput.value = '';
        clearButton.classList.add('hidden');
        if (!keepMessage) {
            messageElement.innerText = '';
        }
    }

    // 縮放功能 (無修改)
    function zoom(factor) { /* ...與之前相同... */ }

    // 陀螺儀模式切換 (無修改)
    function toggleSkyView() { /* ...與之前相同... */ }

    // 處理方向數據 (無修改)
    function orientationHandler(event) { /* ...與之前相同... */ }

    // 獲取地理位置 (無修改)
    function getLocation() { /* ...與之前相同... */ }
    function showPosition(position) { /* ...與之前相同... */ }
    function showError(error) { /* ...與之前相同... */ }
    
    // 星座故事書 Modal (無修改)
    window.showStoryModal = function(title, imageSrc, story) { /* ...與之前相同... */ };
    window.closeStoryModal = function() { /* ...與之前相同... */ };
    window.onclick = function(event) { /* ...與之前相同... */ };
});
