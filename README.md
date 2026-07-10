# E-Commerce Analytics Dashboard

This project is a single-page interactive analytical dashboard for e-commerce transactions. It allows store managers and developers to analyze transaction data, search and filter records, study revenue trends, inspect payment method shares, and visualize purchase behavior patterns over time.

## Key Features

* **Sub-Nav Tab Views**: Toggle between a complete Overview or dedicated single-topic views for Sales & Activity Trends, Payment Portfolios, Product Breakdowns, Correlation Heatmaps, and the Transaction Ledger.
* **Refined Filtering**: Multi-select dropdown menus for products and payment methods with "Select All" capabilities, alongside instant text searches and clear counters.
* **KPI Metric Cards**: Dynamic indicators tracking total revenue, transaction counts, average order value, and top selling products (displayed in the Overview tab).
* **Interactive Timelines**: Recharts-powered graphs displaying revenue and transaction volume across custom resolutions (daily or weekly).
* **Correlation Heatmap**: Visual grid showing order counts clustered by day of the week and hour of the day.
* **Transaction Ledger**: Structured CRUD table supporting inline updates, row deletions, adding new mock records, and CSV importing or exporting.

## Installation

### Prerequisites

* Node.js (version 18 or higher recommended)
* npm (comes bundled with Node.js)

### Setup Steps

1. Clone or download the repository files.
2. Open your terminal in the root folder of the project.
3. Install the required dependencies:
   ```bash
   npm install
   ```

## Usage

To start the development server locally, run:
```bash
npm run dev
```

The server will start, typically binding to port 3000, and will be accessible via `http://localhost:3000`.

To build the application for production deployment, run:
```bash
npm run build
```
This script compiles the React and TypeScript code into highly optimized static assets inside the `dist` directory.
