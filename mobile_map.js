// mobile_map.js - 專為手機設計的全新 WebGL 星圖體驗

document.addEventListener("DOMContentLoaded", function() {
    
    // --- 手機版 UI 優化 ---
    // 隱藏電腦版專用的 UI 元素
    const artControlGroup = document.getElementById('art-control-group');
    if (artControlGroup) artControlGroup.style.display = 'none';
    
    const guideSection = document.getElementById('guide-section');
    if (guideSection) guideSection.style.display = 'none';

    // 修改標題和說明文字以適應手機版
    const title = document.getElementById('starmap-title');
    if (title) title.textContent = '沉浸式星空圖';
    const intro = document.getElementById('starmap-intro');
    if (intro) intro.textContent = '直接觸控螢幕來探索，或使用下方的控制項。';


    // --- UI 元素定義 ---
    const ui = {
        starmapContainer: document.getElementById('starmap-container'),
        messageElement: document.getElementById('message'),
        locationButton: document.getElementById('locationButton'),
        skyviewToggleButton: document.getElementById('skyview-toggle'),
    };

    // --- 狀態變數 ---
    let skyviewActive = false;
    let starmap = null; // 用來存放 VirtualSky 的實例

    // --- 初始化函式 ---
    function init() {
        if (typeof S === 'undefined' || typeof S.virtualsky === 'undefined') {
            console.error("核心星圖函式庫 VirtualSky 未能成功載入。");
            ui.starmapContainer.innerHTML = "<h1>抱歉，手機版星圖元件載入失敗</h1>";
            return;
        }

        // 初始化 VirtualSky
        starmap = S.virtualsky({
            id: 'starmap-container',
            projection: 'stereo',
            constellations: true,
            constellationlabels: true,
            gridlines_az: true,
            gridlines_eq: false, // 預設關閉赤經赤緯線，介面更乾淨
            lang: 'zh',
            latitude: 22.3, longitude: 114.2, // 預設香港
            keyboard: false,
            mouse: true 
        });
        
        setTimeout(getLocation, 500);

        ui.locationButton.addEventListener('click', getLocation);
        ui.skyviewToggleButton.addEventListener('click', toggleSkyView);
    }
    
    // --- 功能函式 ---
    function showMessage(message, duration = 2000) { /* ... */ }
    function getLocation() { /* ... */ }
    function toggleSkyView() { /* ... */ }
    
    // 為了簡潔，此處省略了與上一版 mobile_map.js 相同的函式內部程式碼
    // 請從上一則回覆中，將 showMessage, getLocation, toggleSkyView 的完整程式碼貼入此處

    // --- 啟動 ---
    init();
});
