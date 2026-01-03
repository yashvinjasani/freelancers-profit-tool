# 🚀 Freelance Profit Engine (FPE)

![Python](https://img.shields.io/badge/Python-3.8%2B-blue?style=for-the-badge&logo=python)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/scikit_learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

> **Stop guessing your rate. Calculate your *Real Hourly Rate* with AI.**

## 📖 Overview

The **Freelance Profit Engine (FPE)** is a full-stack financial intelligence dashboard designed to expose the hidden costs of freelancing. Unlike traditional invoicing tools, FPE factors in "friction" (unpaid administrative work) and uses **Machine Learning** to forecast future workload trends.

It syncs a **React Native** mobile client with a secure **Python/Flask** backend, giving you a true picture of your profitability in real-time.

---

## ✨ Key Features

* **💸 Real-Time Profit Calculation:** Instantly computes your 'True Hourly Rate' by subtracting unpaid hours.
* **📉 Friction Score Analysis:** Visualizes the ratio of Billable Work vs. Unpaid Admin Work.
* **🤖 Predictive Analytics:** Uses Linear Regression (Scikit-Learn) to forecast task duration based on history.
* **📝 Smart Edit History:** Full audit trail allowing you to correct past logs without data loss.
* **👻 Smart Onboarding:** Interactive 'Ghost' states guide new users through their first entry.

---

## 🛠️ Technical Architecture

| Component | Tech Stack | Description |
| :--- | :--- | :--- |
| **Frontend** | React Native (Expo) | iOS/Android mobile dashboard |
| **Backend** | Python (Flask) | Secure REST API Server |
| **Database** | SQLite | ACID-compliant local storage |
| **ETL** | Pandas | Data cleaning and transformation pipelines |
| **ML Engine** | Scikit-Learn | Linear Regression for forecasting |
| **Auth** | JWT | JSON Web Token authentication |

---

## ⚙️ System Logic Flow

1.  **User Action:** You update a log in the mobile app.
2.  **Secure Request:** App sends a POST request (w/ JWT) to the Flask backend.
3.  **Data Commit:** Server executes an ACID-compliant SQL UPDATE.
4.  **ETL Trigger:** Pandas triggers a re-calculation pipeline for aggregate metrics.
5.  **AI Retraining:** Scikit-Learn retrains the model on the new dataset.
6.  **Live Update:** App receives the new JSON payload and re-renders charts instantly.

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
* Node.js & npm
* Python 3.8+
* Expo CLI

### 1. Clone the Repository
```bash
git clone [https://github.com/yashvinjasani/freelancers-profit-tool.git](https://github.com/yashvinjasani/freelancers-profit-tool.git)
cd freelancers-profit-tool
