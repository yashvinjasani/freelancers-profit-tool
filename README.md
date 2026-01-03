Freelance Profit Engine (FPE) - Project Overview
1. Executive Summary
The Freelance Profit Engine (FPE) is a full-stack financial intelligence application designed to help
freelancers calculate their 'Real Hourly Rate'. Unlike traditional invoicing tools, FPE factors in unpaid
administrative work (friction) and uses Machine Learning to forecast future workload trends. The system
operates on a local network, syncing a React Native mobile client with a secure Python/Flask backend.
2. Technical Architecture- Frontend: React Native (Expo) for iOS/Android- Backend: Python (Flask) API Server- Database: SQLite (ACID-compliant storage)- Data Engineering: Pandas for ETL (Extract, Transform, Load) pipelines- Machine Learning: Scikit-Learn (Linear Regression for forecasting)- Security: JWT (JSON Web Tokens) for authentication
3. Key Features
1. Real-Time Profit Calculation: Instantly computes 'True Hourly Rate'.
2. Friction Score Analysis: Visualizes the ratio of Billable Work vs. Unpaid Admin Work.
3. Predictive Analytics: Forecasts future task duration using historical trend analysis.
4. Edit History: Full audit trail allowing users to correct past logs.
5. Smart Onboarding: 'Ghost' empty states guide new users through setup.
4. Mobile Dashboard Demonstration

5. System Logic Flow

When a user updates a log:
1. App sends a secure POST request (with JWT) to the Python backend.
2. Server verifies the token and executes an ACID-compliant SQL UPDATE.
3. Pandas triggers a re-calculation pipeline to update aggregate metrics.
4. Scikit-Learn retrains the regression model on the updated dataset.
5. The app receives the new JSON payload and re-renders the charts instantly.