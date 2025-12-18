window.onload = function () {
  // --- Cesium токен ---
  Cesium.Ion.defaultAccessToken = "YOUR_TOKEN_HERE";

  // --- Viewer ---
  const viewer = new Cesium.Viewer("cesiumContainer", {
    baseLayerPicker: true,
    timeline: true,
    animation: true,
    geocoder: true,
    homeButton: true,
    navigationHelpButton: false,
    sceneModePicker: true,
    terrainProvider: new Cesium.EllipsoidTerrainProvider()
  });

  // --- Остановим анимацию сразу ---
  viewer.clock.shouldAnimate = false;

  // --- Удаляем стандартные слои ---
  viewer.imageryLayers.removeAll();

  // Подложки
  const baseLayers = [];

  baseLayers.push(new Cesium.ProviderViewModel({
    name: "Carto Positron",
    iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/mapboxSatellite.png"),
    creationFunction: () => new Cesium.UrlTemplateImageryProvider({
      url: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
    })
  }));

  baseLayers.push(new Cesium.ProviderViewModel({
    name: "OSM",
    iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/openStreetMap.png"),
    creationFunction: () => new Cesium.OpenStreetMapImageryProvider({
      url: "https://a.tile.openstreetmap.org/"
    })
  }));

  baseLayers.push(new Cesium.ProviderViewModel({
    name: "Carto Dark Matter",
    iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/mapboxTerrain.png"),
    creationFunction: () => new Cesium.UrlTemplateImageryProvider({
      url: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
    })
  }));

  viewer.baseLayerPicker.viewModel.imageryProviderViewModels = baseLayers;
  viewer.baseLayerPicker.viewModel.selectedImagery = baseLayers[0];

  // Камера на Горно-Алтайск
  const lat = 51.9547;
  const lon = 85.9558;
  const height = 2000;

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-25),
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

  // Таймлайн на сегодня
  const today = Cesium.JulianDate.now();
  viewer.clock.currentTime = today;
  viewer.timeline.updateFromClock();

  // Кнопка "1834"
  const btn1834 = document.createElement("img");
  btn1834.src = "https://raw.githubusercontent.com/ekrss04/Data-/main/1834.png";
  btn1834.alt = "1834";
  btn1834.style.position = "absolute";
  btn1834.style.bottom = "114px";
  btn1834.style.left = "2px";
  btn1834.style.zIndex = "999";
  btn1834.style.width = "30px";
  btn1834.style.height = "30px";
  btn1834.style.cursor = "pointer";

  btn1834.onclick = function () {
    const t = Cesium.JulianDate.fromIso8601("1834-01-01T00:00:00Z");
    viewer.clock.currentTime = t;
    viewer.clock.multiplier = 100000000;
    viewer.clock.shouldAnimate = true;
    viewer.timeline.updateFromClock();
  };
  document.body.appendChild(btn1834);

  // GeoJSON 
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
          entity.availability = new Cesium.TimeIntervalCollection([
            new Cesium.TimeInterval({
              start: Cesium.JulianDate.fromIso8601(props["1"]),
              stop: Cesium.JulianDate.fromIso8601("2027-01-01")
            })
          ]);
        }

        entity.description = `<b>${props["Здание"] || "Здание"}</b><br>
          Высота: ${height} м<br>
          Адрес: ${props["Адрес"] || ""}<br>
          Год: ${props["Год постройки"] || ""}<br>
          Цвет: ${color}`;
      });

      viewer.clock.startTime = Cesium.JulianDate.fromIso8601("1834-01-01");
      viewer.clock.stopTime = Cesium.JulianDate.fromIso8601("2027-01-01");
      viewer.clock.currentTime = today;
      viewer.clock.multiplier = 100000000;
      viewer.clock.shouldAnimate = false;

      viewer.timeline.makeLabel = function(time) {
        return Cesium.JulianDate.toDate(time).getUTCFullYear().toString();
      };
      setTimeout(() => {
        viewer.timeline.zoomTo(viewer.clock.startTime, viewer.clock.stopTime);
      }, 300);
    })
    .catch(function (error) {
      console.error("Ошибка загрузки GeoJSON:", error);
    });
// -----------------------------------------------------
// 7️⃣ 3D модель — Правительство
// -----------------------------------------------------
const govModelUrl =
  "https://raw.githubusercontent.com/ekrss04/Data-/main/Правительство.glb";

const govLon = 85.9643593;
const govLat = 51.9577677;

const govPosition = Cesium.Cartesian3.fromDegrees(govLon, govLat, 0);

const govOrientation = Cesium.Transforms.headingPitchRollQuaternion(
  govPosition,
  new Cesium.HeadingPitchRoll(
    Cesium.Math.toRadians(89.959), // rotation
    0,
    0
  )
);

viewer.entities.add({
  name: "Правительство",
  position: govPosition,
  orientation: govOrientation,

  // 🕒 Год постройки — 1935
  availability: new Cesium.TimeIntervalCollection([
    new Cesium.TimeInterval({
      start: Cesium.JulianDate.fromIso8601("1935-01-01T00:00:00Z"),
      stop: Cesium.JulianDate.fromIso8601("2027-01-01T00:00:00Z")
    })
  ]),

  model: {
    uri: govModelUrl,
    scale: 0.62
  }
});

console.log("Модель «Правительство» (1935) загружена");

  // 3D модель Прокуратура
  const modelUrl = "https://raw.githubusercontent.com/ekrss04/Data-/main/Прокуратура.glb";
  const modelLon = 85.9592711;
  const modelLat = 51.9567825;
  const position = Cesium.Cartesian3.fromDegrees(modelLon, modelLat, 0);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(
    position,
    new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(91.673), 0, 0)
  );

  viewer.entities.add({
    name: "Прокуратура",
    position: position,
    orientation: orientation,
    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
      start: Cesium.JulianDate.fromIso8601("2016-01-01"),
      stop: Cesium.JulianDate.fromIso8601("2027-01-01")
    })]),
    model: { uri: modelUrl, scale: 0.6}
  });

  // Модель 2: Голубой Алтай
  const modelUrl2 = "https://raw.githubusercontent.com/ekrss04/Data-/main/Голубой Алтай.glb";
  const modelLon2 = 85.9592352;
  const modelLat2 = 51.9519572;
  const position2 = Cesium.Cartesian3.fromDegrees(modelLon2, modelLat2, 0);
  const orientation2 = Cesium.Transforms.headingPitchRollQuaternion(
    position2,
    new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(70), 0, 0)
  );

  viewer.entities.add({
    name: "Голубой Алтай",
    position: position2,
    orientation: orientation2,
    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
      start: Cesium.JulianDate.fromIso8601("1962-01-01T00:00:00Z"),
      stop: Cesium.JulianDate.fromIso8601("2027-01-01T00:00:00Z")
    })]),
    model: { 
      uri: modelUrl2, 
      scale: 0.66}
  });

  console.log("3D модель загружена");
}; // <-- Убедитесь, что эта фигурная скобка есть