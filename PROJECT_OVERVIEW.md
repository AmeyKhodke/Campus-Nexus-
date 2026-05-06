# Campus-Nexus: Comprehensive Project Overview

## 1. Executive Summary
**Campus-Nexus** is a comprehensive, role-based campus management platform designed to digitize, streamline, and centralize day-to-day college or university operations. It transitions traditional, paper-heavy, and manual processes—such as grievance redressal, facility booking, and fund approvals—into a unified digital ecosystem. 

## 2. User Roles & Access Control
The platform is built with strict Role-Based Access Control (RBAC), ensuring data privacy and operational hierarchy. It supports three primary roles:
* **Students:** Can access services, submit requests, vote in elections, and track the status of their applications/complaints.
* **Faculty:** Act as reviewers and administrators for student requests, manage funds/budgets, resolve complaints, and broadcast announcements.
* **Administrators:** Have overarching control to oversee the entire platform, manage campus-wide facilities, and administer elections and large-scale funds.

## 3. Core Modules & Features
Campus-Nexus is divided into several powerful feature modules:

* **📝 Application & Request Management**
  * *Students* can digitally submit applications (e.g., leave requests, event approvals, document requests).
  * *Faculty/Admins* have a dedicated management portal to review, approve, or reject these applications in real-time.
* **🚨 Grievance & Complaint Redressal**
  * *Students* can log complaints regarding infrastructure, academics, or campus life.
  * *Faculty/Admins* use the "Complaint Review" dashboard to assign, track, and resolve these issues.
* **🏛️ Campus Governance (Elections)**
  * A built-in digital election module. Students cast votes securely; Faculty/Admins set up candidates, monitor voting, and declare results.
* **💰 Finance & Fund Management**
  * Tracks departmental budgets, event funding, and financial approvals, ensuring transparency in fund allocation and spending.
* **🏢 Facility Booking & Management**
  * Digitizes the booking of campus infrastructure (auditoriums, labs, sports grounds).
* **📢 Announcements System**
  * A centralized bulletin board for broadcasting important notices and deadlines.

## 4. Technology Stack (The Technical Backbone)
* **Frontend User Interface:** Built with **React.js** and **Vite**. Uses **Tailwind CSS** and **Radix UI** for design, and **Framer Motion** for animations.
* **Backend & Database:** Powered entirely by **Firebase** (Google Cloud). Utilizes Firebase Authentication and Realtime Database.
* **Data Visualization & Media:** Uses **Chart.js / Recharts** for analytical dashboards and **Cloudinary** for image/media storage.

## 5. Key Benefits for the Institution
* **Paperless Operations:** Drastically reduces administrative burden and paper waste.
* **Transparency:** Students can track exactly where their application or complaint is in the pipeline.
* **Data-Driven Governance:** Provides instant visual dashboards on budgets, election turnouts, and facility usage.

---

## 6. Serverless Architecture & Data Flow (API Endpoints)
Campus-Nexus uses a **Serverless Architecture** with Google Firebase. Instead of maintaining a separate backend server to route API calls (like a traditional Express server), the React frontend communicates directly and securely with Firebase Realtime Database collections. This guarantees real-time updates across all dashboards.

In this architecture, **Firebase Database Paths act as the "Endpoints."**

### Authentication & Role Management Flow
* **Login/Signup Action:** Calls Firebase Authentication.
* **Database Profile Endpoints:**
  * `POST/GET /students/{userId}` - Student profiles (enrollment date, student ID).
  * `POST/GET /faculty/{userId}` - Faculty profiles (designation, department).
  * `POST/GET /administrators/{userId}` - Admin profiles (permissions).
  * `POST/GET /pending_profiles/{userId}` - Temporary storage for users via Google Auth pending role selection.

### Application & Request Flow
* **Step 1: Document Upload:** 
  * External REST API: `POST https://api.cloudinary.com/v1_1/dc3pfqjlh/auto/upload`
* **Step 2: Submit Application:**
  * `POST /applications/{category}/{applicationId}`
* **Step 3: Notification Trigger:**
  * `POST /notifications/{notificationId}` - Alerts the relevant faculty member.
* **Step 4: Review & Update:**
  * `PATCH /applications/{category}/{applicationId}` - Faculty updates status.

### Fund & Budget Management Flow
* **Step 1: Fetching Data:**
  * `GET /budget_requests` - Fetches all pending fund requests.
  * `GET /department_budgets` - Fetches allocation vs. spent amount per department.
* **Step 2: Approving Request:**
  * `PATCH /budget_requests/{requestId}` - Updates request status.
* **Step 3: Deducting Funds:**
  * `PATCH /student_budgets/{userId}` - Updates student's total spent.
  * `PATCH /department_budgets/{departmentName}` - Adds to department's spent field.

### Election & Governance Flow
* **Admin Creating Election:** `POST /elections/{electionId}`
* **Candidate Application:** `POST /candidates/{candidateId}`
* **Voting:** `POST /votes/{voteId}`

### Facility Booking Flow
* **Browsing:** `GET /facilities`
* **Booking:** `POST /facility_bookings/{bookingId}`
* **Approval:** `PATCH /facility_bookings/{bookingId}` (Triggers notification back to student).
