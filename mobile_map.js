// mobile_map.js - 專為手機設計的全新 WebGL 星圖體驗

document.addEventListener("DOMContentLoaded", function() {

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
            ui.starmapContainer.innerHTML = "<h1>抱歉，星圖核心元件載入失敗</h1>";
            return;
        }

        // 初始化 VirtualSky
        starmap = S.virtualsky({
            id: 'starmap-container', // 直接在容器上繪製
            projection: 'stereo',
            constellations: true,
            constellationlabels: true,
            gridlines_az: true,
            gridlines_eq: true,
            lang: 'zh', // 嘗試設定為中文
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
        ui.messageElement.innerText = message;
        if (duration > 0) {
            setTimeout(() => { ui.messageElement.innerText = ''; }, duration);
        }
    }

    function getLocation() {
        if (navigator.geolocation) {
            showMessage("正在獲取您的位置...", 0);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // 使用 VirtualSky 的 API 來設定新位置
                    starmap.setLatitude(latitude);
                    starmap.setLongitude(longitude);
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
        skyviewActive = !skyviewActive;
        const button = ui.skyviewToggleButton;
        button.textContent = skyviewActive ? '🛑 關閉陀螺儀' : '🔭 開啟陀螺儀';
        button.classList.toggle('active', skyviewActive);
        
        // 使用 VirtualSky 內建的陀螺儀功能
        starmap.startMove(skyviewActive ? 'inertial' : 'default');

        if(skyviewActive) {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then(permissionState => {
                    if (permissionState === 'granted') {
                        showMessage("陀螺儀已開啟！請將手機對向天空。");
                    } else {
                        showMessage('方向感測器權限遭拒。');
                        // 還原狀態
                        skyviewActive = false;
                        button.textContent = '🔭 開啟陀螺儀';
                        button.classList.remove('active');
                        starmap.startMove('default');
                    }
                });
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
