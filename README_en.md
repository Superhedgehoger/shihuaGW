# SINOPEC Document Formatter (石化公文排版工具)

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-blue?logo=react&logoColor=white&style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.0-purple?logo=vite&logoColor=white&style=flat-square" alt="Vite" />
  <img src="https://img.shields.io/badge/PizZip-3.2-orange?style=flat-square" alt="PizZip" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <b>English</b>
</p>

SINOPEC Document Formatter is a premium, **100% offline, client-side single page application (SPA)** designed for corporate and administrative offices (specifically optimized for Sinopec Group). It automatically parses, diagnostics, and reformats chaotic draft texts into strictly compliant, beautifully structured official documents matching national and enterprise guidelines.

By shifting all VBA layout logic directly to the front-end browser sandbox, this tool eliminates the risks of network data leaks and provides a modern, fast, and secure alternative to traditional Word VBA macros.

---

## ✨ Core Features

*   **VBA Layout Engine Ported to Front-End**:
    - **Punctuation & Formatting Polish**: Auto-converts chaotic half-width brackets to full-width in Chinese contexts, cleans abnormal hidden whitespaces, and standardizes list margins.
    - **5-Tier Heading Auto-Renumbering**: Automatically parses and sequentially calculates numbering trees for up to 5 nested header tiers (e.g. `一、` $\rightarrow$ `（一）` $\rightarrow$ `1.` $\rightarrow$ `（1）` $\rightarrow$ `①`), correcting dot/space misuses.
    - **Intelligent Layout Inscribing**: Automatically parses and right-aligns signature organizations and dates (auto-converting arbitrary date patterns like `2026/05/27` to traditional Chinese big-written characters).
*   **Synchronized Dual-Column Standards Manager**:
    - Select from built-in standard presets: **Sinopec Enterprise Standard (Q/SH 0758—2019)** or **National Government Standard (GB/T 9704—2012)**.
    - Directly synced with the **Template Editor**—allowing any newly created custom clones or imported templates to dynamically appear in the main standard switcher and immediately govern the live A4 preview layout.
*   **"Other" Blank Canvas Mode**:
    - Ideal for writing generic papers, memos, or essays. It skips strict official document rigid elements (such as salutations, file numbers, and signature mandates) but retains robust outline renumbering and applies default standard typography (e.g. FangSong 16pt, 27pt exact line spacing) to form a clean workspace.
*   **Zero-Garbled Character Export Engine**:
    - **Self-Generating Fallback**: If backend template files are missing on your host server, the system automatically retracts to a local code-driven builder that parses the document structure and generates standard `.docx` binaries from scratch.
    - **Pure Binary Packing**: XML compression is strictly compiled via `TextEncoder` into `Uint8Array` byte streams and forced into binary mode `{ binary: true }` in `PizZip`, **completely curing double-byte Chinese character encoding corruption** when double-clicking to open in MS Word or WPS.
*   **100% Offline & High Security**:
    - Absolutely **Zero API/Network requests** for data transmission. All mammoth parsing, regex sanitization, and PizZip compression take place inside the browser local sandbox, making it completely leakproof and compliant with enterprise security standards.

---

## 📸 Screenshots & Preview

### 1. New Parallel Standards & Flat Document Type Selectors
![homepage](review-screenshots/01_new_parallel_selectors.png)

### 2. A4 Live Preview with VBA Auto-Reformatting
![A4 Preview](review-screenshots/04_parsed_a4_preview.png)

### 3. Comprehensive Format Diagnostics Report Panel
![Diagnostics](review-screenshots/05_diagnose_report_panel.png)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18.0.0 or higher recommended, tested on v24.14.1)
- npm (v9.0.0 or higher)

### Installation
Clone the repository and install all developer dependencies locally:
```bash
git clone https://github.com/Superhedgehoger/shihuaGW.git
cd shihua-doc-formatter
npm install
```

### Local Development
Launch the local Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser to interact with the application.

### Production Build
Compile and bundle the application into a optimized, lightweight, single-page static distribution:
```bash
npm run build
```
The compiled SPA is located in the `dist/` directory, ready to be hosted on any static file server or intranet web server.

---

## ⌨️ Global Hotkeys

Enhance your writing productivity with global keyboard shortcuts:
-   **`Ctrl + Enter`**: Instantly parse, clean, and reformat current text.
-   **`Ctrl + S`**: Trigger instant validation and export to a standard `.docx` file.

---

## 📝 Changelog

### v1.3.0 (2026-05-27)
*   **[ADDED]** **Binary Word 97-2003 (`.doc`) Offline Parser**: Built a front-end offline text extractor based on SheetJS `cfb` (OLE2 Compound File unpacker) and UTF-16LE heuristic scan logic to cleanly extract text content locally.
*   **[ADDED]** **Markdown (`.md` / `.markdown`) Upload Support**: Seamlessly integrate markdown files parser in the upload panel.
*   **[FIXED]** **Uploaded DOCX Secondary Export Character Corruption**: Added strict regular expressions to sweep out hidden illegal low-byte ASCII XML control characters (e.g. vertical tabulator `\u000b`) extracted by mammoth.js, preventing Microsoft Word from rejecting XML tree formatting and falling back into Wingdings.
*   **[UPDATED]** **Optimized UX for Uploading**: Upgraded all buttons and dragging prompt text to support case-insensitive multi-format file dragging with robust type checks.

### v1.2.0 (2026-05-27)
*   **[FIXED]** **PizZip Garbled Font Cured**: Rewrote the XML compression layer to utilize `TextEncoder.encode()` and explicitly declare `{ binary: true }` in PizZip packing, **completely eliminating double-byte characters display corruption**.
*   **[REFACTOR]** **Parallel Selector Panels**: ModeSelector removed all nested select group headers. Now "Official Standard" and "Document Type" are aligned as parallel dual columns.
*   **[SYNCED]** **Real-time Active Template Synchronization**: The standards dropdown list is dynamically synchronized with the Template Store configurations (including custom clones and imports), ensuring perfect data consistency across UI preview, template configuration pages, and docx generation.
*   **[ADDED]** **"Other" Blank Canvas Layout Preset**: Added a new `'其他'` custom type that bypasses rigid official document metadata requirements but retains outline renumbering.

### v1.1.0 (2026-05-26)
*   **[PORTED]** **VBA Layout Logic Front-end Migration**: Migrated the traditional official document sequential header recalculating, punctuation normalization, auto-periods for tier-3/4 headings, and date auto-inscribing VBA core algorithms into native client-side JavaScript rules.
*   **[FIXED]** **Adaptive Fallback Generator**: Fixed a high-severity bug that crashes the system when host servers lack preset Word templates. Standard OOXML generator is written locally to build `.docx` from scratch.
*   **[TESTED]** **Playwright Automated E2E Review Testing**: Implemented headless test scripts to mock Modal dismissing, text parsing, status switching, and download intercepting under a console zero-error state.

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
