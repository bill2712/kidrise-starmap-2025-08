// mobile_map.js (手機版 - 修正 UI 元素對應)
document.addEventListener("DOMContentLoaded", function() {

    const mobileContainer = document.getElementById('starmap-container-mobile');
    if (!mobileContainer || window.getComputedStyle(mobileContainer).display === 'none') {
        return;
    }
    
    const artControlGroup = document.getElementById('art-control-group');
    if (artControlGroup) artControlGroup.style.display = 'none';
    const guideSection = document.getElementById('guide-section');
    if (guideSection) guideSection.style.display = 'none';
    const title = document.getElementById('starmap-title');
    if (title) title.textContent = '沉浸式星空圖';
    const intro = document.getElementById('starmap-intro');
    if (intro) intro.textContent = '直接觸控螢幕來探索，或使用下方的控制項。';

    if (typeof S === 'undefined' || typeof S.virtualsky === 'undefined') {
        console.error("手機版：核心星圖函式庫 VirtualSky/stuquery 未能成功載入。");
        mobileContainer.innerHTML = "<h1>抱歉，手機版星圖元件載入失敗</h1>";
        return;
    }
    
    const ui = {
        messageElement: document.getElementById('message-mobile'),
        locationButton: document.getElementById('locationButton'),
        skyviewToggleButton: document.getElementById('skyview-toggle'),
    };

    let state = { skyviewActive: false };
    let starmap = null;

    function init() {
        starmap = S.virtualsky({
            id: 'starmap-container-mobile',
            projection: 'stereo',
            constellations: true,
            constellationlabels: true,
            gridlines_az: true,
            lang: 'zh',
            latitude: 22.3, longitude: 114.2,
            keyboard: false,
            mouse: true 
        });
        setTimeout(getLocation, 500);
        ui.locationButton.addEventListener('click', getLocation);
        ui.skyviewToggleButton.addEventListener('click', toggleSkyView);
    }
    
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

        starmap.startMove(state.skyviewActive ? 'inertial' : 'default');

        if(state.skyviewActive) {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then(permissionState => {
                    if (permissionState === 'granted') {
                        showMessage("陀螺儀已開啟！請將手機對向天空。");
                    } else {
                        showMessage('方向感測器權限遭拒。');
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

    init();
});
