# Architecture

This document describes the structural layout of the application, the flow of data, and the technical choices behind the chosen stack.

## Tech Stack Decisions

The core development stack is selected to prioritize loading performance, component modulatiry, and robust data visualization:

* **React (v19)**: Selected for its component-based composition model. Since the dashboard depends heavily on shared state (such as the master transactions list updating charts, ledger rows, and KPIs in tandem), React's declarative state rendering fits the application needs perfectly.
* **Vite (v6)**: Employed as the primary build tool and development server. Vite bypasses typical bundler lag by using native ES modules during development and leverages rollup for production bundling.
* **Tailwind CSS (v4)**: Used for all visual stylings. Utility classes ensure fast, consistent interface iterations without generating redundant stylesheets.
* **Recharts**: Chosen for timeline and portfolio charts. Unlike canvas-based alternatives, Recharts integrates seamlessly as native React components, allowing quick styling hooks and responsive containers.
* **Lucide React**: Integrated to provide lightweight, consistent SVG-based interface icons that scale without pixelation.

## Directory Structure

The codebase is organized cleanly to maintain modularity:

```
├── index.html                  # HTML template shell
├── package.json                # Project dependencies and script declarations
├── tsconfig.json               # TypeScript compiler configurations
├── vite.config.ts              # Vite bundle configurations
├── src/
│   ├── main.tsx                # Client entry point
│   ├── index.css               # Global Tailwind CSS configurations
│   ├── types.ts                # Shared TypeScript interface declarations
│   ├── App.tsx                 # Core application component (state coordinator)
│   └── components/             # Reusable UI widgets and layout panels
│       ├── MetricCards.tsx     # KPI counters (revenue, volume, averages)
│       ├── FilterPanel.tsx     # Search text inputs and multi-select dropdowns
│       ├── ChartsSection.tsx   # Recharts timelines, product bars, and payment pies
│       ├── HeatmapCard.tsx     # Hourly/weekly transaction frequency grids
│       └── OrderManagerTable.tsx # CRUD-enabled transaction ledger
```

## Data Flow

Data flows in a unidirectional pattern:

1. **State Orchestration**: The master array of transactions (`orders`) is held within the root `App.tsx` component.
2. **Filtering Pipeline**: When users adjust inputs inside `FilterPanel`, the state filters are updated. `App.tsx` recalculates a derived `filteredOrders` array in real time.
3. **Distribution**: The `filteredOrders` array is passed down as read-only properties to `MetricCards` and `ChartsSection`.
4. **Mutations**: Modifications inside the ledger (such as adding new transactions or deleting items) call state-updating callbacks provided by `App.tsx` (e.g. `setOrders`), triggering a clean re-render of downstream components.
