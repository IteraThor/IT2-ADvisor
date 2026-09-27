# 🎯 IT2-ADvisor

> **Minimalist Build Configurator & Bill of Materials (BOM) Advisor for the IT2 Autodarts Autoscoring System.**

[![Makerworld System](https://img.shields.io/badge/Makerworld-IT2%20System-orange?style=flat&logo=bambulab)](https://makerworld.com/en/models/1334165)
[![Makerworld Baseplate](https://img.shields.io/badge/Makerworld-IT2%20Baseplate-blue?style=flat&logo=bambulab)](https://makerworld.com/en/models/2782096)
[![Documentation](https://img.shields.io/badge/GitHub-IT2%20Documentation-181717?style=flat&logo=github)](https://github.com/IteraThor/IT2-Documentation)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.com/invite/pZAjmwV5kE)

---

## 💡 Overview

The **IT2 Autodarts System** has a rich, modular ecosystem of add-ons, mounts, light rings, and vision setups. Deciding on the exact 3D prints, screw sizes, camera modules, and hardware can be daunting.

**IT2-ADvisor** is an interactive, card-based web questionnaire that guides you through your setup step-by-step. As you answer simple questions, it dynamically branches and generates an exact, customized **Bill of Materials (BOM)**:

- 🖨️ **3D Printed Parts Checklist:** Filtered for your exact ring, arms, and mount, with direct Makerworld download links.
- 🔩 **Hardware & Fasteners:** Exact DIN 912 M4x10mm and M2x6mm screw counts, plus M4/M6 heat-set inserts or direct-to-plastic self-tapping counts.
- ⚡ **Electronics & Vision:** HBV camera modules (OV9732 vs OV2710), LED strips, power supplies, and host compute guidance.
- 🛠️ **Assembly Tools:** Hex keys, side-cutters for camera resizing, and soldering iron requirements.
- 📊 **Key Metrics:** Real-time wall drilling impact (e.g. 0 holes on stands, 3 holes with Baseplate vs 8 on direct wall), estimated filament weight (grams), and total piece counts.
- 📋 **Instant Exports:** 1-click Copy to Clipboard (formatted for Discord/Reddit), CSV spreadsheet download, and printable workshop checklist.

---

## 🚀 Quick Start

**IT2-ADvisor** is a lightweight, zero-dependency client-side web application.

### Running Locally

```bash
# Clone the repository
git clone https://github.com/IteraThor/IT2-ADvisor.git
cd IT2-ADvisor

# Run with Python
python -m http.server 3000

# Or run with Node
npx serve .
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Architecture

```
IT2-ADvisor/
├── index.html              # Clean, accessible card-based questionnaire & BOM reveal
├── css/
│   └── style.css           # Zen minimalist dark design system & print stylesheet
├── js/
│   ├── catalog.js          # Component specifications, hardware rules & links
│   └── app.js              # State machine, branching engine & real-time BOM calculator
└── knowledge/
    ├── relations.md        # Mechanical & electrical relationship map (Mermaid diagrams)
    ├── components.json     # Complete machine-readable parts catalog
    └── rules.json          # Dependency rules and compatibility logic
```

---

## 🛠️ Official IT2 Model Downloads

* **IT2 Camera & Light Ring System:** [Makerworld #1334165](https://makerworld.com/en/models/1334165)
* **IT2 4-Part Interlocking Baseplate:** [Makerworld #2782096](https://makerworld.com/en/models/2782096)
* **Official Assembly Documentation:** [IteraThor/IT2-Documentation](https://github.com/IteraThor/IT2-Documentation)

---

## 📜 License & Community

Created by **IteraThor** for the Autodarts community.  
Join the discussion and share your builds on [Discord](https://discord.com/invite/pZAjmwV5kE)!
