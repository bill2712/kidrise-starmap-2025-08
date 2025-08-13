// mobile_map.js (手機版專用 - 最終完整版)

document.addEventListener("DOMContentLoaded", function() {

    // 前置檢查：如果找不到手機版的星圖容器 (可能是在電腦上瀏覽)，則不執行任何程式碼
    const mobileContainer = document.getElementById('starmap-container-mobile');
    if (!mobileContainer) {
        return;
    }

    // --- 手機版 UI 動態調整 ---
    // 隱藏電腦版專用的 UI 元素，讓手機介面更簡潔
    const artControlGroup = document.getElementById('art-control-group');
    if (artControlGroup) artControlGroup.style.display = 'none';
    
    const guideSection = document.getElementById('guide-section');
    if (guideSection) guideSection.style.display = 'none';

    // 修改標題和說明文字以適應手機版
    const title = document.getElementById('starmap-title');
    if (title) title.textContent = '沉浸式星空圖';
    const intro = document.getElementById('starmap-intro');
    if (intro) intro.textContent = '直接觸控螢幕來探索，或使用下方的控制項。';


    // 守衛 VirtualSky 函式庫是否存在
    if (typeof S === 'undefined' || typeof S.virtualsky === 'undefined') {
        console.error("手機版：核心星圖函式庫 VirtualSky/stuquery 未能成功載入。");
        mobileContainer.innerHTML = "<h1>抱歉，手機版星圖元件載入失敗</h1>";
        return;
    }

    // --- UI 元素定義 ---
    const ui = {
        messageElement: document.getElementById('message-mobile'),
        locationButton: document.getElementById('locationButton'),
        skyviewToggleButton: document.getElementById('skyview-toggle'),
    };

    // --- 狀態變數 ---
    let state = {
        skyviewActive: false
    };
    
    let starmap = null; // 用來存放 VirtualSky 的實例

    // --- 初始化函式 ---
    function init() {
        // 初始化 VirtualSky
        starmap = S.virtualsky({
            id: 'starmap-container-mobile', // 在手機版容器上繪製
            projection: 'stereo',
            constellations: true,
            constellationlabels: true,
            gridlines_az: true,
            gridlines_eq: false,
            lang: 'zh',
            latitude: 22.3, // 預設緯度 (香港)
            longitude: 114.2, // 預設經度 (香港)
            keyboard: false, // 禁用鍵盤控制
            mouse: true // 在手機上允許觸控
        });
        
        // 初始載入時自動獲取位置
        setTimeout(getLocation, 500);

        // 綁定事件監聽
        ui.locationButton.addEventListener('click', getLocation);
        ui.skyviewToggleButton.addEventListener('click', toggleSkyView);
    }
    
    // --- 功能函式 ---

    function showMessage(message, duration = 2000) {
        if (ui.messageElement) {
            ui.messageElement.innerText = message;
            if (duration > 0) {
                setTimeout(() => { ui.messageElement.innerText = ''; }, duration);
            }
        }
    }

    function getLocation() {
        if (navigator.geolocation) {
            showMessage("正在獲取您的位置...", 0);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    if (starmap) {
                        starmap.setLatitude(latitude);
                        starmap.setLongitude(longitude);
                    }
                    showMessage(`已更新為您的位置！`);
                }, 
                (error) => {
                    const errors = { 1: '您已拒絕位置請求。', 2: '無法獲取當前位置。', 3: '獲取位置超時。' };
                    showMessage(errors[error.code] || '獲取位置時發生未知錯誤。');
                }, 
                { timeout: 10000, enableHighAccuracy: true }
            );
        } else { 
            showMessage("您的瀏覽器不支援定位。");
        }
    }

    function toggleSkyView() {
        state.skyviewActive = !state.skyviewActive;
        const button = ui.skyviewToggleButton;
        button.textContent = state.skyviewActive ? '🛑 關閉陀螺儀' : '🔭 開啟陀螺儀';
        button.classList.toggle('active', state.skyviewActive);
        
        if (!starmap) return;

        // 使用 VirtualSky 內建的陀螺儀功能
        starmap.startMove(state.skyviewActive ? 'inertial' : 'default');

        if(state.skyviewActive) {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then(permissionState => {
                    if (permissionState === 'granted') {
                        showMessage("陀螺儀已開啟！請將手機對向天空。");
                    } else {
                        showMessage('方向感測器權限遭拒。');
                        // 還原狀態
                        state.skyviewActive = false;
                        button.textContent = '🔭 開啟陀螺儀';
                        button.classList.remove('active');
                        starmap.startMove('default');
                    }
                }).catch(console.error);
            } else {
                 showMessage("陀螺儀已開啟！請將手機對向天空。");
            }
        } else {
            showMessage("陀螺儀已關閉。");
        }
    }

    // --- 啟動 ---
    init();
});
