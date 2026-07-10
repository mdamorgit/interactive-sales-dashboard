# Project Roadmap and Plan

This document summarizes the features built so far and maps out the planned enhancements.

## Completed Milestones

### Core Dashboard Interface
* Set up a responsive React and Vite development scaffold.
* Implemented general KPI cards tracking total revenue, transactional volume, average values, and high-performing products.
* Created a layout structured around a modular sub-navigation tab bar (Overview, Trends, Payments, Products, Heatmap, and Ledger).

### Data Visualization and Analysis
* Developed combined charts for analyzing volume and financial trends dynamically.
* Added payment preference distribution and product breakdown charts.
* Designed an hourly/weekly order frequency heatmap to identify busy sales windows.

### Advanced Data Manipulation
* Constructed a functional ledger supporting rows addition, updates, and direct deletions.
* Created CSV upload handlers for bulk record seeding, alongside custom CSV extraction.
* Built advanced multi-select dropdown filters for products and payments, featuring instant "Select All" switches.

## Planned Enhancements

### Phase 1: Server and Database Integration
* Migrate local memory states to a secure Firestore database for persistent storage across browser sessions.
* Build backend Express API routes to handle heavy query operations safely.

### Phase 2: User Authentication
* Integrate Google or email-based authentication to secure store-level ledgers.
* Establish role-based view rules (e.g. read-only roles for analysts, read-write roles for store owners).

### Phase 3: Enhanced Reporting
* Implement a client-side or server-side automated PDF generator to download weekly analytical summaries.
* Enable automated email alerts for stock drops or unusual spikes in transaction failures.
