/**
 * IT2 System Catalog & Rules Data
 * Official specs from IteraThor/IT2-Documentation and Makerworld models 1334165 & 2782096
 */
const IT2_CATALOG = {
  system: {
    name: "IT2-ADvisor",
    author: "IteraThor",
    makerworld_system_url: "https://makerworld.com/en/models/1334165",
    makerworld_baseplate_url: "https://makerworld.com/en/models/2782096",
    github_url: "https://github.com/IteraThor/IT2-Documentation",
    discord_url: "https://discord.com/invite/pZAjmwV5kE"
  },
  presets: [
    {
      id: "preset_budget_lens",
      icon: "📱",
      name: "Ultra-Budget Phone Lens",
      tagline: "No PC, No USB cams. Phone vision + DIY Ring",
      config: {
        mounting: "mount_direct_wall",
        has_baseplate: false,
        vision: "vision_autodarts_lens",
        ring: "ring_diy_standard",
        lighting_mode: "lighting_standard_white",
        compute: "compute_none",
        cable_routing: "cable_routing_none",
        assembly_style: "fasteners_direct_tapping",
        baseplate_addons: []
      }
    },
    {
      id: "preset_standard_wall",
      icon: "🎯",
      name: "Standard Wall 3-Cam Rig",
      tagline: "Direct wall mount, Plasma / DIY + HBV OV9732 cams",
      config: {
        mounting: "mount_direct_wall",
        has_baseplate: false,
        vision: "vision_3cam_ov9732",
        ring: "ring_winmau_plasma",
        lighting_mode: "lighting_standard_white",
        compute: "compute_existing_pc",
        cable_routing: "cable_routing_clips_y",
        assembly_style: "fasteners_direct_tapping",
        baseplate_addons: []
      }
    },
    {
      id: "preset_pro_silent",
      icon: "🤫",
      name: "Pro Silent Baseplate Rig",
      tagline: "TPU sound dampening, hidden Mini-PC bay & OV2710",
      config: {
        mounting: "mount_baseplate_wall",
        has_baseplate: true,
        vision: "vision_3cam_ov2710",
        ring: "ring_diy_standard",
        lighting_mode: "lighting_standard_white",
        compute: "compute_mini_pc",
        cable_routing: "cable_routing_baseplate",
        assembly_style: "fasteners_heat_inserts",
        baseplate_addons: ["addon_tpu_dampeners", "addon_hardware_bay"]
      }
    },
    {
      id: "preset_arcade_wled",
      icon: "🌈",
      name: "Arcade WLED Edition",
      tagline: "Dual-channel reactive lighting + ambient wall halo",
      config: {
        mounting: "mount_baseplate_wall",
        has_baseplate: true,
        vision: "vision_3cam_ov2710",
        ring: "ring_diy_standard",
        lighting_mode: "lighting_reactive_wled",
        compute: "compute_mini_pc",
        cable_routing: "cable_routing_baseplate",
        assembly_style: "fasteners_heat_inserts",
        baseplate_addons: ["addon_tpu_dampeners", "addon_hardware_bay", "addon_baseplate_ambient_wled"]
      }
    }
  ],
  options: {
    mounting: [
      {
        id: "mount_direct_wall",
        title: "Direct Wall Mount (No Baseplate)",
        desc: "Mounts arms directly to wall. Simple, but requires drilling ~8 holes into drywall or brick.",
        badge: "8 Wall Holes",
        badgeType: "warning",
        requires_baseplate: false
      },
      {
        id: "mount_baseplate_wall",
        title: "IT2 Baseplate (Wall Mounting)",
        desc: "Rigid 4-part interlocking backboard. Protects walls, aligns arms perfectly, and only needs 3 holes.",
        badge: "Only 3 Holes • Clean Cables",
        badgeType: "success",
        requires_baseplate: true
      },
      {
        id: "mount_baseplate_stand",
        title: "IT2 Baseplate (Mobile Dart Stand)",
        desc: "Native direct fit for Winmau Xtreme 2 and mobile tripods. Zero modifications needed.",
        badge: "0 Wall Holes • Stand Native",
        badgeType: "accent",
        requires_baseplate: true
      }
    ],
    vision: [
      {
        id: "vision_3cam_ov9732",
        title: "Classic 3-Camera Rig (HBV OV9732 Budget)",
        desc: "Standard 720p high-speed vision boards. Extremely reliable dart tracking with low CPU usage.",
        badge: "Recommended Budget 3-Cam",
        badgeType: "neutral",
        type: "multi_cam"
      },
      {
        id: "vision_3cam_ov2710",
        title: "Classic 3-Camera Rig (HBV OV2710 Premium)",
        desc: "Crisp 1080p high resolution vision boards. Sharper dart view and higher fidelity.",
        badge: "Premium 1080p",
        badgeType: "accent",
        type: "multi_cam"
      },
      {
        id: "vision_autodarts_lens",
        title: "Autodarts Lens (Single Smartphone)",
        desc: "Uses your existing smartphone mounted on the ring. Eliminates camera arms, PCB cameras, USB cables, and PC.",
        badge: "Zero Cams • Zero PC Needed",
        badgeType: "success",
        type: "phone_lens"
      }
    ],
    ring: [
      {
        id: "ring_winmau_plasma",
        title: "Winmau Plasma Light Ring (Commercial)",
        desc: "Native direct fit! The IT2 system geometry matches the Plasma hole pattern 1:1. Zero adapters required.",
        badge: "Native Fit • 0 Adapters",
        badgeType: "success"
      },
      {
        id: "ring_target_corona",
        title: "Target Corona Light Ring (Commercial)",
        desc: "Adapts the magnetic Corona frame to IT2. Automatically includes 3x 3D-printed conversion brackets.",
        badge: "Needs 3x Adapters",
        badgeType: "neutral"
      },
      {
        id: "ring_diy_standard",
        title: "IT2 DIY 3D-Printed Ring (Ceiling ≥ 2.0m)",
        desc: "Full 360° circular slim light ring with curved clip-on diffusers. Slimmest 3D design available.",
        badge: "360° Full Circle",
        badgeType: "accent"
      },
      {
        id: "ring_diy_low_ceiling",
        title: "IT2 DIY Flat-Top Ring (Ceiling ≤ 2.0m)",
        desc: "Flattened top arch profile engineered specifically for low basements and attics under 2m tall.",
        badge: "Fits Low Ceilings ≤ 2.0m",
        badgeType: "warning"
      }
    ],
    lighting_mode: [
      {
        id: "lighting_standard_white",
        title: "Functional Clean White Illumination",
        desc: "Flicker-free white LED strip (COB or SMD) with diffusers for shadowless dart tracking.",
        badge: "Standard",
        badgeType: "neutral"
      },
      {
        id: "lighting_reactive_wled",
        title: "Dual-Channel Reactive WLED Lighting",
        desc: "Clean board lighting + addressable RGB LEDs running WLED. Reacts live to 180s, checkouts, and hits.",
        badge: "Arcade Animations",
        badgeType: "accent"
      }
    ],
    compute: [
      {
        id: "compute_existing_pc",
        title: "Existing Desktop PC / Laptop",
        desc: "Uses your current PC across the room via an active USB extension or powered hub.",
        badge: "€0 on Computer",
        badgeType: "success"
      },
      {
        id: "compute_mini_pc",
        title: "Dedicated Refurbished Mini-PC",
        desc: "Compact HP ProDesk / Dell Wyse / Lenovo Tiny. Silent, dedicated, snaps into hardware bay.",
        badge: "Community Favorite",
        badgeType: "accent"
      },
      {
        id: "compute_raspberry_pi",
        title: "Raspberry Pi 4 / 5",
        desc: "Ultra-compact Linux SBC running Autodarts server.",
        badge: "Compact SBC",
        badgeType: "neutral"
      }
    ],
    assembly_style: [
      {
        id: "fasteners_heat_inserts",
        title: "Brass Heat-Set Threaded Inserts (M4 / M6)",
        desc: "Melted into plastic with a soldering iron. Rock-solid and can be taken apart and reassembled endlessly.",
        badge: "Heavy Duty & Reusable",
        badgeType: "accent"
      },
      {
        id: "fasteners_direct_tapping",
        title: "Direct Self-Tapping (No Heat Inserts)",
        desc: "Screws thread directly into plastic pilot holes. Zero special tools or soldering iron required.",
        badge: "Beginner Friendly • €0 Inserts",
        badgeType: "success"
      }
    ],
    baseplate_addons: [
      {
        id: "addon_tpu_dampeners",
        title: "TPU 95A Sound & Vibration Dampeners",
        desc: "Shock-absorbing flexible pads fitted into baseplate circular recesses to mute impact sound in walls.",
        badge: "Acoustic Silence",
        badgeType: "success"
      },
      {
        id: "addon_hardware_bay",
        title: "Hidden Rear Hardware Bay",
        desc: "Mounting bracket to cleanly tuck your Mini-PC, Raspberry Pi, or WLED controller behind the board.",
        badge: "Clean Cable Hide",
        badgeType: "accent"
      },
      {
        id: "addon_baseplate_ambient_wled",
        title: "Perimeter Ambient Wall Halo Glow",
        desc: "Perimeter channel on baseplate for addressable LED strip creating a soft ambient halo on the wall.",
        badge: "Wall Glow",
        badgeType: "accent"
      }
    ]
  }
};
