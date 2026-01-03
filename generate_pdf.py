from fpdf import FPDF
import os

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Freelance Profit Engine (FPE) - Project Overview', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, 'Page ' + str(self.page_no()) + '/{nb}', 0, 0, 'C')

def create_pdf():
    pdf = PDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_font('Arial', '', 12)

    # --- 1. OVERVIEW ---
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, '1. Executive Summary', 0, 1)
    pdf.set_font('Arial', '', 11)
    
    # Replaced fancy quotes with standard straight quotes
    pdf.multi_cell(0, 6, 
        "The Freelance Profit Engine (FPE) is a full-stack financial intelligence application designed "
        "to help freelancers calculate their 'Real Hourly Rate'. Unlike traditional invoicing tools, "
        "FPE factors in unpaid administrative work (friction) and uses Machine Learning to forecast "
        "future workload trends. The system operates on a local network, syncing a React Native mobile "
        "client with a secure Python/Flask backend."
    )
    pdf.ln(5)

    # --- 2. ARCHITECTURE ---
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, '2. Technical Architecture', 0, 1)
    pdf.set_font('Arial', '', 11)
    
    # Replaced Bullet Points (u2022) with standard Dashes (-)
    architecture_details = (
        "- Frontend: React Native (Expo) for iOS/Android\n"
        "- Backend: Python (Flask) API Server\n"
        "- Database: SQLite (ACID-compliant storage)\n"
        "- Data Engineering: Pandas for ETL (Extract, Transform, Load) pipelines\n"
        "- Machine Learning: Scikit-Learn (Linear Regression for forecasting)\n"
        "- Security: JWT (JSON Web Tokens) for authentication"
    )
    pdf.multi_cell(0, 6, architecture_details)
    pdf.ln(5)

    # --- 3. KEY FEATURES ---
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, '3. Key Features', 0, 1)
    pdf.set_font('Arial', '', 11)
    
    features = (
        "1. Real-Time Profit Calculation: Instantly computes 'True Hourly Rate'.\n"
        "2. Friction Score Analysis: Visualizes the ratio of Billable Work vs. Unpaid Admin Work.\n"
        "3. Predictive Analytics: Forecasts future task duration using historical trend analysis.\n"
        "4. Edit History: Full audit trail allowing users to correct past logs.\n"
        "5. Smart Onboarding: 'Ghost' empty states guide new users through setup."
    )
    pdf.multi_cell(0, 6, features)
    pdf.ln(10)

    # --- 4. DASHBOARD DEMONSTRATION (IMAGE) ---
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, '4. Mobile Dashboard Demonstration', 0, 1)
    pdf.set_font('Arial', 'I', 10)
    pdf.cell(0, 10, 'Figure 1: The FPE Dashboard running on iOS', 0, 1)
    
    # Image Insertion
    if os.path.exists('dashboard.png'):
        try:
            # Adjust w (width) to fit your page if needed
            pdf.image('dashboard.png', x=10, w=90) 
        except Exception as e:
            pdf.cell(0, 10, f"Error loading image: {str(e)}", 0, 1)
    else:
        pdf.set_text_color(255, 0, 0)
        pdf.cell(0, 10, "[Error: dashboard.png not found in folder]", 0, 1)
        pdf.set_text_color(0, 0, 0)

    pdf.ln(10)
    
    # --- 5. DATA FLOW ---
    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, '5. System Logic Flow', 0, 1)
    pdf.set_font('Arial', '', 11)
    pdf.multi_cell(0, 6, 
        "When a user updates a log:\n"
        "1. App sends a secure POST request (with JWT) to the Python backend.\n"
        "2. Server verifies the token and executes an ACID-compliant SQL UPDATE.\n"
        "3. Pandas triggers a re-calculation pipeline to update aggregate metrics.\n"
        "4. Scikit-Learn retrains the regression model on the updated dataset.\n"
        "5. The app receives the new JSON payload and re-renders the charts instantly."
    )

    # Output using latin-1 encoding to be safe
    pdf.output('FPE_Project_Description.pdf', 'F')
    print("✅ PDF Generated: FPE_Project_Description.pdf")

if __name__ == '__main__':
    create_pdf()