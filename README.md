# ⚡ HostelWise AI — Smart Hostel Energy Management & Audit System

[![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.0%2B-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Enabled-EB5424?style=flat-square&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io/)
[![Ollama](https://img.shields.io/badge/Ollama-Llama3-black?style=flat-square&logo=ollama&logoColor=white)](https://ollama.ai/)
[![Team](https://img.shields.io/badge/Developed_By-Team_Phoenix-purple?style=flat-square)](#-team--credits)

**HostelWise AI** is an enterprise-grade, AI-driven energy management, anomaly detection, and occupancy monitoring platform tailored for college hostels and university campuses. By integrating real-time smart meter telemetry, student biometric attendance logs, machine learning anomaly detection, and a local context-aware LLM assistant, HostelWise AI enables institutional administrators and hostel supervisors to slash energy wastage, prevent power factor penalties, and enforce audit transparency.

---

## 📌 Table of Contents

- [Executive Summary](#-executive-summary)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Database Schema & Models](#-database-schema--models)
- [Machine Learning & Anomaly Detection Pipeline](#-machine-learning--anomaly-detection-pipeline)
- [AI Assistant (Ollama Integration)](#-ai-assistant-ollama-integration)
- [API Endpoints Directory](#-api-endpoints-directory)
- [Frontend Pages & UI Components](#-frontend-pages--ui-components)
- [Installation & Setup Guide](#-installation--setup-guide)
  - [Prerequisites](#1-prerequisites)
  - [Database Setup](#2-database-setup)
  - [Backend Setup](#3-backend-setup)
  - [Machine Learning Model Training](#4-machine-learning-model-training)
  - [Frontend Setup](#5-frontend-setup)
  - [Local AI Assistant Setup (Optional)](#6-local-ai-assistant-setup-optional)
- [Environment Variables](#-environment-variables)
- [Default User Credentials](#-default-user-credentials)
- [Verification & Testing](#-verification--testing)
- [Team & Credits](#-team--credits)

---

## 📖 Executive Summary

Educational institutions face significant electricity wastage in student accommodation facilities due to left-on appliances (fans, lights, air conditioners), unmonitored room vacancies, and illegal electrical load usage. Traditional manual inspection is inefficient and non-scalable.

**HostelWise AI** solves this problem by cross-referencing **real-time energy usage (kWh/Power/Voltage)** with **live occupancy data (biometric IN/OUT logs & approved leave records)**. Whenever a room consumes energy while vacant or exceeds expected energy baselines given the current ambient temperature and occupant count, our Machine Learning models flag it as an **Energy Anomaly / Wastage** instantly.

---

## 🌟 Key Features

### 🏢 1. Campus & Multi-Hostel Hierarchy Management
- Structural hierarchy support: **Hostel ➔ Floor ➔ Wing ➔ Room**.
- Dynamic room capacity tracking and live occupant status.
- Dedicated view for individual room telemetry and historical trends.

### ⚡ 2. Real-Time Smart Meter Telemetry & Energy Monitoring
- Ingestion of voltage, current, power (Watts), cumulative energy (kWh), power factor, and frequency.
- Live tracking of power factor efficiency to mitigate reactive power losses.
- Carbon footprint (\(kg\,CO_2\)) and cost estimation based on campus electricity tariff rates.

### 🤖 3. Machine Learning Anomaly & Wastage Detection
- Automates detection of power wastage, unassigned room draw, and equipment fault anomalies.
- Trained on multi-dimensional telemetry (temperature, hour of day, weekend/holiday status, expected vs actual energy difference).
- Evaluates 4 classification models (**Logistic Regression, Decision Tree, Random Forest, XGBoost**) and selects the optimal checkpoint automatically.
- Generates 10+ Exploratory Data Analysis (EDA) visualizations and feature correlation heatmaps.

### 👥 4. Biometric Attendance & Leave Management
- Real-time student movement tracking (IN / OUT scan events).
- Integration with student leave requests (Pending, Approved, Rejected).
- Automatic correlation between leave status and room energy baseline expectations.

### 🔐 5. Role-Based Access Control (RBAC) & Authentication
- Secure JWT (JSON Web Token) authentication with password hashing (Bcrypt).
- Support for Google OAuth ID Token verification.
- Roles:
  - **Super Admin**: Complete campus-wide access, hostel creation, user management, global analytics.
  - **Hostel Supervisor**: Scoped access restricted strictly to their assigned hostel, rooms, students, and alerts.

### 🧠 6. Local AI Energy Audit Assistant
- Integrated conversational assistant powered by a local **Ollama** instance (`llama3`).
- Dynamically injects live database context (current occupied room count, student distribution, active anomalies) into prompt context for actionable energy-saving recommendations.

### 📊 7. Advanced Analytics & PDF/CSV Reporting
- Interactive energy distribution charts, hourly consumption trends, and occupancy heatmaps built with **Recharts**.
- One-click export for **Daily, Weekly, and Monthly PDF Audit Reports** and CSV data dumps.

---

## 🏗️ System Architecture

```
                       ┌────────────────────────────────────────┐
                       │          React + Vite Frontend         │
                       │   (Tailwind CSS + Recharts + Lucide)   │
                       └───────────────────┬────────────────────┘
                                           │  HTTP / REST API
                                           ▼
                       ┌────────────────────────────────────────┐
                       │          FastAPI Backend Engine        │
                       │    (Python 3.9+ / SQLAlchemy ORM)      │
                       └───────────┬───────────────┬────────────┘
                                   │               │
            ┌──────────────────────┴┐             ┌┴──────────────────────┐
            ▼                       ▼             ▼                       ▼
 ┌─────────────────────┐ ┌──────────────────┐ ┌───────────────────┐ ┌──────────────┐
 │   MySQL Database    │ │ ML Model Payload │ │ Local Ollama LLM  │ │ Smart Meters │
 │ (12 Relational Table│ │ (best_model.pkl  │ │ (Llama3 AI Engine)│ │  & Sensors   │
 │   Schema Architecture│ │ XGBoost/RandomF) │ └───────────────────┘ └──────────────┘
 └─────────────────────┘ └──────────────────┘
```

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [React 18](https://reactjs.org/) + [Vite 5](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/) (with custom dark mode & responsive UI components)
- **Data Visualization**: [Recharts 2.12](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM 6.23](https://reactrouter.com/)

### **Backend**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
- **Server**: [Uvicorn](https://www.uvicorn.org/)
- **ORM & Database**: [SQLAlchemy](https://www.sqlalchemy.org/) + [PyMySQL](https://pymysql.readthedocs.io/) + [MySQL 8.0](https://www.mysql.com/)
- **Authentication**: JWT (`python-jose`) + Bcrypt (`passlib`) + Google OAuth
- **HTTP Client**: `httpx` (for Ollama LLM queries)

### **Machine Learning & Data Science**
- **Libraries**: `scikit-learn`, `xgboost`, `pandas`, `numpy`, `matplotlib`, `seaborn`, `joblib`
- **Trained Models**: Logistic Regression, Decision Tree, Random Forest Classifier, XGBoost Classifier

### **AI Assistant**
- **LLM Engine**: [Ollama](https://ollama.ai/) local runtime serving `llama3`

---

## 📁 Project Directory Structure

```
team_phoenix_HostelWise_AI/
├── HostelWiseAI_Dataset_1000 (1).csv  # 1000-record smart meter & occupancy dataset
├── README.md                            # Comprehensive project documentation
├── backend/                             # Python FastAPI Backend & ML Engine
│   ├── app/                             # Application core package
│   │   ├── main.py                      # FastAPI entry point & startup seeder
│   │   ├── core/                        # Configurations, DB sessions & JWT security
│   │   │   ├── config.py                # Environment settings & Pydantic Config
│   │   │   ├── database.py              # SQLAlchemy engine & session factory
│   │   │   └── security.py              # Password hashing & JWT generation logic
│   │   ├── models/                      # SQLAlchemy ORM model definitions
│   │   │   └── database.py              # Relational mapping for 12 database tables
│   │   ├── schemas/                     # Pydantic validation schemas
│   │   │   └── schemas.py               # Request/Response data transfer objects
│   │   ├── crud/                        # Database operations layer
│   │   │   └── crud.py                  # Database queries & transactional helper functions
│   │   └── routers/                     # REST API Endpoint Routers
│   │       ├── dependencies.py          # Auth middleware & current user injectors
│   │       ├── auth.py                  # Login, registration & OAuth endpoints
│   │       ├── users.py                 # User account management endpoints
│   │       ├── hostels.py               # Hostel, floor, wing, room endpoints
│   │       ├── students.py              # Student allocations, attendance & leave
│   │       ├── energy.py                # Meter telemetry, overview, predictions & heatmaps
│   │       ├── reports.py               # PDF/CSV audit report generation
│   │       └── ai.py                    # Ollama LLM integration endpoint
│   ├── train_model.py                   # End-to-end ML pipeline (EDA, training, evaluation)
│   ├── best_model.pkl                   # Serialized ML model & feature scaler payload
│   ├── schema.sql                       # Clean MySQL database initialization script
│   ├── requirements.txt                 # Backend Python package dependencies
│   └── eda_plots/                       # Generated EDA chart images
│       ├── class_distribution.png
│       ├── expected_vs_actual.png
│       ├── hour_wise_consumption.png
│       ├── correlation_heatmap.png
│       ├── confusion_matrix.png
│       └── feature_importance.png
└── frontend/                            # Vite + React Frontend Dashboard
    ├── package.json                     # Frontend dependencies & npm scripts
    ├── vite.config.js                   # Vite server & build configurations
    ├── tailwind.config.js               # Tailwind design tokens & dark mode settings
    ├── postcss.config.js                # PostCSS setup
    ├── index.html                       # Single Page Application HTML root
    └── src/                             # React application source code
        ├── main.jsx                     # DOM rendering entry point
        ├── App.jsx                      # App router & protected layout shell
        ├── index.css                    # Global CSS & Tailwind directives
        ├── context/                     # Global State Contexts
        │   └── AuthContext.jsx          # User session & JWT state management
        ├── services/                    # API Integration
        │   └── api.js                   # Axios/Fetch HTTP service client
        ├── components/                  # Reusable UI Components
        │   └── layout/                  # Shared Layout Components
        │       ├── Navbar.jsx           # Top navigation bar with search & alerts
        │       └── Sidebar.jsx          # Dynamic navigation sidebar (RBAC aware)
        └── pages/                       # Dashboard Views / Screens
            ├── Login.jsx                # Multi-role authentication page
            ├── Dashboard.jsx            # Real-time campus overview & KPIs
            ├── Hostels.jsx              # Hostel listing & management screen
            ├── HostelDetails.jsx        # Room-level grid, telemetry & state view
            ├── Occupancy.jsx            # Student presence & leave tracking screen
            ├── Analytics.jsx            # Energy consumption charts & ML predictions
            ├── Reports.jsx              # PDF/CSV audit report generator
            ├── AIAssistant.jsx          # Interactive Ollama AI chatbot interface
            ├── UserManagement.jsx       # Admin user creation & role assignment
            └── Settings.jsx             # System configurations & profile settings
```

---

## 🗄️ Database Schema & Models

The database is built on MySQL 8.0 with 12 structured relational tables:

```
+------------------+         +------------------+         +------------------+
|      roles       |         |      users       |         |     hostels      |
+------------------+         +------------------+         +------------------+
| id (PK)          |<-------1| id (PK)          |         | id (PK)          |
| name             |         | username         |         | name             |
| description      |         | role_id (FK)     |         | total_floors     |
+------------------+         | assigned_hostel  |-------->| total_rooms      |
                             +------------------+         +--------┬─────────+
                                                                   │1
                                                                   ▼*
                                                          +------------------+
                                                          |      floors      |
                                                          +------------------+
                                                          | id (PK)          |
                                                          | hostel_id (FK)   |
                                                          | floor_number     |
                                                          +--------┬─────────+
                                                                   │1
                                                                   ▼*
                                                          +------------------+
                                                          |      wings       |
                                                          +------------------+
                                                          | id (PK)          |
                                                          | floor_id (FK)    |
                                                          | wing_name        |
                                                          +--------┬─────────+
                                                                   │1
                                                                   ▼*
+------------------+         +------------------+         +------------------+
|     students     |<-------1| student_room_    |*───────1|      rooms       |
+------------------+         | allocations      |         +------------------+
| id (PK)          |         +------------------+         | id (PK)          |
| roll_number      |         | id (PK)          |         | wing_id (FK)     |
| name             |         | student_id (FK)  |         | room_number      |
| status           |         | room_id (FK)     |         | capacity         |
+--------┬─────────+         | is_active        |         | status           |
         │                   +------------------+         +--------┬─────────+
         ├──────────────────────────────┐                          │1
         │1                             │1                         ▼*
         ▼*                             ▼*                +------------------+
+------------------+         +------------------+         | energy_consump-  |
| attendance_logs  |         |  leave_records   |         | tion_records     |
+------------------+         +------------------+         +------------------+
| id (PK)          |         | id (PK)          |         | id (PK)          |
| student_id (FK)  |         | student_id (FK)  |         | room_id (FK)     |
| direction        |         | start_date       |         | power / energy   |
| logged_at        |         | status           |         | logged_at        |
+------------------+         +------------------+         +------------------+
```

---

## 🤖 Machine Learning & Anomaly Detection Pipeline

The machine learning module ([`train_model.py`](file:///d:/technova/team_phoenix_HostelWise_AI/backend/train_model.py)) executes an end-to-end training and evaluation pipeline:

### 1. Feature Engineering
From the raw dataset `HostelWiseAI_Dataset_1000 (1).csv`, the pipeline constructs 19 features:
- **Spatial & Capacity**: `floor_no`, `room_no`, `room_capacity`, `hostel_id_encoded`, `wing_encoded`
- **Occupancy Metrics**: `students_present`, `students_outside`, `students_on_leave`, `room_status_encoded`
- **Temporal & Environmental**: `hour_of_day`, `is_weekend`, `is_holiday`, `month`, `day`, `day_of_week_encoded`, `temperature`
- **Energy Features**: `expected_energy_kwh`, `actual_energy_kwh`, `energy_difference` (\(Actual - Expected\))

### 2. Model Benchmarking
The script evaluates four algorithms using stratified split cross-validation:
1. **Logistic Regression** (with feature standardization)
2. **Decision Tree Classifier**
3. **Random Forest Classifier** (100 estimators)
4. **XGBoost Classifier** (LogLoss evaluation)

### 3. Automated Checkpointing & Output Artifacts
- The model with the highest F1-Score & Accuracy is selected automatically.
- Serialized to `backend/best_model.pkl` alongside feature scalers.
- EDA charts exported to `backend/eda_plots/`:
  - `class_distribution.png` (Imbalanced dataset analysis)
  - `expected_vs_actual.png` (Energy scatter visualization)
  - `correlation_heatmap.png` (Feature correlation matrix)
  - `confusion_matrix.png` (Classification performance)
  - `feature_importance.png` (Top contributing metrics)

---

## 🧠 AI Assistant (Ollama Integration)

The backend provides a context-aware AI endpoint at `/api/v1/ai/chat`. When a user submits a prompt:
1. The backend queries the database for the active user's scope (campus-wide for Super Admin, single hostel for Supervisor).
2. It compiles live statistics: room occupancy count, total present/outside/on-leave students, and recent energy anomalies.
3. It constructs a context prompt and queries the local Ollama LLM (`llama3`).
4. The response provides targeted suggestions for power factor correction, HVAC optimization, and leave check-out enforcement.

---

## 🔌 API Endpoints Directory

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Form login for OAuth2 password bearer token | Public |
| `POST` | `/auth/register` | Register a new supervisor/admin account | Public |
| `GET` | `/auth/me` | Get current logged-in user profile | Authenticated |
| `POST` | `/auth/google-login` | Authenticate using Google OAuth ID token | Public |

### Hostels & Hierarchy (`/api/v1/hostels`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/hostels/` | List all hostels | Authenticated |
| `POST` | `/hostels/` | Create a new hostel | Super Admin |
| `GET` | `/hostels/{id}` | Get detailed hostel view with floors & rooms | Authenticated |
| `POST` | `/hostels/floors/` | Add floor to hostel | Super Admin |
| `POST` | `/hostels/wings/` | Add wing to floor | Super Admin |
| `POST` | `/hostels/rooms/` | Add room to wing | Super Admin |

### Students & Attendance (`/api/v1/students`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/students/` | List students (filterable by hostel/status) | Authenticated |
| `POST` | `/students/` | Register new student | Authenticated |
| `POST` | `/students/allocate` | Allocate student to a room | Authenticated |
| `POST` | `/students/biometrics/scan` | Log biometric IN/OUT attendance event | Authenticated |
| `POST` | `/students/leave` | File student leave application | Authenticated |
| `PUT` | `/students/leave/{id}` | Approve or reject student leave request | Supervisor / Admin |

### Energy & Telemetry (`/api/v1/energy`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/energy/readings` | Log smart meter telemetry reading | Public / Meter |
| `GET` | `/energy/consumption` | List recent energy consumption records | Authenticated |
| `GET` | `/energy/overview` | Fetch campus real-time KPIs & carbon stats | Authenticated |
| `POST` | `/energy/predict-anomaly` | Run real-time ML anomaly detection on payload | Authenticated |
| `GET` | `/energy/anomalies` | List active flagged energy wastage instances | Authenticated |
| `GET` | `/energy/heatmaps` | Generate floor & room level occupancy heatmaps | Authenticated |

### Reports & Export (`/api/v1/reports`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/reports/` | List generated historical audit reports | Authenticated |
| `GET` | `/reports/export/csv` | Download raw energy data CSV dump | Authenticated |
| `GET` | `/reports/export/pdf` | Generate and download executive PDF audit report | Authenticated |

### AI Assistant (`/api/v1/ai`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/ai/chat` | Context-aware chat with local Ollama model | Authenticated |

---

## 💻 Frontend Pages & UI Components

The React frontend delivers a responsive dashboard:

1. **Login Page (`/login`)**: Secure authentication form supporting standard credentials & Google OAuth login.
2. **Dashboard (`/`)**: Main command center featuring live KPI stat cards (Total Hostels, Rooms Occupied, Active Power Draw, Carbon Footprint), hourly consumption trends, and active alert notifications.
3. **Hostels (`/hostels`)**: Overview of all campus hostels with room occupancy progress bars and quick navigation.
4. **Hostel Details (`/hostels/:id`)**: Detailed floor-by-floor and room-by-room grid layout showing individual room status (Occupied, Energy Efficient, Abnormal, Wastage, Maintenance).
5. **Occupancy (`/occupancy`)**: Student management portal with live presence badges (Present, Outside, On Leave) and leave approval interface.
6. **Analytics (`/analytics`)**: Deep-dive energy graphs, actual vs expected power diffs, power factor monitoring, and live ML anomaly predictor tool.
7. **Reports (`/reports`)**: Report generator interface supporting custom date ranges and one-click PDF/CSV exports.
8. **AI Assistant (`/ai-assistant`)**: Interactive chatbot view powered by Ollama with quick-action prompt suggestions.
9. **User Management (`/users`)**: Restricted to Super Admin for managing user accounts, assigning roles, and linking supervisors to hostels.
10. **Settings (`/settings`)**: Profile settings, API configurations, system theme toggles, and notification preferences.

---

## 🚀 Installation & Setup Guide

### 1. Prerequisites
Ensure you have the following installed on your host system:
- **Node.js** (v18.x or higher) & **npm**
- **Python** (v3.9 or higher) & **pip**
- **MySQL Server** (v8.0 or higher)
- *(Optional)* **Ollama** (for local AI assistant features)

---

### 2. Database Setup

1. Open your MySQL client or command terminal:
   ```bash
   mysql -u root -p
   ```
2. Create the target database:
   ```sql
   CREATE DATABASE hostel_energy_db;
   ```
3. Initialize the schema using the provided [`schema.sql`](file:///d:/technova/team_phoenix_HostelWise_AI/backend/schema.sql) script:
   ```bash
   mysql -u root -p hostel_energy_db < backend/schema.sql
   ```

---

### 3. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows**:
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside the `backend/` directory (see [Environment Variables](#-environment-variables)).
5. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
6. Verify the backend is running by navigating to the interactive API docs:
   - **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 4. Machine Learning Model Training

To train or re-train the anomaly detection classifier models on the dataset:

1. Ensure your virtual environment is active in the `backend/` folder.
2. Run the training script:
   ```bash
   python train_model.py
   ```
3. The pipeline will:
   - Load `HostelWiseAI_Dataset_1000 (1).csv`.
   - Process features and clean invalid records.
   - Generate EDA charts into `backend/eda_plots/`.
   - Train and evaluate Logistic Regression, Decision Tree, Random Forest, and XGBoost models.
   - Save the best model checkpoint to `backend/best_model.pkl`.

---

### 5. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web dashboard in your browser at:
   - [http://localhost:5173](http://localhost:5173)

---

### 6. Local AI Assistant Setup (Optional)

To enable the local context-aware AI assistant:

1. Install [Ollama](https://ollama.ai/).
2. Pull and start the `llama3` model:
   ```bash
   ollama pull llama3
   ollama serve
   ```
3. Ensure `OLLAMA_URL=http://127.0.0.1:11434` is set in your backend `.env` file.

---

## ⚙️ Environment Variables

Create a `.env` file inside `backend/`:

```ini
# Core Configuration
PROJECT_NAME="HostelWise AI - Smart Hostel Energy Management System"
API_V1_STR="/api/v1"
SECRET_KEY="your-super-secret-jwt-key-here"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# MySQL Database Credentials
MYSQL_USER="root"
MYSQL_PASSWORD="your_mysql_password"
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_DB="hostel_energy_db"

# Optional Integrations
GOOGLE_CLIENT_ID=""
OLLAMA_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="llama3"
```

---

## 🔑 Default User Credentials

Upon initial backend startup, default administrative accounts and hostels are automatically seeded if the database is empty:

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Full Campus Access (All Hostels) |

*Note: Supervisors can be created via the Super Admin **User Management** page (`/users`) and linked to specific hostels (Hostel A, Hostel B, Hostel C, Hostel D).*

---

## ✅ Verification & Testing

1. **API Health Check**:
   Send a `GET` request to `http://localhost:8000/docs` to verify FastAPI routing.
2. **Database Auto-Seeding**:
   Upon first backend startup, check the console logs for:
   `[FASTAPI STARTUP] ML model loaded successfully from best_model.pkl!`
3. **ML Anomaly Inference Test**:
   Use the **Analytics** page ML Predictor component to test custom room telemetry inputs against the loaded model.

---

## 👥 Team & Credits

Developed with ❤️ by **Team Phoenix** for smart, sustainable, and energy-efficient educational campuses.

- **Project Repository**: `team_phoenix_HostelWise_AI`
- **System Version**: `1.0.0`
