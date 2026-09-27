const CURRENCIES = {
  USD: { symbol: "$", rate: 1.08 },
  EUR: { symbol: "€", rate: 1.0 },
  GBP: { symbol: "£", rate: 0.85 }
};

let currentCurrency = localStorage.getItem("it2_currency") || "EUR";

function formatCurrency(eurAmount) {
  const curr = CURRENCIES[currentCurrency] || CURRENCIES.EUR;
  const converted = Math.round(eurAmount * curr.rate);
  return `${curr.symbol}${converted}`;
}

const userConfig = {
  vision_mode: null,
  cam_model: "ov9732",
  mount_type: null,
  use_baseplate: null,
  baseplate_addons: [],
  ring_type: null,
  lighting_mode: "white",
  host_compute: "existing_pc",
  assembly_style: null
};

let questionHistory = [];
let currentQuestionId = "q_vision";

const QUESTIONS = {
  q_vision: {
    title: "How do you want to track your darts?",
    options: [
      {
        id: "opt_3cam",
        letter: "A",
        title: "Classic 3-Camera Rig",
        action: () => {
          userConfig.vision_mode = "3cam";
          return "q_cam_model";
        }
      },
      {
        id: "opt_lens",
        letter: "B",
        title: "Autodarts Lens",
        badge: "Coming Soon",
        badgeType: "neutral",
        disabled: true,
        action: null
      }
    ]
  },

  q_cam_model: {
    title: "Which camera modules do you prefer?",
    options: [
      {
        id: "opt_ov9732",
        letter: "A",
        title: "HBV OV9732",
        action: () => {
          userConfig.cam_model = "ov9732";
          return "q_mounting";
        }
      },
      {
        id: "opt_ov2710",
        letter: "B",
        title: "HBV OV2710",
        action: () => {
          userConfig.cam_model = "ov2710";
          return "q_mounting";
        }
      }
    ]
  },

  q_mounting: {
    title: "Where will your dartboard be set up?",
    options: [
      {
        id: "opt_wall",
        letter: "A",
        title: "Wall",
        action: () => {
          userConfig.mount_type = "wall";
          return "q_wall_baseplate";
        }
      },
      {
        id: "opt_stand",
        letter: "B",
        title: "Dart Stand",
        action: () => {
          userConfig.mount_type = "stand";
          userConfig.use_baseplate = true;
          return "q_baseplate_addons";
        }
      }
    ]
  },

  q_wall_baseplate: {
    title: "Do you want to use the IT2 Baseplate?",
    options: [
      {
        id: "opt_baseplate_yes",
        letter: "A",
        title: "Baseplate",
        action: () => {
          userConfig.use_baseplate = true;
          return "q_baseplate_addons";
        }
      },
      {
        id: "opt_baseplate_no",
        letter: "B",
        title: "Direct Wall Mount",
        action: () => {
          userConfig.use_baseplate = false;
          userConfig.baseplate_addons = [];
          return "q_ring";
        }
      }
    ]
  },

  q_baseplate_addons: {
    title: "Which Baseplate add-ons would you like?",
    isMultiSelect: true,
    options: [
      {
        id: "tpu_dampeners",
        title: "Sound Dampeners"
      },
      {
        id: "hardware_bay",
        title: "Hardware Bay"
      },
      {
        id: "ambient_wled",
        title: "Ambient Wall Glow"
      }
    ],
    onContinue: (selectedIds) => {
      userConfig.baseplate_addons = selectedIds;
      return "q_ring";
    }
  },

  q_ring: {
    title: "Which light ring frame will you use?",
    options: [
      {
        id: "opt_ring_plasma",
        letter: "A",
        title: "Winmau Plasma",
        action: () => {
          userConfig.ring_type = "plasma";
          return "q_compute";
        }
      },
      {
        id: "opt_ring_corona",
        letter: "B",
        title: "Target Corona",
        action: () => {
          userConfig.ring_type = "corona";
          return "q_compute";
        }
      },
      {
        id: "opt_ring_diy_std",
        letter: "C",
        title: "IT2 DIY Ring",
        action: () => {
          userConfig.ring_type = "diy_std";
          return "q_lighting_mode";
        }
      },
      {
        id: "opt_ring_diy_low",
        letter: "D",
        title: "IT2 DIY Flat-Top Ring",
        action: () => {
          userConfig.ring_type = "diy_low";
          return "q_lighting_mode";
        }
      }
    ]
  },

  q_lighting_mode: {
    title: "What lighting do you want inside the ring?",
    options: [
      {
        id: "opt_light_white",
        letter: "A",
        title: "White",
        action: () => {
          userConfig.lighting_mode = "white";
          return "q_compute";
        }
      },
      {
        id: "opt_light_wled",
        letter: "B",
        title: "WLED",
        action: () => {
          userConfig.lighting_mode = "wled";
          return "q_compute";
        }
      }
    ]
  },

  q_compute: {
    title: "How will you run Autodarts?",
    options: [
      {
        id: "opt_compute_existing",
        letter: "A",
        title: "PC / Laptop",
        action: () => {
          userConfig.host_compute = "existing_pc";
          return "q_assembly";
        }
      },
      {
        id: "opt_compute_mini_pc",
        letter: "B",
        title: "Mini-PC",
        action: () => {
          userConfig.host_compute = "mini_pc";
          return "q_assembly";
        }
      },
      {
        id: "opt_compute_pi",
        letter: "C",
        title: "Raspberry Pi",
        action: () => {
          userConfig.host_compute = "pi";
          return "q_assembly";
        }
      }
    ]
  },

  q_assembly: {
    title: "How do you want to fasten your 3D printed parts?",
    options: [
      {
        id: "opt_fastener_direct",
        letter: "A",
        title: "Direct Self-Tapping",
        action: () => {
          userConfig.assembly_style = "direct";
          return "FINISHED";
        }
      },
      {
        id: "opt_fastener_inserts",
        letter: "B",
        title: "Heat-Set Inserts",
        action: () => {
          userConfig.assembly_style = "inserts";
          return "FINISHED";
        }
      }
    ]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initCurrencySwitcher();
  showQuestion(currentQuestionId);
  bindNavigationEvents();
});

function initCurrencySwitcher() {
  const switcher = document.getElementById("currency-switcher");
  if (!switcher) return;

  switcher.querySelectorAll(".currency-btn").forEach((btn) => {
    const code = btn.getAttribute("data-curr");
    if (code === currentCurrency) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }

    btn.addEventListener("click", () => {
      currentCurrency = code;
      localStorage.setItem("it2_currency", currentCurrency);
      switcher.querySelectorAll(".currency-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const bomScreen = document.getElementById("screen-bom");
      if (bomScreen && bomScreen.style.display !== "none") {
        generateCustomBOM();
      }
    });
  });
}

function showQuestion(qId) {
  const q = QUESTIONS[qId];
  if (!q) return;

  currentQuestionId = qId;
  const container = document.getElementById("question-card");
  if (!container) return;

  const totalQuestionsEstimate = 7;
  const currentStepNum = questionHistory.length + 1;
  const progressPercent = Math.min(100, Math.round((currentStepNum / totalQuestionsEstimate) * 100));

  const counterEl = document.getElementById("step-counter");
  if (counterEl) counterEl.textContent = `Question ${currentStepNum} of ${totalQuestionsEstimate}`;

  const fillEl = document.getElementById("progress-fill");
  if (fillEl) fillEl.style.width = `${progressPercent}%`;

  const backBtn = document.getElementById("btn-back");
  if (backBtn) {
    backBtn.style.visibility = questionHistory.length > 0 ? "visible" : "hidden";
  }

  if (q.isMultiSelect) {
    renderMultiSelectQuestion(container, q);
  } else {
    renderSingleSelectQuestion(container, q);
  }
}

function renderSingleSelectQuestion(container, q) {
  container.innerHTML = `
    <h2 class="q-title">${q.title}</h2>

    <div class="options-list">
      ${q.options
        .map(
          (opt) => `
        <button type="button" 
                class="option-item ${opt.disabled ? "disabled" : ""}" 
                data-opt="${opt.id}" 
                id="opt-${opt.id}"
                ${opt.disabled ? "disabled aria-disabled='true'" : ""}>
          <span class="option-letter">${opt.letter}</span>
          <div class="option-text-wrap">
            <div class="option-title-row">
              <span class="option-title">${opt.title}</span>
              ${opt.badge ? `<span class="option-badge badge-${opt.badgeType || "neutral"}">${opt.badge}</span>` : ""}
            </div>
          </div>
        </button>
      `
        )
        .join("")}
    </div>
  `;

  container.querySelectorAll(".option-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const optId = btn.getAttribute("data-opt");
      const opt = q.options.find((o) => o.id === optId);
      if (!opt || opt.disabled || !opt.action) return;

      btn.classList.add("selected");
      const nextQId = opt.action();

      setTimeout(() => {
        questionHistory.push(currentQuestionId);
        if (nextQId === "FINISHED") {
          finishQuestionnaire();
        } else {
          showQuestion(nextQId);
        }
      }, 160);
    });
  });
}

function renderMultiSelectQuestion(container, q) {
  let selected = [...userConfig.baseplate_addons];

  container.innerHTML = `
    <h2 class="q-title">${q.title}</h2>

    <div class="options-list" id="multi-options-list">
      ${q.options
        .map((opt) => {
          const isChecked = selected.includes(opt.id);
          return `
          <button type="button" class="option-item ${isChecked ? "selected" : ""}" data-opt="${opt.id}" id="multi-${opt.id}">
            <span class="option-letter">${isChecked ? "✓" : "○"}</span>
            <div class="option-text-wrap">
              <div class="option-title-row">
                <span class="option-title">${opt.title}</span>
              </div>
            </div>
          </button>
        `;
        })
        .join("")}
    </div>

    <div class="multi-actions">
      <button type="button" class="btn-continue" id="btn-multi-continue">
        Continue →
      </button>
    </div>
  `;

  container.querySelectorAll(".option-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const optId = btn.getAttribute("data-opt");
      if (selected.includes(optId)) {
        selected = selected.filter((id) => id !== optId);
        btn.classList.remove("selected");
        btn.querySelector(".option-letter").textContent = "○";
      } else {
        selected.push(optId);
        btn.classList.add("selected");
        btn.querySelector(".option-letter").textContent = "✓";
      }
    });
  });

  const continueBtn = document.getElementById("btn-multi-continue");
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      const nextQId = q.onContinue(selected);
      questionHistory.push(currentQuestionId);
      if (nextQId === "FINISHED") {
        finishQuestionnaire();
      } else {
        showQuestion(nextQId);
      }
    });
  }
}

function bindNavigationEvents() {
  const backBtn = document.getElementById("btn-back");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (questionHistory.length > 0) {
        const prevQId = questionHistory.pop();
        showQuestion(prevQId);
      }
    });
  }

  const restartBtn = document.getElementById("btn-restart");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      questionHistory = [];
      document.getElementById("screen-bom").style.display = "none";
      document.getElementById("screen-questionnaire").style.display = "block";
      showQuestion("q_vision");
    });
  }

  const copyBtn = document.getElementById("btn-copy-bom");
  if (copyBtn) copyBtn.addEventListener("click", () => copyBOMToClipboard());

  const csvBtn = document.getElementById("btn-export-csv");
  if (csvBtn) csvBtn.addEventListener("click", () => exportBOMToCSV());

  const printBtn = document.getElementById("btn-print-bom");
  if (printBtn) printBtn.addEventListener("click", () => window.print());
}

function finishQuestionnaire() {
  document.getElementById("screen-questionnaire").style.display = "none";
  const bomScreen = document.getElementById("screen-bom");
  bomScreen.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  generateCustomBOM();
}

function generateCustomBOM() {
  const isLens = userConfig.vision_mode === "lens";
  const isStand = userConfig.mount_type === "stand";
  const hasBaseplate = userConfig.use_baseplate || isStand;
  const isDirectWall = userConfig.mount_type === "wall" && !hasBaseplate;
  const isDirectTapping = userConfig.assembly_style === "direct";

  let wallHoles = 0;
  if (isDirectWall) wallHoles = 8;
  else if (hasBaseplate && !isStand) wallHoles = 3;
  else if (isStand) wallHoles = 0;

  const printedParts = [];

  if (hasBaseplate) {
    printedParts.push({
      name: "IT2 Baseplate Set",
      qty: 1,
      material: "PLA / PETG",
      notes: "4-segment backboard",
      modelId: "2782096",
      modelUrl: "https://makerworld.com/en/models/2782096",
      estGrams: 480,
      costEur: 9.6
    });
  }

  if (hasBaseplate && userConfig.baseplate_addons.includes("tpu_dampeners")) {
    printedParts.push({
      name: "Sound Dampener Inserts",
      qty: 3,
      material: "TPU 95A",
      notes: "Vibration isolation",
      modelId: "2782096",
      modelUrl: "https://makerworld.com/en/models/2782096",
      estGrams: 45,
      costEur: 1.4
    });
  }

  if (hasBaseplate && userConfig.baseplate_addons.includes("hardware_bay")) {
    printedParts.push({
      name: "Rear Hardware Bay Mount",
      qty: 1,
      material: "PLA / PETG",
      notes: "Host bracket",
      modelId: "2782096",
      modelUrl: "https://makerworld.com/en/models/2782096",
      estGrams: 75,
      costEur: 1.5
    });
  }

  if (isLens) {
    const isTripod = userConfig.lens_mount_type === "tripod";
    printedParts.push({
      name: isTripod ? "IT2 Phone Tripod Mount" : "IT2 Phone Mount",
      qty: 1,
      material: "PLA / PETG",
      notes: "Smartphone bracket",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: isTripod ? 55 : 65,
      costEur: 1.3
    });
  } else {
    printedParts.push({
      name: "IT2 Camera Arm & Pod Assembly",
      qty: 3,
      material: "PLA / PETG",
      notes: "120° camera mounts",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 160,
      costEur: 3.2
    });
  }

  if (userConfig.ring_type === "diy_std") {
    printedParts.push({
      name: "IT2 DIY Light Ring Segments",
      qty: 4,
      material: "PLA / PETG",
      notes: "Ring segments",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 280,
      costEur: 5.6
    });
    printedParts.push({
      name: "IT2 Snap-On Diffusers",
      qty: 4,
      material: "PLA Clear / White",
      notes: "LED diffusers",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 50,
      costEur: 1.0
    });
  } else if (userConfig.ring_type === "diy_low") {
    printedParts.push({
      name: "IT2 DIY Flat-Top Ring Segments",
      qty: 4,
      material: "PLA / PETG",
      notes: "Flat-top ring segments",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 270,
      costEur: 5.4
    });
    printedParts.push({
      name: "IT2 Snap-On Diffusers",
      qty: 4,
      material: "PLA Clear / White",
      notes: "LED diffusers",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 50,
      costEur: 1.0
    });
  } else if (userConfig.ring_type === "corona") {
    printedParts.push({
      name: "IT2 Target Corona Conversion Adapters",
      qty: 3,
      material: "PLA / PETG",
      notes: "Adapter brackets",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 70,
      costEur: 1.4
    });
  }

  if (isDirectWall && !isLens) {
    printedParts.push({
      name: "IT2 Snap-On Cable Clips",
      qty: 6,
      material: "PLA / PETG",
      notes: "Ring clips",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 15,
      costEur: 0.3
    });
    printedParts.push({
      name: "IT2 Bottom Y-Split Cable Exit Guide",
      qty: 1,
      material: "PLA / PETG",
      notes: "Cable guide",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 12,
      costEur: 0.25
    });
  }

  const hardware = [];

  let m4Count = 0;
  if (!isLens) {
    m4Count += userConfig.ring_type === "plasma" ? 6 : 12;
  }
  if (userConfig.ring_type === "corona") m4Count += 6;
  if (hasBaseplate) {
    m4Count += 8;
    if (userConfig.baseplate_addons.includes("hardware_bay")) m4Count += 2;
  }
  if (m4Count > 0) {
    hardware.push({
      name: "M4x10mm Cylindrical Screws",
      qty: m4Count,
      notes: "Arms and joints",
      costEur: Math.round(m4Count * 0.15 * 10) / 10
    });
  }

  if (!isLens) {
    hardware.push({
      name: "M2x6mm Cylindrical Screws",
      qty: 6,
      notes: "Camera PCB mounts",
      costEur: 0.8
    });
  }

  if (!isDirectTapping) {
    let m4Inserts = 0;
    if (!isLens) m4Inserts += 12;
    if (hasBaseplate) m4Inserts += 8;
    if (m4Inserts > 0) {
      hardware.push({
        name: "M4 Heat Inserts",
        qty: m4Inserts,
        notes: "Threaded inserts",
        costEur: Math.round(m4Inserts * 0.25 * 10) / 10
      });
    }
  }

  if (hasBaseplate) {
    const m6Count = isStand ? 7 : 3;
    hardware.push({
      name: "M6 Heat Inserts",
      qty: m6Count,
      notes: isStand ? "Stand mounts & Rota-Locks" : "Rota-Lock levelers",
      costEur: Math.round(m6Count * 0.5 * 10) / 10
    });
  }

  if (hasBaseplate && !isStand) {
    hardware.push({
      name: "4.0mm Wood / Wall Screws + Plugs",
      qty: 3,
      notes: "Wall mounting",
      costEur: 1.0
    });
  } else if (isDirectWall) {
    hardware.push({
      name: "4.0mm Wood / Wall Screws + Plugs",
      qty: 8,
      notes: "Arm & board mounting",
      costEur: 1.8
    });
  }

  const electronics = [];

  if (isLens) {
    electronics.push({
      name: "Smartphone with Autodarts",
      qty: 1,
      notes: "Vision camera",
      source: "Existing Device",
      costEur: 0
    });
    electronics.push({
      name: "USB Phone Cable",
      qty: 1,
      notes: "Power",
      source: "Existing Cable",
      costEur: 0
    });
  } else {
    const isOV2710 = userConfig.cam_model === "ov2710";
    const camName = isOV2710 ? "HBV OV2710 USB Camera Modules" : "HBV OV9732 USB Camera Modules";
    electronics.push({
      name: camName,
      qty: 3,
      notes: "32x32mm",
      source: "AliExpress / Amazon",
      costEur: isOV2710 ? 46.0 : 28.0
    });
    electronics.push({
      name: "USB Camera Cables",
      qty: 3,
      notes: "Included with cameras",
      source: "Camera Kit",
      costEur: 0
    });
  }

  if (userConfig.ring_type === "diy_std" || userConfig.ring_type === "diy_low") {
    electronics.push({
      name: "White LED Strip (1.5m)",
      qty: 1,
      notes: "Ring illumination",
      source: "AliExpress / Amazon",
      costEur: 8.0
    });
    electronics.push({
      name: "Power Supply",
      qty: 1,
      notes: "12V / 5V 2A",
      source: "Standard Electronics",
      costEur: 7.0
    });
  }

  if (userConfig.lighting_mode === "wled") {
    electronics.push({
      name: "ESP32 Board",
      qty: 1,
      notes: "WLED firmware",
      source: "AliExpress / Amazon",
      costEur: 5.0
    });
    electronics.push({
      name: "Addressable LED Strip (1.5m)",
      qty: 1,
      notes: "WS2812B / SK6812",
      source: "AliExpress / Amazon",
      costEur: 8.0
    });
    electronics.push({
      name: "5V 4A Power Supply",
      qty: 1,
      notes: "LED & ESP32 power",
      source: "Electronics Supplier",
      costEur: 11.0
    });
  }

  if (hasBaseplate && userConfig.baseplate_addons.includes("ambient_wled")) {
    electronics.push({
      name: "Addressable LED Strip (1.0m)",
      qty: 1,
      notes: "WS2812B ambient glow",
      source: "AliExpress / Amazon",
      costEur: 5.0
    });
  }

  if (!isLens) {
    if (userConfig.host_compute === "mini_pc") {
      electronics.push({
        name: "Mini-PC",
        qty: 1,
        notes: "Autodarts host",
        source: "Refurbished / New",
        costEur: 75.0
      });
    } else if (userConfig.host_compute === "pi") {
      electronics.push({
        name: "Raspberry Pi",
        qty: 1,
        notes: "Autodarts host",
        source: "Authorized Reseller",
        costEur: 65.0
      });
    } else if (userConfig.host_compute === "existing_pc") {
      electronics.push({
        name: "USB 3.0 Extension Cable / Hub",
        qty: 1,
        notes: "PC connection",
        source: "Standard Cable",
        costEur: 9.0
      });
    }
  }

  const tools = [];
  if (!isLens) {
    tools.push(
      { name: "Hex Key Set", notes: "M4 and M2 screws" },
      { name: "Pliers / Side-Cutters", notes: "Camera board trimming to 32x32" }
    );
    if (!isDirectTapping) {
      tools.push({ name: "Soldering Iron with Insert Tip", notes: "M4/M6 heat inserts" });
    }
  }

  const totalGrams = printedParts.reduce((acc, p) => acc + (p.estGrams * p.qty || 0), 0);
  const totalFasteners = hardware.reduce((acc, h) => acc + (h.qty || 0), 0);
  const totalPrintedPieces = printedParts.reduce((acc, p) => acc + (p.qty || 0), 0);

  const totalPrintedCost = printedParts.reduce((acc, p) => acc + (p.costEur || 0), 0);
  const totalHardwareCost = hardware.reduce((acc, h) => acc + (h.costEur || 0), 0);
  const totalElectronicsCost = electronics.reduce((acc, e) => acc + (e.costEur || 0), 0);
  const totalCostEur = totalPrintedCost + totalHardwareCost + totalElectronicsCost;

  const summaryText = document.getElementById("config-summary-text");
  if (summaryText) {
    summaryText.textContent = "";
  }

  document.getElementById("metric-wall-holes").textContent = wallHoles === 0 ? "0" : `${wallHoles}`;
  document.getElementById("metric-printed-pieces").textContent = `${totalPrintedPieces}`;
  document.getElementById("metric-print-weight").textContent = `~${totalGrams}g`;
  document.getElementById("metric-fastener-count").textContent = `${totalFasteners}`;
  document.getElementById("metric-est-cost").textContent = `~${formatCurrency(totalCostEur)}`;

  renderFinishedTables(printedParts, hardware, electronics, tools, totalPrintedCost, totalHardwareCost, totalElectronicsCost);

  window.lastBOM = {
    printedParts,
    hardware,
    electronics,
    tools,
    wallHoles,
    totalGrams,
    totalFasteners,
    totalPrintedPieces,
    totalPrintedCost,
    totalHardwareCost,
    totalElectronicsCost,
    totalCostEur
  };
}

function renderFinishedTables(printedParts, hardware, electronics, tools, printedCost, hardwareCost, electronicsCost) {
  const container = document.getElementById("bom-tables-container");
  if (!container) return;

  container.innerHTML = `
    <div class="bom-card-group">
      <div class="bom-group-header">
        <div class="group-title-row">
          <span class="group-icon">🖨️</span>
          <h3 class="group-title">3D Printed Parts</h3>
        </div>
        <span class="group-count">${printedParts.length} files (${printedParts.reduce((a, b) => a + b.qty, 0)} pieces • ~${formatCurrency(printedCost)})</span>
      </div>
      <table class="bom-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Qty</th>
            <th>Material</th>
            <th>Est. Cost</th>
            <th>Makerworld</th>
          </tr>
        </thead>
        <tbody>
          ${printedParts
            .map(
              (p) => `
            <tr>
              <td>
                <div class="part-name-cell">
                  <span class="part-name-bold">${p.name}</span>
                </div>
              </td>
              <td><span class="qty-pill">${p.qty}x</span></td>
              <td><span class="mat-tag ${p.material.includes("TPU") ? "mat-tpu" : "mat-pla"}">${p.material}</span></td>
              <td><span class="cost-pill">~${formatCurrency(p.costEur)}</span></td>
              <td>
                <a href="${p.modelUrl}" target="_blank" rel="noopener noreferrer" class="link-external">
                  #${p.modelId} ↗
                </a>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="bom-card-group">
      <div class="bom-group-header">
        <div class="group-title-row">
          <span class="group-icon">🔩</span>
          <h3 class="group-title">Hardware & Fasteners</h3>
        </div>
        <span class="group-count">${hardware.reduce((a, b) => a + b.qty, 0)} items (~${formatCurrency(hardwareCost)})</span>
      </div>
      <table class="bom-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Location</th>
            <th>Est. Cost</th>
          </tr>
        </thead>
        <tbody>
          ${hardware
            .map(
              (h) => `
            <tr>
              <td><span class="part-name-bold">${h.name}</span></td>
              <td><span class="qty-pill">${h.qty}x</span></td>
              <td class="part-notes-dim">${h.notes}</td>
              <td><span class="cost-pill">~${formatCurrency(h.costEur)}</span></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="bom-card-group">
      <div class="bom-group-header">
        <div class="group-title-row">
          <span class="group-icon">⚡</span>
          <h3 class="group-title">Electronics</h3>
        </div>
        <span class="group-count">${electronics.length} items (~${formatCurrency(electronicsCost)})</span>
      </div>
      <table class="bom-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Qty</th>
            <th>Source</th>
            <th>Est. Cost</th>
          </tr>
        </thead>
        <tbody>
          ${electronics
            .map(
              (e) => `
            <tr>
              <td>
                <div class="part-name-cell">
                  <span class="part-name-bold">${e.name}</span>
                </div>
              </td>
              <td><span class="qty-pill">${e.qty}x</span></td>
              <td class="part-notes-dim">${e.source}</td>
              <td><span class="cost-pill">${e.costEur === 0 ? "Free" : `~${formatCurrency(e.costEur)}`}</span></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="bom-card-group">
      <div class="bom-group-header">
        <div class="group-title-row">
          <span class="group-icon">🛠️</span>
          <h3 class="group-title">Tools</h3>
        </div>
      </div>
      <table class="bom-table">
        <tbody>
          ${tools
            .map(
              (t) => `
            <tr>
              <td style="width: 35%;"><span class="part-name-bold">${t.name}</span></td>
              <td class="part-notes-dim">${t.notes}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function copyBOMToClipboard() {
  const data = window.lastBOM;
  if (!data) return;

  let text = `# IT2-ADvisor - Custom Bill of Materials\n\n`;
  text += `### Summary\n`;
  text += `- Wall Holes: ${data.wallHoles}\n`;
  text += `- Total 3D Printed Parts: ${data.totalPrintedPieces} (~${data.totalGrams}g)\n`;
  text += `- Total Fasteners: ${data.totalFasteners}\n`;
  text += `- Est. Total Cost: ${formatCurrency(data.totalCostEur)} (${currentCurrency})\n\n`;

  text += `### 3D Printed Parts\n`;
  data.printedParts.forEach((p) => {
    text += `- [ ] ${p.qty}x ${p.name} (${p.material}) ~${formatCurrency(p.costEur)} [Makerworld #${p.modelId}]\n`;
  });

  text += `\n### Hardware & Fasteners\n`;
  data.hardware.forEach((h) => {
    text += `- [ ] ${h.qty}x ${h.name} ~${formatCurrency(h.costEur)}\n`;
  });

  text += `\n### Electronics\n`;
  data.electronics.forEach((e) => {
    const costStr = e.costEur === 0 ? "Free" : `~${formatCurrency(e.costEur)}`;
    text += `- [ ] ${e.qty}x ${e.name} ${costStr} [${e.source}]\n`;
  });

  text += `\n### Tools\n`;
  data.tools.forEach((t) => {
    text += `- ${t.name}\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("btn-copy-bom");
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = "✓ Copied";
      btn.style.background = "var(--accent-emerald)";
      btn.style.color = "#000";
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.background = "";
        btn.style.color = "";
      }, 2000);
    }
  });
}

function exportBOMToCSV() {
  const data = window.lastBOM;
  if (!data) return;

  let csv = `Category,Part Name,Quantity,Material,Est. Cost (${currentCurrency}),Source\n`;

  data.printedParts.forEach((p) => {
    csv += `"3D Print","${p.name}",${p.qty},"${p.material}","${formatCurrency(p.costEur)}","Makerworld #${p.modelId}"\n`;
  });
  data.hardware.forEach((h) => {
    csv += `"Hardware","${h.name}",${h.qty},"Fastener","${formatCurrency(h.costEur)}","DIN 912 / ISO 4762"\n`;
  });
  data.electronics.forEach((e) => {
    const costStr = e.costEur === 0 ? "Free" : formatCurrency(e.costEur);
    csv += `"Electronics","${e.name}",${e.qty},"Electronics","${costStr}","${e.source}"\n`;
  });
  data.tools.forEach((t) => {
    csv += `"Tools","${t.name}",1,"Tool","0","Workshop"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `IT2-Custom-BOM-${currentCurrency}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
