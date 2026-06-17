# Book Design Studio 📚✨

A professional-grade, interactive **Book Design & Type Layout Studio** tailored for writers, publishers, and visual designers. Craft, layout, customize, and export high-fidelity books from standard standard sizes (A4, A5, Trade, Digest) to fully bespoke configurations. Designed with desktop-first precision and optimized for mobile/touch screens, this application provides standard printing layout models and direct cloud integration.

---

## 🚀 Key Functional Modules

### 1. Project Dashboard & Personal Library
*   **Intuitive Space Hub:** Manage your entire library of cataloged book projects from a high-contrast elegant screen.
*   **Bespoke Dimensions Selector:** Choose from standard physical print presets like **A4**, **A5**, **Trade**, and **Digest**, or set exact custom dimensions in millimeters (`customWidthMm` x `customHeightMm`).
*   **Structural Binding Configs:** Select among binding styles such as **Perfect Binding**, **Saddle Stitch**, and **Spiral Binding** to accommodate actual physical margins and margins compensation.

### 2. Live Page-by-Page Layout Engine
*   **Diverse Page Type Blueprints:** Formulate standard and distinct pages with specialized layouts:
    *   **Cover Page:** Supports customized, on-the-fly graphic background art uploads.
    *   **Title Page:** Pre-formatted displays matching name, subtitle, and author attributes.
    *   **Chapter Openers:** Centered, beautifully tracking typography with elegant spacing.
    *   **Standard Text Bodies:** Standard dual-column or spacious single-column print simulators.
*   **Interactive Content Canvas:** Write or paste directly inside the simulated pages to see exactly how your letters flow.

### 3. Detail Typographical & Layout Settings
*   **Dynamic Binding Margins:** Real-time adjustable spacing selectors including **Inner (Gutter) Margin**, **Outer Margin**, **Top Margin**, and **Bottom Margin** offsets in millimeters to accurately plan for physical folder binding curves.
*   **Fine-Grained Typosetting:** Seamless controls over page colors, text color palettes, font size points (`fontSizePt`), text alignment, and line heights (`lineHeight`) using modular sidebar settings.

### 4. Flawless Multi-Device Touch Responsiveness
*   **Proportional Scaler Wrapper:** Simulated page canvases scale with absolute accuracy using dynamic calculations to guarantee the visual ratio matches physical print proportions on any screen depth.
*   **Zoom Modes:** Toggle instantly between **100% Actual Scale** and **Auto-Fit Screen** preview modes.
*   **Floating Touch Console:** Reachable floating bottom action bars loaded with rich buttons (Chevron pagination, format conversions, Bold/Italic formatting tags, and Page Type controls) designed for optimal finger ergonomics.

---

## 🛠️ Core Engineering & Custom Solutions

### The Tailwind v4 `oklch` html2canvas Workaround 🎨
Modern Tailwind CSS v4 utilizes the advanced `oklch(...)` color function natively. However, standard versions of standard rasterization libraries (e.g., `html2canvas`) crash or render empty backgrounds when attempting to parse non-standard color strings.

**Book Design Studio** solves this seamlessly by introducing a custom **color intercept parser**:
1.  **Computed Style Interception:** Overrides `window.getComputedStyle` during compilation/export steps.
2.  **Color Space Translation:** Translates color space configurations (`L, C, H`) programmatically utilizing mathematical color-matrix conversions into clean, compatible standard-RGB/RGBA streams.
3.  **Perfect Rendering Outputs:** Ensures visual accuracy in generated PDF wrappers without requiring outdated Tailwind versions or third-party wrappers.

---

## 📁 Repository Directory Architecture

```bash
├── app/
│   ├── api/                # Server-relative proxy routes
│   │   └── drive/          # Google Drive cloud sync pipelines
│   ├── globals.css         # Main stylesheet with Tailwind directives
│   ├── layout.tsx          # Root structure and font integrations
│   └── page.tsx            # Full interactive client application & editor
├── components/             # Visual UI controls and dialog models
├── hooks/                  # Helpful device monitors and states
├── lib/
│   ├── firebase.ts         # User authorization and database routines
│   └── utils.ts            # Helper function chains
├── metadata.json           # Application specifications & descriptors
├── package.json            # Tooling and package requirements
├── tsconfig.json           # TypeScript compilation configuration
└── .env.example            # Environment properties boilerplate
```

---

## ⚡ Setup & Local Installation

### Prerequisites
*   Node.js (v18.0.0 or higher)
*   npm or yarn

### 1. Clone the Directory
```bash
git clone <repository-url>
cd book-design-studio
```

### 2. Install Development Dependencies
```bash
npm install
```

### 3. Setup Environment Parameters
Create a `.env` file in the root directory and define the following variables:
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Firebase Credentials
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
```

### 4. Boot Up the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` inside your preferred browser.

### 5. Compile to Production
Combine styles and build static server optimized outputs:
```bash
npm run build
npm run start
```

---

## 📝 Documenting Application Metadata
The platform specifications for this application are declared cleanly inside `metadata.json`:
```json
{
  "name": "Book Design Studio",
  "description": "A professional book design and customization tool with PDF export and Google Drive integration.",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}
```

---

## 🛡️ License
Distributable under the modern MIT License. See `LICENSE` for standard authorization schemas.
