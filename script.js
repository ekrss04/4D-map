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
  const waterColor = Cesium.Color.fromCssColorString('#3794cc'); // Новый цвет гидрографии
  const vegetationColor = Cesium.Color.fromCssColorString('#c5e6d1').withAlpha(0.4);
  const roadColor = Cesium.Color.fromCssColorString('#898989');
  
  // Цвета для границы
  const borderFillColor = Cesium.Color.fromCssColorString('#ffffff').withAlpha(0.9);
  const borderStrokeColor = Cesium.Color.fromCssColorString('#b3526c'); // Новый цвет красной границы

  function clearMapLayers() {
    const dataSources = viewer.dataSources;
    for (let i = dataSources.length - 1; i >= 0; i--) {
      const ds = dataSources.get(i);
      if (ds.name && (ds.name.includes('Граница') ||
                      ds.name.includes('Растительность') || 
                      ds.name.includes('Гидрография') || 
                      ds.name.includes('Дороги'))) {
        dataSources.remove(ds);
      }
    }
  }

  function loadMapFoundation() {
    clearMapLayers();

    // --- 0.1 ГРАНИЦА (ПОЛИГОН) - ПОЛУПРОЗРАЧНАЯ белая заливка ---
    Cesium.GeoJsonDataSource.load(
      'https://raw.githubusercontent.com/ekrss04/Data-/main/Granica.geojson',
      {
        stroke: Cesium.Color.fromCssColorString('#ffffff').withAlpha(0), // Прозрачная обводка
        strokeWidth: 0,
        fill: borderFillColor, // Теперь с прозрачностью 0.5
        clampToGround: true
      }
    ).then(dataSource => {
      dataSource.name = 'Граница (полигон)';
      viewer.dataSources.add(dataSource);
    }).catch(() => {});

    // --- 1. Растительность (поверх белой заливки) ---
    Cesium.GeoJsonDataSource.load(
      'https://raw.githubusercontent.com/ekrss04/Data-/main/Rastitelnost.geojson',
      { 
        stroke: vegetationColor, 
        fill: vegetationColor, 
        strokeWidth: 1, 
        clampToGround: true 
      }
    ).then(dataSource => {
      dataSource.name = 'Растительность';
      viewer.dataSources.add(dataSource);
    }).catch(() => {});

    // --- 2. Гидрография площадная ---
    Cesium.GeoJsonDataSource.load(
      'https://raw.githubusercontent.com/ekrss04/Data-/main/Gidrigraf.geojson',
      { 
        stroke: waterColor, 
        fill: waterColor, 
        strokeWidth: 2, 
        clampToGround: true 
      }
    ).then(dataSource => {
      dataSource.name = 'Гидрография площадная';
      viewer.dataSources.add(dataSource);
    }).catch(() => {});

    // --- 3. Гидрография линейная ---
    Cesium.GeoJsonDataSource.load(
      'https://raw.githubusercontent.com/ekrss04/Data-/main/Gidrigraf_2.geojson',
      { 
        stroke: waterColor, 
        strokeWidth: 3, 
        clampToGround: true 
      }
    ).then(dataSource => {
      dataSource.name = 'Гидрография линейная';
      viewer.dataSources.add(dataSource);
    }).catch(() => {});

    // --- 4. Дороги ---
    Cesium.GeoJsonDataSource.load(
      'https://raw.githubusercontent.com/ekrss04/Data-/main/Dorogi.geojson',
      { 
        stroke: roadColor,
        strokeWidth: 3,
        clampToGround: true 
      }
    ).then(dataSource => {
      dataSource.name = 'Дороги';
      viewer.dataSources.add(dataSource);
    }).catch(() => {});

    // --- 5. ГРАНИЦА (ЛИНЕЙНАЯ) - красная линия (самый верхний) ---
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
      viewer.dataSources.add(dataSource);
    }).catch(() => {});
}

  // --- 5 КАРТОГРАФИЧЕСКИХ ОСНОВ ---
  const positronProvider = new Cesium.UrlTemplateImageryProvider({
    url: "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
  });

  const googleSatelliteProvider = new Cesium.UrlTemplateImageryProvider({
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
  });

  const layers = [
    {
      name: "Картографическая основа",
      provider: positronProvider,
      onSelect: loadMapFoundation
    },
    {
      name: "Positron",
      provider: positronProvider,
      onSelect: function() {}
    },
    {
      name: "OSM",
      provider: new Cesium.OpenStreetMapImageryProvider({
        url: "https://a.tile.openstreetmap.org/"
      }),
      onSelect: function() {}
    },
    {
      name: "Dark Matter",
      provider: new Cesium.UrlTemplateImageryProvider({
        url: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      }),
      onSelect: function() {}
    },
    {
      name: "Google Спутник",
      provider: googleSatelliteProvider,
      onSelect: function() {}
    }
  ];

  let currentLayerIndex = 0;
  viewer.imageryLayers.addImageryProvider(layers[currentLayerIndex].provider);

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
    }

    item.onmouseenter = () => {
      if (index !== currentLayerIndex) item.style.background = "rgba(255,255,255,0.1)";
    };
    item.onmouseleave = () => {
      if (index !== currentLayerIndex) item.style.background = "transparent";
    };

    item.onclick = () => {
      clearMapLayers();
      
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(layers[index].provider);
      currentLayerIndex = index;
      updateLayersMenu();
      layersMenu.style.display = 'none';
      
      if (layers[currentLayerIndex].onSelect) {
        layers[currentLayerIndex].onSelect();
      }
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
    destination: Cesium.Cartesian3.fromDegrees(85.9558, 51.9547, 2000),
    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-25), roll: 0 }
  });

  const homeButton = viewer.homeButton.viewModel;
  homeButton.command.beforeExecute.addEventListener(function(commandInfo) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(85.9558, 51.9547, 5000),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
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

  // --- Здания с анимацией по году постройки ---
  Cesium.GeoJsonDataSource.load(
    'https://cdn.jsdelivr.net/gh/ekrss04/Data-/Buildings.geojson',
    { clampToGround: false }
  ).then(dataSource => {
    dataSource.name = 'Buildings';
    viewer.dataSources.add(dataSource);
    const entities = dataSource.entities.values;
    const now = Cesium.JulianDate.now();

    entities.forEach(entity => {
      if (!entity.polygon || !entity.properties) return;
      const props = entity.properties.getValue(now);
      let height = parseFloat(props["Высота здания"]) || 10;
      const yearStr = props["Год постройки"];
      
      // Настройки полигона
      entity.polygon.height = 0;
      entity.polygon.extrudedHeight = height;
      entity.polygon.outline = false;
      const color = props["Color"] || "#ffffff";
      
      entity.originalColor = Cesium.Color.fromCssColorString(color).withAlpha(0.95);
      entity.polygon.material = entity.originalColor;
      
      // Добавляем временной интервал на основе года постройки
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
      
      entity.description = `<b>${props["Здание"] || "Здание"}</b><br>Высота: ${height} м<br>Адрес: ${props["Адрес"] || ""}<br>Год постройки: ${yearStr || "не указан"}`;
    });
    
    console.log("Здания загружены с временными интервалами");
  }).catch(() => {});

  // --- 3D модели с временными интервалами ---
  function addModel(name, url, lon, lat, rot, scale, year) {
    const pos = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
    const orient = Cesium.Transforms.headingPitchRollQuaternion(pos, new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(rot), 0, 0));
    viewer.entities.add({
      name, 
      position: pos, 
      orientation: orient,
      availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
        start: Cesium.JulianDate.fromIso8601(`${year}-01-01T00:00:00Z`),
        stop: Cesium.JulianDate.fromIso8601("2027-01-01T00:00:00Z")
      })]),
      model: { uri: url, scale }
    });
  }

  addModel("Правительство", "https://raw.githubusercontent.com/ekrss04/Data-/main/Правительство.glb", 85.9643593, 51.9577677, 89.959, 0.62, 1935);
  addModel("Прокуратура", "https://raw.githubusercontent.com/ekrss04/Data-/main/Прокуратура.glb", 85.9592711, 51.9567825, 91.673, 0.6, 2016);
  addModel("Голубой Алтай", "https://raw.githubusercontent.com/ekrss04/Data-/main/Голубой Алтай.glb", 85.9592352, 51.9519572, 70, 0.66, 1962);
  addModel("Дом культуры", "https://raw.githubusercontent.com/ekrss04/Data-/main/Дом%20культуры.glb", 85.961289, 51.9527243, 60.114, 0.616, 1970);
  addModel("Администрация", "https://raw.githubusercontent.com/ekrss04/Data-/main/Администрация.glb", 85.9602147, 51.9592017, 90.073, 0.615, 1985);
  addModel("Лавка купца Тобокова", "https://raw.githubusercontent.com/ekrss04/Data-/main/Лавка%20Тобокова.glb", 85.9653642, 51.9520659, -81.488, 0.61, 1887);

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
    viewer.camera.flyTo({ destination, orientation: { heading: viewer.camera.heading, pitch: 0, roll: 0 }, duration: 1.5 });
  };

  // Geocoder
  const customGeocoderContainer = document.createElement("div");
  customGeocoderContainer.style.cssText = `position: absolute; display: none; z-index: 1001;`;
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
    btn.addEventListener('mouseenter', () => { btn.style.opacity = '0.6'; btn.style.backgroundColor = 'rgba(255,255,255,0.2)'; });
    btn.addEventListener('mouseleave', () => { if (!btn.classList.contains('active')) { btn.style.opacity = '0.3'; btn.style.backgroundColor = 'transparent'; } });
  });

  // --- Увеличение фото ---
  function enlargePhoto(src, alt) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:3000;display:flex;justify-content:center;align-items:center;cursor:pointer;background:rgba(0,0,0,0.8);';
    const img = document.createElement('img');
    img.src = src; img.alt = alt;
    img.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain;border-radius:8px;';
    overlay.appendChild(img); document.body.appendChild(overlay);
    overlay.addEventListener('click', () => document.body.removeChild(overlay));
  }

  // --- Модальные окна периодов ---
  let currentModal = null;
  function openModal(id) { if (currentModal) currentModal.style.display = 'none'; const m = document.getElementById(id); if (m) { m.style.display = 'block'; currentModal = m; m.querySelector('.modal-description')?.scrollTo(0,0); } }
  function closeModal() { if (currentModal) { currentModal.style.display = 'none'; currentModal = null; } }

  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const year = parseInt(btn.dataset.year);
      const map = {1850:'modalAltai',1921:'modalMerchant',1991:'modalSoviet',2026:'modalModern',2027:'modalModern'};
      if (map[year]) openModal(map[year]);
    });
  });
  document.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); }));
  document.querySelectorAll('.period-modal').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) closeModal(); }));
  document.querySelectorAll('.modal-image').forEach(i => i.addEventListener('click', (e) => { e.stopPropagation(); enlargePhoto(i.src, i.alt); }));

  // --- Попапы для объектов ---
  let currentPopup = null;
  
  function openBuildingPopup(title, desc) {
    closeAllPopups();
    
    const p = document.getElementById('buildingPopup'); 
    if (p) {
      document.getElementById('buildingTitle').textContent = title; 
      document.getElementById('buildingDescription').innerHTML = desc; 
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
        desc: 'Кинотеатр Голубой Алтай открыт 13 июня 1962 года. Своим фасадом и пропорциями напоминает виллы Андреа Палладио, который в свою очередь, вдохновился римским Пантеоном. Историческая и культурная ценность кинотеатра «Голубой Алтай» в Горно-Алтайске заключается в его длительной истории и роли в культурной жизни города. Здесь показывали художественные, документальные и научно-популярные фильмы. Параллельно в кинотеатре проводили зрительские и читательские конференции, киноутренники для детей и концерты.', 
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
        
        // --- УНИФИЦИРОВАННЫЙ РАЗМЕР ФОТО ---
        const img = document.getElementById('modelImage');
        img.src = data[name].img;
        img.alt = name;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '180px'; // Фиксируем максимальную высоту как у фото в периодах
        img.style.width = 'auto';
        img.style.height = 'auto';
        img.style.objectFit = 'contain';
        
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
    const o = viewer.scene.pick(m.position);
    if (o?.id) {
      if (o.id.polygon && o.id.description) {
        const d = o.id.description.getValue(viewer.clock.currentTime);
        const n = o.id.properties?.getValue(viewer.clock.currentTime)["Здание"] || "Здание";
        openBuildingPopup(n, d);
      } else if (o.id.model && o.id.name) {
        openModelPopup(o.id.name);
      }
    } else {
      closeAllPopups();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllPopups();
      closeModal();
    }
  });

  document.querySelectorAll('.popup-close').forEach(b => b.addEventListener('click', (e) => { 
    e.stopPropagation(); 
    closeAllPopups(); 
  }));
  
  document.querySelectorAll('.popup-container').forEach(p => p.addEventListener('click', (e) => { 
    if (e.target === p) closeAllPopups();
  }));
  document.getElementById('modelImage')?.addEventListener('click', (e) => { e.stopPropagation(); enlargePhoto(e.target.src, e.target.alt); });
};