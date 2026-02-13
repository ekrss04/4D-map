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

  let currentLayerIndex = 0;
  viewer.imageryLayers.addImageryProvider(layers[currentLayerIndex].provider);

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

  // --- GeoJSON ---
  const geojsonUrl = "https://cdn.jsdelivr.net/gh/ekrss04/Data-/Buildings.geojson";
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
  }

  function playSlowAnimation() {
    if (Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
      viewer.clock.currentTime = viewer.clock.startTime;
    }
    
    viewer.clock.multiplier = 1000000;
    viewer.clock.shouldAnimate = true;
    isPlaying = true;
    currentSpeed = 1000000;
    updatePlayerButtons('play');
  }

  function playFastAnimation() {
    if (Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
      viewer.clock.currentTime = viewer.clock.startTime;
    }
    
    viewer.clock.multiplier = 100000000;
    viewer.clock.shouldAnimate = true;
    isPlaying = true;
    currentSpeed = 100000000;
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
    const buttons = document.querySelectorAll('.player-btn');
    buttons.forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`.player-btn.${activeBtn}`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  function checkAnimationReset() {
    if (isPlaying && Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
      viewer.clock.currentTime = viewer.clock.startTime;
    }
  }

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
    
    updatePlayerButtons('pause');
    setInterval(checkAnimationReset, 1000);
  }

  // ========== ТАЙМЛАЙН ПЕРИОДОВ ==========
  let currentPeriod = 2027; 

  function goToYear(targetYear) {
    const targetDate = Cesium.JulianDate.fromIso8601(`${targetYear}-01-01T00:00:00Z`);
    viewer.clock.currentTime = targetDate;
    viewer.clock.shouldAnimate = false;
    updatePeriodButtons(targetYear);
    currentPeriod = targetYear;
  }

  function updatePeriodButtons(activeYear) {
    const buttons = document.querySelectorAll('.period-btn');
    buttons.forEach(btn => {
      const year = parseInt(btn.dataset.year);
      if (year === activeYear) {
        btn.classList.add('active');
        btn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        btn.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
      } else {
        btn.classList.remove('active');
        btn.style.backgroundColor = 'transparent';
        btn.style.boxShadow = 'none';
      }
    });
  }

  function initTimeline() {
    const buttons = document.querySelectorAll('.period-btn');
    
    buttons.forEach(btn => {
      const year = parseInt(btn.dataset.year);
      
      // Делаем кнопки видимыми
      btn.style.opacity = '0.3';
      btn.style.transition = 'all 0.3s ease';
      btn.style.cursor = 'pointer';
      
      // Эффекты при наведении
      btn.addEventListener('mouseenter', () => {
        btn.style.opacity = '0.5';
        btn.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        btn.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.2)';
      });
      
      btn.addEventListener('mouseleave', () => {
        if (!btn.classList.contains('active')) {
          btn.style.opacity = '0.3';
          btn.style.backgroundColor = 'transparent';
          btn.style.boxShadow = 'none';
        }
      });
      
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        goToYear(year);
      });
    });
    
    updatePeriodButtons(currentPeriod);
  }

  // ========== ПРОСТАЯ ФУНКЦИЯ УВЕЛИЧЕНИЯ ФОТО БЕЗ ФОНА ==========
  function enlargePhoto(src, alt) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
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
    `;
    
    overlay.appendChild(enlargedImg);
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
  }

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
        if (e.target === modal) {
          closeModal();
        }
      });
    });
    
    // Простая функция увеличения фото при клике
    const modalImages = document.querySelectorAll('.period-modal .modal-image');
    modalImages.forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        enlargePhoto(img.src, img.alt);
      });
    });
  }

  // ========== ВСПЛЫВАЮЩИЕ ОКНА ДЛЯ ЗДАНИЙ И МОДЕЛЕЙ ==========
  let currentPopup = null;

  function openBuildingPopup(title, description) {
    closeAllPopups();
    
    const popup = document.getElementById('buildingPopup');
    document.getElementById('buildingTitle').textContent = title;
    document.getElementById('buildingDescription').innerHTML = description;
    
    popup.style.display = 'block';
    currentPopup = popup;
  }

  function openModelPopup(modelName) {
    closeAllPopups();
    
    let description = '';
    let photoUrl = '';
    
    switch(modelName) {
      case 'Дом культуры':
        description = 'Городской дом культуры г. Горно-Алтайска открыт в 1950 году на базе ликвидированного национального театра для колхозников. Дом культуры выступает как центр праздничной жизни города, где проводятся концертные программы, народные гуляния, митинги и юбилеи.';
        photoUrl = 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/Дом_культуры.jpg?raw=true';
        break;
      case 'Голубой Алтай':
        description = 'Кинотеатр Голубой Алтай открыт 13 июня 1962 года. Своим фасадом и пропорциями напоминает виллы Андреа Палладио, который в свою очередь, вдохновился римским Пантеоном. Историческая и культурная ценность кинотеатра «Голубой Алтай» в Горно-Алтайске заключается в его длительной истории и роли в культурной жизни города. Здесь показывали художественные, документальные и научно-популярные фильмы. Параллельно в кинотеатре проводили зрительские и читательские конференции, киноутренники для детей и концерты.';
        photoUrl = 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/%D0%93%D0%BE%D0%BB%D1%83%D0%B1%D0%BE%D0%B9_%D0%90%D0%BB%D1%82%D0%B0%D0%B9.jpg?raw=true';
        break;
      case 'Правительство':
        description = 'Здание Правительства построено в 1935 году. По первоначальному замыслу, здание должно иметь 4-этажные боковые корпуса и 5-этажный главный корпус, украшенный символическими фигурами. Однако в процессе строительства в первоначальный вариант внесли изменения, и здание получилось более простым. На фасаде здания есть флорентийская мозаика с гербом Республики Алтай, на крыше здания развеваются флаги.';
        photoUrl = 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/%D0%9F%D1%80%D0%B0%D0%B2%D0%B8%D1%82%D0%B5%D0%BB%D1%8C%D1%81%D1%82%D0%B2%D0%BE.jpg?raw=true';
        break;
      case 'Администрация':
        description = 'Здание Администрации города Горно-Алтайска сдано в эксплуатацию 29 апреля 1969 года. Здание стало частью истории города и отражает некоторые этапы его развития, так как изначально в нем располагались горкома КПСС и горисполком. В ходе эксплуатации здание подняли на один этаж и перестроили фасад. В результате оно приобрело современный облик и хорошо вписалось в архитектурный ландшафт центра Горно-Алтайска.';
        photoUrl = 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/%D0%90%D0%B4%D0%BC%D0%B8%D0%BD%D0%B8%D1%81%D1%82%D1%80%D0%B0%D1%86%D0%B8%D1%8F.jpg?raw=true';
        break;
      case 'Прокуратура':
        description = 'Здание Прокуратуры Республики Алтай открыто 23 марта в городе Горно-Алтайске. В восьмиэтажном здании площадью более 6 тыс. кв. м разместились республиканская, межрайонная природоохранная и городская прокуратуры. Здание оснащено современными рабочими кабинетами, библиотекой, музеем, архивом, актовым и конференц-залами, спортзалом и парковкой. Фасад выполнен из современных материалов, а конструкция учитывает повышенную сейсмоактивность региона.';
        photoUrl = 'https://github.com/ekrss04/Data-/blob/main/visual/photo/models/%D0%9F%D1%80%D0%BE%D0%BA%D1%83%D1%80%D0%B0%D1%82%D1%83%D1%80%D0%B0.jpg?raw=true';
        break;
    }
    
    const popup = document.getElementById('modelPopup');
    document.getElementById('modelTitle').textContent = modelName;
    document.getElementById('modelDescription').textContent = description;
    
    const modelImage = document.getElementById('modelImage');
    modelImage.src = photoUrl;
    modelImage.alt = modelName;
    
    popup.style.display = 'block';
    currentPopup = popup;
  }

  function closeAllPopups() {
    const popups = document.querySelectorAll('.popup-container');
    popups.forEach(popup => {
      popup.style.display = 'none';
    });
    currentPopup = null;
  }

  // Обновленные обработчики кликов
  function initClickHandlers() {
    // Обработчик кликов по зданиям и моделям
    viewer.screenSpaceEventHandler.setInputAction(function(movement) {
      const pickedObject = viewer.scene.pick(movement.position);
      
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id;
        
        // Если это здание из GeoJSON
        if (entity.polygon && entity.description) {
          const description = entity.description.getValue(viewer.clock.currentTime);
          const name = entity.properties ? entity.properties.getValue(viewer.clock.currentTime)["Здание"] || "Здание" : "Здание";
          
          openBuildingPopup(name, description);
        }
        // Если это 3D модель
        else if (entity.model && entity.name) {
          openModelPopup(entity.name);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  // Инициализация всплывающих окон
  function initPopups() {
    // Обработчики закрытия на крестики
    const closeButtons = document.querySelectorAll('.popup-close');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllPopups();
      });
    });
    
    // Закрытие при клике на фон
    const popups = document.querySelectorAll('.popup-container');
    popups.forEach(popup => {
      popup.addEventListener('click', (e) => {
        if (e.target === popup) {
          closeAllPopups();
        }
      });
    });
    
    // Обработчик для увеличения фото моделей
    const modelImage = document.getElementById('modelImage');
    if (modelImage) {
      modelImage.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const src = modelImage.src;
        const alt = modelImage.alt;
        
        if (src && src !== '') {
          enlargePhoto(src, alt);
        }
      });
    }
  }

  // Инициализация всего
  setTimeout(() => {
    initTimeline();
    initPlayer();
    initModals();
    initClickHandlers();
    initPopups();
  }, 1000);
};