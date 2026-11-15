# CafeOS

Cafe POS and restaurant management demo for "The Coffee House". Frontend only: mock data, React state, localStorage. No backend.

## Demo video

Watch the walkthrough: https://www.loom.com/share/6fbfbc501cc34e828c8318401eda3b8a

## Run

    npm install
    npm run dev      # development
    npm run build    # production build

## Stack

React, Vite, Tailwind CSS v4 (Northern Lights theme in `src/index.css`), React Router, Lucide, Recharts.

## Screens

Overview, Point of Sale, Orders, Tables, Kitchen Display, Menu, Inventory, Customers, Staff, Reports, Expenses, Settings.

## Structure

    src/
      components/  layout, common (UI primitives), charts, orders, pos
      pages/       one file per screen
      context/     StoreContext: shared state, actions, localStorage
      data/        mockData: seed menu, orders, customers, inventory
      utils/       calculations (GST, totals), analytics, formatters

## Notes

- All screens share one store. Checking out an order updates orders, kitchen, tables, customers, inventory, dashboard and reports.
- Demo data resets each new day (orders are timestamped relative to now). Reset manually in Settings, System Preferences.
- Prices are GST-exclusive by default; toggle in Settings, Billing & GST.
- Menu photos are in `public/menu/`; items without one show an icon tile.
