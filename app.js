import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const form = document.getElementById("json-form");
const textarea = document.getElementById("json-input");
const statusMessage = document.getElementById("status-message");
const itemsList = document.getElementById("items-list");
const viewerContainer = document.getElementById("viewer-container");
const summaryBar = document.getElementById("summary-bar");
const exampleTrigger = document.getElementById("example-trigger");
const exampleMenu = document.getElementById("example-menu");
const exampleDropdown = document.querySelector(".example-dropdown");
const resetViewBtn = document.getElementById("reset-view");
const toggleGravityBtn = document.getElementById("toggle-gravity");
const copyUrlBtn = document.getElementById("copy-url");
const exportScreenshotBtn = document.getElementById("export-screenshot");
const toastContainer = document.getElementById("toast-container");
const statsPanel = document.getElementById("stats-panel");
const statsContent = document.getElementById("stats-content");
const sidebar = document.querySelector(".sidebar");
const viewerBaseHeight = viewerContainer ? Math.max(viewerContainer.clientHeight || 0, 560) : 560;

// Physics simulation state
let gravityEnabled = false;
let physicsItems = [];
const GRAVITY = -98; // cm/s² (Earth gravity scaled)
const DAMPING = 0.8; // Bounce damping factor

const palette = [
  "#0ea5e9",
  "#f97316",
  "#34d399",
  "#a855f7",
  "#f43f5e",
  "#14b8a6",
  "#facc15"
];

const boxSizeConfigs = [
  { id: 1, length: 800, width: 600, height: 600 },
  { id: 2, length: 700, width: 500, height: 500 },
  { id: 3, length: 600, width: 400, height: 400 },
  { id: 4, length: 500, width: 400, height: 400 },
  { id: 5, length: 400, width: 300, height: 300 },
  { id: 6, length: 350, width: 250, height: 250 },
  { id: 7, length: 300, width: 200, height: 200 },
  { id: 8, length: 250, width: 200, height: 150 },
  { id: 9, length: 200, width: 150, height: 150 },
  { id: 10, length: 150, width: 100, height: 100 },
  { id: 11, length: 100, width: 100, height: 80 },
  { id: 12, length: 80, width: 80, height: 50 }
];

const examplePayloads = boxSizeConfigs.map((config) => {
  const payload = buildExamplePayload(config);
  const dimsLabel = `${(config.length / 10).toFixed(0)}×${(config.width / 10).toFixed(0)}×${(config.height / 10).toFixed(0)} cm`;
  return {
    label: `Caixa ${config.id} (${dimsLabel})`,
    payload
  };
});

textarea.value = JSON.stringify(examplePayloads[0].payload, null, 2);
let lastBox = null;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050915);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewerContainer.appendChild(renderer.domElement);

// resize handled via window events + manual calls to avoid resize loops

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
camera.position.set(160, 140, 180);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 40;
controls.maxDistance = 800;
controls.maxPolarAngle = Math.PI - 0.05;

const hemisphereLight = new THREE.HemisphereLight(0xfefce8, 0x111827, 0.8);
scene.add(hemisphereLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.1);
mainLight.position.set(140, 220, 160);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 500;
mainLight.shadow.camera.left = -200;
mainLight.shadow.camera.right = 200;
mainLight.shadow.camera.top = 200;
mainLight.shadow.camera.bottom = -200;
mainLight.shadow.bias = -0.0001;
scene.add(mainLight);

const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
rimLight.position.set(-120, 180, -200);
scene.add(rimLight);

const gridHelper = new THREE.GridHelper(800, 32, 0x475569, 0x1e293b);
scene.add(gridHelper);

const cleanupCallbacks = [];

// Raycaster for item interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredItem = null;
let selectedItem = null;
let itemMeshes = [];

populateExampleMenu();

const loadedFromQuery = loadPayloadFromQuery();

window.addEventListener("resize", autoResize);
autoResize();

// Mouse interaction events
viewerContainer.addEventListener("mousemove", onMouseMove);
viewerContainer.addEventListener("click", onMouseClick);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  handleJsonLoad();
});

exampleTrigger?.addEventListener("click", (event) => {
  event.stopPropagation();
  if (exampleMenu) {
    exampleMenu.hidden = !exampleMenu.hidden;
  }
});

document.addEventListener("click", (event) => {
  if (!exampleDropdown?.contains(event.target)) {
    if (exampleMenu && !exampleMenu.hidden) {
      exampleMenu.hidden = true;
    }
  }
});

resetViewBtn?.addEventListener("click", () => {
  resetCameraView();
});

toggleGravityBtn?.addEventListener("click", () => {
  gravityEnabled = !gravityEnabled;
  toggleGravityBtn.dataset.active = gravityEnabled.toString();

  if (gravityEnabled) {
    initializePhysics();
    showToast("🌍 Gravidade ativada - itens cairão!", "success");
  } else {
    stopPhysics();
    showToast("Gravidade desativada", "");
  }
});

copyUrlBtn?.addEventListener("click", () => {
  copyShareableUrl();
});

exportScreenshotBtn?.addEventListener("click", () => {
  exportSceneScreenshot();
});

if (!loadedFromQuery) {
  handleJsonLoad();
}

function handleJsonLoad() {
  try {
    const parsed = parsePayload(textarea.value);
    lastBox = parsed.box;
    const decoratedItems = decorateItems(parsed.box, parsed.items);
    renderScene(parsed.box, decoratedItems);
    updateItemList(decoratedItems);
    updateSummary(parsed.box, decoratedItems);
    focusCamera(parsed.box);
    const totalWeight = decoratedItems.reduce((sum, item) => sum + item.weight, 0);
    const overweight = totalWeight > parsed.box.maxWeight;
    const boxName = parsed.box.name ? `Caixa "${parsed.box.name}". ` : "";
    let message = `${boxName}Cena atualizada. ${decoratedItems.length} item(s). Peso total ${totalWeight.toFixed(1)}kg / capacidade ${parsed.box.maxWeight.toFixed(1)}kg.`;
    if (overweight) {
      message += " Atencao: peso excede o suportado.";
    }
    updateStatus(message, overweight ? "warning" : "success");
    autoResize();
  } catch (error) {
    console.error(error);
    updateStatus(error.message, "error");
  }
}

function parsePayload(rawText) {
  if (!rawText.trim()) {
    throw new Error("Cole um JSON valido antes de carregar.");
  }

  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch (err) {
    throw new Error(`JSON malformado: ${err.message}`);
  }

  if (!payload.box) {
    throw new Error("Campo 'box' e obrigatorio.");
  }

  const box = sanitizeBox(payload.box);

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Informe ao menos um item no array 'items'.");
  }

  const items = payload.items.map((item, index) => sanitizeItem(item, index));

  return { box, items };
}

function sanitizeBox(box) {
  const width = ensurePositiveNumber(box.width, "box.width");
  const height = ensurePositiveNumber(box.height, "box.height");
  const depth = ensurePositiveNumber(box.depth, "box.depth");
  const maxWeight = ensurePositiveNumber(box.maxWeight, "box.maxWeight");
  const position = sanitizeVector(box.position ?? { x: 0, y: 0, z: 0 }, "box.position");
  const name = typeof box.name === "string" && box.name.trim() ? box.name.trim() : undefined;

  return { width, height, depth, maxWeight, position, name };
}

function sanitizeItem(item, index) {
  if (!item || typeof item !== "object") {
    throw new Error(`Item na posicao ${index + 1} e invalido.`);
  }

  if (!item.position) {
    throw new Error(`Item '${item.name ?? item.id ?? index + 1}' esta sem o campo obrigatorio 'position'.`);
  }

  const width = ensurePositiveNumber(item.width, `items[${index}].width`);
  const height = ensurePositiveNumber(item.height, `items[${index}].height`);
  const depth = ensurePositiveNumber(item.depth, `items[${index}].depth`);
  const weight = ensurePositiveNumber(item.weight, `items[${index}].weight`);
  const position = sanitizeVector(item.position, `items[${index}].position`);

  const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : `item-${index + 1}`;
  const name = typeof item.name === "string" && item.name.trim() ? item.name.trim() : id;

  return { id, name, width, height, depth, weight, position };
}

function ensurePositiveNumber(value, label) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`${label} deve ser um numero maior que 0.`);
  }
  return num;
}

function sanitizeVector(value, label) {
  if (!value || typeof value !== "object") {
    throw new Error(`${label} deve ser um objeto com x, y e z.`);
  }
  const coords = { x: 0, y: 0, z: 0 };
  ["x", "y", "z"].forEach((axis) => {
    const num = Number(value[axis]);
    if (!Number.isFinite(num)) {
      throw new Error(`${label}.${axis} deve ser um numero.`);
    }
    coords[axis] = num;
  });
  return coords;
}

function decorateItems(box, items) {
  return items.map((item, index) => {
    const color = palette[index % palette.length];
    const outside = isOutsideBox(box, item);
    const collisions = detectCollisions(item, items, index);
    const hasCollision = collisions.length > 0;
    return { ...item, color, outside, hasCollision, collisions };
  });
}

function detectCollisions(item, allItems, currentIndex) {
  const collisions = [];

  for (let i = 0; i < allItems.length; i++) {
    if (i === currentIndex) continue;

    const other = allItems[i];
    if (checkAABBCollision(item, other)) {
      collisions.push(other.id || `item-${i + 1}`);
    }
  }

  return collisions;
}

function checkAABBCollision(item1, item2) {
  // Calculate bounds for item1
  const min1 = {
    x: item1.position.x - item1.width / 2,
    y: item1.position.y - item1.height / 2,
    z: item1.position.z - item1.depth / 2
  };
  const max1 = {
    x: item1.position.x + item1.width / 2,
    y: item1.position.y + item1.height / 2,
    z: item1.position.z + item1.depth / 2
  };

  // Calculate bounds for item2
  const min2 = {
    x: item2.position.x - item2.width / 2,
    y: item2.position.y - item2.height / 2,
    z: item2.position.z - item2.depth / 2
  };
  const max2 = {
    x: item2.position.x + item2.width / 2,
    y: item2.position.y + item2.height / 2,
    z: item2.position.z + item2.depth / 2
  };

  // Check for overlap on all axes
  return (
    min1.x < max2.x && max1.x > min2.x &&
    min1.y < max2.y && max1.y > min2.y &&
    min1.z < max2.z && max1.z > min2.z
  );
}

function isOutsideBox(box, item) {
  const dx = Math.abs(item.position.x - box.position.x);
  const dy = Math.abs(item.position.y - box.position.y);
  const dz = Math.abs(item.position.z - box.position.z);

  const fitsX = dx + item.width / 2 <= box.width / 2 + 0.0001;
  const fitsY = dy + item.height / 2 <= box.height / 2 + 0.0001;
  const fitsZ = dz + item.depth / 2 <= box.depth / 2 + 0.0001;

  return !(fitsX && fitsY && fitsZ);
}

function renderScene(box, items) {
  resetScene();
  alignGridWithFloor(box);

  const boxGroup = buildBox(box);
  scene.add(boxGroup);
  cleanupCallbacks.push(() => disposeObject(scene, boxGroup));

  const dimensions = buildDimensionHelpers(box);
  scene.add(dimensions);
  cleanupCallbacks.push(() => disposeObject(scene, dimensions));

  // Reset item meshes array
  itemMeshes = [];

  items.forEach((item) => {
    const mesh = buildItemMesh(item);
    mesh.userData.itemData = item; // Store item data for interaction
    scene.add(mesh);
    itemMeshes.push(mesh); // Track for raycasting
    cleanupCallbacks.push(() => disposeObject(scene, mesh));

    if (item.outside) {
      const outline = buildItemOutline(item);
      scene.add(outline);
      cleanupCallbacks.push(() => disposeObject(scene, outline));

      const outsideTag = buildOutsideTag(item);
      scene.add(outsideTag);
      cleanupCallbacks.push(() => disposeObject(scene, outsideTag));
    }
  });
}

function alignGridWithFloor(box) {
  const floorY = box.position.y - box.height / 2 - 0.5;
  gridHelper.position.y = floorY;
}

function buildBox(box) {
  const group = new THREE.Group();
  group.name = "box-group";

  const texture = createCardboardTexture();
  const baseMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    opacity: 0.65,
    color: 0xffffff,
    side: THREE.DoubleSide,
    metalness: 0.05,
    roughness: 0.85
  });

  const bottom = new THREE.Mesh(new THREE.PlaneGeometry(box.width, box.depth), baseMaterial.clone());
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.set(box.position.x, box.position.y - box.height / 2, box.position.z);
  bottom.receiveShadow = true;

  const back = new THREE.Mesh(new THREE.PlaneGeometry(box.width, box.height), baseMaterial.clone());
  back.position.set(box.position.x, box.position.y, box.position.z - box.depth / 2);
  back.receiveShadow = true;

  const front = back.clone();
  front.position.set(box.position.x, box.position.y, box.position.z + box.depth / 2);
  front.rotateY(Math.PI);
  front.receiveShadow = true;

  const left = new THREE.Mesh(new THREE.PlaneGeometry(box.depth, box.height), baseMaterial.clone());
  left.rotation.y = Math.PI / 2;
  left.position.set(box.position.x - box.width / 2, box.position.y, box.position.z);
  left.receiveShadow = true;

  const right = left.clone();
  right.position.set(box.position.x + box.width / 2, box.position.y, box.position.z);
  right.rotation.y = -Math.PI / 2;
  right.receiveShadow = true;

  [bottom, back, front, left, right].forEach((wall) => group.add(wall));

  const outlineGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(box.width, box.height, box.depth));
  const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.5 });
  const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
  outline.position.copy(new THREE.Vector3(box.position.x, box.position.y, box.position.z));
  group.add(outline);

  return group;
}

function buildDimensionHelpers(box) {
  const group = new THREE.Group();
  const corner = new THREE.Vector3(
    box.position.x - box.width / 2,
    box.position.y - box.height / 2,
    box.position.z + box.depth / 2
  );
  const epsilon = 0.1;

  const widthOffset = new THREE.Vector3(0, 0, 8);
  const depthOffset = new THREE.Vector3(-8, 0, 0);
  const heightOffset = widthOffset.clone().add(depthOffset);

  const widthStart = corner.clone().add(widthOffset);
  widthStart.y += epsilon;
  const widthEnd = widthStart.clone().add(new THREE.Vector3(box.width, 0, 0));

  const depthStart = corner.clone().add(depthOffset);
  depthStart.y += epsilon;
  const depthEnd = depthStart.clone().add(new THREE.Vector3(0, 0, -box.depth));

  const heightStart = corner.clone().add(heightOffset);
  heightStart.y += epsilon;
  const heightEnd = heightStart.clone().add(new THREE.Vector3(0, box.height, 0));

  const widthLine = createDimensionLine(widthStart, widthEnd, `Largura ${box.width} cm`);
  const depthLine = createDimensionLine(depthStart, depthEnd, `Profundidade ${box.depth} cm`);
  const heightLine = createDimensionLine(heightStart, heightEnd, `Altura ${box.height} cm`);

  group.add(widthLine, depthLine, heightLine);
  return group;
}

function createDimensionLine(start, end, label) {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineDashedMaterial({ color: 0x93c5fd, dashSize: 8, gapSize: 4, linewidth: 1, transparent: true, opacity: 0.9 });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();

  const labelSprite = createTextSprite(label, { background: "rgba(15,23,42,0.9)", color: "#f8fafc", fontSize: 64, padding: 20, scale: 0.2 });
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  labelSprite.position.copy(midpoint.clone().add(new THREE.Vector3(0, 4, 0)));

  const helperGroup = new THREE.Group();
  helperGroup.add(line, labelSprite);
  return helperGroup;
}

function buildItemMesh(item) {
  const geometry = new THREE.BoxGeometry(item.width, item.height, item.depth);

  // Determine emissive color based on state
  let emissiveColor = new THREE.Color(0x000000);
  let emissiveIntensity = 0;

  if (item.outside) {
    emissiveColor = new THREE.Color(0xb91c1c); // Red for outside
    emissiveIntensity = 0.45;
  } else if (item.hasCollision) {
    emissiveColor = new THREE.Color(0xf97316); // Orange for collision
    emissiveIntensity = 0.35;
  }

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(item.color),
    roughness: 0.45,
    metalness: 0.05,
    transparent: item.outside || item.hasCollision,
    opacity: item.outside || item.hasCollision ? 0.75 : 1,
    emissive: emissiveColor,
    emissiveIntensity: emissiveIntensity
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(item.position.x, item.position.y, item.position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = item.name;
  return mesh;
}

function buildItemOutline(item) {
  const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(item.width, item.height, item.depth));
  const material = new THREE.LineBasicMaterial({ color: 0xd90429 });
  const outline = new THREE.LineSegments(geometry, material);
  outline.position.set(item.position.x, item.position.y, item.position.z);
  return outline;
}

function buildOutsideTag(item) {
  const sprite = createTextSprite("FORA DA CAIXA", { background: "rgba(185,28,28,0.9)", color: "#ffffff", padding: 12 });
  sprite.position.set(item.position.x, item.position.y + item.height / 2 + 8, item.position.z);
  return sprite;
}

function createCardboardTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#c28b45";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#a26f32";
  for (let i = 0; i < size; i += 8) {
    ctx.fillRect(0, i, size, 2);
  }
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

function createTextSprite(text, options = {}) {
  const padding = options.padding ?? 8;
  const fontSize = options.fontSize ?? 38;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const font = `600 ${fontSize}px 'Inter', 'Segoe UI', sans-serif`;
  ctx.font = font;
  const textWidth = ctx.measureText(text).width;
  canvas.width = Math.ceil(textWidth + padding * 2);
  canvas.height = Math.ceil(fontSize + padding * 2);
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = options.background ?? "rgba(15,23,42,0.85)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = options.color ?? "#ffffff";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  const scaleFactor = options.scale ?? 0.12;
  sprite.scale.set(canvas.width * scaleFactor * 0.1, canvas.height * scaleFactor * 0.1, 1);
  return sprite;
}

function updateItemList(items) {
  if (!items.length) {
    itemsList.classList.add("empty");
    itemsList.textContent = "Nenhum item carregado.";
    return;
  }

  itemsList.classList.remove("empty");
  itemsList.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("div");
    let rowClass = "item-row";
    if (item.outside) rowClass += " outside";
    if (item.hasCollision) rowClass += " collision";
    row.className = rowClass;
    row.dataset.itemId = item.id; // For interaction tracking

    const colorTag = document.createElement("span");
    colorTag.className = "color-tag";
    colorTag.style.background = item.color;

    const details = document.createElement("div");
    details.className = "item-details";

    const title = document.createElement("strong");
    title.textContent = item.name;

    const meta = document.createElement("div");
    meta.className = "item-meta";
    const dims = `${item.width}x${item.height}x${item.depth} cm`;
    let metaText = `${dims} | ${item.weight} kg`;

    if (item.outside) {
      metaText += " | Fora da caixa";
    }
    if (item.hasCollision) {
      metaText += ` | ⚠️ Colisão (${item.collisions.length})`;
    }

    meta.textContent = metaText;

    details.appendChild(title);
    details.appendChild(meta);

    row.appendChild(colorTag);
    row.appendChild(details);
    itemsList.appendChild(row);
  });
}

function populateExampleMenu() {
  if (!exampleMenu) return;
  exampleMenu.innerHTML = "";
  examplePayloads.forEach((example, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = example.label;
    button.addEventListener("click", () => {
      textarea.value = JSON.stringify(example.payload, null, 2);
      updateStatus(`Exemplo ${index + 1} pronto. Clique em Carregar para visualizar.`, "");
      exampleMenu.hidden = true;
    });
    exampleMenu.appendChild(button);
  });
  exampleMenu.hidden = true;
}

function buildExamplePayload(config) {
  const width = Number((config.length / 10).toFixed(1));
  const depth = Number((config.width / 10).toFixed(1));
  const height = Number((config.height / 10).toFixed(1));
  const maxWeight = Number((Math.max(width, depth) * height * 0.4).toFixed(1));
  const items = createExampleItems(width, depth, height, config.id);
  return {
    box: {
      name: `Caixa ${config.id}`,
      width,
      height,
      depth,
      maxWeight,
      position: { x: 0, y: 0, z: 0 }
    },
    items
  };
}

function createExampleItems(width, depth, height, id) {
  const templates = [
    { ratio: 0.45, pos: { x: -width / 4, y: -height / 4, z: -depth / 4 } },
    { ratio: 0.35, pos: { x: width / 5, y: -height / 6, z: depth / 5 } },
    { ratio: 0.25, pos: { x: 0, y: height / 6, z: 0 } }
  ];

  return templates.map((template, index) => {
    const w = clampDimension(width * template.ratio);
    const h = clampDimension(height * template.ratio);
    const d = clampDimension(depth * template.ratio);
    return {
      id: `item-${id}-${index + 1}`,
      name: `Pacote ${String.fromCharCode(65 + index)}`,
      width: w,
      height: h,
      depth: d,
      weight: Number((Math.max(w * h * d / 5000, 1)).toFixed(1)),
      position: {
        x: Number(template.pos.x.toFixed(1)),
        y: Number(template.pos.y.toFixed(1)),
        z: Number(template.pos.z.toFixed(1))
      }
    };
  });
}

function clampDimension(value) {
  return Number(Math.max(4, value).toFixed(1));
}

function updateStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message${type ? " " + type : ""}`;
}

function focusCamera(box) {
  controls.target.set(box.position.x, box.position.y, box.position.z);
  controls.update();
}

function resetCameraView() {
  camera.position.set(160, 140, 180);
  if (lastBox) {
    focusCamera(lastBox);
  } else {
    controls.target.set(0, 0, 0);
    controls.update();
  }
}

function onMouseMove(event) {
  const rect = viewerContainer.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function onMouseClick(event) {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(itemMeshes);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    const itemData = clickedMesh.userData.itemData;

    // Toggle selection
    if (selectedItem === clickedMesh) {
      selectedItem = null;
      updateItemHighlight(clickedMesh, false, false);
    } else {
      // Deselect previous
      if (selectedItem) {
        updateItemHighlight(selectedItem, false, selectedItem === hoveredItem);
      }
      selectedItem = clickedMesh;
      updateItemHighlight(clickedMesh, true, false);
    }

    // Scroll to item in list
    scrollToItemInList(itemData.id);
  } else {
    // Click on empty space - deselect
    if (selectedItem) {
      updateItemHighlight(selectedItem, false, selectedItem === hoveredItem);
      selectedItem = null;
    }
  }
}

function updateInteractions() {
  if (!itemMeshes.length) return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(itemMeshes);

  if (intersects.length > 0) {
    const newHovered = intersects[0].object;

    if (hoveredItem !== newHovered) {
      // Remove hover from previous
      if (hoveredItem && hoveredItem !== selectedItem) {
        updateItemHighlight(hoveredItem, false, false);
      }

      // Add hover to new
      hoveredItem = newHovered;
      if (hoveredItem !== selectedItem) {
        updateItemHighlight(hoveredItem, false, true);
      }

      // Update cursor
      viewerContainer.style.cursor = 'pointer';

      // Highlight in list
      highlightItemInList(hoveredItem.userData.itemData.id, true);
    }
  } else {
    // No hover
    if (hoveredItem && hoveredItem !== selectedItem) {
      updateItemHighlight(hoveredItem, false, false);
      highlightItemInList(hoveredItem.userData.itemData.id, false);
    }
    hoveredItem = null;
    viewerContainer.style.cursor = 'default';
  }
}

function updateItemHighlight(mesh, isSelected, isHovered) {
  if (!mesh || !mesh.material) return;

  const itemData = mesh.userData.itemData;
  const baseColor = new THREE.Color(itemData.color);

  if (isSelected) {
    // Selected: bright emissive glow
    mesh.material.emissive = new THREE.Color(0xffffff);
    mesh.material.emissiveIntensity = 0.4;
    mesh.scale.set(1.05, 1.05, 1.05);
  } else if (isHovered) {
    // Hovered: subtle glow
    mesh.material.emissive = baseColor.clone().multiplyScalar(0.5);
    mesh.material.emissiveIntensity = 0.3;
    mesh.scale.set(1.02, 1.02, 1.02);
  } else {
    // Normal state
    if (itemData.outside) {
      mesh.material.emissive = new THREE.Color(0xb91c1c);
      mesh.material.emissiveIntensity = 0.45;
    } else {
      mesh.material.emissive = new THREE.Color(0x000000);
      mesh.material.emissiveIntensity = 0;
    }
    mesh.scale.set(1, 1, 1);
  }
}

function scrollToItemInList(itemId) {
  const itemRows = itemsList.querySelectorAll('.item-row');
  itemRows.forEach(row => {
    if (row.dataset.itemId === itemId) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

function highlightItemInList(itemId, highlight) {
  const itemRows = itemsList.querySelectorAll('.item-row');
  itemRows.forEach(row => {
    if (row.dataset.itemId === itemId) {
      if (highlight) {
        row.classList.add('hovered');
      } else {
        row.classList.remove('hovered');
      }
    }
  });
}

function resetScene() {
  cleanupCallbacks.splice(0).forEach((dispose) => dispose());
  updateSummary(null, []);
  // Reset interaction state
  hoveredItem = null;
  selectedItem = null;
  itemMeshes = [];
}

function disposeObject(parent, object) {
  if (!object) return;
  parent.remove(object);
  const materials = new Set();
  const textures = new Set();

  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    const mat = child.material;
    if (mat) {
      if (Array.isArray(mat)) {
        mat.forEach((m) => collectMaterial(m, materials, textures));
      } else {
        collectMaterial(mat, materials, textures);
      }
    }
  });

  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}

function collectMaterial(material, materials, textures) {
  if (!material) return;
  if (material.map) textures.add(material.map);
  if (material.alphaMap) textures.add(material.alphaMap);
  if (material.emissiveMap) textures.add(material.emissiveMap);
  materials.add(material);
}

function autoResize() {
  if (!viewerContainer) {
    return;
  }
  const width = viewerContainer.clientWidth;
  const viewportHeight = Math.max(window.innerHeight - 260, 420);
  const targetHeight = Math.max(viewerBaseHeight, viewportHeight);
  viewerContainer.style.height = `${targetHeight}px`;
  renderer.setSize(width, targetHeight);
  camera.aspect = width / targetHeight;
  camera.updateProjectionMatrix();
}

function loadPayloadFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const payloadParam = params.get("payload");
  if (!payloadParam) return false;

  let rawText = payloadParam;
  try {
    rawText = decodeURIComponent(payloadParam);
  } catch (err) {
    console.warn("Falha ao decodificar payload via query string.", err);
  }

  let jsonText = rawText.trim();
  if (!jsonText.startsWith("{")) {
    try {
      const decoded = atob(rawText);
      if (decoded.trim().startsWith("{")) {
        jsonText = decoded.trim();
      }
    } catch (err) {
      console.warn("Payload da query string não é Base64 válido.", err);
    }
  }

  try {
    JSON.parse(jsonText);
    textarea.value = jsonText;
    handleJsonLoad();
    updateStatus("Cena carregada automaticamente via query string.", "success");
    return true;
  } catch (error) {
    console.error("Falha no payload via query string.", error);
    updateStatus("Payload via query string inválido: " + error.message, "error");
    return false;
  }
}

function updateSummary(box, items) {
  if (!summaryBar) return;
  if (!box || !items.length) {
    summaryBar.classList.add("empty");
    summaryBar.textContent = "Nenhum dado carregado.";
    return;
  }
  summaryBar.classList.remove("empty");

  const weightTotal = items.reduce((sum, item) => sum + item.weight, 0).toFixed(1);
  const dims = `${box.width}×${box.depth}×${box.height} cm`;
  const namePart = box.name ? `${box.name} • ` : "";

  // Calculate space utilization
  const spaceAnalysis = calculateSpaceUtilization(box, items);
  const utilizationPercent = spaceAnalysis.utilizationPercent.toFixed(1);
  const efficiencyClass = spaceAnalysis.efficiency;
  const efficiencyEmoji = efficiencyClass === 'high' ? '🟢' : efficiencyClass === 'medium' ? '🟡' : '🔴';

  summaryBar.innerHTML = `
    <span>Caixa: <strong>${namePart}${dims}</strong></span>
    <span>Itens: <strong>${items.length}</strong></span>
    <span>Peso: <strong>${weightTotal} / ${box.maxWeight.toFixed(1)} kg</strong></span>
    <span>Volume: <strong>${utilizationPercent}%</strong> ${efficiencyEmoji}</span>
  `;

  // Update stats panel
  updateStatsPanel(box, items, spaceAnalysis);
}

function updateStatsPanel(box, items, spaceAnalysis) {
  if (!statsPanel || !statsContent) return;

  statsPanel.hidden = false;

  const weightTotal = items.reduce((sum, item) => sum + item.weight, 0);
  const weightPercent = ((weightTotal / box.maxWeight) * 100).toFixed(1);

  statsContent.innerHTML = `
    <div class="stat-row">
      <span class="stat-label">Volume da caixa:</span>
      <span class="stat-value">${spaceAnalysis.boxVolume.toLocaleString()} cm³</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Volume ocupado:</span>
      <span class="stat-value">${spaceAnalysis.itemsVolume.toLocaleString()} cm³</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Volume livre:</span>
      <span class="stat-value">${spaceAnalysis.unusedVolume.toLocaleString()} cm³</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Aproveitamento:</span>
      <span class="stat-value stat-highlight">${spaceAnalysis.utilizationPercent.toFixed(1)}%</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Peso utilizado:</span>
      <span class="stat-value">${weightPercent}%</span>
    </div>
  `;
}

function calculateSpaceUtilization(box, items) {
  // Calculate box volume
  const boxVolume = box.width * box.height * box.depth;

  // Calculate total items volume
  const itemsVolume = items.reduce((sum, item) => {
    return sum + (item.width * item.height * item.depth);
  }, 0);

  // Calculate utilization percentage
  const utilizationPercent = (itemsVolume / boxVolume) * 100;

  // Determine efficiency level
  let efficiency = 'low';
  if (utilizationPercent >= 70) {
    efficiency = 'high';
  } else if (utilizationPercent >= 40) {
    efficiency = 'medium';
  }

  return {
    boxVolume,
    itemsVolume,
    utilizationPercent,
    efficiency,
    unusedVolume: boxVolume - itemsVolume
  };
}

function copyShareableUrl() {
  try {
    const currentJson = textarea.value.trim();
    if (!currentJson) {
      showToast("Nenhum JSON carregado para compartilhar", "error");
      return;
    }

    // Validate JSON before encoding
    JSON.parse(currentJson);

    // Encode JSON to Base64
    const encoded = btoa(currentJson);
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?payload=${encodeURIComponent(encoded)}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast("✓ URL copiada para a área de transferência!", "success");
    }).catch(() => {
      // Fallback for older browsers
      const tempInput = document.createElement("input");
      tempInput.value = shareUrl;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      showToast("✓ URL copiada para a área de transferência!", "success");
    });
  } catch (error) {
    showToast("Erro ao gerar URL: " + error.message, "error");
  }
}

function exportSceneScreenshot() {
  try {
    if (!itemMeshes.length) {
      showToast("Carregue uma cena antes de exportar", "error");
      return;
    }

    // Render at higher resolution for better quality
    const originalSize = renderer.getSize(new THREE.Vector2());
    const scale = 2; // 2x resolution
    renderer.setSize(originalSize.x * scale, originalSize.y * scale);
    renderer.render(scene, camera);

    // Get image data
    const dataUrl = renderer.domElement.toDataURL("image/png");

    // Restore original size
    renderer.setSize(originalSize.x, originalSize.y);

    // Create download link
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    link.download = `packviz-3d-${timestamp}.png`;
    link.href = dataUrl;
    link.click();

    showToast("✓ Screenshot exportada com sucesso!", "success");
  } catch (error) {
    showToast("Erro ao exportar screenshot: " + error.message, "error");
  }
}

function showToast(message, type = "") {
  const toast = document.createElement("div");
  toast.className = `toast${type ? " " + type : ""}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease reverse";
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  }, 3000);
}

// Physics simulation functions
function initializePhysics() {
  if (!lastBox || !itemMeshes.length) {
    showToast("Carregue uma cena antes de ativar a gravidade", "error");
    gravityEnabled = false;
    toggleGravityBtn.dataset.active = "false";
    return;
  }

  // Initialize physics items with velocity
  physicsItems = itemMeshes.map(mesh => {
    const itemData = mesh.userData.itemData;
    return {
      mesh: mesh,
      data: itemData,
      velocity: { x: 0, y: 0, z: 0 },
      grounded: false
    };
  });
}

function stopPhysics() {
  physicsItems = [];
}

function updatePhysics(deltaTime) {
  if (!gravityEnabled || !physicsItems.length || !lastBox) return;

  const dt = Math.min(deltaTime, 0.033); // Cap at ~30fps for stability

  physicsItems.forEach(physItem => {
    if (physItem.grounded) return;

    // Apply gravity
    physItem.velocity.y += GRAVITY * dt;

    // Update position
    const newY = physItem.mesh.position.y + physItem.velocity.y * dt;

    // Calculate floor position (bottom of box)
    const floorY = lastBox.position.y - lastBox.height / 2 + physItem.data.height / 2;

    // Check collision with floor
    if (newY <= floorY) {
      physItem.mesh.position.y = floorY;
      physItem.velocity.y = -physItem.velocity.y * DAMPING;

      // Stop if velocity is very small
      if (Math.abs(physItem.velocity.y) < 1) {
        physItem.velocity.y = 0;
        physItem.grounded = true;
      }
    } else {
      // Check collision with other items below
      let collision = false;

      for (let other of physicsItems) {
        if (other === physItem || !other.grounded) continue;

        // Simple AABB check for items below
        if (checkItemBelow(physItem, other)) {
          const topY = other.mesh.position.y + other.data.height / 2 + physItem.data.height / 2;
          physItem.mesh.position.y = topY;
          physItem.velocity.y = -physItem.velocity.y * DAMPING;

          if (Math.abs(physItem.velocity.y) < 1) {
            physItem.velocity.y = 0;
            physItem.grounded = true;
          }
          collision = true;
          break;
        }
      }

      if (!collision) {
        physItem.mesh.position.y = newY;
      }
    }

    // Update item data position for collision detection
    physItem.data.position.y = physItem.mesh.position.y;
  });
}

function checkItemBelow(falling, below) {
  // Check if falling item is above and overlapping in X and Z
  const fallingMinX = falling.mesh.position.x - falling.data.width / 2;
  const fallingMaxX = falling.mesh.position.x + falling.data.width / 2;
  const fallingMinZ = falling.mesh.position.z - falling.data.depth / 2;
  const fallingMaxZ = falling.mesh.position.z + falling.data.depth / 2;

  const belowMinX = below.mesh.position.x - below.data.width / 2;
  const belowMaxX = below.mesh.position.x + below.data.width / 2;
  const belowMinZ = below.mesh.position.z - below.data.depth / 2;
  const belowMaxZ = below.mesh.position.z + below.data.depth / 2;

  const overlapX = fallingMinX < belowMaxX && fallingMaxX > belowMinX;
  const overlapZ = fallingMinZ < belowMaxZ && fallingMaxZ > belowMinZ;

  const fallingBottom = falling.mesh.position.y - falling.data.height / 2;
  const belowTop = below.mesh.position.y + below.data.height / 2;

  return overlapX && overlapZ && fallingBottom <= belowTop + 2 && fallingBottom >= belowTop - 2;
}

// Update animation loop to include physics
let lastTime = performance.now();

renderer.setAnimationLoop(() => {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;

  controls.update();
  updateInteractions();
  updatePhysics(deltaTime);
  renderer.render(scene, camera);
});
