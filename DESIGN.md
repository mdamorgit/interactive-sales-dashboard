# Design Decisions

This document outlines the visual and behavioral design guidelines chosen for the e-commerce analytics dashboard.

## Typography and Contrast

* **Primary Font Family**: Inter is utilized as the primary sans-serif font across the application to ensure legible labels, numbers, and descriptive metadata.
* **Contrast Ratios**: Elements are structured using high-contrast combinations. Deep slate grays are set against soft white panels and neutral backgrounds to reduce eye strain.
* **Data Presentation**: Tables and telemetry values rely on clean proportional alignment, using standard weights to convey hierarchy without relying on excess color.

## Layout and Cognitive Load

* **Tabbed Section Isolation**: Instead of presenting all telemetry, timelines, heatmaps, and tables on a single screen, the dashboard offers a responsive tab menu. Users can study individual components (such as just payment portfolios or the ledger) in isolation.
* **Unified Controls**: The search bar, category filters, and action buttons are grouped inside a persistent sticky header or top block, remaining consistently accessible.
* **Visual Rhythm**: Generous negative space separates distinct charts and metric blocks, utilizing subtle borders (1px border-slate-100) instead of heavy shadows to establish grouping.

## Interactive Behaviors

* **Contextual Metric Filtering**: Primary metrics update dynamically to reflect filtered datasets, ensuring visual consistency across views.
* **Micro-Transitions**: Page loads and tab swaps employ subtle opacity fades (via standard CSS or the motion library) to soften state switches.
* **Explicit Control Flow**: Destructive actions (like removing ledger entries) or massive selections (using the "Select All" checkbox) use direct visual cues to prevent accidental inputs.
