# Content Management System - Student Form (Frontend Only)

A simple React + Vite student registration form using localStorage for persistence.

## 🎯 What This Project Does

This application allows you to:
- ✅ Add student records with name, roll number, age, and department
- ✅ View students in a responsive table
- ✅ Delete students
- ✅ Keep data persisted across browser sessions using localStorage
- ✅ Work without a separate Node/Express backend

## 🏗️ Project Architecture

### Frontend (React + Vite)
- **Location**: `src/`
- **Technology**: React 18 + Vite
- **Features**: Form-based CRUD UI, localStorage persistence

## 📁 Current Project Structure

```
student-form/
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── README.md
└── .env (optional)
```

## 🚀 How to Run

1. Install dependencies:

```bash
npm install
```

2. Start frontend dev server:

```bash
npm run dev
```

3. Open `http://localhost:5173`.

## 💾 Data Storage

- Uses browser `localStorage` key: `studentFormStudents`
- No backend or database service required

## 🛠️ Notes

- Existing backend files (`server.js`, `models/`, `routes/`) have been removed.
- `package.json` dependencies are now only React/Vite.

## 🔧 How MongoDB Connection Works

### 1. Environment Variables (.env)
```env
MONGODB_URI=mongodb+srv://CSI02-7WEB:CSI02-7WEB123@csi07-2web.ne1wwfo.mongodb.net/?appName=CSI07-2WEB
PORT=5000
```

### 2. Server Connection (server.js)
```javascript
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));
```

### 3. Data Model (models/Student.js)
```javascript
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roll: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  department: { type: String, required: true }
});
```

### 4. API Routes (routes/students.js)
- `GET /api/students` - Fetch all students
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

## 🚀 How to Run the Application

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (free tier available)

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure MongoDB**
   - Your `.env` file already contains the MongoDB Atlas connection string
   - If you need to change it, update the `MONGODB_URI` variable

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   This starts both:
   - Backend server on `http://localhost:5000`
   - Frontend React app on `http://localhost:5173`

4. **Open Browser**
   - Go to `http://localhost:5173`
   - Start adding students!

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api/students
```

### Get All Students
```http
GET /api/students
```
**Response**: Array of student objects
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "roll": "CS001",
    "age": 20,
    "department": "Computer Science",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Add New Student
```http
POST /api/students
Content-Type: application/json

{
  "name": "Jane Smith",
  "roll": "CS002",
  "age": 19,
  "department": "Electronics"
}
```
**Response**: Created student object

### Update Student
```http
PUT /api/students/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "age": 21
}
```

### Delete Student
```http
DELETE /api/students/:id
```

## 🔍 How the Frontend Works

### State Management
```javascript
const [students, setStudents] = useState([]);        // Student list
const [loading, setLoading] = useState(true);       // Loading state
const [error, setError] = useState(null);           // Error state
```

### Data Fetching
```javascript
useEffect(() => {
  fetchStudents();  // Load students on component mount
}, []);

const fetchStudents = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/students');
    const data = await response.json();
    setStudents(data);
  } catch (error) {
    setError(error.message);
  }
};
```

### Form Submission
```javascript
const addStudent = async (e) => {
  e.preventDefault();
  // Collect form data
  const studentData = { name, roll, age, department };

  // Send to API
  const response = await fetch('http://localhost:5000/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData)
  });

  // Update local state with new student
  const newStudent = await response.json();
  setStudents([...students, newStudent]);
};
```

## 🛠️ Technologies Used

| Technology | Purpose | Version |
|------------|---------|---------|
| React | Frontend UI | 18.2.0 |
| Vite | Build tool | 7.2.4 |
| Express.js | Backend server | 4.18.2 |
| MongoDB | Database | Atlas (Cloud) |
| Mongoose | ODM for MongoDB | 8.0.3 |
| CORS | Cross-origin requests | 2.8.5 |
| dotenv | Environment variables | 16.3.1 |

## 🐛 Troubleshooting

### "MongoDB connection error"
- Check your internet connection
- Verify MongoDB Atlas connection string in `.env`
- Ensure your IP address is whitelisted in MongoDB Atlas

### "Port 5000 already in use"
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### "Failed to fetch students"
- Ensure backend server is running (`npm run dev`)
- Check browser console for CORS errors
- Verify API endpoint URLs

### "Roll number already exists"
- Each student must have a unique roll number
- This is enforced by MongoDB unique index

## 📈 Data Flow

1. **User fills form** → React component collects data
2. **Form submission** → Data sent to `/api/students` endpoint
3. **Express server** → Receives request, validates data
4. **Mongoose model** → Saves data to MongoDB Atlas
5. **Response sent back** → Frontend updates UI with new data
6. **Data persists** → Stored permanently in cloud database

## 🔐 Security Features

- Input validation on both frontend and backend
- Unique roll number constraint
- CORS enabled for cross-origin requests
- Environment variables for sensitive data
- Error handling for database operations

## 🚀 Next Steps

You can extend this application by:
- Adding user authentication
- Implementing student search/filtering
- Adding more fields (email, phone, address)
- Creating admin dashboard
- Adding file upload for student photos
- Implementing pagination for large datasets

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify MongoDB Atlas connection
3. Ensure all dependencies are installed
4. Check the terminal output for server errors

Your student management system is now fully functional with cloud database persistence! 🎉
├── vite.config.js
└── .env                    # Environment variables
```

## Technologies Used

- **Frontend**: React, Vite
- **Backend**: Express.js, Node.js
- **Database**: MongoDB with Mongoose
- **Other**: CORS, dotenv