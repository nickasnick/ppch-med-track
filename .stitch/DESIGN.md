# Design System: PPCH Medical Equipment Tracking Suite
> Specification and Design Tokens for Phitsanuvej Hospital (โรงพยาบาลพิษณุเวช)  
> Aligned with Google Stitch CLI (`@google/stitch`) and HA / JCI Healthcare Standards.

---

## 1. Visual Theme & Atmosphere

- **Clinical Precision & Trust**: Tailored for clinical engineers, head nurses, and hospital quality directors. Clean, distraction-free surfaces that prioritize immediate situational awareness of critical life-support devices.
- **Surface & Hierarchy**: High-contrast, slate-based canvas (`#f1f5f9`) with crisp white card containers (`#ffffff`), delineated by subtle slate borders (`#e2e8f0`).
- **Executive Navy Header**: Linear gradient (`linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e40af 100%)`) providing institutional gravitas while anchoring primary navigation.

---

## 2. Color Palette & Roles

### Primary Foundation
- **Executive Navy (`#0f172a`)**: Deep header base and high-contrast text headlines.
- **PPCH Royal Blue (`#1e40af`)**: Primary brand identity, active tabs, and primary action buttons.
- **Canvas Slate (`#f1f5f9`)**: Crisp, light root background reducing eye fatigue during long clinical shifts.
- **Surface Pure White (`#ffffff`)**: Container background for cards, tables, and modal dialogs.
- **Sub-surface Neutral (`#f8fafc`)**: Inputs, badges, and secondary container fills.

### Accent & Interactive
- **Medical Cyan (`#38bdf8`)**: Gradient highlights and live connectivity badges.
- **Ocean Interactive (`#0284c7`)**: Category pills and secondary links.
- **Biomedical Teal (`#0d9488`)**: Device relocation, equipment transfers, and hardware management.
- **Deep Purple (`#7c3aed`)**: Specialized machinery (e.g., Anesthesia machines).

### Typography & Text Hierarchy
- **Obsidian Main (`#0f172a`)**: Primary titles, asset codes, and table headers.
- **Slate Secondary (`#64748b`)**: Explanatory captions, department labels, timestamps, and metadata.
- **Slate Hairline (`#94a3b8`)**: Inactive states, placeholder text, and subtle icons.

### Functional Status States (Medical Readiness)
- **Ready / Pass (`#059669` / `#15803d`)**: High-saturation emerald on `#ecfdf5` or `#dcfce7` containers. Indicates 100% operational readiness.
- **Defect / Abnormal (`#dc2626` / `#b91c1c`)**: Bold crimson on `#fee2e2` containers with warning badges. Highlights immediate repair requirements.
- **Pending Inspection (`#d97706` / `#b45309`)**: Warm amber on `#fef3c7` containers. Indicates daily inspection awaiting completion.

---

## 3. Typography Rules

- **Font Family**: 
  - Primary (Thai & Latin UI): `'Prompt', sans-serif` (Google Fonts weights: 300, 400, 500, 600, 700, 800)
  - Secondary (Numeric Telemetry & Codes): `'Inter', monospace`
  - System Icons: `'Material Icons Round'` (Google Fonts)

### Scale & Hierarchy
- **Display Page Titles**: `22px` - `24px` / Weight: `800` / Color: `#0f172a`
- **Category & Card Headers**: `16px` - `18px` / Weight: `700` / Color: `#1e293b`
- **Body & Table Text**: `13px` - `14px` / Weight: `400` & `500` / Color: `#1e293b`
- **Asset Codes & Serial Numbers**: `12px` / Font: `monospace` / Weight: `700` / Background: `#f8fafc` / Border: `#cbd5e1`
- **Badges & Meta Labels**: `11px` - `12px` / Weight: `600` & `700`

---

## 4. Component Stylings

### KPI Summary Cards
- 5-column responsive grid on desktop.
- `background: #ffffff`, `border: 1px solid #e2e8f0`, `border-radius: 14px`, `box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08)`.
- Icon avatar with soft themed background (`42px x 42px`, `border-radius: 10px`).
- Bold stat counter with clear descriptive label underneath.

### Workstation Sidebar (Desktop & Admin)
- Fixed width: `330px`, `position: sticky; top: 0; height: 100vh`.
- Dark gradient brand header with hospital crest.
- Context-aware filter groups (dynamically shows only filters applicable to current view).
- Quick date pill buttons (`[วันนี้]`, `[เมื่อวาน]`) and Range switches (`[ตามเดือน]`, `[ระบุช่วง]`, `[ทั้งหมด]`).

### Data Tables (Device Inspection Table)
- Clean tabular rows with `border-bottom: 1px solid #f1f5f9`.
- Monospace asset code badges with subtle border.
- Centered status badges with icon (`check_circle` or `warning`).
- Quick-action buttons (`ดูสลิป`, `ตรวจเช็ค`) aligned to right action column.

### Verification Modal & Detail Slip
- Floating modal card (`max-width: 600px`, `border-radius: 16px`, `box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)`).
- Two-column metadata grid (Department, Evaluator, Timestamp, Status).
- Abnormality highlight box in soft red when defects are found.
- Checklist verification list with individual pass/fail icon chips.

---

## 5. Layout Principles

- **Desktop Workstation Mode**: Two-column layout (`sidebar: 330px`, `main: flex: 1`).
- **Mobile Mode**: Responsive collapse into single-column card stack with top navigation bar.
- **Print Optimization (`@media print`)**:
  - Automatically hides sidebars, action buttons, and pagination (`.no-print`).
  - Renders official Hospital Header, Document Title, and 3-signatory verification lines (Inspector, Head Nurse, Biomedical Engineer).

---

## 6. Design System Notes for Stitch Generation

When invoking Stitch to generate or iterate screens:

- **Atmosphere Keywords**:  
  `Clinical precision`, `Biomedical engineering telemetry`, `Phitsanuvej Hospital executive navy`, `Slate canvas`, `High-contrast readiness cards`, `Prompt font typography`.
- **Component Prompts**:
  1. **Preventive Maintenance (PM) Schedule Screen**:  
     *"A biomedical equipment preventive maintenance dashboard following the PPCH design system, featuring calendar cycle filters, equipment calibration gauges, and upcoming service alerts in Slate Blue and Emerald."*
  2. **Spare Parts & Battery Replacement Inventory**:  
     *"A clean clinical inventory table for Defibrillator pads, Ventilator circuits, and battery health telemetry matching PPCH executive card styling."*
  3. **Biomedical Incident & Quality Assurance Analytics**:  
     *"An HA/JCI inspection audit report page displaying monthly MTBF (Mean Time Between Failures) charts, categorized by 8 equipment categories with print-ready official signatures."*
