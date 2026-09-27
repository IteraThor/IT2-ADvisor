/**
 * IT2 System Minimalist Card Questionnaire & BOM Engine
 * Features dynamic branching questions, clean progressive transitions, and customized BOM output.
 */

// User Configuration State
const userConfig = {
  vision_mode: null, // "lens" | "3cam"
  cam_model: "ov9732", // "ov9732" | "ov2710"
  mount_type: null, // "wall" | "stand"
  use_baseplate: null, // true | false
  baseplate_addons: [], // ["tpu_dampeners", "hardware_bay", "ambient_wled"]
  ring_type: null, // "plasma" | "corona" | "diy_std" | "diy_low"
  lighting_mode: "white", // "white" | "wled"
  host_compute: "existing_pc", // "existing_pc" | "mini_pc" | "pi"
  assembly_style: null // "direct" | "inserts"
};

// Navigation History Stack
let questionHistory = [];
let currentQuestionId = "q_vision";

// Define the Branching Questions
const QUESTIONS = {
  q_vision: {
    category: "Vision Architecture",
    title: "How do you want to track your darts?",
    subtitle: "Autodarts now supports single-smartphone tracking alongside the classic 3-camera rig.",
    options: [
      {
        id: "opt_lens",
        letter: "A",
        title: "Autodarts Lens (Use My Smartphone)",
        desc: "Single phone mounts directly to the light ring. Zero external cameras, zero USB cables, no dedicated PC needed!",
        badge: "Ultra-Budget & Minimalist",
        badgeType: "success",
        action: () => {
          userConfig.vision_mode = "lens";
          userConfig.host_compute = "none";
          return "q_mounting"; // skip camera models & compute questions!
        }
      },
      {
        id: "opt_3cam",
        letter: "B",
        title: "Classic 3-Camera Rig (IT2 High Performance)",
        desc: "3 dedicated 3D-printed arms with 32x32 USB vision boards for tournament-grade dart tracking.",
        badge: "Full Hardware Rig",
        badgeType: "accent",
        action: () => {
          userConfig.vision_mode = "3cam";
          return "q_cam_model";
        }
      }
    ]
  },

  q_cam_model: {
    category: "Camera Sensors",
    title: "Which camera modules do you prefer?",
    subtitle: "We exclusively recommend genuine HBV camera modules from AliExpress.",
    options: [
      {
        id: "opt_ov9732",
        letter: "A",
        title: "HBV OV9732 (Recommended Budget)",
        desc: "720p high-speed sensors. Extremely reliable dart detection with low CPU overhead.",
        badge: "Best Value",
        badgeType: "success",
        action: () => {
          userConfig.cam_model = "ov9732";
          return "q_mounting";
        }
      },
      {
        id: "opt_ov2710",
        letter: "B",
        title: "HBV OV2710 (Premium 1080p)",
        desc: "1080p crisp board view. Higher resolution visual feed for sharper monitoring.",
        badge: "Crisp 1080p",
        badgeType: "accent",
        action: () => {
          userConfig.cam_model = "ov2710";
          return "q_mounting";
        }
      }
    ]
  },

  q_mounting: {
    category: "Mounting Environment",
    title: "Where will your dartboard be set up?",
    subtitle: "This dictates the mounting brackets and structural anchor required.",
    options: [
      {
        id: "opt_wall",
        letter: "A",
        title: "On a Wall (Drywall, Brick, or Backboard)",
        desc: "Permanent wall setup. You can choose direct wall mounting or the IT2 4-part Baseplate.",
        badge: "Permanent Setup",
        badgeType: "neutral",
        action: () => {
          userConfig.mount_type = "wall";
          return "q_wall_baseplate";
        }
      },
      {
        id: "opt_stand",
        letter: "B",
        title: "On a Portable Dart Stand (Tripod)",
        desc: "Mobile setups (e.g. Winmau Xtreme 2). Natively requires the IT2 Baseplate for rigidity.",
        badge: "Stand Native • 0 Wall Holes",
        badgeType: "accent",
        action: () => {
          userConfig.mount_type = "stand";
          userConfig.use_baseplate = true;
          return "q_baseplate_addons"; // auto-selects baseplate!
        }
      }
    ]
  },

  q_wall_baseplate: {
    category: "Wall Mounting Strategy",
    title: "Do you want to use the IT2 4-part Baseplate?",
    subtitle: "The Baseplate acts as a rigid master anchor between the wall, dartboard, and IT2 system.",
    options: [
      {
        id: "opt_baseplate_yes",
        letter: "A",
        title: "Yes, use the Baseplate (Highly Recommended)",
        desc: "Drastically protects walls (only 3 holes drilled instead of 8), hides all wiring, and unlocks sound dampening.",
        badge: "Only 3 Holes • Clean Cables",
        badgeType: "success",
        action: () => {
          userConfig.use_baseplate = true;
          return "q_baseplate_addons";
        }
      },
      {
        id: "opt_baseplate_no",
        letter: "B",
        title: "No, Direct Wall Mount (Minimalist)",
        desc: "Mounts arms and board directly to the wall. Slightly fewer 3D printed parts, but requires drilling ~8 holes.",
        badge: "8 Wall Holes Needed",
        badgeType: "warning",
        action: () => {
          userConfig.use_baseplate = false;
          userConfig.baseplate_addons = [];
          return "q_ring";
        }
      }
    ]
  },

  q_baseplate_addons: {
    category: "Baseplate Upgrades",
    title: "Which Baseplate add-ons would you like?",
    subtitle: "Select all that you want to include, or choose None.",
    isMultiSelect: true,
    options: [
      {
        id: "tpu_dampeners",
        title: "TPU 95A Sound & Vibration Dampeners",
        desc: "Flexible shock-absorbing inserts in the baseplate to mute dart impact noise into walls.",
        badge: "Acoustic Silence",
        badgeType: "success"
      },
      {
        id: "hardware_bay",
        title: "Hidden Rear Hardware Bay",
        desc: "Integrated bracket behind the board to conceal a Mini-PC, Raspberry Pi, or WLED controller.",
        badge: "Concealed Hardware",
        badgeType: "accent"
      },
      {
        id: "ambient_wled",
        title: "Perimeter Ambient Wall Halo Glow",
        desc: "Perimeter channel for addressable LED strip creating a soft halo glow on the wall.",
        badge: "Ambient Halo",
        badgeType: "accent"
      }
    ],
    onContinue: (selectedIds) => {
      userConfig.baseplate_addons = selectedIds;
      return "q_ring";
    }
  },

  q_ring: {
    category: "Light Ring & Frame",
    title: "Which light ring frame will you use?",
    subtitle: "The IT2 system geometry is matched 1:1 to the Winmau Plasma pattern.",
    options: [
      {
        id: "opt_ring_plasma",
        letter: "A",
        title: "Winmau Plasma Light Ring (Commercial)",
        desc: "Native direct fit! Camera arms bolt directly to the Plasma frame. Needs 0 adapters.",
        badge: "Native Direct Fit",
        badgeType: "success",
        action: () => {
          userConfig.ring_type = "plasma";
          return userConfig.vision_mode === "3cam" ? "q_compute" : "q_assembly";
        }
      },
      {
        id: "opt_ring_corona",
        letter: "B",
        title: "Target Corona Light Ring (Commercial)",
        desc: "Converts the Target Corona magnetic ring to IT2 using 3x 3D-printed conversion brackets.",
        badge: "Includes 3x Adapters",
        badgeType: "neutral",
        action: () => {
          userConfig.ring_type = "corona";
          return userConfig.vision_mode === "3cam" ? "q_compute" : "q_assembly";
        }
      },
      {
        id: "opt_ring_diy_std",
        letter: "C",
        title: "IT2 DIY 3D-Printed Ring (Standard Ceiling ≥ 2.0m)",
        desc: "Full 360° circular slim light ring with snap-on curved diffusers. Slimmest 3D design available.",
        badge: "Full 360° Circle",
        badgeType: "accent",
        action: () => {
          userConfig.ring_type = "diy_std";
          return "q_lighting_mode";
        }
      },
      {
        id: "opt_ring_diy_low",
        letter: "D",
        title: "IT2 DIY Flat-Top Ring (Low Ceiling ≤ 2.0m)",
        desc: "Flattened top arch profile engineered specifically for low basements and attic rooms under 2 meters high.",
        badge: "Fits Low Ceilings ≤ 2.0m",
        badgeType: "warning",
        action: () => {
          userConfig.ring_type = "diy_low";
          return "q_lighting_mode";
        }
      }
    ]
  },

  q_lighting_mode: {
    category: "Ring Illumination",
    title: "What kind of lighting do you want inside the DIY Ring?",
    subtitle: "You can choose clean standard white or reactive gameplay animations.",
    options: [
      {
        id: "opt_light_white",
        letter: "A",
        title: "Clean Functional White Illumination",
        desc: "Flicker-free white LED strip (COB or SMD) with diffusers for shadow-free dart tracking.",
        badge: "Standard",
        badgeType: "neutral",
        action: () => {
          userConfig.lighting_mode = "white";
          return userConfig.vision_mode === "3cam" ? "q_compute" : "q_assembly";
        }
      },
      {
        id: "opt_light_wled",
        letter: "B",
        title: "Dual-Channel Reactive WLED Lighting",
        desc: "Clean board light + addressable RGB LEDs running WLED. Flashes and animates to 180s, checkouts & hits.",
        badge: "Arcade Reactive",
        badgeType: "accent",
        action: () => {
          userConfig.lighting_mode = "wled";
          return userConfig.vision_mode === "3cam" ? "q_compute" : "q_assembly";
        }
      }
    ]
  },

  q_compute: {
    category: "Host Hardware",
    title: "How will you run the Autodarts software?",
    subtitle: "The 3 USB camera feeds need to be processed by a computer.",
    options: [
      {
        id: "opt_compute_existing",
        letter: "A",
        title: "Use My Existing Desktop PC or Laptop",
        desc: "Connects across the room using an active USB extension or powered hub. €0 added computer cost.",
        badge: "€0 Added Cost",
        badgeType: "success",
        action: () => {
          userConfig.host_compute = "existing_pc";
          return "q_assembly";
        }
      },
      {
        id: "opt_compute_mini_pc",
        letter: "B",
        title: "Dedicated Refurbished Mini-PC",
        desc: "Compact Intel N95/N100 or refurbished HP ProDesk / Dell Tiny. Silent, dedicated, snaps into hardware bay.",
        badge: "Community Favorite",
        badgeType: "accent",
        action: () => {
          userConfig.host_compute = "mini_pc";
          return "q_assembly";
        }
      },
      {
        id: "opt_compute_pi",
        letter: "C",
        title: "Raspberry Pi 4 / 5",
        desc: "Single-board computer running Linux Autodarts. Compact and energy efficient.",
        badge: "Compact SBC",
        badgeType: "neutral",
        action: () => {
          userConfig.host_compute = "pi";
          return "q_assembly";
        }
      }
    ]
  },

  q_assembly: {
    category: "Fasteners & Assembly",
    title: "How do you want to fasten your 3D printed parts?",
    subtitle: "IT2 supports both heat-set brass threaded inserts and direct self-tapping screws.",
    options: [
      {
        id: "opt_fastener_direct",
        letter: "A",
        title: "Direct Self-Tapping (No Inserts)",
        desc: "Taps M4 cylindrical screws directly into plastic pilot holes. Zero brass inserts and zero soldering iron needed!",
        badge: "Beginner Friendly • €0 Inserts",
        badgeType: "success",
        action: () => {
          userConfig.assembly_style = "direct";
          return "FINISHED";
        }
      },
      {
        id: "opt_fastener_inserts",
        letter: "B",
        title: "Brass Heat-Set Threaded Inserts (M4 / M6)",
        desc: "Melted into 3D prints using a soldering iron. Rock-solid and can be assembled and disassembled endlessly.",
        badge: "Heavy Duty & Reusable",
        badgeType: "accent",
        action: () => {
          userConfig.assembly_style = "inserts";
          return "FINISHED";
        }
      }
    ]
  }
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  showQuestion(currentQuestionId);
  bindNavigationEvents();
});

// Render the active question card
function showQuestion(qId) {
  const q = QUESTIONS[qId];
  if (!q) return;

  currentQuestionId = qId;
  const container = document.getElementById("question-card");
  if (!container) return;

  // Update Progress Meta
  const totalQuestionsEstimate = userConfig.vision_mode === "lens" ? 5 : 7;
  const currentStepNum = questionHistory.length + 1;
  const progressPercent = Math.min(100, Math.round((currentStepNum / totalQuestionsEstimate) * 100));

  const counterEl = document.getElementById("step-counter");
  if (counterEl) counterEl.textContent = `Question ${currentStepNum}`;

  const fillEl = document.getElementById("progress-fill");
  if (fillEl) fillEl.style.width = `${progressPercent}%`;

  const backBtn = document.getElementById("btn-back");
  if (backBtn) {
    backBtn.style.visibility = questionHistory.length > 0 ? "visible" : "hidden";
  }

  // Handle Multi-Select vs Single-Select Card
  if (q.isMultiSelect) {
    renderMultiSelectQuestion(container, q);
  } else {
    renderSingleSelectQuestion(container, q);
  }
}

// Render Single-Select Question
function renderSingleSelectQuestion(container, q) {
  container.innerHTML = `
    <span class="q-category-tag">${q.category}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-subtitle">${q.subtitle}</p>

    <div class="options-list">
      ${q.options
        .map(
          (opt) => `
        <button type="button" class="option-item" data-opt="${opt.id}" id="opt-${opt.id}">
          <span class="option-letter">${opt.letter}</span>
          <div class="option-text-wrap">
            <div class="option-title-row">
              <span class="option-title">${opt.title}</span>
              ${opt.badge ? `<span class="option-badge badge-${opt.badgeType || "neutral"}">${opt.badge}</span>` : ""}
            </div>
            <p class="option-desc">${opt.desc}</p>
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
      if (!opt) return;

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

// Render Multi-Select Question
function renderMultiSelectQuestion(container, q) {
  let selected = [...userConfig.baseplate_addons];

  container.innerHTML = `
    <span class="q-category-tag">${q.category}</span>
    <h2 class="q-title">${q.title}</h2>
    <p class="q-subtitle">${q.subtitle}</p>

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
                ${opt.badge ? `<span class="option-badge badge-${opt.badgeType || "neutral"}">${opt.badge}</span>` : ""}
              </div>
              <p class="option-desc">${opt.desc}</p>
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

  // Toggle selections
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

  // Continue button
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

// Bind Navigation
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

  // Export buttons
  const copyBtn = document.getElementById("btn-copy-bom");
  if (copyBtn) copyBtn.addEventListener("click", () => copyBOMToClipboard());

  const csvBtn = document.getElementById("btn-export-csv");
  if (csvBtn) csvBtn.addEventListener("click", () => exportBOMToCSV());

  const printBtn = document.getElementById("btn-print-bom");
  if (printBtn) printBtn.addEventListener("click", () => window.print());
}

// Finish Questionnaire and Reveal BOM
function finishQuestionnaire() {
  document.getElementById("screen-questionnaire").style.display = "none";
  const bomScreen = document.getElementById("screen-bom");
  bomScreen.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  generateCustomBOM();
}

// Calculate the Custom BOM based on answers
function generateCustomBOM() {
  const isLens = userConfig.vision_mode === "lens";
  const isStand = userConfig.mount_type === "stand";
  const hasBaseplate = userConfig.use_baseplate || isStand;
  const isDirectWall = userConfig.mount_type === "wall" && !hasBaseplate;
  const isDirectTapping = userConfig.assembly_style === "direct";

  // Wall Drilling Impact
  let wallHoles = 0;
  if (isDirectWall) wallHoles = 8;
  else if (hasBaseplate && !isStand) wallHoles = 3;
  else if (isStand) wallHoles = 0;

  // 1. 3D Printed Parts
  const printedParts = [];

  if (hasBaseplate) {
    printedParts.push({
      name: "IT2 4-Segment Interlocking Baseplate",
      qty: 1,
      material: "PLA / PETG",
      notes: "Heavy-duty backboard frame for dartboard & IT2 arms",
      modelId: "2782096",
      modelUrl: "https://makerworld.com/en/models/2782096",
      estGrams: 480
    });
  }

  if (hasBaseplate && userConfig.baseplate_addons.includes("tpu_dampeners")) {
    printedParts.push({
      name: "Circular Sound Dampener Inserts",
      qty: 3,
      material: "TPU 95A (Flexible)",
      notes: "Absorbs dart impact thud from traveling into wall",
      modelId: "2782096",
      modelUrl: "https://makerworld.com/en/models/2782096",
      estGrams: 45
    });
  }

  if (hasBaseplate && userConfig.baseplate_addons.includes("hardware_bay")) {
    printedParts.push({
      name: "Rear Hidden Hardware Bay Bracket",
      qty: 1,
      material: "PLA / PETG",
      notes: "Conceals Mini-PC, Pi, or WLED controller behind board",
      modelId: "2782096",
      modelUrl: "https://makerworld.com/en/models/2782096",
      estGrams: 75
    });
  }

  if (isLens) {
    printedParts.push({
      name: "IT2 Ring-Mounted Calibrated Phone Mount",
      qty: 1,
      material: "PLA / PETG",
      notes: "Rigid phone mount at calibrated angle pointing at dartboard",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 65
    });
  } else {
    printedParts.push({
      name: "IT2 Camera Arm & Pod Assembly",
      qty: 3,
      material: "PLA / PETG",
      notes: "Bolts directly to Plasma pattern at 120°",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 160
    });
  }

  if (userConfig.ring_type === "diy_std") {
    printedParts.push({
      name: "IT2 DIY Light Ring Segments (Full 360°)",
      qty: 4,
      material: "PLA / PETG",
      notes: "Slim circular light ring profile",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 280
    });
    printedParts.push({
      name: "IT2 Snap-On Curved Light Diffusers",
      qty: 4,
      material: "PLA Clear / Translucent White",
      notes: "Diffuses LEDs for zero glare in camera sensors",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 50
    });
  } else if (userConfig.ring_type === "diy_low") {
    printedParts.push({
      name: "IT2 DIY Flat-Top Ring Segments (Low Ceiling)",
      qty: 4,
      material: "PLA / PETG",
      notes: "Flattened top arch profile for rooms ≤ 2.0m tall",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 270
    });
    printedParts.push({
      name: "IT2 Snap-On Curved Light Diffusers",
      qty: 4,
      material: "PLA Clear / Translucent White",
      notes: "Diffuses LEDs for zero glare in camera sensors",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 50
    });
  } else if (userConfig.ring_type === "corona") {
    printedParts.push({
      name: "IT2 Target Corona Conversion Adapters",
      qty: 3,
      material: "PLA / PETG",
      notes: "Clamps to Target Corona magnetic frame",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 70
    });
  }

  if (isDirectWall && !isLens) {
    printedParts.push({
      name: "IT2 Light Ring Snap-On Cable Clips",
      qty: 6,
      material: "PLA / PETG",
      notes: "Routes camera cables down ring to bottom Y-exit",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 15
    });
    printedParts.push({
      name: "IT2 Bottom Y-Split Cable Exit Guide",
      qty: 1,
      material: "PLA / PETG",
      notes: "Clean bundled exit for 3 USB camera cables",
      modelId: "1334165",
      modelUrl: "https://makerworld.com/en/models/1334165",
      estGrams: 12
    });
  }

  // 2. Hardware & Fasteners
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
      name: "Cylindrical Screws M4x10mm (DIN 912 / ISO 4762)",
      qty: m4Count,
      notes: "Primary mechanical screws for arms and joints"
    });
  }

  if (!isLens) {
    hardware.push({
      name: "Cylindrical Screws M2x6mm (DIN 912 / ISO 4762)",
      qty: 6,
      notes: "2 screws per 32x32 camera PCB mount"
    });
  }

  if (!isDirectTapping) {
    let m4Inserts = 0;
    if (!isLens) m4Inserts += 12;
    if (hasBaseplate) m4Inserts += 8;
    if (m4Inserts > 0) {
      hardware.push({
        name: "M4 Brass Heat-Set Inserts (6.3mm OD, max 9mm length)",
        qty: m4Inserts,
        notes: "Melted into 3D prints for reusable steel threads"
      });
    }
  }

  if (hasBaseplate) {
    const m6Count = isStand ? 7 : 3;
    hardware.push({
      name: "M6 Brass Heat-Set Inserts (8mm OD)",
      qty: m6Count,
      notes: isStand ? "7x mandatory for stand brackets & Rota-Locks" : "3x mandatory for Rota-Lock levelers"
    });
  }

  if (hasBaseplate && !isStand) {
    hardware.push({
      name: "4.0mm Wood / Wall Screws + Plugs",
      qty: 3,
      notes: "Anchors baseplate securely with only 3 holes"
    });
  } else if (isDirectWall) {
    hardware.push({
      name: "4.0mm Wood / Wall Screws + Plugs",
      qty: 8,
      notes: "6 for IT2 arm brackets + 2 for board bracket"
    });
  }

  // 3. Electronics & Vision
  const electronics = [];

  if (!isLens) {
    const camName =
      userConfig.cam_model === "ov2710"
        ? "HBV OV2710 1080p 32x32 USB Camera Modules"
        : "HBV OV9732 720p 32x32 USB Camera Modules";
    electronics.push({
      name: camName,
      qty: 3,
      notes: "Snap outer perforated 38x38 frame to 32x32mm with pliers",
      source: "HBV Store (AliExpress / Amazon)"
    });
    electronics.push({
      name: "USB Camera Connecting Cables (1.5m - 2m)",
      qty: 3,
      notes: "Included with HBV camera kits",
      source: "Included with cameras"
    });
  }

  if (userConfig.ring_type === "diy_std" || userConfig.ring_type === "diy_low") {
    electronics.push({
      name: "White High-CRI LED Strip (1.5m length)",
      qty: 1,
      notes: "6000K daylight white, 12V or 5V",
      source: "AliExpress / Amazon"
    });
    electronics.push({
      name: "12V / 5V 2A DC Power Supply with Barrel Jack",
      qty: 1,
      notes: "Powers LED ring illumination",
      source: "Standard electronics"
    });
  }

  if (userConfig.lighting_mode === "wled") {
    electronics.push({
      name: "ESP32 Development Board (Pre-flashed WLED)",
      qty: 1,
      notes: "Controls reactive game animations via WiFi / UDP",
      source: "AliExpress / Amazon"
    });
    electronics.push({
      name: "WS2812B / SK6812 Addressable 5V LED Strip (1.5m)",
      qty: 1,
      notes: "Runs inside reactive channel for game celebrations",
      source: "AliExpress / Amazon"
    });
    electronics.push({
      name: "5V 4A Dedicated Power Supply",
      qty: 1,
      notes: "Powers ESP32 and addressable LEDs",
      source: "Electronics supplier"
    });
  }

  if (hasBaseplate && userConfig.baseplate_addons.includes("ambient_wled")) {
    electronics.push({
      name: "WS2812B 5V Addressable LED Strip (1.0m)",
      qty: 1,
      notes: "Rear perimeter halo glow behind board",
      source: "AliExpress / Amazon"
    });
  }

  if (!isLens) {
    if (userConfig.host_compute === "mini_pc") {
      electronics.push({
        name: "Refurbished Mini-PC (Intel N95/N100 or i5 Tiny)",
        qty: 1,
        notes: "HP ProDesk, Dell Wyse, or Lenovo Tiny running Autodarts",
        source: "eBay / Amazon Refurbished"
      });
    } else if (userConfig.host_compute === "pi") {
      electronics.push({
        name: "Raspberry Pi 4 (4GB+) or Pi 5 + USB-C PSU",
        qty: 1,
        notes: "Runs Autodarts Linux server",
        source: "Raspberry Pi Approved Reseller"
      });
    } else if (userConfig.host_compute === "existing_pc") {
      electronics.push({
        name: "Active USB 3.0 Repeater / Extension Cable (5m - 10m)",
        qty: 1,
        notes: "Connects board cameras across the room to your desktop/laptop",
        source: "Amazon"
      });
    }
  }

  // 4. Required Tools
  const tools = [
    { name: "Hex Key Set (Allen Wrenches)", notes: "For M4 and M2 cylindrical screws" },
    { name: "Pliers / Flush Side-Cutters", notes: "For resizing HBV camera boards from 38x38 to 32x32" }
  ];
  if (!isDirectTapping) {
    tools.push({ name: "Soldering Iron with M4/M6 Insert Tip", notes: "For melting brass heat inserts into plastic" });
  }

  // Calculate Metrics
  const totalGrams = printedParts.reduce((acc, p) => acc + (p.estGrams * p.qty || 0), 0);
  const totalFasteners = hardware.reduce((acc, h) => acc + (h.qty || 0), 0);
  const totalPrintedPieces = printedParts.reduce((acc, p) => acc + (p.qty || 0), 0);

  // Update Summary Subtitle
  const summaryText = document.getElementById("config-summary-text");
  if (summaryText) {
    const visionLabel = isLens ? "Autodarts Lens (Smartphone)" : `3-Camera (${userConfig.cam_model.toUpperCase()})`;
    const mountLabel = isStand ? "Stand Mounted" : hasBaseplate ? "Baseplate Wall Mounted" : "Direct Wall Mounted";
    summaryText.textContent = `Configured for ${visionLabel} • ${mountLabel} • ${userConfig.assembly_style === "direct" ? "Direct Self-Tapping" : "Heat-Set Inserts"}.`;
  }

  // Update Metric Cards
  document.getElementById("metric-wall-holes").textContent = wallHoles === 0 ? "0 (Stand)" : `${wallHoles} Holes`;
  document.getElementById("metric-printed-pieces").textContent = `${totalPrintedPieces} Files`;
  document.getElementById("metric-print-weight").textContent = `~${totalGrams}g`;
  document.getElementById("metric-fastener-count").textContent = `${totalFasteners} Items`;

  // Render Itemized Tables
  renderFinishedTables(printedParts, hardware, electronics, tools);

  // Save for exports
  window.lastBOM = {
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

// Render Finished Tables
function renderFinishedTables(printedParts, hardware, electronics, tools) {
  const container = document.getElementById("bom-tables-container");
  if (!container) return;

  container.innerHTML = `
    <!-- 3D Printed Parts -->
    <div class="bom-card-group">
      <div class="bom-group-header">
        <div class="group-title-row">
          <span class="group-icon">🖨️</span>
          <h3 class="group-title">3D Printed Parts Checklist</h3>
        </div>
        <span class="group-count">${printedParts.length} files (${printedParts.reduce((a, b) => a + b.qty, 0)} total pieces)</span>
      </div>
      <table class="bom-table">
        <thead>
          <tr>
            <th>Component Name</th>
            <th>Qty</th>
            <th>Material</th>
            <th>Makerworld Link</th>
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
                  <span class="part-notes-dim">${p.notes}</span>
                </div>
              </td>
              <td><span class="qty-pill">${p.qty}x</span></td>
              <td><span class="mat-tag ${p.material.includes("TPU") ? "mat-tpu" : "mat-pla"}">${p.material}</span></td>
              <td>
                <a href="${p.modelUrl}" target="_blank" rel="noopener noreferrer" class="link-external">
                  Makerworld #${p.modelId} ↗
                </a>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <!-- Hardware & Fasteners -->
    <div class="bom-card-group">
      <div class="bom-group-header">
        <div class="group-title-row">
          <span class="group-icon">🔩</span>
          <h3 class="group-title">Hardware & Fasteners</h3>
        </div>
        <span class="group-count">${hardware.reduce((a, b) => a + b.qty, 0)} items</span>
      </div>
      <table class="bom-table">
        <thead>
          <tr>
            <th>Item & Specification</th>
            <th>Qty</th>
            <th>Purpose / Location</th>
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
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <!-- Electronics & Vision -->
    <div class="bom-card-group">
      <div class="bom-group-header">
        <div class="group-title-row">
          <span class="group-icon">⚡</span>
          <h3 class="group-title">Electronics, Vision & Host</h3>
        </div>
        <span class="group-count">${electronics.length} items</span>
      </div>
      <table class="bom-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Qty</th>
            <th>Source & Guidance</th>
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
                  <span class="part-notes-dim">${e.notes}</span>
                </div>
              </td>
              <td><span class="qty-pill">${e.qty}x</span></td>
              <td class="part-notes-dim">${e.source}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <!-- Tools Required -->
    <div class="bom-card-group">
      <div class="bom-group-header">
        <div class="group-title-row">
          <span class="group-icon">🛠️</span>
          <h3 class="group-title">Assembly Tools Required</h3>
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

// Copy Markdown formatted BOM
function copyBOMToClipboard() {
  const data = window.lastBOM;
  if (!data) return;

  let text = `# IT2-ADvisor - Custom Bill of Materials\n`;
  text += `Generated via IT2-ADvisor by IteraThor\n\n`;
  text += `### Summary\n`;
  text += `- Wall Holes: ${data.wallHoles}\n`;
  text += `- Total 3D Printed Parts: ${data.totalPrintedPieces} (~${data.totalGrams}g filament)\n`;
  text += `- Total Fasteners: ${data.totalFasteners} items\n\n`;

  text += `### 🖨️ 3D Printed Parts\n`;
  data.printedParts.forEach((p) => {
    text += `- [ ] **${p.qty}x ${p.name}** (${p.material}) - ${p.notes} [Makerworld #${p.modelId}]\n`;
  });

  text += `\n### 🔩 Hardware & Fasteners\n`;
  data.hardware.forEach((h) => {
    text += `- [ ] **${h.qty}x ${h.name}** - ${h.notes}\n`;
  });

  text += `\n### ⚡ Electronics & Vision\n`;
  data.electronics.forEach((e) => {
    text += `- [ ] **${e.qty}x ${e.name}** - ${e.notes} [${e.source}]\n`;
  });

  text += `\n### 🛠️ Required Tools\n`;
  data.tools.forEach((t) => {
    text += `- ${t.name}: ${t.notes}\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("btn-copy-bom");
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = "✓ Copied to Clipboard!";
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

// Export CSV
function exportBOMToCSV() {
  const data = window.lastBOM;
  if (!data) return;

  let csv = "Category,Part Name,Quantity,Specification / Material,Purpose / Notes,Source\n";

  data.printedParts.forEach((p) => {
    csv += `"3D Print","${p.name}",${p.qty},"${p.material}","${p.notes}","Makerworld #${p.modelId}"\n`;
  });
  data.hardware.forEach((h) => {
    csv += `"Hardware","${h.name}",${h.qty},"Fastener","${h.notes}","DIN 912 / ISO 4762"\n`;
  });
  data.electronics.forEach((e) => {
    csv += `"Electronics","${e.name}",${e.qty},"Electronics","${e.notes}","${e.source}"\n`;
  });
  data.tools.forEach((t) => {
    csv += `"Tools","${t.name}",1,"Tool","${t.notes}","Workshop"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `IT2-Custom-BOM-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
