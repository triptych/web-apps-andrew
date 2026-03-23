# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.2.0] - 2026-03-22

### Added
- `alife-sim` — Artificial life simulator with genetic algorithms and Three.js rendering
  - 16-gene float genome encoding speed, size, aggression, metabolism, sense range, hue, fertility, longevity, and more
  - Uniform crossover and Gaussian mutation; mutation rate is itself a heritable gene
  - Creatures sense food and other creatures within a configurable field-of-view
  - Predator/prey dynamics: aggressive larger creatures can eat smaller ones
  - Reproduction requires sufficient energy and proximity to a compatible mate
  - Three.js orthographic renderer with instanced meshes for creatures and food
  - Simulation tab with play/pause/reset controls and speed multiplier
  - Gene Pool tab showing live creature portraits with trait bars
  - Stats tab with population-over-time chart and average trait readout
  - Click any creature to inspect its full genome and stats in a modal

## [0.1.0] - 2026-03-16

### Added
- `markdown-to-html-converter` app — live Markdown editor with preview, source view, copy, and download
- `lib/tabs.js` — `<tab-group>`, `<tab-item>`, `<tab-panel>` custom elements
- `lib/modal.js` — `<modal-dialog>` accessible modal with backdrop
- `lib/menu.js` — `<drop-menu>`, `<menu-item>`, `<menu-separator>` dropdown menu
- `lib/toast.js` — `<toast-rack>`, `<toast-item>` notification system
- `lib/accordion.js` — `<accordion-group>`, `<accordion-item>` collapsible sections
- `lib/drag-drop.js` — `<drag-container>`, `<drag-item>` sortable drag-and-drop
- `lib/tooltip.js` — `<tool-tip>` hover/focus tooltips
