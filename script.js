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
    const waterColor = Cesium.Color.fromCssColorString('#77b1ea');
    const waterAreaColor = Cesium.Color.fromCssColorString('#77b1ea').withAlpha(1);
    const forestColor = Cesium.Color.fromCssColorString('#77d496').withAlpha(0.3);
    const parkColor = Cesium.Color.fromCssColorString('#86c882').withAlpha(0.5);

    // Цвета для дорог по классам
    const roadMainBaseColor = Cesium.Color.fromCssColorString('#999999').withAlpha(1);
    const roadMainTopColor = Cesium.Color.fromCssColorString('#a08573').withAlpha(1);
    const roadSecondaryColor = Cesium.Color.fromCssColorString('#999999').withAlpha(1);
    const roadLocalColor = Cesium.Color.fromCssColorString('#999999').withAlpha(1);
    // Цвета для зданий по назначению
const buildingResidentialColor = Cesium.Color.fromCssColorString('#678398').withAlpha(1);  
const buildingPublicColor = Cesium.Color.fromCssColorString('#986177').withAlpha(1);  
const buildingIndustrialColor = Cesium.Color.fromCssColorString('#78488e').withAlpha(1);
const buildingOtherColor = Cesium.Color.fromCssColorString('#9e9e9e').withAlpha(1);  
          // Цвета для классификации по десятилетиям (затемнённая, приглушённая версия)
    const decadeColors = {
        '1820-1829': Cesium.Color.fromCssColorString('#14275e').withAlpha(1), 
        '1830-1839': Cesium.Color.fromCssColorString('#172c63').withAlpha(1),
        '1840-1849': Cesium.Color.fromCssColorString('#1b3168').withAlpha(1),
        '1850-1859': Cesium.Color.fromCssColorString('#1e366d').withAlpha(1),
        '1860-1869': Cesium.Color.fromCssColorString('#223b72').withAlpha(1),
        '1870-1879': Cesium.Color.fromCssColorString('#254077').withAlpha(1),
        '1880-1889': Cesium.Color.fromCssColorString('#2a467c').withAlpha(1),
        '1890-1899': Cesium.Color.fromCssColorString('#2f4b81').withAlpha(1),
        '1900-1909': Cesium.Color.fromCssColorString('#345186').withAlpha(1),
        '1910-1919': Cesium.Color.fromCssColorString('#39568b').withAlpha(1),
        '1920-1929': Cesium.Color.fromCssColorString('#405c90').withAlpha(1),
        '1930-1939': Cesium.Color.fromCssColorString('#5a6894').withAlpha(1),
        '1940-1949': Cesium.Color.fromCssColorString('#766e89').withAlpha(1),
        '1950-1959': Cesium.Color.fromCssColorString('#8e6f7a').withAlpha(1),
        '1960-1969': Cesium.Color.fromCssColorString('#a5706d').withAlpha(1),
        '1970-1979': Cesium.Color.fromCssColorString('#b87c6a').withAlpha(1),
        '1980-1989': Cesium.Color.fromCssColorString('#c6846a').withAlpha(1),
        '1990-1999': Cesium.Color.fromCssColorString('#d48e6e').withAlpha(1),
        '2000-2009': Cesium.Color.fromCssColorString('#e09e76').withAlpha(1),
        '2010-2019': Cesium.Color.fromCssColorString('#e8ab7e').withAlpha(1),
        '2020-2029': Cesium.Color.fromCssColorString('#f0b886').withAlpha(1)
    };
    // Цвета для классификации по этажности
    const floorsColors = {
        1: Cesium.Color.fromCssColorString('#ffe3ba').withAlpha(1), 
        2: Cesium.Color.fromCssColorString('#f7c998').withAlpha(1),
        3: Cesium.Color.fromCssColorString('#efb07a').withAlpha(1),
        4: Cesium.Color.fromCssColorString('#e3975d').withAlpha(1),
        5: Cesium.Color.fromCssColorString('#d47f44').withAlpha(1),
        6: Cesium.Color.fromCssColorString('#c46830').withAlpha(1),
        7: Cesium.Color.fromCssColorString('#b45322').withAlpha(1),
        8: Cesium.Color.fromCssColorString('#a2401a').withAlpha(1),
        9: Cesium.Color.fromCssColorString('#903015').withAlpha(1),
        10: Cesium.Color.fromCssColorString('#82231a').withAlpha(1),
        '10+': Cesium.Color.fromCssColorString('#824a20').withAlpha(1) 
    };

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

    // Классификация зданий
    let currentClassification = 'purpose';
    let expandedSections = {
        purpose: false,
        decade: false,
        floors: false
    };

    let buildingsDataSource = null;

    // Функция получения цвета по десятилетию
    function getColorByDecade(year) {
        let yearNum = parseInt(year);
        if (isNaN(yearNum)) return buildingOtherColor;
        
        const startDecade = Math.floor(yearNum / 10) * 10;
        const decadeKey = `${startDecade}-${startDecade + 9}`;
        
        return decadeColors[decadeKey] || buildingOtherColor;
    }

    // Функция получения цвета по этажности (коричневая гамма)
    function getColorByFloorsCount(floors) {
        let floorsNum = parseInt(floors);
        if (isNaN(floorsNum)) return buildingOtherColor;
        
        if (floorsNum >= 10) return floorsColors['10+'];
        return floorsColors[floorsNum] || buildingOtherColor;
    }

    // Функция обновления цветов зданий
    function updateBuildingsClassification() {
        if (!buildingsDataSource) return;
        
        const entities = buildingsDataSource.entities.values;
        const now = Cesium.JulianDate.now();
        
        entities.forEach(entity => {
            if (!entity.polygon || !entity.properties) return;
            
            const props = entity.properties.getValue(now);
            let color;
            
            switch(currentClassification) {
                case 'purpose':
    const purpose = props["Назначение_2"] || '';
    const purposeStr = String(purpose).trim();
    switch (purposeStr) {
        case 'Жилое здание':
            color = buildingResidentialColor;
            break;
        case 'Общественное здание':
            color = buildingPublicColor;
            break;
        case 'Промышленное здание':
        case 'Промышленные':
            color = buildingIndustrialColor;
            break;
        case 'Сооружение':
            color = buildingOtherColor;
            break;
        default:
            color = buildingOtherColor;
    }
    break;
                    
                case 'decade':
                    const yearStr = props["Год постройки"];
                    color = getColorByDecade(yearStr);
                    break;
                    
                case 'floors':
                    const floorsStr = props["Количесто этажей"];
                    color = getColorByFloorsCount(floorsStr);
                    break;
                    
                default:
                    color = buildingOtherColor;
            }
            
            if (entity.polygon.material !== color) {
                entity.polygon.material = color;
            }
        });
    }

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

    // --- Таймлайн и анимация  ---
    const startTime = Cesium.JulianDate.fromIso8601("1834-01-01T00:00:00Z");
    const stopTime = Cesium.JulianDate.fromIso8601("2027-01-01T00:00:00Z");

    function loadMapFoundation() {
        clearMapLayers();

        // --- ПЛОЩАДНАЯ ГИДРОГРАФИЯ ---
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
        }).catch(() => {});

        // --- ЛИНЕЙНАЯ ГИДРОГРАФИЯ ---
       // --- ЛИНЕЙНАЯ ГИДРОГРАФИЯ С ШИРИНОЙ 5 МЕТРОВ ---
Cesium.GeoJsonDataSource.load(
    'https://raw.githubusercontent.com/ekrss04/Data-/main/Gidrigraf_2.geojson',
    {
        clampToGround: true
    }
).then(dataSource => {
    dataSource.name = 'Гидрография линейная';
    dataSource.show = layerVisibility.гидрография;

    const entities = dataSource.entities.values;
    entities.forEach(entity => {
        if (entity.polyline && entity.properties) {
            const props = entity.properties.getValue(Cesium.JulianDate.now());
            const name = props['Название'] || props['name'] || '';
            const positions = entity.polyline.positions.getValue(Cesium.JulianDate.now());
            
            if (positions && positions.length >= 2) {
                // Удаляем старую polyline
                entity.polyline = undefined;
                
                // Создаём corridor (ширина в метрах)
                entity.corridor = {
                    positions: positions,
                    width: 4,  
                    material: waterColor,
                    height: 0,
                    extrudedHeight: 0,  
                    cornerType: Cesium.CornerType.ROUNDED
                };
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

        // --- ДОРОГИ (с привязкой к анимации по полю "1") ---
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
                    const startYear = props['1'];
                    const classStr = String(roadClass).trim();

                    if (positions) {
                        let corridorConfig = null;
                        
                        if (classStr === '1' || classStr === 'Главные' || classStr === 'главные') {
                            corridorConfig = {
                                corridor: {
                                    positions: positions,
                                    width: 12,
                                    material: roadMainBaseColor,
                                    height: 0,
                                    extrudedHeight: 0.2,
                                    cornerType: Cesium.CornerType.ROUNDED
                                },
                                _name: roadName
                            };
                        } 
                        else if (classStr === '2' || classStr === 'Прочие' || classStr === 'прочие') {
                            corridorConfig = {
                                corridor: {
                                    positions: positions,
                                    width: 8,
                                    material: roadSecondaryColor,
                                    height: 0,
                                    extrudedHeight: 0.2,
                                    cornerType: Cesium.CornerType.ROUNDED
                                },
                                _name: roadName
                            };
                        } 
                        else {
                            corridorConfig = {
                                corridor: {
                                    positions: positions,
                                    width: 5,
                                    material: roadLocalColor,
                                    height: 0,
                                    extrudedHeight: 0.1,
                                    cornerType: Cesium.CornerType.ROUNDED
                                },
                                _name: roadName
                            };
                        }
                        
                        // Добавляем временную привязку, если указан год появления
                        if (corridorConfig && startYear && !isNaN(parseInt(startYear))) {
                            const year = parseInt(startYear);
                            const startDate = Cesium.JulianDate.fromIso8601(`${year}-01-01T00:00:00Z`);
                            corridorConfig.availability = new Cesium.TimeIntervalCollection([
                                new Cesium.TimeInterval({
                                    start: startDate,
                                    stop: stopTime.clone()
                                })
                            ]);
                        }
                        
                        if (corridorConfig) {
                            newEntities.push(corridorConfig);
                        }
                        
                        // Для главных дорог добавляем второй слой
                        if (classStr === '1' || classStr === 'Главные' || classStr === 'главные') {
                            const topLayerConfig = {
                                corridor: {
                                    positions: positions,
                                    width: 8,
                                    material: roadMainTopColor,
                                    height: 0.2,
                                    extrudedHeight: 0.4,
                                    cornerType: Cesium.CornerType.ROUNDED
                                },
                                _name: roadName
                            };
                            if (startYear && !isNaN(parseInt(startYear))) {
                                const year = parseInt(startYear);
                                const startDate = Cesium.JulianDate.fromIso8601(`${year}-01-01T00:00:00Z`);
                                topLayerConfig.availability = new Cesium.TimeIntervalCollection([
                                    new Cesium.TimeInterval({
                                        start: startDate,
                                        stop: stopTime.clone()
                                    })
                                ]);
                            }
                            newEntities.push(topLayerConfig);
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

        // --- ГРАНИЦА (с привязкой к анимации по полям "1" и "2") ---
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
                if (entity.polyline && entity.properties) {
                    const props = entity.properties.getValue(Cesium.JulianDate.now());
                    const startYear = props['1'];
                    const endYear = props['2'];
                    
                    if (startYear && !isNaN(parseInt(startYear))) {
                        const startDate = Cesium.JulianDate.fromIso8601(`${parseInt(startYear)}-01-01T00:00:00Z`);
                        let endDate = stopTime.clone();
                        
                        if (endYear && !isNaN(parseInt(endYear))) {
                            endDate = Cesium.JulianDate.fromIso8601(`${parseInt(endYear)}-01-01T00:00:00Z`);
                        }
                        
                        entity.availability = new Cesium.TimeIntervalCollection([
                            new Cesium.TimeInterval({
                                start: startDate,
                                stop: endDate
                            })
                        ]);
                    }
                    entity.properties = undefined;
                } else if (entity.polyline) {
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
    
    // Картографическая основа
    viewer.imageryLayers.addImageryProvider(layers[currentLayerIndex].provider);
    
    // Рельеф
    reliefLayer = viewer.imageryLayers.addImageryProvider(reliefProvider);
    reliefLayer.alpha = 0.5;
    
    // Векторные данные
    loadMapFoundation();

    // --- Таймлайн и анимация ---
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

    // --- ЛЕГЕНДА ---
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

    function toggleSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const isVisible = section.style.display === 'block';
            section.style.display = isVisible ? 'none' : 'block';
            expandedSections[sectionId.replace('section-', '')] = !isVisible;
        }
    }

        function updateLegendButtons() {
        // Все десятилетия для левой колонки (1820-1929)
        const leftDecades = [
            { label: '1820-1829', color: '#1a2f6b' },
            { label: '1830-1839', color: '#1e3470' },
            { label: '1840-1849', color: '#223a75' },
            { label: '1850-1859', color: '#26407a' },
            { label: '1860-1869', color: '#2a467f' },
            { label: '1870-1879', color: '#2e4c84' },
            { label: '1880-1889', color: '#345289' },
            { label: '1890-1899', color: '#3a588e' },
            { label: '1900-1909', color: '#405e93' },
            { label: '1910-1919', color: '#466498' },
            { label: '1920-1929', color: '#506a9d' }
        ];
        
        // Все десятилетия для правой колонки (1930-2029)
        const rightDecades = [
            { label: '1930-1939', color: '#6b7aa3' },
            { label: '1940-1949', color: '#8a8faa' },
            { label: '1950-1959', color: '#a58f9f' },
            { label: '1960-1969', color: '#bf9998' },
            { label: '1970-1979', color: '#d3a395' },
            { label: '1980-1989', color: '#e0ab94' },
            { label: '1990-1999', color: '#edb796' },
            { label: '2000-2009', color: '#f5c098' },
            { label: '2010-2019', color: '#fbc79a' },
            { label: '2020-2029', color: '#ffce9c' }
        ];
        
        // Формируем HTML для левой колонки
        let leftColumnHtml = '<div style="flex: 1;">';
        leftDecades.forEach(decade => {
            leftColumnHtml += `
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <div style="width: 20px; height: 20px; background: ${decade.color}; margin-right: 10px; border-radius: 3px; border: 1px solid #888;"></div>
                    <span style="font-size: 11px;">${decade.label}</span>
                </div>
            `;
        });
        leftColumnHtml += '</div>';
        
        // Формируем HTML для правой колонки
        let rightColumnHtml = '<div style="flex: 1;">';
        rightDecades.forEach(decade => {
            rightColumnHtml += `
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <div style="width: 20px; height: 20px; background: ${decade.color}; margin-right: 10px; border-radius: 3px; border: 1px solid #888;"></div>
                    <span style="font-size: 11px;">${decade.label}</span>
                </div>
            `;
        });
        rightColumnHtml += '</div>';
        
        let classificationsHtml = `
            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">ЗДАНИЯ</div>
                    <button class="toggle-layer" data-layer="здания" style="background: ${layerVisibility.здания ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.здания ? '✓' : '✗'}</button>
                </div>
                
                <div style="margin-left: 12px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="toggleSection('section-purpose')">
                        <span style="font-size: 14px;">${expandedSections.purpose ? '▼' : '▶'}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="buildingClassification" value="purpose" ${currentClassification === 'purpose' ? 'checked' : ''} style="cursor: pointer;">
                            <span style="font-weight: 500;">По назначению</span>
                        </div>
                    </div>
                    <div id="section-purpose" style="margin-left: 24px; margin-top: 6px; display: ${expandedSections.purpose ? 'block' : 'none'};">
    <div style="display: flex; align-items: center; margin-bottom: 4px;"><div style="width: 20px; height: 20px; background: #678398; margin-right: 10px; border-radius: 3px; border: 1px solid #888;"></div><span>Жилые</span></div>
    <div style="display: flex; align-items: center; margin-bottom: 4px;"><div style="width: 20px; height: 20px; background: #986177; margin-right: 10px; border-radius: 3px; border: 1px solid #888;"></div><span>Общественные</span></div>
    <div style="display: flex; align-items: center; margin-bottom: 4px;"><div style="width: 20px; height: 20px; background: #78488e; margin-right: 10px; border-radius: 3px; border: 1px solid #888;"></div><span>Промышленные</span></div>
    <div style="display: flex; align-items: center;"><div style="width: 20px; height: 20px; background: #9e9e9e; margin-right: 10px; border-radius: 3px; border: 1px solid #888;"></div><span>Сооружения</span></div>
                    </div>
                </div>
                
                <div style="margin-left: 12px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="toggleSection('section-decade')">
                        <span style="font-size: 14px;">${expandedSections.decade ? '▼' : '▶'}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="buildingClassification" value="decade" ${currentClassification === 'decade' ? 'checked' : ''} style="cursor: pointer;">
                            <span style="font-weight: 500;">По году постройки</span>
                        </div>
                    </div>
                    <div id="section-decade" style="margin-left: 24px; margin-top: 6px; display: ${expandedSections.decade ? 'block' : 'none'};">
                        <div style="display: flex; gap: 20px; justify-content: space-between;">
                            ${leftColumnHtml}
                            ${rightColumnHtml}
                        </div>
                    </div>
                </div>
                
                <div style="margin-left: 12px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="toggleSection('section-floors')">
                        <span style="font-size: 14px;">${expandedSections.floors ? '▼' : '▶'}</span>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="buildingClassification" value="floors" ${currentClassification === 'floors' ? 'checked' : ''} style="cursor: pointer;">
                            <span style="font-weight: 500;">По этажности</span>
                        </div>
                    </div>
                    <div id="section-floors" style="margin-left: 24px; margin-top: 6px; display: ${expandedSections.floors ? 'block' : 'none'};">
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                            <div style="display: flex; align-items: center;"><div style="width: 20px; height: 20px; background: #ffe3ba; margin-right: 10px; border-radius: 3px; border: 1px solid #888; opacity: 0.95;"></div><span>1-2 этажа</span></div>
                            <div style="display: flex; align-items: center;"><div style="width: 20px; height: 20px; background: #efb07a; margin-right: 10px; border-radius: 3px; border: 1px solid #888; opacity: 0.95;"></div><span>3-4 этажа</span></div>
                            <div style="display: flex; align-items: center;"><div style="width: 20px; height: 20px; background: #c46830; margin-right: 10px; border-radius: 3px; border: 1px solid #888; opacity: 0.95;"></div><span>5-6 этажей</span></div>
                            <div style="display: flex; align-items: center;"><div style="width: 20px; height: 20px; background: #a2401a; margin-right: 10px; border-radius: 3px; border: 1px solid #888; opacity: 0.95;"></div><span>7-9 этажей</span></div>
                            <div style="display: flex; align-items: center;"><div style="width: 20px; height: 20px; background: #824a20; margin-right: 10px; border-radius: 3px; border: 1px solid #888; opacity: 0.95;"></div><span>10+ этажей</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        legendPopup.innerHTML = `
            <span class="popup-close" style="position: absolute; top: 8px; right: 10px; font-size: 22px; cursor: pointer; color: #666;">&times;</span>
            <h4 style="margin: 0 0 18px 0; text-align: center; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; font-size: 18px; letter-spacing: 1px;">УСЛОВНЫЕ ОБОЗНАЧЕНИЯ</h4>

            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">РЕЛЬЕФ</div>
                    <button class="toggle-layer" data-layer="рельеф" style="background: ${layerVisibility.рельеф ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.рельеф ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; padding-left: 12px;">
                    <div style="width: 30px; height: 20px; background: linear-gradient(135deg, #8B7355 0%, #D2B48C 50%, #F5DEB3 100%); margin-right: 10px; border-radius: 3px; border: 1px solid #888;"></div>
                    <span>Рельеф</span>
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">ГИДРОГРАФИЯ</div>
                    <button class="toggle-layer" data-layer="гидрография" style="background: ${layerVisibility.гидрография ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.гидрография ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; padding-left: 12px;"><div style="width: 30px; height: 4px; background: #77b1ea; margin-right: 10px; border-radius: 2px;"></div><span>Линейная гидрография</span></div>
                <div style="display: flex; align-items: center; padding-left: 12px; margin-top: 6px;"><div style="width: 30px; height: 20px; background: #77b1ea; margin-right: 10px; border-radius: 3px; border: 1px solid #5a9aa0;"></div><span>Площадная гидрография</span></div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">ДОРОЖНАЯ СЕТЬ</div>
                    <button class="toggle-layer" data-layer="дороги" style="background: ${layerVisibility.дороги ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.дороги ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 6px; padding-left: 12px;"><div style="width: 30px; height: 8px; background: #6a6a6a; margin-right: 10px; border-radius: 2px; position: relative;"><div style="position: absolute; top: 2px; left: 2px; width: 26px; height: 4px; background: #998680; border-radius: 1px;"></div></div><span>Главные дороги</span></div>
                <div style="display: flex; align-items: center; margin-bottom: 6px; padding-left: 12px;"><div style="width: 30px; height: 6px; background: #b0b0b0; margin-right: 10px; border-radius: 2px;"></div><span>Второстепенные дороги</span></div>
                <div style="display: flex; align-items: center; padding-left: 12px;"><div style="width: 30px; height: 4px; background: #b0b0b0; margin-right: 10px; border-radius: 2px;"></div><span>Проезды</span></div>
            </div>

            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">РАСТИТЕЛЬНОСТЬ</div>
                    <button class="toggle-layer" data-layer="растительность" style="background: ${layerVisibility.растительность ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.растительность ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 6px; padding-left: 12px;"><div style="width: 20px; height: 20px; background: #77d496; margin-right: 10px; border-radius: 3px; border: 1px solid #5a9a60; opacity: 0.8;"></div><span>Леса</span></div>
                <div style="display: flex; align-items: center; padding-left: 12px;"><div style="width: 20px; height: 20px; background: #86c882; margin-right: 10px; border-radius: 3px; border: 1px solid #5a9a60; opacity: 0.8;"></div><span>Парки, скверы</span></div>
            </div>

            ${classificationsHtml}

            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">ГРАНИЦА</div>
                    <button class="toggle-layer" data-layer="границаЛиния" style="background: ${layerVisibility.границаЛиния ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.границаЛиния ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; padding-left: 12px;"><div style="width: 30px; height: 4px; background: #b3526c; margin-right: 10px; border-radius: 2px;"></div><span>Граница города</span></div>
            </div>

            <div style="margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-weight: bold; color: #333; font-size: 14px;">3D МОДЕЛИ</div>
                    <button class="toggle-layer" data-layer="достопримечательности" style="background: ${layerVisibility.достопримечательности ? '#4CAF50' : '#f44336'}; border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">${layerVisibility.достопримечательности ? '✓' : '✗'}</button>
                </div>
                <div style="display: flex; align-items: center; padding-left: 12px;"><div style="width: 20px; height: 20px; background: #d4a373; margin-right: 10px; border-radius: 3px; border: 1px solid #a07453;"></div><span>3D модели</span></div>
            </div>
        `;

        const radioButtons = legendPopup.querySelectorAll('input[name="buildingClassification"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    currentClassification = e.target.value;
                    updateBuildingsClassification();
                }
            });
        });

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

    window.toggleSection = toggleSection;

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

     // --- Здания ---
    if (!buildingsDataSource) {
        Cesium.GeoJsonDataSource.load(
            'https://raw.githubusercontent.com/ekrss04/Data-/main/Buildings.geojson',
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
                const floorsStr = props["Количесто этажей"];
                const purposeStr = String(props["Назначение_2"] || '').trim();

                entity.polygon.height = 0;
                entity.polygon.extrudedHeight = height;
                entity.polygon.outline = false;

                // Определяем цвет в зависимости от текущей классификации
                let color;
                if (currentClassification === 'purpose') {
                    if (purposeStr === 'Жилое здание') {
                        color = buildingResidentialColor;
                    } else if (purposeStr === 'Общественное здание') {
                        color = buildingPublicColor;
                    } else if (purposeStr === 'Промышленное здание' || purposeStr === 'Промышленные') {
                        color = buildingIndustrialColor;
                    } else {
                        color = buildingOtherColor;
                    }
                } else if (currentClassification === 'decade') {
                    color = getColorByDecade(yearStr);
                } else if (currentClassification === 'floors') {
                    color = getColorByFloorsCount(floorsStr);
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

                const purposeDisplay = props["Назначение_2"] || "не указано";
                const floorsDisplay = props["Количесто этажей"] || "не указано";
                entity.description = `Высота: ${height} м<br>Этажей: ${floorsDisplay}<br> Адрес: ${props["Адрес"] || "не указан"}<br> Год постройки: ${yearStr || "не указан"}<br> Назначение: ${purposeDisplay}`;
            });
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
    addModel("Мечеть Духовного управления мусульман", "https://raw.githubusercontent.com/ekrss04/Data-/main/Мечеть.glb", 85.898202, 51.9675375, 54.022, 0.6, 2024);
    addModel("Администрация", "https://raw.githubusercontent.com/ekrss04/Data-/main/Администрация.glb", 85.9602147, 51.9592017, 90.073, 0.615, 1985);
    addModel("Лавка купца Тобокова", "https://raw.githubusercontent.com/ekrss04/Data-/main/Лавка%20Тобокова.glb", 85.9653642, 51.9520659, -81.488, 0.61, 1887);
    addModel("Национальный драматический театр имени П.В. Кучияка", "https://raw.githubusercontent.com/ekrss04/Data-/main/Театр.glb", 85.9613045, 51.9592354, 180, 0.62, 1977);
    addModel("Буддийский храм Ак-Бурхан","https://raw.githubusercontent.com/ekrss04/Data-/main/Ак-Буркан.glb", 85.9356503, 51.9530286, -100.841, 0.6, 2012);
    addModel("Мужская церковно-приходская школа", "https://raw.githubusercontent.com/ekrss04/Data-/main/Мужская%20школа.glb", 85.9627761, 51.9524142, -71.047, 0.6, 1838);

    // ========== НАДПИСЬ НАЗВАНИЯ ГОРОДА ==========
    function getCityNameByYear(currentTime) {
        const date = Cesium.JulianDate.toDate(currentTime);
        const year = date.getUTCFullYear();
        
        if (year < 1932) {
            return 'Улала';
        } else if (year >= 1932 && year < 1948) {
            return 'Ойрот-Тура';
        } else {
            return 'Горно-Алтайск';
        }
    }

    function addCityNameMarker() {
        const longitude = 85.891825054503002;
        const latitude = 51.977554608212493;
        
        const markerEntity = viewer.entities.add({
            name: 'city_name_marker',
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 8),
            label: {
                text: getCityNameByYear(viewer.clock.currentTime),
                font: 'bold 22px "Segoe UI", "Roboto", "Open Sans", Arial, sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.fromCssColorString('#2C3E50'),
                outlineColor: Cesium.Color.fromCssColorString('#FFFFFF'),
                outlineWidth: 3,
                showBackground: false,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                pixelOffset: new Cesium.Cartesian2(0, -15),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000),
                scale: 1.0
            }
        });
        
        viewer.clock.onTick.addEventListener(function(clock) {
            const newText = getCityNameByYear(clock.currentTime);
            if (markerEntity.label.text !== newText) {
                markerEntity.label.text = newText;
            }
        });
    }

    addCityNameMarker();
    // ========== КОНЕЦ НАДПИСИ ==========

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

      // ========== РЕЖИМ ПРОГУЛКИ ==========
    let walkModeActive = false;
    let walkCameraPosition = null;
    let walkCameraHeading = 0;
    const WALK_SPEED = 8;
    const ROTATE_SPEED = 1.5;
    let moveForward = false, moveBack = false, moveLeft = false, moveRight = false;
    let rotateLeft = false, rotateRight = false;
    let walkAnimationId = null;
    
    function updateWalkPosition() {
        if (!walkModeActive) return;
        
        const deltaTime = 1 / 60;
        let rotated = false;
        
        if (rotateLeft) {
            walkCameraHeading -= Cesium.Math.toRadians(ROTATE_SPEED);
            rotated = true;
        }
        if (rotateRight) {
            walkCameraHeading += Cesium.Math.toRadians(ROTATE_SPEED);
            rotated = true;
        }
        
        if (rotated) {
            viewer.camera.setView({
                orientation: { heading: walkCameraHeading, pitch: Cesium.Math.toRadians(-10), roll: 0 }
            });
        }
        
        if (moveForward || moveBack || moveLeft || moveRight) {
            const speed = WALK_SPEED * deltaTime;
            const direction = new Cesium.Cartesian3();
            const forward = viewer.camera.direction;
            const right = viewer.camera.right;
            
            if (moveForward) { direction.x += forward.x; direction.y += forward.y; direction.z += forward.z; }
            if (moveBack) { direction.x -= forward.x; direction.y -= forward.y; direction.z -= forward.z; }
            if (moveRight) { direction.x += right.x; direction.y += right.y; direction.z += right.z; }
            if (moveLeft) { direction.x -= right.x; direction.y -= right.y; direction.z -= right.z; }
            
            const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
            if (length > 0) {
                direction.x /= length;
                direction.y /= length;
                direction.z /= length;
            }
            
            let newPosition = Cesium.Cartesian3.add(walkCameraPosition, 
                new Cesium.Cartesian3(direction.x * speed, direction.y * speed, direction.z * speed), 
                new Cesium.Cartesian3());
            
            const cartographic = Cesium.Cartographic.fromCartesian(newPosition);
            const terrainHeight = viewer.scene.globe.getHeight(cartographic);
            
            if (terrainHeight !== undefined && !isNaN(terrainHeight)) {
                cartographic.height = terrainHeight + 1.7;
            } else {
                cartographic.height = 1.7;
            }
            
            newPosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height);
            walkCameraPosition = newPosition;
            viewer.camera.setView({ destination: walkCameraPosition });
        }
        
        walkAnimationId = requestAnimationFrame(updateWalkPosition);
    }
    
    function startWalkAnimation() {
        if (walkAnimationId) cancelAnimationFrame(walkAnimationId);
        walkAnimationId = requestAnimationFrame(updateWalkPosition);
    }
    
    function startWalkMode() {
        if (walkModeActive) return;
        walkModeActive = true;
        
        const currentPosition = viewer.camera.position;
        const currentHeading = viewer.camera.heading;
        walkCameraPosition = currentPosition.clone();
        walkCameraHeading = currentHeading;
        
        viewer.scene.screenSpaceCameraController.enableTilt = false;
        viewer.scene.screenSpaceCameraController.enableLook = false;
        viewer.scene.screenSpaceCameraController.enableRotate = false;
        viewer.scene.screenSpaceCameraController.enableTranslate = false;
        viewer.scene.screenSpaceCameraController.enableZoom = false;
        
        const cartographic = Cesium.Cartographic.fromCartesian(walkCameraPosition);
        cartographic.height = 1.7;
        const newPosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height);
        viewer.camera.setView({
            destination: newPosition,
            orientation: { heading: walkCameraHeading, pitch: Cesium.Math.toRadians(-10), roll: 0 }
        });
        
        startWalkAnimation();
        btnWalk.style.backgroundColor = 'rgba(66, 133, 244, 0.5)';
        btnWalk.style.boxShadow = '0 0 15px rgba(66, 133, 244, 0.8)';
        console.log("Режим прогулки активирован");
    }
    
    function stopWalkMode() {
        if (!walkModeActive) return;
        walkModeActive = false;
        
        viewer.scene.screenSpaceCameraController.enableTilt = true;
        viewer.scene.screenSpaceCameraController.enableLook = true;
        viewer.scene.screenSpaceCameraController.enableRotate = true;
        viewer.scene.screenSpaceCameraController.enableTranslate = true;
        viewer.scene.screenSpaceCameraController.enableZoom = true;
        
        if (walkAnimationId) {
            cancelAnimationFrame(walkAnimationId);
            walkAnimationId = null;
        }
        
        moveForward = moveBack = moveLeft = moveRight = rotateLeft = rotateRight = false;
        btnWalk.style.backgroundColor = 'rgba(30, 30, 30, 0.85)';
        btnWalk.style.boxShadow = 'none';
        console.log("Режим прогулки деактивирован");
    }
    
    function walkHandleKeyDown(e) {
        if (!walkModeActive) return;
        switch(e.key) {
            case 'ArrowUp': case 'w': case 'W': moveForward = true; e.preventDefault(); break;
            case 'ArrowDown': case 's': case 'S': moveBack = true; e.preventDefault(); break;
            case 'ArrowLeft': case 'a': case 'A': moveLeft = true; e.preventDefault(); break;
            case 'ArrowRight': case 'd': case 'D': moveRight = true; e.preventDefault(); break;
            case 'q': case 'Q': rotateLeft = true; e.preventDefault(); break;
            case 'e': case 'E': rotateRight = true; e.preventDefault(); break;
            case 'Escape': stopWalkMode(); break;
        }
    }
    
    function walkHandleKeyUp(e) {
        if (!walkModeActive) return;
        switch(e.key) {
            case 'ArrowUp': case 'w': case 'W': moveForward = false; e.preventDefault(); break;
            case 'ArrowDown': case 's': case 'S': moveBack = false; e.preventDefault(); break;
            case 'ArrowLeft': case 'a': case 'A': moveLeft = false; e.preventDefault(); break;
            case 'ArrowRight': case 'd': case 'D': moveRight = false; e.preventDefault(); break;
            case 'q': case 'Q': rotateLeft = false; e.preventDefault(); break;
            case 'e': case 'E': rotateRight = false; e.preventDefault(); break;
        }
    }
    
    // Регистрация обработчиков клавиатуры
    document.addEventListener('keydown', walkHandleKeyDown);
    document.addEventListener('keyup', walkHandleKeyUp);
    
    // --- Кнопка прогулки ---
    btnWalk.onclick = () => {
        if (!walkModeActive) {
            startWalkMode();
        } else {
            stopWalkMode();
        }
    };
    // ========== КОНЕЦ РЕЖИМА ПРОГУЛКИ ==========
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

    // --- Плеер ---
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

    // --- Модальные окна ---
    let currentModal = null;

    function openModal(id) {
        if (currentModal) currentModal.style.display = 'none';
        const m = document.getElementById(id);
        if (m) {
            if (!m.querySelector('.archive-link')) {
                const link = document.createElement('a');
                link.className = 'archive-link';
                link.href = 'https://ekrss04.github.io/Gorno-Altaisk-website/#archive-photos';
                link.target = '_blank';
                link.style.cssText = `
                    position: absolute;
                    top: 23px;
                    left: 30px;
                    color: #fadadd;
                    text-decoration: underline;
                    font-size: 14px;
                    font-weight: normal;
                    font-family: 'Noah', Arial, sans-serif;
                    cursor: pointer;
                    background: transparent;
                    z-index: 10;
                `;
                link.innerHTML = 'Больше фотографий';
                m.appendChild(link);
            }
            m.style.display = 'block';
            currentModal = m;
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

    // --- Попапы ---
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
            'Мечеть Духовного управления мусульман': {
                desc: 'Мечеть Духовного управления мусульман открыта 28 сентября 2013 года. Это светлое одноэтажное здание с синими куполами и двумя минаретами. Рядом расположено двухэтажное здание медресе, мусульманского учебного заведения. Новую мечеть назвали в честь безвременно ушедшего из жизни активиста мусульманской организации Горно-Алтайска Аскара Зианурова, который стоял у истоков строительства мечети.',
                img: 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/Мечеть.jpg?raw=true'
            },
            'Лавка купца Тобокова': {
                desc: 'Лавка купца Д. М. Тобокова построена в 1887 году. Здание использовалось Даниилом Михайловичем в качестве винной лавки. В 1920-е годы здесь располагался Союз охотников. С 1926 по 1931 годы здание принадлежало Ойротскому краеведческому музею, затем передано в распоряжение Горно-Алтайской конторы государственной торговли. 1989 году объект получил охранный статус и стал объектом культурного наследия регионального значения.',
                img: 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/Лавка%20Тобокова.jpg?raw=true'
            },
            'Буддийский храм Ак-Бурхан': {
              desc: 'Буддийский храм Ак-Бурхан («Светлый Бурхан» или «Будда Грядущего») построен в 2012 году для религиозного объединения «Ак-Бурхан». Объединение образовано в 1991 году, его цель – возродить алтайскую форму бурханизма, сходную с раннетибетской. Назван в честь Белого Бурхана – спасителя, которого алтайцы ждут в образе богатыря Ойрат-хана, а буддисты видят в нём Будду.',
              img: 'https://raw.githubusercontent.com/ekrss04/Data-/main/visual/photo/models/Ак-Буркан.jpg'
             },
             'Мужская церковно-приходская школа': { 
              desc: 'Здание Мужской церковно-приходской школы в Горно-Алтайске построено в 1838 году под руководством Алтайской духовной миссии. Здание имеет статус памятника истории и архитектуры начала ХХ века. Первый этаж почти квадратного в плане здания – кирпичный, второй – деревянный, позже пристроен в 1920-х годах. Вход, расположенный в центре главного фасада, обозначен треугольным навесом.', 
             img: 'https://raw.githubusercontent.com/ekrss04/Data-/main/visual/photo/models/Мужская%20школа.jpg' 
             },            
             'Национальный драматический театр имени П.В. Кучияка': {
              desc: 'Здание театра построено в 1977 году. По форме напоминает традиционное алтайское жилище – аил. В оформлении фасада использованы панели из кедра и украшения с национальными орнаментами. Театр играет важную роль в сохранении и развитии культуры коренных народов Алтая. Театру присвоено имя алтайского драматурга Павла Васильевича Кучияка, основоположника алтайской драматургии и создателя первых национальных пьес.',
              img: 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/Театр.jpg?raw=true'
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
const mobileMenu = document.getElementById("mobileMenu");
const btnMenu = document.getElementById("btnMenu");
const closeMobileMenu = document.getElementById("closeMobileMenu");

btnMenu.addEventListener("click", () => {
  mobileMenu.classList.add("active");
});

closeMobileMenu.addEventListener("click", () => {
  mobileMenu.classList.remove("active");
});

document.querySelectorAll(".mobilePeriod").forEach(item => {

  item.addEventListener("click", () => {

    mobileMenu.classList.remove("active");

    const modalId = item.dataset.modal;

    const modal = document.getElementById(modalId);

    if (modal) {
      modal.style.display = "block";
    }

  });

});
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
