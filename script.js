document.addEventListener('DOMContentLoaded', () => {
    const roomWidthInput = document.getElementById('room-width');
    const roomHeightInput = document.getElementById('room-height');
    const roomCanvas = document.getElementById('room-canvas');

    const furnitureNameInput = document.getElementById('furniture-name');
    const furnitureWidthInput = document.getElementById('furniture-width');
    const furnitureHeightInput = document.getElementById('furniture-height');
    const colorPalette = document.getElementById('color-palette'); // 色選択パレット
    const colorButtons = document.querySelectorAll('.color-button'); // 色選択ボタン
    const addFurnitureButton = document.getElementById('add-furniture');
    const furnitureItemsList = document.getElementById('furniture-items-list');

    // 1m を何 px で表示するかを定義 (例: 1m = 50px で2倍の拡大率)
    const PX_PER_METER = 50;

    let selectedColor = '#FF5733'; // デフォルト色

    let furniture = []; // { id, name, width, height, color, x, y }
    // 初期値はm単位で取得し、内部的にはpxに変換して保持
    let currentRoomWidthM = parseFloat(roomWidthInput.value) || 0;
    let currentRoomHeightM = parseFloat(roomHeightInput.value) || 0;
    let currentRoomWidthPx = currentRoomWidthM * PX_PER_METER;
    let currentRoomHeightPx = currentRoomHeightM * PX_PER_METER;


    // 部屋のサイズを適用する関数
    const applyRoomSize = () => {
        currentRoomWidthM = parseFloat(roomWidthInput.value) || 0;
        currentRoomHeightM = parseFloat(roomHeightInput.value) || 0;

        if (currentRoomWidthM > 0 && currentRoomHeightM > 0) {
            currentRoomWidthPx = currentRoomWidthM * PX_PER_METER;
            currentRoomHeightPx = currentRoomHeightM * PX_PER_METER;
            
            roomCanvas.style.width = `${currentRoomWidthPx}px`;
            roomCanvas.style.height = `${currentRoomHeightPx}px`;
            renderFurniture();
        }
    };

    // 家具を描画する関数
    const renderFurniture = () => {
        roomCanvas.innerHTML = ''; // キャンバスをクリア
        furnitureItemsList.innerHTML = ''; // リストをクリア

        furniture.forEach((item) => {
            // レイアウト図に家具を描画 (m単位の値をpxに変換して適用)
            const furnitureDiv = document.createElement('div');
            furnitureDiv.classList.add('furniture-item');
            let currentDisplayWidthPx = item.width * PX_PER_METER;
            let currentDisplayHeightPx = item.height * PX_PER_METER;

            let finalX_px = item.x * PX_PER_METER;
            let finalY_px = item.y * PX_PER_METER;

            // 部屋の境界内で移動を制限 (オフセット適用後の座標を使用)
            finalX_px = Math.max(0, Math.min(finalX_px, currentRoomWidthPx - currentDisplayWidthPx));
            finalY_px = Math.max(0, Math.min(finalY_px, currentRoomHeightPx - currentDisplayHeightPx));

            furnitureDiv.style.width = `${currentDisplayWidthPx}px`;
            furnitureDiv.style.height = `${currentDisplayHeightPx}px`;
            furnitureDiv.style.backgroundColor = item.color;
            furnitureDiv.style.left = `${finalX_px}px`;
            furnitureDiv.style.top = `${finalY_px}px`;
            // テキスト用のspan要素を作成し、家具名を設定
            const furnitureTextSpan = document.createElement('span');
            furnitureTextSpan.classList.add('furniture-text'); // 新しいクラスを追加
            furnitureTextSpan.textContent = item.name;
            furnitureDiv.appendChild(furnitureTextSpan);

            furnitureDiv.dataset.id = item.id;
            roomCanvas.appendChild(furnitureDiv);

            // ドラッグ機能を実装
            let isDragging = false;
            let currentFurniture = null;
            let initialX; // マウスの初期X座標
            let initialY; // マウスの初期Y座標
            let xOffset; // 家具内のクリック位置と家具の左端の差
            let yOffset; // 家具内のクリック位置と家具の上端の差

            furnitureDiv.addEventListener('mousedown', (e) => {
                isDragging = true;
                currentFurniture = item;
                
                // クリックされた座標と家具の左上からのオフセットを計算
                // e.clientX, e.clientY はビューポート基準の座標
                // furnitureDiv.getBoundingClientRect() はビューポート基準の家具の位置情報
                const rect = furnitureDiv.getBoundingClientRect();
                xOffset = e.clientX - rect.left;
                yOffset = e.clientY - rect.top;

                initialX = e.clientX;
                initialY = e.clientY;

                // ドラッグ中のスタイルを適用 (オプション)
                furnitureDiv.style.cursor = 'grabbing';
                furnitureDiv.style.zIndex = 1000; // 最前面に表示
            });

            roomCanvas.addEventListener('mousemove', (e) => {
                if (!isDragging || !currentFurniture) return;

                e.preventDefault(); // テキスト選択などを防ぐ

                // 新しい位置を計算 (PX単位)
                let newX_px = e.clientX - roomCanvas.getBoundingClientRect().left - xOffset;
                let newY_px = e.clientY - roomCanvas.getBoundingClientRect().top - yOffset;

                // 部屋の境界内で移動を制限
                const furnitureWidthPx = currentFurniture.width * PX_PER_METER;
                const furnitureHeightPx = currentFurniture.height * PX_PER_METER;

                newX_px = Math.max(0, Math.min(newX_px, currentRoomWidthPx - furnitureWidthPx));
                newY_px = Math.max(0, Math.min(newY_px, currentRoomHeightPx - furnitureHeightPx));

                furnitureDiv.style.left = `${newX_px}px`;
                furnitureDiv.style.top = `${newY_px}px`;
            });

            roomCanvas.addEventListener('mouseup', () => {
                if (isDragging && currentFurniture) {
                    isDragging = false;
                    furnitureDiv.style.cursor = 'grab';
                    furnitureDiv.style.zIndex = ''; // z-indexをリセット

                    // ドロップされた家具の最終位置をメートル単位で計算し、更新
                    const finalX_px = parseFloat(furnitureDiv.style.left);
                    const finalY_px = parseFloat(furnitureDiv.style.top);

                    const updatedX_m = finalX_px / PX_PER_METER;
                    const updatedY_m = finalY_px / PX_PER_METER;

                    // furniture配列内のオブジェクトを更新
                    const index = furniture.findIndex(f => f.id === currentFurniture.id);
                    if (index !== -1) {
                        furniture[index].x = updatedX_m;
                        furniture[index].y = updatedY_m;
                    }
                    currentFurniture = null;
                    renderFurniture(); // UIを更新して、リストの座標も反映させる
                }
            });


            // 家具リストに項目を追加 (m単位で表示)
            const listItem = document.createElement('li');
            listItem.style.color = item.color; // リストアイテムに家具の色を適用
            listItem.innerHTML = `
                <strong>${item.name}</strong> ${item.width.toFixed(1)}x${item.height.toFixed(1)}m
                <button data-id="${item.id}">削除</button>
            `;
            furnitureItemsList.appendChild(listItem);
        });
    };

    // 家具追加ボタンのクリックイベント
    addFurnitureButton.addEventListener('click', () => {
        const name = furnitureNameInput.value.trim();
        // 入力はm単位なので、parseFloatを使用
        const width = parseFloat(furnitureWidthInput.value) || 0;
        const height = parseFloat(furnitureHeightInput.value) || 0;
        // X, Y座標はドラッグで設定されるため、初期値は不要
        const x = 0;
        const y = 0;

            if (name && width > 0 && height > 0) {
                const newFurniture = {
                    id: Date.now(),
                    name,
                    width,
                    height,
                    color: selectedColor, // 選択された色を使用
                    x,
                    y,
                };
                furniture.push(newFurniture);
                renderFurniture();
                // フォームをリセット
                furnitureNameInput.value = '机';
                furnitureWidthInput.value = '2';
                furnitureHeightInput.value = '1';
                // 色はリセットしない（最後に選択された色を維持）
            } else {
                alert('家具の名前、幅、高さを正しく入力してください。');
            }
        });

    // 色選択ボタンのイベントリスナー
    colorButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 現在選択されているボタンのselectedクラスを削除
            colorButtons.forEach(btn => btn.classList.remove('selected'));
            // クリックされたボタンにselectedクラスを追加
            button.classList.add('selected');
            selectedColor = button.dataset.color; // 選択された色を更新
        });
    });

    // 初期選択色を設定
    const initialColorButton = document.querySelector(`.color-button[data-color="${selectedColor}"]`);
    if (initialColorButton) {
        initialColorButton.classList.add('selected');
    }

    // 部屋のサイズ入力フィールドの変更イベント (即時反映)
    roomWidthInput.addEventListener('input', applyRoomSize);
    roomHeightInput.addEventListener('input', applyRoomSize);

    // 家具リストからの削除イベント
    furnitureItemsList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const idToRemove = parseInt(e.target.dataset.id, 10);
            furniture = furniture.filter(item => item.id !== idToRemove);
            renderFurniture();
        }
    });

    // 初期表示
    applyRoomSize();
    renderFurniture();
});
