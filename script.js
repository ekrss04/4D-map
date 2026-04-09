window.onload = function () {
    // --- Cesium токен ---
    Cesium.Ion.defaultAccessToken = "YOUR_TOKEN_HERE";

    // --- Viewer ---
    const viewer = new Cesium.Viewer("cesiumContainer", {
        baseLayerPicker: false,
        timeline: true,
        animation: false,
        geocoder: true,
        homeButton: true,
        navigationHelpButton: false,
        sceneModePicker: true,
        fullscreenButton: true,
        terrainProvider: new Cesium.EllipsoidTerrainProvider()
    });

    // ========== ЗАГРУЗКА РЕЛЬЕФА ==========
    const reliefTilesUrl = 'https://raw.githubusercontent.com/ekrss04/Data-/main/RELEF/{z}/{x}/{y}.png';
    
    const reliefProvider = new Cesium.UrlTemplateImageryProvider({
        url: reliefTilesUrl,
        minimumLevel: 4,
        maximumLevel: 16,
        credit: 'Рельеф: данные QGIS'
    });
    
    let reliefLayer = null;
    console.log("Рельеф подготовлен");
    // ========== КОНЕЦ БЛОКА РЕЛЬЕФА ==========

    // Скрываем стандартные кнопки
    viewer.homeButton.container.style.display = 'none';
    viewer.sceneModePicker.container.style.display = 'none';
    viewer.geocoder.container.style.display = 'none';
    if (viewer.animation) {
        viewer.animation.container.style.display = "none";
    }

    // --- Настройка анимация ---
    viewer.clock.shouldAnimate = false;
    viewer.clock.multiplier = 1;

    // --- Удаляем стандартные слои ---
    viewer.imageryLayers.removeAll();

    // --- Цвета для слоев карты ---
    const waterColor = Cesium.Color.fromCssColorString('#ace7f2'); // Цвет линейной гидрографии
    const waterAreaColor = Cesium.Color.fromCssColorString('#ace7f2').withAlpha(1); // Площадная гидрография - непрозрачная
    const forestColor = Cesium.Color.fromCssColorString('#77d496').withAlpha(0.3); // Леса - темнее и прозрачнее (30% непрозрачности)
    const parkColor = Cesium.Color.fromCssColorString('#86c882').withAlpha(0.5); // Парки, скверы

    // Цвета для дорог по классам
    const roadMainBaseColor = Cesium.Color.fromCssColorString('#b0b0b0');
    const roadMainTopColor = Cesium.Color.fromCssColorString('#c4b0a4');
    const roadSecondaryColor = Cesium.Color.fromCssColorString('#b0b0b0');
    const roadLocalColor = Cesium.Color.fromCssColorString('#b0b0b0');

    // Цвета для зданий
    const buildingResidentialColor = Cesium.Color.fromCssColorString('#8dabc2').withAlpha(0.9);
    const buildingPublicColor = Cesium.Color.fromCssColorString('#ab96a5').withAlpha(0.9);
    const buildingIndustrialColor = Cesium.Color.fromCssColorString('#909090').withAlpha(0.9);
    const buildingOtherColor = Cesium.Color.fromCssColorString('#C0C0C0').withAlpha(0.9);

    const borderStrokeColor = Cesium.Color.fromCssColorString('#b3526c');

    const layerVisibility = {
        рельеф: true,
        гидрография: true,
        растительность: true,
        дороги: true,
        здания: true,
        достопримечательности: true,
        границаЛиния: true
    };

    let buildingsDataSource = null;

    function updateReliefVisibility() {
        if (reliefLayer) {
            reliefLayer.show = (currentLayerIndex === 0) && layerVisibility.рельеф;
        }
    }

    function createTooltip(name, screenPosition) {
        const oldTooltip = document.getElementById('dynamicTooltip');
        if (oldTooltip) {
            document.body.removeChild(oldTooltip);
        }

        const tooltip = document.createElement('div');
        tooltip.id = 'dynamicTooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: transparent;
            color: black;
            padding: 6px 12px;
            border-radius: 3px;
            font-family: 'Noah', Arial, sans-serif;
            font-size: 14px;
            font-weight: 600;
            text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
            pointer-events: none;
            z-index: 3000;
            white-space: nowrap;
        `;
        tooltip.textContent = name;
        document.body.appendChild(tooltip);
        tooltip.style.left = (screenPosition.x + 15) + 'px';
        tooltip.style.top = (screenPosition.y - 25) + 'px';

        setTimeout(() => {
            if (tooltip && tooltip.parentNode) {
                document.body.removeChild(tooltip);
            }
        }, 2000);
    }

    function createPolygonTooltip(name, screenPosition) {
        const oldTooltip = document.getElementById('polygonTooltip');
        if (oldTooltip) {
            document.body.removeChild(oldTooltip);
        }

        const tooltip = document.createElement('div');
        tooltip.id = 'polygonTooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: transparent;
            color: black;
            padding: 6px 12px;
            border-radius: 3px;
            font-family: 'Noah', Arial, sans-serif;
            font-size: 14px;
            font-weight: 600;
            text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
            pointer-events: none;
            z-index: 3000;
            white-space: nowrap;
            transform: translate(-50%, -50%);
        `;
        tooltip.textContent = name;
        document.body.appendChild(tooltip);
        tooltip.style.left = screenPosition.x + 'px';
        tooltip.style.top = screenPosition.y + 'px';

        setTimeout(() => {
            if (tooltip && tooltip.parentNode) {
                document.body.removeChild(tooltip);
            }
        }, 2000);
    }

    function updateLayerVisibility() {
        updateReliefVisibility();
        
        const dataSources = viewer.dataSources;
        for (let i = 0; i < dataSources.length; i++) {
            const ds = dataSources.get(i);
            if (ds.name === 'Гидрография линейная' || ds.name === 'Гидрография площадная') {
                ds.show = layerVisibility.гидрография;
            } else if (ds.name === 'Леса') {
                ds.show = layerVisibility.растительность;
            } else if (ds.name === 'Парки и скверы') {
                ds.show = layerVisibility.растительность;
            } else if (ds.name === 'Дороги') {
                ds.show = layerVisibility.дороги;
            } else if (ds.name === 'Buildings') {
                ds.show = layerVisibility.здания;
            } else if (ds.name === 'Граница (линия)') {
                ds.show = layerVisibility.границаЛиния;
            }
        }

        const entities = viewer.entities.values;
        entities.forEach(entity => {
            if (entity.model && entity.name) {
                entity.show = layerVisibility.достопримечательности;
            }
        });
    }

    function clearMapLayers() {
        const dataSources = viewer.dataSources;
        for (let i = dataSources.length - 1; i >= 0; i--) {
            const ds = dataSources.get(i);
            if (ds.name && (ds.name.includes('Леса') || ds.name.includes('Парки') || ds.name.includes('Гидрография') || ds.name.includes('Дороги') || ds.name.includes('Граница'))) {
                dataSources.remove(ds);
            }
        }
    }

    function loadMapFoundation() {
        clearMapLayers();

        // --- ПЛОЩАДНАЯ ГИДРОГРАФИЯ (поверх линейной, непрозрачная) ---
        Cesium.GeoJsonDataSource.load(
            'https://raw.githubusercontent.com/ekrss04/Data-/main/Gidrigraf.geojson',
            {
                stroke: waterAreaColor,
                fill: waterAreaColor,
                strokeWidth: 1,
                clampToGround: true
            }
        ).then(dataSource => {
            dataSource.name = 'Гидрография площадная';
            dataSource.show = layerVisibility.гидрография;
            
            const entities = dataSource.entities.values;
            entities.forEach(entity => {
                if (entity.polygon) {
                    entity.polygon.material = waterAreaColor;
                    entity.properties = undefined;
                }
            });
            
            viewer.dataSources.add(dataSource);
            console.log("Площадная гидрография загружена");
        }).catch(() => console.log("Файл площадной гидрографии не найден"));

        // --- ЛИНЕЙНАЯ ГИДРОГРАФИЯ ---
        Cesium.GeoJsonDataSource.load(
            'https://raw.githubusercontent.com/ekrss04/Data-/main/Gidrigraf_2.geojson',
            {
                stroke: waterColor,
                strokeWidth: 3,
                clampToGround: true
            }
        ).then(dataSource => {
            dataSource.name = 'Гидрография линейная';
            dataSource.show = layerVisibility.гидрография;

            const entities = dataSource.entities.values;
            entities.forEach(entity => {
                if (entity.polyline) {
                    entity.polyline.material = waterColor;
                    entity.polyline.width = 3;
                    if (entity.properties) {
                        const props = entity.properties.getValue(Cesium.JulianDate.now());
                        const name = props['Название'] || props['name'] || '';
                        entity._name = name;
                        entity.properties = undefined;
                    }
                }
            });
            viewer.dataSources.add(dataSource);
        }).catch(() => {});

        // --- Леса ---
        Cesium.GeoJsonDataSource.load(
            'https://raw.githubusercontent.com/ekrss04/Data-/main/Rastitelnost.geojson',
            {
                stroke: forestColor,
                fill: forestColor,
                strokeWidth: 1,
                clampToGround: true
            }
        ).then(dataSource => {
            dataSource.name = 'Леса';
            dataSource.show = layerVisibility.растительность;
            
            const entities = dataSource.entities.values;
            entities.forEach(entity => {
                if (entity.polygon) {
                    entity.polygon.material = forestColor;
                    entity.properties = undefined;
                }
            });
            viewer.dataSources.add(dataSource);
        }).catch(() => {});

        // --- Парки и скверы ---
        Cesium.GeoJsonDataSource.load(
            'https://raw.githubusercontent.com/ekrss04/Data-/main/Park.geojson',
            {
                stroke: parkColor,
                fill: parkColor,
                strokeWidth: 1,
                clampToGround: true
            }
        ).then(dataSource => {
            dataSource.name = 'Парки и скверы';
            dataSource.show = layerVisibility.растительность;
            
            const entities = dataSource.entities.values;
            entities.forEach(entity => {
                if (entity.polygon) {
                    entity.polygon.material = parkColor;
                    if (entity.properties) {
                        const props = entity.properties.getValue(Cesium.JulianDate.now());
                        const name = props['Название'] || props['name'] || 'Парк';
                        entity._name = name;
                        entity.properties = undefined;
                    }
                }
            });
            viewer.dataSources.add(dataSource);
        }).catch(() => {});

        // --- ДОРОГИ (CORRIDOR) ---
        Cesium.GeoJsonDataSource.load(
            'https://raw.githubusercontent.com/ekrss04/Data-/main/Dorogi.geojson',
            {
                clampToGround: true
            }
        ).then(dataSource => {
            dataSource.name = 'Дороги';
            dataSource.show = layerVisibility.дороги;

            const newEntities = [];

            dataSource.entities.values.forEach(entity => {
                if (entity.polyline && entity.properties) {
                    const props = entity.properties.getValue(Cesium.JulianDate.now());
                    const roadClass = props['Класс'] || props['класс'] || props['CLASS'] || '';
                    const positions = entity.polyline.positions.getValue(Cesium.JulianDate.now());
                    
                    const roadName = props['name'] || props['Name'] || '';
                    const classStr = String(roadClass).trim();

                    if (positions) {
                        if (classStr === '1' || classStr === 'Главные' || classStr === 'главные') {
                            newEntities.push({
                                corridor: {
                                    positions: positions,
                                    width: 12,
                                    material: roadMainBaseColor,
                                    height: 0,
                                    extrudedHeight: 0.2,
                                    cornerType: Cesium.CornerType.ROUNDED
                                },
                                _name: roadName
                            });
                            newEntities.push({
                                corridor: {
                                    positions: positions,
                                    width: 8,
                                    material: roadMainTopColor,
                                    height: 0.2,
                                    extrudedHeight: 0.4,
                                    cornerType: Cesium.CornerType.ROUNDED
                                },
                                _name: roadName
                            });
                        } 
                        else if (classStr === '2' || classStr === 'Прочие' || classStr === 'прочие') {
                            newEntities.push({
                                corridor: {
                                    positions: positions,
                                    width: 8,
                                    material: roadSecondaryColor,
                                    height: 0,
                                    extrudedHeight: 0.2,
                                    cornerType: Cesium.CornerType.ROUNDED
                                },
                                _name: roadName
                            });
                        } 
                        else {
                            newEntities.push({
                                corridor: {
                                    positions: positions,
                                    width: 5,
                                    material: roadLocalColor,
                                    height: 0,
                                    extrudedHeight: 0.1,
                                    cornerType: Cesium.CornerType.ROUNDED
                                },
                                _name: roadName
                            });
                        }
                    }
                }
            });

            dataSource.entities.removeAll();
            newEntities.forEach(entityData => {
                const entity = dataSource.entities.add(entityData);
                if (entityData._name) entity._name = entityData._name;
            });

            viewer.dataSources.add(dataSource);
        }).catch(() => {});

        // --- ГРАНИЦА ---
        Cesium.GeoJsonDataSource.load(
            'https://raw.githubusercontent.com/ekrss04/Data-/main/Gran.geojson',
            {
                stroke: borderStrokeColor,
                strokeWidth: 4,
                fill: Cesium.Color.fromCssColorString('rgba(255,255,255,0)'),
                clampToGround: true,
                markerSize: 0
            }
        ).then(dataSource => {
            dataSource.name = 'Граница (линия)';
            dataSource.show = layerVisibility.границаЛиния;
            
            const entities = dataSource.entities.values;
            entities.forEach(entity => {
                if (entity.polyline) {
                    entity.properties = undefined;
                }
            });
            viewer.dataSources.add(dataSource);
        }).catch(() => {});
    }

    // --- КАРТОГРАФИЧЕСКИЕ ОСНОВЫ ---
    const positronProvider = new Cesium.UrlTemplateImageryProvider({
        url: "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
    });
    const googleSatelliteProvider = new Cesium.UrlTemplateImageryProvider({
        url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    });

    const layers = [
        { name: "Картографическая основа", provider: positronProvider, onSelect: loadMapFoundation, hasRelief: true },
        { name: "Positron", provider: positronProvider, onSelect: function() {}, hasRelief: false },
        { name: "OSM", provider: new Cesium.OpenStreetMapImageryProvider({ url: "https://a.tile.openstreetmap.org/" }), onSelect: function() {}, hasRelief: false },
        { name: "Dark Matter", provider: new Cesium.UrlTemplateImageryProvider({ url: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" }), onSelect: function() {}, hasRelief: false },
        { name: "Google Спутник", provider: googleSatelliteProvider, onSelect: function() {}, hasRelief: false }
    ];

    let currentLayerIndex = 0;
    
    viewer.imageryLayers.addImageryProvider(layers[currentLayerIndex].provider);
    
    reliefLayer = viewer.imageryLayers.addImageryProvider(reliefProvider);
    reliefLayer.alpha = 0.5;
    
    loadMapFoundation();

    // --- МАСШТАБНАЯ ЛИНЕЙКА ---
    const scaleContainer = document.createElement('div');
    scaleContainer.style.cssText = `
        position: absolute;
        bottom: 130px;
        right: 20px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        z-index: 1002;
        font-family: 'Noah', Arial, sans-serif;
        pointer-events: none;
    `;

    const scaleBar = document.createElement('div');
    scaleBar.style.cssText = `
        width: 140px;
        height: 1.5px;
        background: #4a4a4a;
        position: relative;
        margin-bottom: 5px;
        border-left: 1.5px solid #4a4a4a;
        border-right: 1.5px solid #4a4a4a;
        box-shadow: 0 0 2px rgba(255,255,255,0.3);
    `;

    const scaleMarkers = document.createElement('div');
    scaleMarkers.style.cssText = `
        width: 140px;
        display: flex;
        justify-content: space-between;
        color: #4a4a4a;
        font-size: 10px;
        text-shadow: 0 0 2px rgba(255,255,255,0.5);
        margin-top: 2px;
    `;
    scaleMarkers.innerHTML = '<span>0</span><span></span><span id="scaleEnd">140 м</span>';

    scaleContainer.appendChild(scaleBar);
    scaleContainer.appendChild(scaleMarkers);
    document.body.appendChild(scaleContainer);

    function updateScale() {
        if (!viewer.scene) return;
        const canvas = viewer.scene.canvas;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const left = viewer.camera.getPickRay(new Cesium.Cartesian2(0, height / 2));
        const right = viewer.camera.getPickRay(new Cesium.Cartesian2(width, height / 2));

        if (!left || !right) return;

        const leftCartesian = viewer.scene.globe.pick(left, viewer.scene);
        const rightCartesian = viewer.scene.globe.pick(right, viewer.scene);

        if (!leftCartesian || !rightCartesian) return;

        const distance = Cesium.Cartesian3.distance(leftCartesian, rightCartesian);
        const barLength = 140;
        const barDistance = (distance / width) * barLength;

        let barText;
        if (barDistance < 1000) {
            barText = Math.round(barDistance / 10) * 10 + ' м';
        } else if (barDistance < 10000) {
            barText = (barDistance / 1000).toFixed(1) + ' км';
        } else {
            barText = Math.round(barDistance / 1000) + ' км';
        }

        scaleMarkers.querySelector('#scaleEnd').textContent = barText;
    }

    viewer.camera.changed.addEventListener(updateScale);
    setTimeout(updateScale, 1000);

    // --- ЛЕГЕНДА (очищена от лишних комментариев) ---
    const legendBtn = document.createElement('div');
    legendBtn.id = 'btnLegend';
    legendBtn.className = 'ui-btn';
    legendBtn.style.backgroundImage = 'url("https://raw.githubusercontent.com/ekrss04/Data-/main/visual/icons_1/legend.svg")';
    document.getElementById('ui').appendChild(legendBtn);

    const legendPopup = document.createElement('div');
    legendPopup.id = 'legendPopup';
    legendPopup.style.cssText = `
        position: absolute;
        top: 60px;
        right: 10px;
        background: white;
        color: #333;
        border-radius: 8px;
        padding: 20px;
        z-index: 1002;
        font-family: 'Noah', Arial, sans-serif;
        font-size: 12px;
        border: 1px solid #ddd;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        min-width: 320px;
        max-height: 80vh;
        overflow-y: auto;
        display: none;
    `;

    function updateLegendButtons() {
        legendPopup.innerHTML = `
            <span class="popup-close" style="position: absolute; top: 8px; right: 10px; font-size: 22px; cursor: pointer; color: #666;">&times;</span>
            <h4 style="margin: 0 0 18px 0; text-align: center; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; font-size: 18px; letter-spacing: 1px;">УСЛОВНЫЕ ОБОЗНАЧЕНИЯ</h4>

            <!-- РЕЛЬЕФ -->
            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">РЕЛЬЕФ</div>
                    <button class="toggle-layer" data-layer="рельеф" style="background: ${layerVisibility.рельеф ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.рельеф ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; padding-left: 12px;">
                    <div style="width: 30px; height: 20px; background: linear-gradient(135deg, #8B7355 0%, #D2B48C 50%, #F5DEB3 100%); margin-right: 10px; border-radius: 3px; border: 1px solid #888;"></div>
                    <span>Отмывка рельефа</span>
                </div>
            </div>

            <!-- ГИДРОГРАФИЯ -->
            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">ГИДРОГРАФИЯ</div>
                    <button class="toggle-layer" data-layer="гидрография" style="background: ${layerVisibility.гидрография ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.гидрография ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; padding-left: 12px;">
                    <div style="width: 30px; height: 4px; background: #ace7f2; margin-right: 10px; border-radius: 2px;"></div>
                    <span>Линейная гидрография</span>
                </div>
                <div style="display: flex; align-items: center; padding-left: 12px; margin-top: 6px;">
                    <div style="width: 30px; height: 20px; background: #ace7f2; margin-right: 10px; border-radius: 3px; border: 1px solid #5a9aa0;"></div>
                    <span>Площадная гидрография</span>
                </div>
            </div>

            <!-- ДОРОЖНАЯ СЕТЬ -->
            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">ДОРОЖНАЯ СЕТЬ</div>
                    <button class="toggle-layer" data-layer="дороги" style="background: ${layerVisibility.дороги ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.дороги ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 6px; padding-left: 12px;">
                    <div style="width: 30px; height: 8px; background: #6a6a6a; margin-right: 10px; border-radius: 2px; position: relative;">
                        <div style="position: absolute; top: 2px; left: 2px; width: 26px; height: 4px; background: #c4b0a4; border-radius: 1px;"></div>
                    </div>
                    <span>Главные дороги</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 6px; padding-left: 12px;">
                    <div style="width: 30px; height: 6px; background: #8a8a8a; margin-right: 10px; border-radius: 2px;"></div>
                    <span>Прочие дороги</span>
                </div>
                <div style="display: flex; align-items: center; padding-left: 12px;">
                    <div style="width: 30px; height: 4px; background: #b0b0b0; margin-right: 10px; border-radius: 2px;"></div>
                    <span>Проезды</span>
                </div>
            </div>

            <!-- РАСТИТЕЛЬНОСТЬ -->
            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">РАСТИТЕЛЬНОСТЬ</div>
                    <button class="toggle-layer" data-layer="растительность" style="background: ${layerVisibility.растительность ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.растительность ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 6px; padding-left: 12px;">
                    <div style="width: 20px; height: 20px; background: #77d496; margin-right: 10px; border-radius: 3px; border: 1px solid #5a9a60; opacity: 0.8;"></div>
                    <span>Леса</span>
                </div>
                <div style="display: flex; align-items: center; padding-left: 12px;">
                    <div style="width: 20px; height: 20px; background: #86c882; margin-right: 10px; border-radius: 3px; border: 1px solid #5a9a60; opacity: 0.8;"></div>
                    <span>Парки, скверы</span>
                </div>
            </div>

            <!-- ЗДАНИЯ -->
            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">ЗДАНИЯ</div>
                    <button class="toggle-layer" data-layer="здания" style="background: ${layerVisibility.здания ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.здания ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 6px; padding-left: 12px;">
                    <div style="width: 20px; height: 20px; background: #8dabc2; margin-right: 10px; border-radius: 3px; border: 1px solid #888; opacity: 0.9;"></div>
                    <span>Жилые</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 6px; padding-left: 12px;">
                    <div style="width: 20px; height: 20px; background: #ab96a5; margin-right: 10px; border-radius: 3px; border: 1px solid #888; opacity: 0.9;"></div>
                    <span>Общественные</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 6px; padding-left: 12px;">
                    <div style="width: 20px; height: 20px; background: #909090; margin-right: 10px; border-radius: 3px; border: 1px solid #888; opacity: 0.9;"></div>
                    <span>Сооружения</span>
                </div>
                <div style="display: flex; align-items: center; padding-left: 12px;">
                    <div style="width: 20px; height: 20px; background: #C0C0C0; margin-right: 10px; border-radius: 3px; border: 1px solid #888; opacity: 0.9;"></div>
                    <span>Прочее</span>
                </div>
            </div>

            <!-- ГРАНИЦА -->
            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">ГРАНИЦА</div>
                    <button class="toggle-layer" data-layer="границаЛиния" style="background: ${layerVisibility.границаЛиния ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.границаЛиния ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; padding-left: 12px;">
                    <div style="width: 30px; height: 4px; background: #b3526c; margin-right: 10px; border-radius: 2px;"></div>
                    <span>Граница Горно-Алтайска</span>
                </div>
            </div>

            <!-- 3D МОДЕЛИ -->
            <div style="margin-bottom: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">3D МОДЕЛИ</div>
                    <button class="toggle-layer" data-layer="достопримечательности" style="background: ${layerVisibility.достопримечательности ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.достопримечательности ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; padding-left: 12px;">
                    <div style="width: 20px; height: 20px; background: #d4a373; margin-right: 10px; border-radius: 3px; border: 1px solid #a07453;"></div>
                    <span>Исторические здания</span>
                </div>
            </div>
        `;

        legendPopup.querySelectorAll('.toggle-layer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const layer = btn.dataset.layer;
                layerVisibility[layer] = !layerVisibility[layer];
                updateLayerVisibility();
                updateLegendButtons();
            });
        });

        legendPopup.querySelector('.popup-close').onclick = () => {
            legendPopup.style.display = 'none';
        };
    }

    document.body.appendChild(legendPopup);
    updateLegendButtons();

    legendBtn.onclick = (e) => {
        e.stopPropagation();
        if (layers[currentLayerIndex].name === "Картографическая основа") {
            if (legendPopup.style.display === 'none' || legendPopup.style.display === '') {
                legendPopup.style.display = 'block';
                updateLegendButtons();
            } else {
                legendPopup.style.display = 'none';
            }
        } else {
            alert('Легенда доступна только для картографической основы');
        }
    };

    document.addEventListener('click', (e) => {
        if (!legendPopup.contains(e.target) && e.target !== legendBtn) {
            legendPopup.style.display = 'none';
        }
    });

    // --- Меню слоев ---
    const layersMenu = document.createElement("div");
    layersMenu.id = "layersMenu";
    layersMenu.style.cssText = `
        position: absolute;
        display: none;
        background: rgba(30,30,30,0.95);
        border-radius: 8px;
        padding: 10px;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        min-width: 200px;
        color: white;
        font-family: sans-serif;
    `;

    layers.forEach((layer, index) => {
        const item = document.createElement("div");
        item.style.cssText = `
            display: flex;
            align-items: center;
            padding: 8px 12px;
            margin: 2px 0;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        `;
        item.textContent = layer.name;

        if (index === currentLayerIndex) {
            item.style.background = "rgba(66, 133, 244, 0.3)";
            item.innerHTML += ' <span style="margin-left: auto;">✓</span>';
        } else {
            item.style.background = "transparent";
        }

        item.onmouseenter = () => {
            if (index !== currentLayerIndex) {
                item.style.background = "rgba(255,255,255,0.1)";
            }
        };
        item.onmouseleave = () => {
            if (index !== currentLayerIndex) {
                item.style.background = "transparent";
            }
        };
        item.onclick = () => {
            clearMapLayers();
            
            viewer.imageryLayers.removeAll();
            viewer.imageryLayers.addImageryProvider(layers[index].provider);
            
            if (layers[index].hasRelief && reliefLayer) {
                viewer.imageryLayers.add(reliefLayer);
                reliefLayer.show = layerVisibility.рельеф;
            } else if (reliefLayer) {
                reliefLayer.show = false;
            }
            
            currentLayerIndex = index;
            updateLayersMenu();
            layersMenu.style.display = 'none';

            if (layers[currentLayerIndex].onSelect) {
                layers[currentLayerIndex].onSelect();
            }

            legendPopup.style.display = 'none';
            setTimeout(updateScale, 500);
        };
        layersMenu.appendChild(item);
    });

    document.body.appendChild(layersMenu);

    function updateLayersMenu() {
        const items = layersMenu.children;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (i === currentLayerIndex) {
                item.style.background = "rgba(66, 133, 244, 0.3)";
                if (!item.innerHTML.includes('✓')) {
                    item.innerHTML += ' <span style="margin-left: auto;">✓</span>';
                }
            } else {
                item.style.background = "transparent";
                item.innerHTML = item.innerHTML.replace(' <span style="margin-left: auto;">✓</span>', '');
            }
        }
    }

    // --- Камера ---
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(85.9558, 51.9547, 5000),
        orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-90),
            roll: 0
        }
    });

    const homeButton = viewer.homeButton.viewModel;
    homeButton.command.beforeExecute.addEventListener(function(commandInfo) {
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(85.9558, 51.9547, 5000),
            orientation: {
                heading: 0,
                pitch: Cesium.Math.toRadians(-90),
                roll: 0
            },
            duration: 1.5
        });
        commandInfo.cancel = true;
    });

    // --- Таймлайн и анимация ---
    const startTime = Cesium.JulianDate.fromIso8601("1834-01-01T00:00:00Z");
    const stopTime = Cesium.JulianDate.fromIso8601("2027-01-01T00:00:00Z");

    viewer.clock.startTime = startTime.clone();
    viewer.clock.stopTime = stopTime.clone();
    viewer.clock.currentTime = Cesium.JulianDate.now();
    viewer.clock.multiplier = 1000000;
    viewer.clock.shouldAnimate = false;
    viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;

    viewer.timeline.makeLabel = function(time) {
        return Cesium.JulianDate.toDate(time).getUTCFullYear().toString();
    };

    setTimeout(() => {
        viewer.timeline.zoomTo(startTime, stopTime);
    }, 300);

    // --- Здания ---
    if (!buildingsDataSource) {
        Cesium.GeoJsonDataSource.load(
            'https://cdn.jsdelivr.net/gh/ekrss04/Data-/Buildings.geojson',
            {
                clampToGround: false
            }
        ).then(dataSource => {
            buildingsDataSource = dataSource;
            dataSource.name = 'Buildings';
            dataSource.show = layerVisibility.здания;
            viewer.dataSources.add(dataSource);

            const entities = dataSource.entities.values;
            const now = Cesium.JulianDate.now();

            entities.forEach(entity => {
                if (!entity.polygon || !entity.properties) return;

                const props = entity.properties.getValue(now);
                let height = parseFloat(props["Высота здания"]) || 10;
                const yearStr = props["Год постройки"];
                const purpose = props["Назначение_2"] || '';

                entity.polygon.height = 0;
                entity.polygon.extrudedHeight = height;
                entity.polygon.outline = false;

                let color;
                const purposeStr = String(purpose).trim();
                if (purposeStr === 'Жилое здание') {
                    color = buildingResidentialColor;
                } else if (purposeStr === 'Общественное здание') {
                    color = buildingPublicColor;
                } else if (purposeStr === 'Сооружение') {
                    color = buildingIndustrialColor;
                } else {
                    color = buildingOtherColor;
                }
                entity.polygon.material = color;

                if (yearStr && !isNaN(parseInt(yearStr))) {
                    const year = parseInt(yearStr);
                    const startDate = Cesium.JulianDate.fromIso8601(`${year}-01-01T00:00:00Z`);
                    entity.availability = new Cesium.TimeIntervalCollection([
                        new Cesium.TimeInterval({
                            start: startDate,
                            stop: stopTime.clone()
                        })
                    ]);
                }

                const buildingName = props["Здание"] || "Здание";
                const purposeDisplay = props["Назначение_2"] || "не указано";
                entity.description = `Высота: ${height} м<br> Адрес: ${props["Адрес"] || "не указан"}<br> Год постройки: ${yearStr || "не указан"}<br> Назначение: ${purposeDisplay}`;
            });
            console.log("Здания загружены");
        }).catch(() => {});
    }

    // --- 3D модели ---
    function addModel(name, url, lon, lat, rot, scale, year) {
        viewer.entities.add({
            name,
            position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
            orientation: Cesium.Transforms.headingPitchRollQuaternion(
                Cesium.Cartesian3.fromDegrees(lon, lat, 0),
                new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(rot), 0, 0)
            ),
            availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                start: Cesium.JulianDate.fromIso8601(`${year}-01-01T00:00:00Z`),
                stop: Cesium.JulianDate.fromIso8601("2027-01-01T00:00:00Z")
            })]),
            model: {
                uri: url,
                scale
            },
            show: layerVisibility.достопримечательности
        });
    }

    addModel("Правительство", "https://raw.githubusercontent.com/ekrss04/Data-/main/Правительство.glb", 85.9643593, 51.9577677, 89.959, 0.62, 1935);
    addModel("Прокуратура", "https://raw.githubusercontent.com/ekrss04/Data-/main/Прокуратура.glb", 85.9592711, 51.9567825, 91.673, 0.6, 2016);
    addModel("Голубой Алтай", "https://raw.githubusercontent.com/ekrss04/Data-/main/Голубой Алтай.glb", 85.9592352, 51.9519572, 70, 0.66, 1962);
    addModel("Дом культуры", "https://raw.githubusercontent.com/ekrss04/Data-/main/Дом%20культуры.glb", 85.961289, 51.9527243, 60.114, 0.616, 1970);
    addModel("Администрация", "https://raw.githubusercontent.com/ekrss04/Data-/main/Администрация.glb", 85.9602147, 51.9592017, 90.073, 0.615, 1985);
    addModel("Лавка купца Тобокова", "https://raw.githubusercontent.com/ekrss04/Data-/main/Лавка%20Тобокова.glb", 85.9653642, 51.9520659, -81.488, 0.61, 1887);

    // ========== ФУНКЦИИ ДЛЯ МАРКЕРА ==========
    function getCitySvgByYear(currentTime) {
        const date = Cesium.JulianDate.toDate(currentTime);
        const year = date.getUTCFullYear();
        
        if (year < 1932) {
            return 'https://raw.githubusercontent.com/ekrss04/Data-/main/visual/Улала.svg';
        } else if (year >= 1932 && year < 1948) {
            return 'https://raw.githubusercontent.com/ekrss04/Data-/main/visual/Ойрот-Тура.svg';
        } else {
            return 'https://raw.githubusercontent.com/ekrss04/Data-/main/visual/Горно-Алтайск.svg';
        }
    }

    function addCityNameMarker() {
        const longitude = 85.891825054503002;
        const latitude = 51.977554608212493;
        
        const markerEntity = viewer.entities.add({
            name: 'city_name_marker',
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 0),
            billboard: {
                image: getCitySvgByYear(viewer.clock.currentTime),
                width: 120,
                height: 40,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                scale: 1.0,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000)
            }
        });
        
        viewer.clock.onTick.addEventListener(function(clock) {
            const newImage = getCitySvgByYear(clock.currentTime);
            if (markerEntity.billboard.image !== newImage) {
                markerEntity.billboard.image = newImage;
            }
        });
        
        console.log("✅ Маркер с SVG добавлен");
    }

    addCityNameMarker();
    // ========== КОНЕЦ ФУНКЦИЙ МАРКЕРА ==========

    // --- Кнопки UI ---
    const btnHome = document.getElementById("btnHome");
    const btnLayers = document.getElementById("btnLayers");
    const btnWalk = document.getElementById("btnWalk");
    const btnGeocoder = document.getElementById("btnGeocoder");

    btnHome.onclick = () => homeButton.command();

    btnLayers.onclick = (e) => {
        e.stopPropagation();
        if (layersMenu.style.display === 'none') {
            const btnRect = btnLayers.getBoundingClientRect();
            layersMenu.style.top = (btnRect.bottom + 5) + 'px';
            layersMenu.style.right = (window.innerWidth - btnRect.right) + 'px';
            layersMenu.style.display = 'block';
            setTimeout(() => {
                document.addEventListener('click', function close(e) {
                    if (!layersMenu.contains(e.target) && e.target !== btnLayers) {
                        layersMenu.style.display = 'none';
                        document.removeEventListener('click', close);
                    }
                });
            }, 10);
        } else {
            layersMenu.style.display = 'none';
        }
    };

    btnWalk.onclick = () => {
        const carto = Cesium.Cartographic.fromCartesian(viewer.camera.position);
        const destination = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, 1.7);
        viewer.camera.flyTo({
            destination,
            orientation: {
                heading: viewer.camera.heading,
                pitch: 0,
                roll: 0
            },
            duration: 1.5
        });
    };

    // Geocoder
    const customGeocoderContainer = document.createElement("div");
    customGeocoderContainer.style.cssText = `
        position: absolute;
        display: none;
        z-index: 1001;
    `;
    const standardGeocoder = viewer.geocoder.container;
    standardGeocoder.style.position = 'static';
    standardGeocoder.style.display = 'block';
    customGeocoderContainer.appendChild(standardGeocoder);
    document.body.appendChild(customGeocoderContainer);

    btnGeocoder.onclick = (e) => {
        e.stopPropagation();
        const btnRect = btnGeocoder.getBoundingClientRect();
        customGeocoderContainer.style.top = (btnRect.bottom + 5) + 'px';
        customGeocoderContainer.style.right = (window.innerWidth - btnRect.right) + 'px';
        customGeocoderContainer.style.display = 'block';
        setTimeout(() => {
            document.addEventListener('click', function closeGeo(e) {
                if (!customGeocoderContainer.contains(e.target) && e.target !== btnGeocoder) {
                    customGeocoderContainer.style.display = 'none';
                    document.removeEventListener('click', closeGeo);
                }
            });
        }, 10);
    };

    // --- Плеер (анимация) ---
    let isPlaying = false;

    function pauseAnimation() {
        viewer.clock.shouldAnimate = false;
        isPlaying = false;
        updatePlayerButtons('pause');
    }

    function playSlowAnimation() {
        if (Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
            viewer.clock.currentTime = startTime.clone();
        }
        viewer.clock.multiplier = 1000000;
        viewer.clock.shouldAnimate = true;
        isPlaying = true;
        updatePlayerButtons('play');
    }

    function playFastAnimation() {
        if (Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
            viewer.clock.currentTime = startTime.clone();
        }
        viewer.clock.multiplier = 100000000;
        viewer.clock.shouldAnimate = true;
        isPlaying = true;
        updatePlayerButtons('fast');
    }

    function goToToday() {
        viewer.clock.shouldAnimate = false;
        viewer.clock.currentTime = Cesium.JulianDate.now();
        viewer.timeline.updateFromClock();
        isPlaying = false;
        updatePlayerButtons('pause');
    }

    function updatePlayerButtons(activeBtn) {
        document.querySelectorAll('.player-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.player-btn.${activeBtn}`)?.classList.add('active');
    }

    function checkAnimationReset() {
        if (isPlaying && Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
            viewer.clock.currentTime = startTime.clone();
        }
    }

    document.querySelectorAll('.player-btn').forEach(btn => {
        btn.onclick = () => {
            const action = btn.className.split(' ')[1];
            if (action === 'pause') pauseAnimation();
            else if (action === 'play') playSlowAnimation();
            else if (action === 'fast') playFastAnimation();
            else if (action === 'end') goToToday();
        };
    });

    updatePlayerButtons('pause');
    setInterval(checkAnimationReset, 1000);

    // --- Кнопки периодов ---
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const year = parseInt(btn.dataset.year);
            viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(`${year}-01-01T00:00:00Z`);
            viewer.clock.shouldAnimate = false;
        });
        btn.style.opacity = '0.3';
        btn.style.transition = 'all 0.3s';
        btn.style.cursor = 'pointer';
        btn.addEventListener('mouseenter', () => {
            btn.style.opacity = '0.6';
            btn.style.backgroundColor = 'rgba(255,255,255,0.2)';
        });
        btn.addEventListener('mouseleave', () => {
            if (!btn.classList.contains('active')) {
                btn.style.opacity = '0.3';
                btn.style.backgroundColor = 'transparent';
            }
        });
    });

    // --- Увеличение фото ---
    function enlargePhoto(src, alt) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:3000;display:flex;justify-content:center;align-items:center;cursor:pointer;background:rgba(0,0,0,0.8);';
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        img.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain;border-radius:8px;';
        overlay.appendChild(img);
        document.body.appendChild(overlay);
        overlay.addEventListener('click', () => document.body.removeChild(overlay));
    }

    // --- Модальные окна периодов ---
    let currentModal = null;

    function openModal(id) {
        if (currentModal) currentModal.style.display = 'none';
        const m = document.getElementById(id);
        if (m) {
            m.style.display = 'block';
            currentModal = m;
            m.querySelector('.modal-description')?.scrollTo(0, 0);
        }
    }

    function closeModal() {
        if (currentModal) {
            currentModal.style.display = 'none';
            currentModal = null;
        }
    }

    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const year = parseInt(btn.dataset.year);
            const map = {1850: 'modalAltai', 1921: 'modalMerchant', 1991: 'modalSoviet', 2026: 'modalModern', 2027: 'modalModern'};
            if (map[year]) openModal(map[year]);
        });
    });

    document.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
    }));

    document.querySelectorAll('.period-modal').forEach(m => m.addEventListener('click', (e) => {
        if (e.target === m) closeModal();
    }));

    document.querySelectorAll('.modal-image').forEach(i => i.addEventListener('click', (e) => {
        e.stopPropagation();
        enlargePhoto(i.src, i.alt);
    }));

    // --- Попапы для объектов ---
    let currentPopup = null;

    function openBuildingPopup(description) {
        closeAllPopups();
        const p = document.getElementById('buildingPopup');
        if (p) {
            document.getElementById('buildingDescription').innerHTML = description;
            p.style.display = 'block';
            currentPopup = p;
        }
    }

    function openModelPopup(name) {
        closeAllPopups();
        const data = {
            'Дом культуры': {
                desc: 'Городской дом культуры г. Горно-Алтайска открыт в 1950 году на базе ликвидированного национального театра для колхозников. Дом культуры выступает как центр праздничной жизни города, где проводятся концертные программы, народные гуляния, митинги и юбилеи.',
                img: 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/Дом_культуры.jpg?raw=true'
            },
            'Голубой Алтай': {
                desc: 'Кинотеатр Голубой Алтай открыт 13 июня 1962 года. Своим фасадом и пропорциями напоминает виллы Андреа Палладио, который в свою очередь, вдохновился римским Пантеоном. Историческая и культурная ценность кинотеатра «Голубой Алтай» в Горно-Алтайске заключается в его длительной истории и роли в культурной жизни города. Здесь показывали художественные, документальные и научно-популярные фильмы.',
                img: 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/Голубой_Алтай.jpg?raw=true'
            },
            'Правительство': {
                desc: 'Здание Правительства построено в 1935 году. По первоначальному замыслу, здание должно иметь 4-этажные боковые корпуса и 5-этажный главный корпус, украшенный символическими фигурами. Однако в процессе строительства в первоначальный вариант внесли изменения, и здание получилось более простым. На фасаде здания есть флорентийская мозаика с гербом Республики Алтай, на крыше здания развеваются флаги.',
                img: 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/Правительство.jpg?raw=true'
            },
            'Администрация': {
                desc: 'Здание Администрации города Горно-Алтайска сдано в эксплуатацию 29 апреля 1969 года. Здание стало частью истории города и отражает некоторые этапы его развития, так как изначально в нем располагались горкома КПСС и горисполком. В ходе эксплуатации здание подняли на один этаж и перестроили фасад. В результате оно приобрело современный облик и хорошо вписалось в архитектурный ландшафт центра Горно-Алтайска.',
                img: 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/Администрация.jpg?raw=true'
            },
            'Прокуратура': {
                desc: 'Здание Прокуратуры Республики Алтай открыто 23 марта в городе Горно-Алтайске. В восьмиэтажном здании площадью более 6 тыс. кв. м разместились республиканская, межрайонная природоохранная и городская прокуратуры. Здание оснащено современными рабочими кабинетами, библиотекой, музеем, архивом, актовым и конференц-залами, спортзалом и парковкой. Фасад выполнен из современных материалов, а конструкция учитывает повышенную сейсмоактивность региона.',
                img: 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/Прокуратура.jpg?raw=true'
            },
            'Лавка купца Тобокова': {
                desc: 'Лавка купца Д. М. Тобокова построена в 1887 году. Здание использовалось Даниилом Михайловичем в качестве винной лавки. В 1920-е годы здесь располагался Союз охотников. С 1926 по 1931 годы здание принадлежало Ойротскому краеведческому музею, затем передано в распоряжение Горно-Алтайской конторы государственной торговли (Горно-Алтайторг). 1989 году объект получил охранный статус и стал объектом культурного наследия регионального значения.',
                img: 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/Лавка%20Тобокова.jpg?raw=true'
            }
        };
        if (data[name]) {
            const p = document.getElementById('modelPopup');
            if (p) {
                document.getElementById('modelTitle').textContent = name;
                document.getElementById('modelDescription').textContent = data[name].desc;
                const img = document.getElementById('modelImage');
                img.src = data[name].img;
                img.alt = name;
                img.style.width = '100%';
                img.style.height = '200px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '6px';
                img.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                p.style.display = 'block';
                currentPopup = p;
            }
        }
    }

    function closeAllPopups() {
        document.querySelectorAll('.popup-container').forEach(p => p.style.display = 'none');
        currentPopup = null;
    }

    // Обработчик кликов
    viewer.screenSpaceEventHandler.setInputAction(function(m) {
        const pickedObject = viewer.scene.pick(m.position);
        
        if (Cesium.defined(pickedObject) && pickedObject.id) {
            const entity = pickedObject.id;
            
            if (entity.polygon && entity.description && entity.properties) {
                const description = entity.description.getValue(viewer.clock.currentTime);
                openBuildingPopup(description);
                return;
            }
            
            if (entity.model && entity.name) {
                openModelPopup(entity.name);
                return;
            }
            
            if (entity._name && entity.polygon && entity.polygon.material && 
                entity.polygon.material.color && entity.polygon.material.color.toCssColorString() === parkColor.toCssColorString()) {
                createPolygonTooltip(entity._name, m.position);
                return;
            }
            
            if (entity._name && entity.polyline) {
                createTooltip(entity._name, m.position);
                return;
            }
            
            if (entity._name && entity.corridor) {
                createTooltip(entity._name, m.position);
                return;
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    document.querySelectorAll('.popup-close').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllPopups();
    }));

    document.querySelectorAll('.popup-container').forEach(p => p.addEventListener('click', (e) => {
        if (e.target === p) closeAllPopups();
    }));

    document.getElementById('modelImage')?.addEventListener('click', (e) => {
        e.stopPropagation();
        enlargePhoto(e.target.src, e.target.alt);
    });

    window.addEventListener('resize', updateScale);
};