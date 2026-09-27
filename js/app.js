const CURRENCIES = {
  USD: { symbol: "$", rateKey: "usd", fallbackRate: 1.08 },
  EUR: { symbol: "€", rateKey: "eur", fallbackRate: 1.0 },
  GBP: { symbol: "£", rateKey: "gbp", fallbackRate: 0.85 }
};

let currentCurrency = localStorage.getItem("it2_currency") || "EUR";
let livePrices = {};

fetch("knowledge/prices.json")
  .then(r => r.ok ? r.json() : {})
  .then(data => { livePrices = data; })
  .catch(() => {});

function getLiveRate(currCode) {
  const fx = livePrices._fx_rates;
  if (!fx) return CURRENCIES[currCode]?.fallbackRate ?? 1.0;
  if (currCode === "EUR") return 1.0;
  return fx[currCode] ?? CURRENCIES[currCode]?.fallbackRate ?? 1.0;
}

function formatCurrency(eurAmount) {
  const curr = CURRENCIES[currentCurrency] || CURRENCIES.EUR;
  const converted = Math.round(eurAmount * getLiveRate(currentCurrency));
  return `${curr.symbol}${converted}`;
}

if (!window.itemStates) window.itemStates = {};

function getItemKey(type, name) {
  return `${type}_${name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}`;
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
        id: "opt_ov2710",
        letter: "A",
        title: "HBV OV2710",
        badge: "Recommended",
        badgeType: "success",
        priceTag: () => {
          const p = livePrices.camera_ov2710;
          if (!p?.eur) return null;
          const rate = getLiveRate(currentCurrency);
          const sym = CURRENCIES[currentCurrency]?.symbol ?? "€";
          return `${sym}${(p.eur * rate).toFixed(2)}`;
        },
        action: () => {
          userConfig.cam_model = "ov2710";
          return "q_mounting";
        }
      },
      {
        id: "opt_ov9732",
        letter: "B",
        title: "HBV OV9732",
        badge: "Budget",
        badgeType: "neutral",
        priceTag: () => {
          const p = livePrices.camera_ov9732;
          if (!p?.eur) return null;
          const rate = getLiveRate(currentCurrency);
          const sym = CURRENCIES[currentCurrency]?.symbol ?? "€";
          return `${sym}${(p.eur * rate).toFixed(2)}`;
        },
        action: () => {
          userConfig.cam_model = "ov9732";
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
        badge: "Recommended",
        badgeType: "success",
        action: () => {
          userConfig.mount_type = "wall";
          return "q_wall_baseplate";
        }
      },
      {
        id: "opt_stand",
        letter: "B",
        title: "Portable Dart Stand",
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
    subtitle: "The IT2 Baseplate mounts behind your dartboard to unlock modular add-ons and easier cable routing.",
    options: [
      {
        id: "opt_baseplate_yes",
        letter: "A",
        title: "IT2 Baseplate",
        subtitle: "Mounts securely with Rota-Lock holes and unlocks the modular IT2 ecosystem.",
        features: [
          "Add-on: Noise Reducing TPU Sound Dampeners",
          "Add-on: Enclosed System (Shroud)"
        ],
        action: () => {
          userConfig.use_baseplate = true;
          return "q_baseplate_addons";
        }
      },
      {
        id: "opt_baseplate_no",
        letter: "B",
        title: "Direct Wall Mount",
        subtitle: "Mounts board & arms directly to the wall without the 3D-printed rear backplate.",
        features: [
          "Saves ~580g Filament"
        ],
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
    subtitle: "Select the modular add-ons to integrate into your IT2 build.",
    isMultiSelect: true,
    options: [
      {
        id: "tpu_dampeners",
        title: "Sound Dampeners",
        subtitle: "3x TPU 95A vibration-isolation dampening pads between wall and dartboard."
      },
      {
        id: "shroud",
        title: "Enclosed System (Shroud)",
        subtitle: "Protective modular outer shroud enclosing the board and camera frame."
      },
      {
        id: "hardware_bay",
        title: "Hardware Bay",
        badge: "WIP",
        badgeType: "neutral",
        subtitle: "Concealed rear mounting enclosure for your Mini-PC, Raspberry Pi, or USB hub.",
        disabled: true
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
        id: "opt_ring_diy_std",
        letter: "A",
        title: "IT2 DIY Light Ring Standard",
        subtitle: "3D-printed 360° light ring.",
        action: () => {
          userConfig.ring_type = "diy_std";
          userConfig.lighting_mode = "white";
          return "q_compute";
        }
      },
      {
        id: "opt_ring_diy_wled",
        letter: "B",
        title: "IT2 DIY WLED Light Ring",
        subtitle: "3D-printed 360° light ring with addressable RGB LED strip and ESP32 reactive lighting.",
        action: () => {
          userConfig.ring_type = "diy_std";
          userConfig.lighting_mode = "wled";
          return "q_compute";
        }
      },
      {
        id: "opt_ring_plasma",
        letter: "C",
        title: "Winmau Plasma",
        subtitle: "Commercial light ring; camera arms mount directly into the native hole pattern.",
        action: () => {
          userConfig.ring_type = "plasma";
          userConfig.lighting_mode = "white";
          return "q_compute";
        }
      },
      {
        id: "opt_ring_corona",
        letter: "D",
        title: "Target Corona",
        subtitle: "Commercial light ring; uses 3x 3D-printed conversion adapter brackets.",
        action: () => {
          userConfig.ring_type = "corona";
          userConfig.lighting_mode = "white";
          return "q_compute";
        }
      },
      {
        id: "opt_ring_diy_low",
        letter: "E",
        title: "IT2 DIY Flat-Top Ring (For low ceilings, min. 2.0m)",
        subtitle: "Flattened top segment for low-clearance spaces (requires min. 2.0m ceiling height).",
        action: () => {
          userConfig.ring_type = "diy_low";
          userConfig.lighting_mode = "white";
          return "q_compute";
        }
      }
    ]
  },

  q_compute: {
    title: "How would you like to run Autodarts?",
    options: [
      {
        id: "opt_compute_existing",
        letter: "A",
        title: "PC / Laptop",
        subtitle: "Utilize existing device",
        action: () => {
          userConfig.host_compute = "existing_pc";
          return "q_assembly";
        }
      },
      {
        id: "opt_compute_mini_pc",
        letter: "B",
        title: "Mini-PC",
        subtitle: "Dedicated PC",
        badge: "Recommended",
        badgeType: "success",
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
    title: "How would you like to assemble your 3D printed parts?",
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
        title: "Heat Inserts",
        subtitle: "Requires Soldering Iron",
        action: () => {
          userConfig.assembly_style = "inserts";
          return "FINISHED";
        }
      }
    ]
  }
};

function initApp() {
  initCurrencySwitcher();
  showQuestion(currentQuestionId);
  bindNavigationEvents();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

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

  // Dynamic step count: Wall -> Baseplate Yes gives 7 questions. Direct Wall gives 6 questions.
  // 1: q_vision, 2: q_cam_model, 3: q_mounting
  // If stand: q_baseplate_addons (4), q_ring (5), q_compute (6), q_assembly (7) -> 7 total
  // If wall + baseplate: q_wall_baseplate (4), q_baseplate_addons (5), q_ring (6), q_compute (7), q_assembly (8) -> 8 total
  // If wall + direct: q_wall_baseplate (4), q_ring (5), q_compute (6), q_assembly (7) -> 7 total
  let totalQuestions = 7;
  if (userConfig.mount_type === "wall") {
    totalQuestions = (userConfig.use_baseplate === false) ? 7 : 8;
  } else if (userConfig.mount_type === "stand") {
    totalQuestions = 7;
  } else {
    // Before mounting choice is made, default to 7
    totalQuestions = 7;
  }

  const currentStepNum = questionHistory.length + 1;
  // Cap current question progress at (currentStepNum - 1) / totalQuestions or proportionally so it never hits 100% until result screen
  const progressPercent = Math.min(95, Math.round(((currentStepNum - 0.5) / totalQuestions) * 100));

  const counterEl = document.getElementById("step-counter");
  if (counterEl) counterEl.textContent = `Question ${currentStepNum} of ${totalQuestions}`;

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
  const subtitleHtml = q.subtitle ? `<p class="q-subtitle">${q.subtitle}</p>` : "";
  container.innerHTML = `
    <h2 class="q-title">${q.title}</h2>
    ${subtitleHtml}

    <div class="options-list">
      ${q.options
        .map(
          (opt) => {
            const priceTag = typeof opt.priceTag === "function" ? opt.priceTag() : null;
            const subtitle = opt.subtitle ? `<div class="option-desc">${opt.subtitle}</div>` : "";
            const features = Array.isArray(opt.features) && opt.features.length > 0
              ? `<div class="option-features-pills">${opt.features.map(f => `<span class="feature-tag"><span class="feature-tag-bullet">✦</span>${f}</span>`).join("")}</div>`
              : "";

            return `
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
            ${subtitle}
            ${features}
          </div>
          ${priceTag ? `<span class="option-price-pill">${priceTag}</span>` : ""}
        </button>
      `;
          }
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
  const subtitleHtml = q.subtitle ? `<p class="q-subtitle">${q.subtitle}</p>` : "";

  container.innerHTML = `
    <h2 class="q-title">${q.title}</h2>
    ${subtitleHtml}

    <div class="options-list" id="multi-options-list">
      ${q.options
        .map((opt) => {
          const isChecked = selected.includes(opt.id) && !opt.disabled;
          const subtitle = opt.subtitle ? `<div class="option-desc">${opt.subtitle}</div>` : "";
          const badge = opt.badge ? `<span class="option-badge badge-${opt.badgeType || "neutral"}">${opt.badge}</span>` : "";
          return `
          <button type="button" 
                  class="option-item ${isChecked ? "selected" : ""} ${opt.disabled ? "disabled" : ""}" 
                  data-opt="${opt.id}" 
                  id="multi-${opt.id}"
                  ${opt.disabled ? "disabled aria-disabled='true'" : ""}>
            <span class="option-letter">${opt.disabled ? "—" : (isChecked ? "✓" : "○")}</span>
            <div class="option-text-wrap">
              <div class="option-title-row">
                <span class="option-title">${opt.title}</span>
                ${badge}
              </div>
              ${subtitle}
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
      const opt = q.options.find(o => o.id === optId);
      if (!opt || opt.disabled) return;

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

  const PLA_EUR_PER_GRAM = 0.012; // ~12€ / kg
  const TPU_EUR_PER_GRAM = 0.030; // ~30€ / kg

  const printedParts = [];

  if (hasBaseplate) {
    const g = 480;
    printedParts.push({
      name: "Baseplate",
      qty: 1,
      material: "PLA / PETG",
      notes: "4-segment backboard",
      project: "IT2 Baseplate",
      modelId: "2782096",
      modelUrl: "https://makerworld.com/en/models/2782096",
      estGrams: g,
      costEur: +(g * PLA_EUR_PER_GRAM).toFixed(2)
    });
  }

  if (hasBaseplate && userConfig.baseplate_addons.includes("tpu_dampeners")) {
    const g = 45;
    printedParts.push({
      name: "Sound Dampeners",
      qty: 3,
      material: "TPU 95A",
      notes: "Vibration isolation",
      project: "IT2 Baseplate",
      modelId: "2782096",
      modelUrl: "https://makerworld.com/en/models/2782096",
      estGrams: g,
      costEur: +(g * TPU_EUR_PER_GRAM).toFixed(2)
    });
  }

  if (hasBaseplate && userConfig.baseplate_addons.includes("shroud")) {
    const g = 320;
    printedParts.push({
      name: "Shroud (Enclosed)",
      qty: 1,
      material: "PLA / PETG",
      notes: "Enclosed surround shroud",
      project: "IT2 Baseplate",
      modelId: "2782096",
      modelUrl: "https://makerworld.com/en/models/2782096",
      estGrams: g,
      costEur: +(g * PLA_EUR_PER_GRAM).toFixed(2)
    });
  }

  if (hasBaseplate && userConfig.baseplate_addons.includes("hardware_bay")) {
    const g = 75;
    printedParts.push({
      name: "Rear Hardware Bay",
      qty: 1,
      material: "PLA / PETG",
      notes: "Host bracket",
      project: "IT2 Baseplate",
      modelId: "2782096",
      modelUrl: "https://makerworld.com/en/models/2782096",
      estGrams: g,
      costEur: +(g * PLA_EUR_PER_GRAM).toFixed(2)
    });
  }

  if (isLens) {
    const isTripod = userConfig.lens_mount_type === "tripod";
    const g = isTripod ? 55 : 65;
    printedParts.push({
      name: isTripod ? "Phone Tripod Mount" : "Phone Mount",
      qty: 1,
      material: "PLA / PETG",
      notes: "Smartphone bracket",
      project: "IT2 Camera Arm Assembly",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: g,
      costEur: +(g * PLA_EUR_PER_GRAM).toFixed(2)
    });
  } else {
    const g = 350; // Camera Arms ~350g total
    printedParts.push({
      name: "Camera Arms",
      qty: 3,
      material: "PLA / PETG",
      notes: "120° camera mounts",
      project: "IT2 Camera Arm Assembly",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: g,
      costEur: +(g * PLA_EUR_PER_GRAM).toFixed(2)
    });
  }

  if (userConfig.ring_type === "diy_std") {
    const g = 385; // DIY Light Ring ~385g total
    printedParts.push({
      name: "DIY Light Ring",
      qty: 4,
      material: "PLA / PETG",
      notes: "4-segment light ring",
      project: "IT2 Camera Arm Assembly",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: g,
      costEur: +(g * PLA_EUR_PER_GRAM).toFixed(2)
    });
  } else if (userConfig.ring_type === "diy_low") {
    const g = 385;
    printedParts.push({
      name: "DIY Flat-Top Light Ring",
      qty: 4,
      material: "PLA / PETG",
      notes: "4-segment flat-top light ring",
      project: "IT2 Camera Arm Assembly",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: g,
      costEur: +(g * PLA_EUR_PER_GRAM).toFixed(2)
    });
  } else if (userConfig.ring_type === "corona") {
    const g = 70;
    printedParts.push({
      name: "Target Corona Conversion Adapters",
      qty: 3,
      material: "PLA / PETG",
      notes: "Adapter brackets",
      project: "IT2 Camera Arm Assembly",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: g,
      costEur: +(g * PLA_EUR_PER_GRAM).toFixed(2)
    });
  }

  if (isDirectWall && !isLens) {
    const g = 7; // Cable Clips ~7g total
    printedParts.push({
      name: "Addon: Snap-On Cable Clips",
      qty: 6,
      material: "PLA / PETG",
      notes: "Ring clips",
      project: "IT2 Camera Arm Assembly",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: g,
      costEur: +(g * PLA_EUR_PER_GRAM).toFixed(2)
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
    const camName = isOV2710 ? "HBV OV2710 USB Camera Modules (Set of 3)" : "HBV OV9732 USB Camera Modules (Set of 3)";
    const priceKey = isOV2710 ? "camera_ov2710" : "camera_ov9732";
    const liveData = livePrices[priceKey] ?? null;
    const liveEur = liveData?.eur ?? null;
    const camCostEur = liveEur !== null ? liveEur : (isOV2710 ? 50.99 : 35.39);
    electronics.push({
      name: camName,
      qty: 1,
      notes: "3-pack with 2m cables",
      source: liveEur !== null ? "AliExpress (live price)" : "AliExpress / Amazon",
      costEur: camCostEur,
      liveData
    });
  }

  if ((userConfig.ring_type === "diy_std" || userConfig.ring_type === "diy_low") && userConfig.lighting_mode === "white") {
    electronics.push({
      name: "LED Light Strip (~2.2m)",
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
      name: "Addressable LED Strip (~2.2m)",
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

  if (!isLens) {
    if (userConfig.host_compute === "mini_pc") {
      electronics.push({
        name: "Mini-PC",
        qty: 1,
        notes: "Autodarts host",
        source: "Refurbished / New",
        costEur: 50.0
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

  // Calculate dynamic costs considering user's owned status
  function calculateActiveTotals() {
    let activePrintedCost = 0;
    let activeHardwareCost = 0;
    let activeElectronicsCost = 0;
    let activeGrams = 0;

    printedParts.forEach((p) => {
      const key = getItemKey("print", p.name);
      const isOwned = window.itemStates[key]?.owned;
      if (!isOwned) {
        activePrintedCost += p.costEur || 0;
        activeGrams += p.estGrams || 0;
      }
    });

    hardware.forEach((h) => {
      const key = getItemKey("hardware", h.name);
      const isOwned = window.itemStates[key]?.owned;
      if (!isOwned) {
        activeHardwareCost += h.costEur || 0;
      }
    });

    electronics.forEach((e) => {
      const key = getItemKey("elec", e.name);
      const isOwned = window.itemStates[key]?.owned;
      if (!isOwned) {
        activeElectronicsCost += e.costEur || 0;
      }
    });

    return {
      activePrintedCost,
      activeHardwareCost,
      activeElectronicsCost,
      activeTotalCost: activePrintedCost + activeHardwareCost + activeElectronicsCost,
      activeGrams
    };
  }

  const totals = calculateActiveTotals();

  const totalGrams = totals.activeGrams;
  const totalFasteners = hardware.reduce((acc, h) => acc + (h.qty || 0), 0);
  const totalPrintedPieces = printedParts.reduce((acc, p) => acc + (p.qty || 0), 0);

  const totalPrintedCost = totals.activePrintedCost;
  const totalHardwareCost = totals.activeHardwareCost;
  const totalElectronicsCost = totals.activeElectronicsCost;
  const totalCostEur = totals.activeTotalCost;

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

  window.toggleItemCheck = (key) => {
    if (!window.itemStates[key]) window.itemStates[key] = {};
    window.itemStates[key].checked = !window.itemStates[key].checked;
    generateCustomBOM();
  };

  window.toggleItemOwned = (key) => {
    if (!window.itemStates[key]) window.itemStates[key] = {};
    window.itemStates[key].owned = !window.itemStates[key].owned;
    generateCustomBOM();
  };

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
            <th style="width: 40px; text-align: center;">Done</th>
            <th>Component</th>
            <th>Qty</th>
            <th>Material</th>
            <th>Est. Weight</th>
            <th>Est. Cost</th>
            <th>Status / Own</th>
            <th>Makerworld</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            const groups = {};
            printedParts.forEach((p) => {
              const proj = p.project || "IT2 Project";
              if (!groups[proj]) {
                groups[proj] = {
                  name: proj,
                  modelId: p.modelId,
                  modelUrl: p.modelUrl,
                  items: []
                };
              }
              groups[proj].items.push(p);
            });

            return Object.values(groups)
              .map((grp) => {
                const headerRow = `
                  <tr class="project-group-row">
                    <td colspan="8">
                      <div class="project-group-cell">
                        <span class="project-badge-title">
                          <span>📦</span>
                          <span>${grp.name}</span>
                        </span>
                        <a href="${grp.modelUrl}" target="_blank" rel="noopener noreferrer" class="project-link-pill">
                          Makerworld #${grp.modelId} ↗
                        </a>
                      </div>
                    </td>
                  </tr>
                `;
                const itemRows = grp.items
                  .map((p) => {
                    const key = getItemKey("print", p.name);
                    const state = window.itemStates[key] || {};
                    const isChecked = !!state.checked;
                    const isOwned = !!state.owned;

                    return `
                  <tr class="bom-item-row ${isChecked ? "item-completed" : ""} ${isOwned ? "item-owned" : ""}">
                    <td style="text-align: center;">
                      <input type="checkbox" class="bom-checkbox" ${isChecked ? "checked" : ""} onchange="window.toggleItemCheck('${key}')" title="Mark as printed / ready">
                    </td>
                    <td>
                      <div class="part-name-cell">
                        <span class="part-name-bold ${isChecked ? "text-strike" : ""}">${p.name}</span>
                      </div>
                    </td>
                    <td><span class="qty-pill">${p.qty}x</span></td>
                    <td><span class="mat-tag ${p.material.includes("TPU") ? "mat-tpu" : "mat-pla"}">${p.material}</span></td>
                    <td><span class="weight-pill">${p.estGrams ? `~${p.estGrams}g` : "-"}</span></td>
                    <td>
                      ${isOwned ? `<span class="cost-pill text-free">€0 (Owned)</span>` : `<span class="cost-pill">~${formatCurrency(p.costEur)}</span>`}
                    </td>
                    <td>
                      <button type="button" class="btn-owned-toggle ${isOwned ? "active" : ""}" onclick="window.toggleItemOwned('${key}')">
                        ${isOwned ? "✓ Already Have" : "I Have This"}
                      </button>
                    </td>
                    <td>
                      <a href="${p.modelUrl}" target="_blank" rel="noopener noreferrer" class="link-external">
                        #${p.modelId} ↗
                      </a>
                    </td>
                  </tr>
                `;
                  })
                  .join("");
                return headerRow + itemRows;
              })
              .join("");
          })()}
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
            <th style="width: 40px; text-align: center;">Done</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Location</th>
            <th>Est. Cost</th>
            <th>Status / Own</th>
          </tr>
        </thead>
        <tbody>
          ${hardware
            .map((h) => {
              const key = getItemKey("hardware", h.name);
              const state = window.itemStates[key] || {};
              const isChecked = !!state.checked;
              const isOwned = !!state.owned;

              return `
            <tr class="bom-item-row ${isChecked ? "item-completed" : ""} ${isOwned ? "item-owned" : ""}">
              <td style="text-align: center;">
                <input type="checkbox" class="bom-checkbox" ${isChecked ? "checked" : ""} onchange="window.toggleItemCheck('${key}')" title="Mark as acquired">
              </td>
              <td><span class="part-name-bold ${isChecked ? "text-strike" : ""}">${h.name}</span></td>
              <td><span class="qty-pill">${h.qty}x</span></td>
              <td class="part-notes-dim">${h.notes}</td>
              <td>
                ${isOwned ? `<span class="cost-pill text-free">€0 (Owned)</span>` : `<span class="cost-pill">~${formatCurrency(h.costEur)}</span>`}
              </td>
              <td>
                <button type="button" class="btn-owned-toggle ${isOwned ? "active" : ""}" onclick="window.toggleItemOwned('${key}')">
                  ${isOwned ? "✓ Already Have" : "I Have This"}
                </button>
              </td>
            </tr>
          `;
            })
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
            <th style="width: 40px; text-align: center;">Done</th>
            <th>Component</th>
            <th>Qty</th>
            <th>Source</th>
            <th>Est. Cost</th>
            <th>Status / Own</th>
          </tr>
        </thead>
        <tbody>
          ${electronics
            .map((e) => {
              const key = getItemKey("elec", e.name);
              const state = window.itemStates[key] || {};
              const isChecked = !!state.checked;
              const isOwned = !!state.owned;

              return `
            <tr class="bom-item-row ${isChecked ? "item-completed" : ""} ${isOwned ? "item-owned" : ""}">
              <td style="text-align: center;">
                <input type="checkbox" class="bom-checkbox" ${isChecked ? "checked" : ""} onchange="window.toggleItemCheck('${key}')" title="Mark as acquired">
              </td>
              <td>
                <div class="part-name-cell">
                  <span class="part-name-bold ${isChecked ? "text-strike" : ""}">${e.name}</span>
                </div>
              </td>
              <td><span class="qty-pill">${e.qty}x</span></td>
              <td class="part-notes-dim">${e.source}</td>
              <td>
                ${isOwned || e.costEur === 0 ? `<span class="cost-pill text-free">Free (Owned)</span>` : `<span class="cost-pill">~${formatCurrency(e.costEur)}</span>`}
              </td>
              <td>
                <button type="button" class="btn-owned-toggle ${isOwned ? "active" : ""}" onclick="window.toggleItemOwned('${key}')">
                  ${isOwned ? "✓ Already Have" : "I Have This"}
                </button>
              </td>
            </tr>
          `;
            })
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="bom-card-group">
      <div class="bom-group-header">
        <div class="group-title-row">
          <span class="group-icon">🛠️</span>
          <h3 class="group-title">Tools Required</h3>
        </div>
      </div>
      <table class="bom-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">Have</th>
            <th>Tool</th>
            <th>Notes</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${tools
            .map((t) => {
              const key = getItemKey("tool", t.name);
              const state = window.itemStates[key] || {};
              const isChecked = !!state.checked;

              return `
            <tr class="bom-item-row ${isChecked ? "item-completed" : ""}">
              <td style="text-align: center;">
                <input type="checkbox" class="bom-checkbox" ${isChecked ? "checked" : ""} onchange="window.toggleItemCheck('${key}')" title="Mark as available">
              </td>
              <td style="width: 35%;"><span class="part-name-bold ${isChecked ? "text-strike" : ""}">${t.name}</span></td>
              <td class="part-notes-dim">${t.notes}</td>
              <td>
                <span class="status-pill ${isChecked ? "status-ready" : "status-needed"}">
                  ${isChecked ? "✓ Ready" : "Needed"}
                </span>
              </td>
            </tr>
          `;
            })
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
