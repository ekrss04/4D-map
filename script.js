window.onload = function () {
  // --- Cesium токен ---
  Cesium.Ion.defaultAccessToken = "YOUR_TOKEN_HERE";

  // --- Viewer ---
  const viewer = new Cesium.Viewer("cesiumContainer", {
    baseLayerPicker: false,
    timeline: true, // Включаем стандартную шкалу времени
    animation: false, // Отключаем стандартную анимацию (будет кастомный плеер)
    geocoder: true,
    homeButton: true,
    navigationHelpButton: false,
    sceneModePicker: true,
    fullscreenButton: true, // Включаем кнопку полноэкранного режима
    terrainProvider: new Cesium.EllipsoidTerrainProvider()
  });

  // Скрываем стандартные кнопки (будут кастомные)
  viewer.homeButton.container.style.display = 'none';
  viewer.sceneModePicker.container.style.display = 'none';
  viewer.geocoder.container.style.display = 'none';
  
  // Скрываем стандартный контроллер анимации
  if (viewer.animation) {
    viewer.animation.container.style.display = "none";
  }

  // --- Настройка анимации ---
  viewer.clock.shouldAnimate = false;
  viewer.clock.multiplier = 1;

  // --- Удаляем стандартные слои ---
  viewer.imageryLayers.removeAll();

  // Создаем слои
  const layers = [
    {
      name: "Carto Positron",
      provider: new Cesium.UrlTemplateImageryProvider({
        url: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      }),
      icon: "https://raw.githubusercontent.com/ekrss04/Data-/main/visual/icons_1/map-light.svg"
    },
    {
      name: "OSM",
      provider: new Cesium.OpenStreetMapImageryProvider({
        url: "https://a.tile.openstreetmap.org/"
      }),
      icon: "https://raw.githubusercontent.com/ekrss04/Data-/main/visual/icons_1/map-street.svg"
    },
    {
      name: "Carto Dark Matter",
      provider: new Cesium.UrlTemplateImageryProvider({
        url: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      }),
      icon: "https://raw.githubusercontent.com/ekrss04/Data-/main/visual/icons_1/map-dark.svg"
    }
  ];

  // Добавляем первый слой по умолчанию
  let currentLayerIndex = 0;
  viewer.imageryLayers.addImageryProvider(layers[currentLayerIndex].provider);

  // Создаем контейнер для меню слоев
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
    min-width: 180px;
  `;

  // Добавляем опции слоев
  layers.forEach((layer, index) => {
    const layerOption = document.createElement("div");
    layerOption.style.cssText = `
      display: flex;
      align-items: center;
      padding: 8px 12px;
      margin: 2px 0;
      border-radius: 4px;
      cursor: pointer;
      color: white;
      font-family: sans-serif;
      font-size: 14px;
      transition: background 0.2s;
    `;
    
    layerOption.innerHTML = `
      <div style="width: 20px; height: 20px; margin-right: 10px; 
                  background-image: url(${layer.icon});
                  background-size: contain; background-repeat: no-repeat; background-position: center;"></div>
      <span>${layer.name}</span>
    `;
    
    if (index === currentLayerIndex) {
      layerOption.style.background = "rgba(66, 133, 244, 0.3)";
      layerOption.innerHTML += `<span style="margin-left: auto; font-size: 12px;">✓</span>`;
    }
    
    layerOption.onmouseenter = () => {
      if (index !== currentLayerIndex) {
        layerOption.style.background = "rgba(255,255,255,0.1)";
      }
    };
    
    layerOption.onmouseleave = () => {
      if (index !== currentLayerIndex) {
        layerOption.style.background = "transparent";
      }
    };
    
    layerOption.onclick = () => {
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(layers[index].provider);
      currentLayerIndex = index;
      updateLayersMenu();
      layersMenu.style.display = 'none';
    };
    
    layersMenu.appendChild(layerOption);
  });
  
  document.body.appendChild(layersMenu);
  
  function updateLayersMenu() {
    const options = layersMenu.children;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      option.style.background = i === currentLayerIndex ? 
        "rgba(66, 133, 244, 0.3)" : "transparent";
      
      const checkmark = option.querySelector('span:last-child');
      if (checkmark && checkmark.textContent === '✓') {
        checkmark.remove();
      }
      
      if (i === currentLayerIndex) {
        const checkmarkSpan = document.createElement("span");
        checkmarkSpan.style.cssText = "margin-left: auto; font-size: 12px;";
        checkmarkSpan.textContent = "✓";
        option.appendChild(checkmarkSpan);
      }
    }
  }

  // --- Камера на Горно-Алтайск ---
  const lat = 51.9547;
  const lon = 85.9558;
  const height = 2000;
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
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

  // --- Настройка таймлайна ---
  viewer.clock.startTime = Cesium.JulianDate.fromIso8601("1834-01-01T00:00:00Z");
  viewer.clock.stopTime = Cesium.JulianDate.fromIso8601("2027-01-01T00:00:00Z");
  viewer.clock.currentTime = Cesium.JulianDate.now();
  viewer.clock.multiplier = 1;
  viewer.clock.shouldAnimate = false;

  viewer.timeline.makeLabel = time => Cesium.JulianDate.toDate(time).getUTCFullYear().toString();
  setTimeout(() => viewer.timeline.zoomTo(viewer.clock.startTime, viewer.clock.stopTime), 300);

  // --- GeoJSON (старая версия, которая вам нравилась) ---
  const geojsonUrl = "https://cdn.jsdelivr.net/gh/ekrss04/Data-/Buildings1.geojson";
  Cesium.GeoJsonDataSource.load(geojsonUrl, { clampToGround: false })
    .then(dataSource => {
      viewer.dataSources.add(dataSource);
      const entities = dataSource.entities.values;
      const now = Cesium.JulianDate.now();
      entities.forEach(entity => {
        if (!entity.polygon || !entity.properties) return;
        const props = entity.properties.getValue(now);
        let height = parseFloat(props["Высота здания"]) || 10;
        entity.polygon.height = 0;
        entity.polygon.extrudedHeight = height;
        entity.polygon.outline = false;
        const color = props["Color"] || "#ffffff";
        entity.polygon.material = Cesium.Color.fromCssColorString(color).withAlpha(0.95);

        if (props["1"]) {
          entity.availability = new Cesium.TimeIntervalCollection([ new Cesium.TimeInterval({
            start: Cesium.JulianDate.fromIso8601(props["1"]),
            stop: Cesium.JulianDate.fromIso8601("2027-01-01")
          })]);
        }

        entity.description = `<b>${props["Здание"] || "Здание"}</b><br>
          Высота: ${height} м<br>
          Адрес: ${props["Адрес"] || ""}<br>
          Год: ${props["Год постройки"] || ""}<br>
          Цвет: ${color}`;
      });
    })
    .catch(err => console.error("Ошибка загрузки GeoJSON:", err));

  // --- 3D модели ---
  function addModel(name, url, lon, lat, rot, scale, year) {
    const pos = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
    const orient = Cesium.Transforms.headingPitchRollQuaternion(pos, new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(rot), 0, 0));
    viewer.entities.add({
      name, position: pos, orientation: orient,
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

  // --- Кастомные кнопки UI ---
  const btnHome = document.getElementById("btnHome");
  const btnLayers = document.getElementById("btnLayers");
  const btnWalk = document.getElementById("btnWalk");
  const btnGeocoder = document.getElementById("btnGeocoder");

  // Home
  btnHome.onclick = () => homeButton.command();

  // Layers
  btnLayers.onclick = (e) => {
    e.stopPropagation();
    
    if (layersMenu.style.display === 'none' || layersMenu.style.display === '') {
      const btnRect = btnLayers.getBoundingClientRect();
      layersMenu.style.top = (btnRect.bottom + 5) + 'px';
      layersMenu.style.right = (window.innerWidth - btnRect.right) + 'px';
      layersMenu.style.display = 'block';
      
      const closeHandler = (event) => {
        if (!layersMenu.contains(event.target) && event.target !== btnLayers) {
          layersMenu.style.display = 'none';
          document.removeEventListener('click', closeHandler);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', closeHandler);
      }, 10);
    } else {
      layersMenu.style.display = 'none';
    }
  };

  // Walk
  btnWalk.onclick = () => {
    const carto = Cesium.Cartographic.fromCartesian(viewer.camera.position);
    const destination = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, 1.7);
    viewer.camera.flyTo({
      destination,
      orientation: { heading: viewer.camera.heading, pitch: 0, roll: 0 },
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
    
    if (customGeocoderContainer.style.display === 'none' || customGeocoderContainer.style.display === '') {
      const btnRect = btnGeocoder.getBoundingClientRect();
      customGeocoderContainer.style.top = (btnRect.bottom + 5) + 'px';
      customGeocoderContainer.style.right = (window.innerWidth - btnRect.right) + 'px';
      customGeocoderContainer.style.display = 'block';
      
      const input = standardGeocoder.querySelector('input');
      if (input) {
        input.focus();
      }
      
      const closeHandler = (event) => {
        if (!customGeocoderContainer.contains(event.target) && event.target !== btnGeocoder) {
          customGeocoderContainer.style.display = 'none';
          document.removeEventListener('click', closeHandler);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', closeHandler);
      }, 10);
    } else {
      customGeocoderContainer.style.display = 'none';
    }
  };

 // ========== КАСТОМНЫЙ ПЛЕЕР ==========
let isPlaying = false;
let currentSpeed = 0;

function pauseAnimation() {
  viewer.clock.shouldAnimate = false;
  isPlaying = false;
  updatePlayerButtons('pause');
  console.log('Анимация остановлена');
}

function playSlowAnimation() {
  // Если уже на 2027 году, сбрасываем на 1834
  if (Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
    viewer.clock.currentTime = viewer.clock.startTime;
  }
  
  viewer.clock.multiplier = 1000000; // Медленная скорость
  viewer.clock.shouldAnimate = true;
  isPlaying = true;
  currentSpeed = 1000000;
  updatePlayerButtons('play');
  console.log('Запущена медленная анимация с 1834 года');
}

function playFastAnimation() {
  // Если уже на 2027 году, сбрасываем на 1834
  if (Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
    viewer.clock.currentTime = viewer.clock.startTime;
  }
  
  viewer.clock.multiplier = 100000000; // Ускоренная скорость
  viewer.clock.shouldAnimate = true;
  isPlaying = true;
  currentSpeed = 100000000;
  updatePlayerButtons('fast');
  console.log('Запущена ускоренная анимация (100,000,000x) с 1834 года');
}

function goToToday() {
  viewer.clock.shouldAnimate = false;
  viewer.clock.currentTime = Cesium.JulianDate.now();
  viewer.timeline.updateFromClock();
  isPlaying = false;
  updatePlayerButtons('pause');
  console.log('Переход к текущей дате');
}

function updatePlayerButtons(activeBtn) {
  const buttons = document.querySelectorAll('.player-btn');
  buttons.forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeButton = document.querySelector(`.player-btn.${activeBtn}`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
}

// Автоматический сброс анимации при достижении конца
function checkAnimationReset() {
  if (isPlaying && Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
    // Достигли конца - сбрасываем на начало
    viewer.clock.currentTime = viewer.clock.startTime;
    console.log('Анимация достигла конца, сброс на 1834 год');
  }
}

// Инициализация плеера
function initPlayer() {
  const playerBtns = document.querySelectorAll('.player-btn');
  
  playerBtns.forEach(btn => {
    btn.onclick = () => {
      const action = btn.className.split(' ')[1];
      
      switch (action) {
        case "pause":
          pauseAnimation();
          break;
          
        case "play":
          playSlowAnimation();
          break;
          
        case "fast":
          playFastAnimation();
          break;
          
        case "end":
          goToToday();
          break;
      }
    };
    
    // Добавляем подсказки
    btn.addEventListener('mouseenter', function() {
      let title = '';
      const action = this.className.split(' ')[1];
      
      switch (action) {
        case "pause": title = 'Остановить анимацию'; break;
        case "play": title = 'Медленная анимация с 1834 года'; break;
        case "fast": title = 'Ускоренная анимация (100,000,000x) с 1834 года'; break;
        case "end": title = 'Перейти к текущей дате'; break;
      }
      this.title = title;
    });
  });
  
  // Инициализируем кнопку паузы как активную
  updatePlayerButtons('pause');
  
  // Запускаем проверку сброса анимации каждую секунду
  setInterval(checkAnimationReset, 1000);
}

// В разделе инициализации добавьте:
setTimeout(() => {
  initTimeline();
  initPlayer(); // Инициализируем плеер
}, 1000);
  // ========== ТАЙМЛАЙН ПЕРИОДОВ ==========
let currentPeriod = 2027; 
function goToYear(targetYear) {
  console.log(`Переход к году: ${targetYear}`);
  
  const targetDate = Cesium.JulianDate.fromIso8601(`${targetYear}-01-01T00:00:00Z`);
  
  viewer.clock.currentTime = targetDate;
  viewer.clock.shouldAnimate = false; // Останавливаем анимацию
  
  updatePeriodButtons(targetYear);
  currentPeriod = targetYear;
}

function updatePeriodButtons(activeYear) {
  const buttons = document.querySelectorAll('.period-btn');
  buttons.forEach(btn => {
    const year = parseInt(btn.dataset.year);
    if (year === activeYear) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function initTimeline() {
  const buttons = document.querySelectorAll('.period-btn');
  
  buttons.forEach(btn => {
    const year = parseInt(btn.dataset.year);
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToYear(year);
    });
  });
  
  updatePeriodButtons(currentPeriod);
}

// Инициализация таймлайна
setTimeout(() => {
  initTimeline();
}, 1000);
  // ========== ВСПЛЫВАЮЩИЕ ОКНА ПЕРИОДОВ ==========
let currentModal = null;

// Функция для открытия модального окна
function openModal(modalId) {
  // Закрываем текущее модальное окно, если оно открыто
  if (currentModal) {
    currentModal.style.display = 'none';
  }
  
  // Открываем новое
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    currentModal = modal;
    
    // Прокручиваем описание в начало
    const description = modal.querySelector('.modal-description');
    if (description) {
      description.scrollTop = 0;
    }
  }
}

// Функция для закрытия модального окна
function closeModal() {
  if (currentModal) {
    currentModal.style.display = 'none';
    currentModal = null;
  }
}

// Инициализация модальных окон
function initModals() {
  // Назначаем обработчики на кнопки периодов
  const periodButtons = document.querySelectorAll('.period-btn');
  
  periodButtons.forEach(btn => {
    const year = parseInt(btn.dataset.year);
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Определяем какое модальное окно открывать по году
      let modalId = '';
      switch(year) {
        case 1850:
          modalId = 'modalAltai';
          break;
        case 1921:
          modalId = 'modalMerchant';
          break;
        case 1991:
          modalId = 'modalSoviet';
          break;
        case 2026:
        case 2027:
          modalId = 'modalModern';
          break;
      }
      
      if (modalId) {
        openModal(modalId);
      }
    });
  });
  
  // Назначаем обработчики закрытия на все крестики
  const closeButtons = document.querySelectorAll('.close-modal');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });
  });
  
  // Закрытие при клике на фон (только если клик именно на фон)
  const modals = document.querySelectorAll('.period-modal');
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      // Проверяем, что клик был именно на фоне модального окна, а не на контенте
      if (e.target === modal) {
        closeModal();
      }
    });
  });
  
  // Обработчики для увеличения изображений при клике
  const modalImages = document.querySelectorAll('.modal-image');
  modalImages.forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const src = img.src;
      const alt = img.alt;
      
      // Создаем модальное окно для увеличенного изображения
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 3000;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
      `;
      
      const enlargedImg = document.createElement('img');
      enlargedImg.src = src;
      enlargedImg.alt = alt;
      enlargedImg.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      `;
      
      overlay.appendChild(enlargedImg);
      document.body.appendChild(overlay);
      
      // Закрытие при клике
      overlay.addEventListener('click', () => {
        document.body.removeChild(overlay);
      });
    });
  });
}

// В конце функции window.onload добавьте:
setTimeout(() => {
  initTimeline();
  initPlayer();
  initModals(); // Инициализируем модальные окна
}, 1000);
  
};