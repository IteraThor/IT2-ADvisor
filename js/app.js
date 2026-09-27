/**
 * IT2 System BOM Configurator Application Logic
 * Implements dependency solver, dynamic BOM calculation, presets, and exports.
 */

// Application State
const state = {
  mounting: "mount_baseplate_wall",
  has_baseplate: true,
  vision: "vision_3cam_ov9732",
  ring: "ring_diy_standard",
  lighting_mode: "lighting_standard_white",
  compute: "compute_mini_pc",
  cable_routing: "cable_routing_baseplate",
  assembly_style: "fasteners_heat_inserts",
  baseplate_addons: ["addon_tpu_dampeners", "addon_hardware_bay"],
  activeTab: "all",
  activePreset: "preset_pro_silent"
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  renderPresets();
  renderConfigurator();
  bindGlobalEvents();
  applyRulesAndCalculateBOM();
});

// Render Quick Preset Buttons
function renderPresets() {
  const container = document.getElementById("preset-pills");
  if (!container) return;

  container.innerHTML = IT2_CATALOG.presets
    .map(
      (preset) => `
    <button type="button" 
            class="preset-pill ${state.activePreset === preset.id ? "active" : ""}" 
            data-preset="${preset.id}"
            id="preset-${preset.id}">
      <span class="preset-icon">${preset.icon}</span>
      <div class="preset-info">
        <span class="preset-name">${preset.name}</span>
        <span class="preset-tagline">${preset.tagline}</span>
      </div>
    </button>
  `
    )
    .join("");

  container.querySelectorAll(".preset-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const presetId = btn.getAttribute("data-preset");
      loadPreset(presetId);
    });
  });
}

// Load a specific preset configuration
function loadPreset(presetId) {
  const preset = IT2_CATALOG.presets.find((p) => p.id === presetId);
  if (!preset) return;

  Object.assign(state, JSON.parse(JSON.stringify(preset.config)));
  state.activePreset = presetId;

  // Refresh preset UI active state
  document.querySelectorAll(".preset-pills .preset-pill").forEach((el) => {
    el.classList.toggle("active", el.getAttribute("data-preset") === presetId);
  });

  renderConfigurator();
  applyRulesAndCalculateBOM();
}

// Render the progressive form cards
function renderConfigurator() {
  renderRadioGroup("mounting-options", "mounting", IT2_CATALOG.options.mounting);
  renderRadioGroup("vision-options", "vision", IT2_CATALOG.options.vision);
  renderRadioGroup("ring-options", "ring", IT2_CATALOG.options.ring);
  renderRadioGroup("lighting-options", "lighting_mode", IT2_CATALOG.options.lighting_mode);
  renderRadioGroup("compute-options", "compute", IT2_CATALOG.options.compute);
  renderRadioGroup("assembly-options", "assembly_style", IT2_CATALOG.options.assembly_style);
  renderBaseplateAddons();
  updateConditionalVisibility();
}

// Render a single radio card group
function renderRadioGroup(containerId, stateKey, options) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = options
    .map((opt) => {
      const isSelected = state[stateKey] === opt.id;
      return `
      <label class="choice-card ${isSelected ? "selected" : ""}" 
             data-key="${stateKey}" 
             data-val="${opt.id}"
             id="card-${opt.id}">
        <div class="card-radio">
          <input type="radio" name="${stateKey}" value="${opt.id}" ${isSelected ? "checked" : ""}>
          <span class="radio-custom"></span>
        </div>
        <div class="card-content">
          <div class="card-header-row">
            <span class="card-title">${opt.title}</span>
            ${opt.badge ? `<span class="badge badge-${opt.badgeType || "neutral"}">${opt.badge}</span>` : ""}
          </div>
          <p class="card-desc">${opt.desc}</p>
        </div>
      </label>
    `;
    })
    .join("");

  container.querySelectorAll(".choice-card").forEach((card) => {
    card.addEventListener("click", () => {
      const key = card.getAttribute("data-key");
      const val = card.getAttribute("data-val");
      state[key] = val;
      state.activePreset = null; // Custom configuration
      document.querySelectorAll(".preset-pill").forEach((p) => p.classList.remove("active"));
      renderConfigurator();
      applyRulesAndCalculateBOM();
    });
  });
}

// Render Baseplate Addon Checkboxes
function renderBaseplateAddons() {
  const container = document.getElementById("baseplate-addons-options");
  if (!container) return;

  container.innerHTML = IT2_CATALOG.options.baseplate_addons
    .map((addon) => {
      const isChecked = state.baseplate_addons.includes(addon.id);
      const isDisabled = !state.has_baseplate;
      return `
      <label class="choice-card checkbox-card ${isChecked && !isDisabled ? "selected" : ""} ${isDisabled ? "disabled" : ""}"
             data-addon="${addon.id}"
             id="addon-${addon.id}">
        <div class="card-radio">
          <input type="checkbox" value="${addon.id}" ${isChecked && !isDisabled ? "checked" : ""} ${isDisabled ? "disabled" : ""}>
          <span class="checkbox-custom"></span>
        </div>
        <div class="card-content">
          <div class="card-header-row">
            <span class="card-title">${addon.title}</span>
            ${addon.badge ? `<span class="badge badge-${addon.badgeType || "accent"}">${addon.badge}</span>` : ""}
          </div>
          <p class="card-desc">${addon.desc}</p>
          ${isDisabled ? `<span class="disabled-hint">⚠️ Requires IT2 Baseplate to be selected above</span>` : ""}
        </div>
      </label>
    `;
    })
    .join("");

  if (state.has_baseplate) {
    container.querySelectorAll(".choice-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        const addonId = card.getAttribute("data-addon");
        if (state.baseplate_addons.includes(addonId)) {
          state.baseplate_addons = state.baseplate_addons.filter((id) => id !== addonId);
        } else {
          state.baseplate_addons.push(addonId);
        }
        state.activePreset = null;
        document.querySelectorAll(".preset-pill").forEach((p) => p.classList.remove("active"));
        renderBaseplateAddons();
        applyRulesAndCalculateBOM();
      });
    });
  }
}

// Update UI state based on dynamic rules
function updateConditionalVisibility() {
  // Stand requires baseplate
  if (state.mounting === "mount_baseplate_stand" || state.mounting === "mount_baseplate_wall") {
    state.has_baseplate = true;
  } else {
    state.has_baseplate = false;
  }

  // Visual cues for baseplate section
  const baseplateSection = document.getElementById("section-baseplate-addons");
  if (baseplateSection) {
    baseplateSection.classList.toggle("section-dimmed", !state.has_baseplate);
  }

  // Autodarts lens eliminates compute & routing
  const isLens = state.vision === "vision_autodarts_lens";
  const computeSection = document.getElementById("section-compute");
  if (computeSection) {
    computeSection.classList.toggle("section-dimmed", isLens);
    const notice = document.getElementById("lens-compute-notice");
    if (notice) notice.style.display = isLens ? "flex" : "none";
  }
}

// The core BOM Calculation and Rules Engine
function applyRulesAndCalculateBOM() {
  const isLens = state.vision === "vision_autodarts_lens";
  const isStand = state.mounting === "mount_baseplate_stand";
  const isDirectWall = state.mounting === "mount_direct_wall";
  const isBaseplateWall = state.mounting === "mount_baseplate_wall";
  const hasBaseplate = isStand || isBaseplateWall;
  const isDirectTapping = state.assembly_style === "fasteners_direct_tapping";

  // Calculate Wall Holes
  let wallHoles = 0;
  if (isDirectWall) wallHoles = 8;
  else if (isBaseplateWall) wallHoles = 3;
  else if (isStand) wallHoles = 0;

  // 1. 3D PRINTED PARTS
  const printedParts = [];

  // Baseplate parts
  if (hasBaseplate) {
    printedParts.push({
      name: "IT2 4-Segment Interlocking Baseplate",
      qty: 1,
      material: "PLA or PETG",
      notes: "Heavy-duty 4-part backboard structure",
      estGrams: 480,
      modelUrl: IT2_CATALOG.system.makerworld_baseplate_url,
      modelId: "2782096"
    });
  }

  // Baseplate Add-ons
  if (hasBaseplate && state.baseplate_addons.includes("addon_tpu_dampeners")) {
    printedParts.push({
      name: "Circular Sound & Vibration Dampener Pads",
      qty: 3,
      material: "TPU 95A (Flexible)",
      notes: "Mutes dartboard thud into walls",
      estGrams: 45,
      modelUrl: IT2_CATALOG.system.makerworld_baseplate_url,
      modelId: "2782096"
    });
  }

  if (hasBaseplate && state.baseplate_addons.includes("addon_hardware_bay")) {
    printedParts.push({
      name: "Rear Hidden Hardware Bay Bracket",
      qty: 1,
      material: "PLA or PETG",
      notes: "Conceals Mini-PC / Pi / WLED controller",
      estGrams: 75,
      modelUrl: IT2_CATALOG.system.makerworld_baseplate_url,
      modelId: "2782096"
    });
  }

  // Vision Parts
  if (isLens) {
    printedParts.push({
      name: "IT2 Calibrated Ring-Mounted Phone Mount",
      qty: 1,
      material: "PLA or PETG",
      notes: "Rigid phone bracket at calibrated angle",
      estGrams: 65,
      modelUrl: IT2_CATALOG.system.makerworld_system_url,
      modelId: "1334165"
    });
  } else {
    // 3-camera arms
    printedParts.push({
      name: "IT2 Camera Arm & Pod Assembly",
      qty: 3,
      material: "PLA or PETG",
      notes: "Bolts directly to Plasma pattern at 120°",
      estGrams: 160,
      modelUrl: IT2_CATALOG.system.makerworld_system_url,
      modelId: "1334165"
    });
  }

  // Ring Parts
  if (state.ring === "ring_diy_standard") {
    printedParts.push({
      name: "IT2 DIY Light Ring Segments (Full 360°)",
      qty: 4,
      material: "PLA or PETG",
      notes: "Circular light ring segments (Ceiling ≥ 2.0m)",
      estGrams: 280,
      modelUrl: IT2_CATALOG.system.makerworld_system_url,
      modelId: "1334165"
    });
    printedParts.push({
      name: "IT2 Snap-On Curved Light Diffusers",
      qty: 4,
      material: "PLA Clear / Translucent White",
      notes: "Glides over LEDs for glare-free vision",
      estGrams: 50,
      modelUrl: IT2_CATALOG.system.makerworld_system_url,
      modelId: "1334165"
    });
  } else if (state.ring === "ring_diy_low_ceiling") {
    printedParts.push({
      name: "IT2 DIY Flat-Top Ring Segments (Low Ceiling)",
      qty: 4,
      material: "PLA or PETG",
      notes: "Flattened top profile for ceilings ≤ 2.0m",
      estGrams: 270,
      modelUrl: IT2_CATALOG.system.makerworld_system_url,
      modelId: "1334165"
    });
    printedParts.push({
      name: "IT2 Snap-On Curved Light Diffusers",
      qty: 4,
      material: "PLA Clear / Translucent White",
      notes: "Glides over LEDs for glare-free vision",
      estGrams: 50,
      modelUrl: IT2_CATALOG.system.makerworld_system_url,
      modelId: "1334165"
    });
  } else if (state.ring === "ring_target_corona") {
    printedParts.push({
      name: "IT2 Target Corona Conversion Adapters",
      qty: 3,
      material: "PLA or PETG",
      notes: "Converts Target Corona magnetic frame to IT2",
      estGrams: 70,
      modelUrl: IT2_CATALOG.system.makerworld_system_url,
      modelId: "1334165"
    });
  }

  // Cable routing clips (if direct wall and multi-cam)
  if (isDirectWall && !isLens) {
    printedParts.push({
      name: "IT2 Light Ring Snap-On Cable Clips",
      qty: 6,
      material: "PLA or PETG",
      notes: "Guides top 2 camera wires down the ring",
      estGrams: 15,
      modelUrl: IT2_CATALOG.system.makerworld_system_url,
      modelId: "1334165"
    });
    printedParts.push({
      name: "IT2 Bottom Y-Split Cable Exit Guide",
      qty: 1,
      material: "PLA or PETG",
      notes: "Clean single exit for bundled USB cables",
      estGrams: 12,
      modelUrl: IT2_CATALOG.system.makerworld_system_url,
      modelId: "1334165"
    });
  }

  // 2. HARDWARE & FASTENERS
  const hardware = [];

  // M4x10mm Cylindrical Screws (DIN 912)
  let m4Count = 0;
  if (!isLens) {
    // 3 arms to ring or plasma
    m4Count += state.ring === "ring_winmau_plasma" ? 6 : 12;
  }
  if (state.ring === "ring_target_corona") {
    m4Count += 6; // corona adapters
  }
  if (hasBaseplate) {
    m4Count += 8; // baseplate segment joints
    if (state.baseplate_addons.includes("addon_hardware_bay")) {
      m4Count += 2; // hardware bracket
    }
  }
  if (m4Count > 0) {
    hardware.push({
      name: "Cylindrical Screws M4x10mm (DIN 912 / ISO 4762)",
      qty: m4Count,
      type: "Fastener",
      notes: "Primary mechanical fastener for joints and arms"
    });
  }

  // M2x6mm Cylindrical Screws (DIN 912) - for camera PCBs
  if (!isLens) {
    hardware.push({
      name: "Cylindrical Screws M2x6mm (DIN 912 / ISO 4762)",
      qty: 6,
      type: "Fastener",
      notes: "2 screws per 32x32 camera PCB mount"
    });
  }

  // M4 Heat Inserts
  if (!isDirectTapping) {
    let m4InsertCount = 0;
    if (!isLens) m4InsertCount += 12; // camera arms and ring
    if (hasBaseplate) m4InsertCount += 8; // baseplate joints
    if (m4InsertCount > 0) {
      hardware.push({
        name: "M4 Heat-Set Brass Inserts (6.3mm OD, max 9mm length)",
        qty: m4InsertCount,
        type: "Thread Insert",
        notes: "Melted into 3D prints for reusable steel threads"
      });
    }
  }

  // M6 Heat Inserts (Mandatory for Rota Lock / Stand on Baseplate)
  if (hasBaseplate) {
    const m6Count = isStand ? 7 : 3;
    hardware.push({
      name: "M6 Heat-Set Brass Inserts (8mm OD)",
      qty: m6Count,
      type: "Thread Insert",
      notes: isStand ? "7x mandatory for stand brackets & Rota-Locks" : "3x mandatory for Rota-Lock levelers"
    });
  }

  // Wall screws
  if (isBaseplateWall) {
    hardware.push({
      name: "4.0mm Wood / Wall Screws + Plugs",
      qty: 3,
      type: "Wall Anchor",
      notes: "Anchors baseplate securely with only 3 holes"
    });
  } else if (isDirectWall) {
    hardware.push({
      name: "4.0mm Wood / Wall Screws + Plugs",
      qty: 8,
      type: "Wall Anchor",
      notes: "6 for IT2 arm brackets + 2 for board bracket"
    });
  }

  // 3. ELECTRONICS & CAMERAS
  const electronics = [];

  if (!isLens) {
    const camName =
      state.vision === "vision_3cam_ov2710"
        ? "HBV OV2710 1080p 32x32 USB Camera Modules"
        : "HBV OV9732 720p 32x32 USB Camera Modules";
    electronics.push({
      name: camName,
      qty: 3,
      category: "Vision",
      notes: "Snap outer 38x38 frame to 32x32mm with pliers",
      source: "HBV Store (AliExpress / Amazon)"
    });
    electronics.push({
      name: "USB Camera Connecting Cables (1.5m - 2m)",
      qty: 3,
      category: "Cabling",
      notes: "Included with HBV camera kits",
      source: "Included with cameras"
    });
  }

  // Ring LEDs
  if (state.ring === "ring_diy_standard" || state.ring === "ring_diy_low_ceiling") {
    electronics.push({
      name: "White High-CRI LED Strip (1.5m length)",
      qty: 1,
      category: "Lighting",
      notes: "6000K daylight white, 12V or 5V",
      source: "AliExpress / Amazon"
    });
    electronics.push({
      name: "12V / 5V 2A DC Power Supply + Barrel Jack",
      qty: 1,
      category: "Power",
      notes: "Powers LED ring illumination",
      source: "Standard electronics"
    });
  }

  // Reactive WLED
  if (state.lighting_mode === "lighting_reactive_wled") {
    electronics.push({
      name: "ESP32 Development Board (Pre-flashed WLED)",
      qty: 1,
      category: "Controller",
      notes: "Controls reactive game animations via WiFi / UDP",
      source: "AliExpress / Amazon"
    });
    electronics.push({
      name: "WS2812B / SK6812 Addressable 5V LED Strip (1.5m)",
      qty: 1,
      category: "Lighting",
      notes: "Runs inside reactive channel for game celebrations",
      source: "AliExpress / Amazon"
    });
    electronics.push({
      name: "5V 4A Dedicated Power Supply",
      qty: 1,
      category: "Power",
      notes: "Adequate current for ESP32 and addressable LEDs",
      source: "Electronics supplier"
    });
  }

  // Baseplate Ambient Halo
  if (hasBaseplate && state.baseplate_addons.includes("addon_baseplate_ambient_wled")) {
    electronics.push({
      name: "WS2812B 5V Addressable LED Strip (1.0m)",
      qty: 1,
      category: "Lighting",
      notes: "Rear perimeter halo glow behind board",
      source: "AliExpress / Amazon"
    });
  }

  // Host Compute
  if (!isLens) {
    if (state.compute === "compute_mini_pc") {
      electronics.push({
        name: "Refurbished Mini-PC (Intel N95/N100 or i5 Tiny)",
        qty: 1,
        category: "Host PC",
        notes: "HP ProDesk, Dell Wyse, or Lenovo Tiny running Autodarts",
        source: "eBay / Amazon Refurbished"
      });
    } else if (state.compute === "compute_raspberry_pi") {
      electronics.push({
        name: "Raspberry Pi 4 (4GB+) or Pi 5 + USB-C PSU",
        qty: 1,
        category: "Host PC",
        notes: "Runs Autodarts Linux server",
        source: "Raspberry Pi Approved Reseller"
      });
    } else if (state.compute === "compute_existing_pc") {
      electronics.push({
        name: "Active USB 3.0 Repeater / Extension Cable (5m - 10m)",
        qty: 1,
        category: "Cabling",
        notes: "Connects board cameras across the room to your desktop/laptop",
        source: "Amazon"
      });
    }
  }

  // 4. REQUIRED TOOLS
  const tools = [
    { name: "Hex Key Set (Allen Wrenches)", notes: "For M4 and M2 cylindrical screws" },
    { name: "Pliers / Flush Side-Cutters", notes: "For resizing HBV camera boards from 38x38 to 32x32" }
  ];
  if (!isDirectTapping) {
    tools.push({ name: "Soldering Iron with M4/M6 Insert Tip", notes: "For melting brass heat inserts into plastic" });
  }

  // Summaries
  const totalGrams = printedParts.reduce((acc, p) => acc + (p.estGrams * p.qty || 0), 0);
  const totalFasteners = hardware.reduce((acc, h) => acc + (h.qty || 0), 0);
  const totalPrintedPieces = printedParts.reduce((acc, p) => acc + (p.qty || 0), 0);

  // Update Metrics in DOM
  updateMetric("metric-wall-holes", wallHoles === 0 ? "0 (Stand)" : `${wallHoles} Holes`);
  updateMetric("metric-print-weight", `~${totalGrams}g`);
  updateMetric("metric-printed-pieces", `${totalPrintedPieces} Parts`);
  updateMetric("metric-fastener-count", `${totalFasteners} Items`);

  // Render BOM Sections
  renderBOMTables(printedParts, hardware, electronics, tools);

  // Store for export
  window.lastCalculatedBOM = {
    printedParts,
    hardware,
    electronics,
    tools,
    wallHoles,
    totalGrams,
    totalFasteners,
    totalPrintedPieces
  };
}

function updateMetric(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Render the itemized tables
function renderBOMTables(printedParts, hardware, electronics, tools) {
  const container = document.getElementById("bom-content-container");
  if (!container) return;

  container.innerHTML = `
    <!-- 3D Printed Parts -->
    <div class="bom-group" id="group-printed">
      <div class="bom-group-header">
        <div class="group-title-wrap">
          <span class="group-icon">🖨️</span>
          <h3 class="group-title">3D Printed Parts Checklist</h3>
        </div>
        <span class="group-count">${printedParts.length} files (${printedParts.reduce((a, b) => a + b.qty, 0)} total pieces)</span>
      </div>
      <div class="bom-table-wrap">
        <table class="bom-table">
          <thead>
            <tr>
              <th>Part Name</th>
              <th>Qty</th>
              <th>Material</th>
              <th>Source / Download</th>
            </tr>
          </thead>
          <tbody>
            ${printedParts
              .map(
                (p) => `
              <tr>
                <td>
                  <div class="part-cell">
                    <span class="part-name">${p.name}</span>
                    <span class="part-notes">${p.notes}</span>
                  </div>
                </td>
                <td class="qty-cell"><strong>${p.qty}x</strong></td>
                <td><span class="material-badge ${p.material.includes("TPU") ? "mat-tpu" : "mat-pla"}">${p.material}</span></td>
                <td>
                  <a href="${p.modelUrl}" target="_blank" rel="noopener noreferrer" class="link-download">
                    <span>Makerworld</span>
                    <span class="model-id">#${p.modelId}</span> ↗
                  </a>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Hardware & Fasteners -->
    <div class="bom-group" id="group-hardware">
      <div class="bom-group-header">
        <div class="group-title-wrap">
          <span class="group-icon">🔩</span>
          <h3 class="group-title">Hardware & Fasteners</h3>
        </div>
        <span class="group-count">${hardware.reduce((a, b) => a + b.qty, 0)} items</span>
      </div>
      <div class="bom-table-wrap">
        <table class="bom-table">
          <thead>
            <tr>
              <th>Item & Specification</th>
              <th>Qty</th>
              <th>Type</th>
              <th>Purpose & Notes</th>
            </tr>
          </thead>
          <tbody>
            ${hardware
              .map(
                (h) => `
              <tr>
                <td>
                  <div class="part-cell">
                    <span class="part-name">${h.name}</span>
                  </div>
                </td>
                <td class="qty-cell"><strong>${h.qty}x</strong></td>
                <td><span class="type-pill">${h.type}</span></td>
                <td class="notes-cell">${h.notes}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Electronics & Vision -->
    <div class="bom-group" id="group-electronics">
      <div class="bom-group-header">
        <div class="group-title-wrap">
          <span class="group-icon">⚡</span>
          <h3 class="group-title">Electronics, Cameras & Host</h3>
        </div>
        <span class="group-count">${electronics.length} items</span>
      </div>
      <div class="bom-table-wrap">
        <table class="bom-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Qty</th>
              <th>Category</th>
              <th>Source / Guidance</th>
            </tr>
          </thead>
          <tbody>
            ${electronics
              .map(
                (e) => `
              <tr>
                <td>
                  <div class="part-cell">
                    <span class="part-name">${e.name}</span>
                    <span class="part-notes">${e.notes}</span>
                  </div>
                </td>
                <td class="qty-cell"><strong>${e.qty}x</strong></td>
                <td><span class="type-pill">${e.category}</span></td>
                <td class="notes-cell">${e.source}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Required Tools -->
    <div class="bom-group" id="group-tools">
      <div class="bom-group-header">
        <div class="group-title-wrap">
          <span class="group-icon">🛠️</span>
          <h3 class="group-title">Assembly Tools Required</h3>
        </div>
      </div>
      <div class="bom-table-wrap">
        <table class="bom-table">
          <tbody>
            ${tools
              .map(
                (t) => `
              <tr>
                <td><strong class="part-name">${t.name}</strong></td>
                <td class="notes-cell">${t.notes}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Global Event Handlers for Export & Modals
function bindGlobalEvents() {
  // Copy BOM
  const copyBtn = document.getElementById("btn-copy-bom");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => copyBOMToClipboard());
  }

  // Download CSV
  const csvBtn = document.getElementById("btn-export-csv");
  if (csvBtn) {
    csvBtn.addEventListener("click", () => exportBOMToCSV());
  }

  // Print BOM
  const printBtn = document.getElementById("btn-print-bom");
  if (printBtn) {
    printBtn.addEventListener("click", () => window.print());
  }

  // Topology Modal
  const topoBtn = document.getElementById("btn-open-topology");
  const modal = document.getElementById("topology-modal");
  const closeBtn = document.getElementById("btn-close-modal");
  if (topoBtn && modal) {
    topoBtn.addEventListener("click", () => modal.classList.add("open"));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => modal.classList.remove("open"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("open");
    });
  }
}

// Copy Markdown formatted BOM
function copyBOMToClipboard() {
  const data = window.lastCalculatedBOM;
  if (!data) return;

  let text = `# IT2 Autodarts System - Customized Bill of Materials\n`;
  text += `Generated via IT2 BOM Configurator (IteraThor)\n\n`;
  text += `### Setup Summary\n`;
  text += `- Wall Holes to Drill: ${data.wallHoles}\n`;
  text += `- Total 3D Printed Parts: ${data.totalPrintedPieces} (~${data.totalGrams}g filament)\n`;
  text += `- Total Fasteners & Screws: ${data.totalFasteners}\n\n`;

  text += `### 🖨️ 3D Printed Parts\n`;
  data.printedParts.forEach((p) => {
    text += `- [ ] **${p.qty}x ${p.name}** | Material: ${p.material} | ${p.notes} (Makerworld #${p.modelId})\n`;
  });

  text += `\n### 🔩 Hardware & Fasteners\n`;
  data.hardware.forEach((h) => {
    text += `- [ ] **${h.qty}x ${h.name}** (${h.type}) - ${h.notes}\n`;
  });

  text += `\n### ⚡ Electronics & Vision\n`;
  data.electronics.forEach((e) => {
    text += `- [ ] **${e.qty}x ${e.name}** - ${e.notes} [${e.source}]\n`;
  });

  text += `\n### 🛠️ Required Tools\n`;
  data.tools.forEach((t) => {
    text += `- ${t.name}: ${t.notes}\n`;
  });

  text += `\nOfficial Downloads:\n- System: ${IT2_CATALOG.system.makerworld_system_url}\n- Baseplate: ${IT2_CATALOG.system.makerworld_baseplate_url}\n- Documentation: ${IT2_CATALOG.system.github_url}\n`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("btn-copy-bom");
    if (btn) {
      const original = btn.innerHTML;
      btn.innerHTML = `✓ Copied to Clipboard!`;
      btn.classList.add("btn-success");
      setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove("btn-success");
      }, 2000);
    }
  });
}

// Export CSV
function exportBOMToCSV() {
  const data = window.lastCalculatedBOM;
  if (!data) return;

  let csv = "Category,Part Name,Quantity,Specification / Material,Purpose / Notes,Source / Link\n";

  data.printedParts.forEach((p) => {
    csv += `"3D Print","${p.name}",${p.qty},"${p.material}","${p.notes}","Makerworld #${p.modelId}"\n`;
  });
  data.hardware.forEach((h) => {
    csv += `"Hardware","${h.name}",${h.qty},"${h.type}","${h.notes}","DIN 912 / ISO 4762"\n`;
  });
  data.electronics.forEach((e) => {
    csv += `"Electronics","${e.name}",${e.qty},"${e.category}","${e.notes}","${e.source}"\n`;
  });
  data.tools.forEach((t) => {
    csv += `"Tools","${t.name}",1,"Tool","${t.notes}","Workshop"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `IT2-BOM-Configuration-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
