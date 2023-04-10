import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as d3 from "d3";
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(5, 5, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function render() {
  controls.update();
  requestAnimationFrame(render);
  // 使用渲染器渲染相机看这个场景的内容渲染出来
  renderer.render(scene, camera);
}

render();

// 载入 json 文件
const loader = new THREE.FileLoader();
loader.load("./100000_full.json", (data) => {
  const jsonData = JSON.parse(data);
  operationData(jsonData);
});

const map = new THREE.Object3D();
function operationData(jsonData) {
  const features = jsonData.features;
  console.log(features);
  features.forEach((feature) => {
    // 创建省份
    const province = new THREE.Object3D();
    province.properties = feature.properties.name;

    // 获取经纬度坐标
    const coordinates = feature.geometry.coordinates;
    // 创建线框
    if (feature.geometry.type === "Polygon") {
      coordinates.forEach((coordinate) => {
        const mesh = createMesh(coordinate);
        mesh.properties = feature.properties.name;
        province.add(mesh);
        const line = createLine(coordinate);
        province.add(line);
      });
    }
    if (feature.geometry.type === "MultiPolygon") {
      coordinates.forEach((item) => {
        item.forEach((coor) => {
          const mesh = createMesh(coor);
          mesh.properties = feature.properties.name;
          province.add(mesh);
          const line = createLine(coor);
          province.add(line);
        });
      });
    }
    map.add(province);
  });
  scene.add(map);
}
const projection = d3.geoMercator().center([116.5, 38.5]).translate([0, 0, 0]);
function createMesh(polygon) {
  const shape = new THREE.Shape();
  polygon.forEach((row, i) => {
    const [x, y] = projection(row);
    if (i === 0) {
      shape.moveTo(x, -y);
    }
    shape.lineTo(x, -y);
  });
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 10,
  });
  const color = new THREE.Color(Math.random() * 0xffffff);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.5,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

function createLine(polygon) {
  const lineGeometry = new THREE.BufferGeometry();
  const pointsArray = new Array();
  polygon.forEach((row) => {
    const [x, y] = projection(row);
    // 创建三维点
    pointsArray.push(new THREE.Vector3(x, -y, 10));
  });
  // 放入多个点
  lineGeometry.setFromPoints(pointsArray);
  // 生成随机颜色
  const lineColor = new THREE.Color(
    Math.random() * 0.5 + 0.5,
    Math.random() * 0.5 + 0.5,
    Math.random() * 0.5 + 0.5
  );

  const lineMaterial = new THREE.LineBasicMaterial({
    color: lineColor,
  });
  return new THREE.Line(lineGeometry, lineMaterial);
}

let lastPicker = null;
window.addEventListener("click", (event) => {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(map.children);
  if (intersects.length) {
    if (lastPicker) {
      lastPicker.material.color.copy(lastPicker.material.oldColor);
    }
    lastPicker = intersects[0].object;
    lastPicker.material.oldColor = lastPicker.material.color.clone();
    lastPicker.material.color.set("#ffffff");
  } else {
    lastPicker.material.color.copy(lastPicker.material.oldColor);
  }
});
