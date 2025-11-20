# FinMetrics ⚡
<img width="1512" height="786" alt="Screenshot 2025-11-19 at 8 30 21 PM" src="https://github.com/user-attachments/assets/31bc6e98-b1ce-4a14-acff-2deb035f5514" />

**Financial Intelligence Redefined for the Modern Era.**
A browser-based, privacy-first financial modeling platform powered by WebAssembly and Python.

![Project Status](https://img.shields.io/badge/Status-Operational-000000?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React_|_Python_|_WASM-black?style=for-the-badge)

## 📋 Overview

FinMetrics is a sophisticated financial dashboard that brings the power of Python's data science libraries (NumPy) directly into the browser via **Pyodide**. Unlike traditional dashboards that rely on server-side processing, FinMetrics executes complex valuation models, linear regressions, and sensitivity analyses entirely on the client side.

This project demonstrates the intersection of **Institutional Finance**, **Data Science**, and **Modern Web Architecture**, specifically designed to solve complex forecasting and valuation challenges found in utility and energy sectors.

## 🎯 Key Features

### 1. 🧠 Neural Forecast & Scenario Analysis
*   **Technology:** Python (NumPy) executed via WebAssembly.
*   **Function:** Performs linear regression on historical datasets to project future growth.
*   **Risk Modeling:** Includes a "Cone of Uncertainty" visualization, allowing users to adjust sensitivity sliders (±5% to ±30%) to generate Bull and Bear case scenarios.
*   **Strategic Insights:** Automatically generates natural language commentary on CAGR (Compound Annual Growth Rate) and trend direction.
*   <img width="1512" height="732" alt="Screenshot 2025-11-19 at 8 14 25 PM" src="https://github.com/user-attachments/assets/9422fbf3-5bed-4b39-96c5-dc820db6a68f" />


### 2. 💎 Intrinsic Valuation (DCF Model)
*   **Methodology:** 2-Stage Discounted Cash Flow (DCF) model.
*   **Features:**
    *   Real-time calculation of Enterprise Value and Fair Value per Share.
    *   Adjustable WACC, Terminal Growth, and Net Debt assumptions.
    *   **Waterfall Bridge:** Visualizes the contribution of near-term cash flows vs. terminal value to the total valuation.
    *   <img width="1512" height="747" alt="Screenshot 2025-11-19 at 8 14 41 PM" src="https://github.com/user-attachments/assets/bb4a1777-78f0-40f1-a8db-a5451bf15530" />


### 3. ⚠️ Risk & Variance Control
*   **Variance Analysis:** Automated detection of Budget vs. Actual discrepancies.
*   **Sensitivity Matrix:** A multivariate heatmap stress-testing Net Income against simultaneous shocks to Revenue and Cost structures (Simulation of ±10% volatility).
*   <img width="1512" height="749" alt="Screenshot 2025-11-19 at 8 14 37 PM" src="https://github.com/user-attachments/assets/5609a869-841e-4b50-9312-a6050593a689" />


### 4. 🛡️ Data Integrity & Export
*   **Integrity Scanner:** Automated "Health Check" upon CSV upload. Scans for null values, outliers, and fiscal year anomalies to ensure data quality before processing.
*   **Professional Reporting:** One-click generation of multi-sheet Excel reports (via SheetJS) containing raw data, forecast models, and executive summaries.
*   <img width="872" height="171" alt="Screenshot 2025-11-19 at 8 21 12 PM" src="https://github.com/user-attachments/assets/2cbe9071-8689-46a7-a662-300c6fae4c3b" />


## 🛠️ Technical Architecture

*   **Frontend Framework:** React 18 (TypeScript)
*   **Styling:** Tailwind CSS (Strict Black & White "AlphaQubit" Design System)
*   **Runtime:** Pyodide (Python WebAssembly) - *Enables NumPy usage in the browser.*
*   **Visualization:** Recharts (Charts) & React Three Fiber (3D Hero Scene)
*   **State Management:** React Hooks (`useState`, `useEffect`, `useMemo`)

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16 or higher)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/fin-metrics.git
    cd fin-metrics
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Build for production** (Optional)
    ```bash
    npm run build
    ```

5.  **Open your browser**
    Navigate to the URL shown in your terminal (usually `http://localhost:5173`) to access the dashboard.

## 📊 How to Use

1.  **Upload Data:** Click "Upload Data" and select a CSV file.
    *   *Format Requirements:* Columns for `Year`, `Revenue`, `Net Income`, `Free Cash Flow`.
2.  **Check Console:** Open the "System Kernel" at the bottom to view the Data Integrity Score and Python initialization logs.
3.  **Forecast:** Navigate to "Neural Forecast." Select a metric (e.g., Revenue) and adjust the "Sensitivity" slider to visualize risk.
4.  **Valuation:** Go to "Valuation Model." Input the company's capital structure (Shares, Debt) and WACC to derive a target share price.
5.  **Export:** Click "Generate Excel Report" to download a comprehensive .xlsx file for offline analysis.

## 💼 Job Relevance & Skills Demonstrated

This project was engineered to demonstrate core competencies required for **Financial Analyst** roles (specifically within the Energy/Utility sector):

*   **Financial Modeling:** DCF valuation, linear projection, and sensitivity analysis.
*   **Risk Management:** Understanding of "Cone of Uncertainty" and scenario planning (Bull/Bear cases).
*   **Data Integrity:** Automated validation logic to ensure reporting accuracy.
*   **Technical Proficiency:** bridging the gap between traditional finance (Excel) and modern data science (Python/SQL/Web).

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
