# Job Portal

A full-stack job portal web application where **employers** can post jobs and manage applicants, and **employees** can browse and apply for jobs.  
Built with **React.js** (Bootstrap/MUI) for the frontend and **.NET Core** with **SQL Server** for the backend.

---

## 🚀 Features
### For Employers
- Register, login, and manage profile
- Post new job listings
- Edit and delete jobs
- View applicants for each job

### For Employees
- Register, login, and manage profile
- Browse available jobs
- Search and filter jobs by category, location, etc.
- Apply for jobs
- View application history

### Admin Panel
- Manage users (activate/deactivate accounts)
- Manage all job postings
- Monitor system activity

---

## 🛠 Tech Stack
### Frontend
- React.js
- Bootstrap 5 or Material-UI
- Axios (for API calls)
- React Router DOM

### Backend
- .NET Core 8 Web API
- Entity Framework Core
- SQL Server

### Tools
- Git & GitHub (Version Control)
- Visual Studio Code / Visual Studio
- Postman (API Testing)

---

## 📂 Project Structure

job-portal/
│
├── frontend/ # React.js app
│ ├── src/
│ ├── public/
│ └── package.json
│
├── backend/ # .NET Core Web API
│ ├── Controllers/
│ ├── Models/
│ ├── Services/
│ ├── Program.cs
│ └── jobportal.sln
│
└── README.md


⚙️ Installation & Setup
1️⃣ Clone the Repository

Step 1: Clone the repository:
git clone https://github.com/YourUsername/job-portal.git
cd job-portal

2️⃣ Frontend Setup

Step 1: Go to the frontend folder: cd frontend
Step 2: Install dependencies: npm install
Step 3: Start the React app: npm start
The app will run on http://localhost:3000

3️⃣ Backend Setup

Step 1: Go to the backend folder: cd backend
Step 2: Restore packages: dotnet restore
Step 3: Build the project: dotnet build
Step 4: Run the API: dotnet run
The API will run on http://localhost:5000

4️⃣ Database Setup

Step 1: Create a SQL Server database
Step 2: Update the connection string in appsettings.json:

"ConnectionStrings": {
  "DefaultConnection": "Server=YOUR_SERVER_NAME;Database=JobPortal;Trusted_Connection=True;"
}


Step 3: Apply database migrations: dotnet ef database update

📌 Branching Strategy

main → Production-ready code

dev → Development integration

feature/xxx → New feature branch (e.g., feature/authentication)

bugfix/xxx → Bug fix branch

Example:
git checkout -b feature/authentication
