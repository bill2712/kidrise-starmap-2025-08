// mobile_map.js - 專為手機設計的全新 WebGL 星圖體驗
document.addEventListener("DOMContentLoaded", function() {

    // --- 手機版 UI 優化 ---
    const artControlGroup = document.getElementById('art-control-group');
    if (artControlGroup) artControlGroup.style.display = 'none';
    const guideSection = document.getElementById('guide-section');
    if (guideSection) guideSection.style.display = 'none';
    const title = document.getElementById('starmap-title');
    if (title) title.textContent = '沉浸式星空圖';
    const intro = document.getElementById('starmap-intro');
    if (intro) intro.textContent = '直接觸控螢幕來探索，或使用下方的控制項。';

    // (所有手機版的功能函式與事件監聽)
});
