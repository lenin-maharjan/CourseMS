import { useState, useEffect } from 'react';
import './App.css';

const STORAGE_KEY = 'studentFormStudents';

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const storedStudents = raw ? JSON.parse(raw) : [];
      setStudents(storedStudents);
    } catch (err) {
      setError('Could not load saved students.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistStudents = (nextStudents) => {
    setStudents(nextStudents);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStudents));
  };

  const addStudent = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const roll = form.roll.value.trim();
    const age = Number(form.age.value);
    const department = form.department.value;

    if (!name || !roll || !age || !department) {
      alert('Please fill in all fields.');
      return;
    }

    if (students.some((s) => s.roll === roll)) {
      alert('Roll number already exists.');
      return;
    }

    const newStudent = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      name,
      roll,
      age,
      department,
    };

    persistStudents([...students, newStudent]);
    form.reset();
    form.name.focus();
  };

  if (loading) {
    return <div className="container"><h1>Loading students...</h1></div>;
  }

  if (error) {
    return <div className="container"><h1>Error: {error}</h1></div>;
  }

  return (
    <div className="container">
      <h1>College Management - Student Entry</h1>
      <form onSubmit={addStudent} className="student-form">
        <label htmlFor="name">Name:</label>
        <input type="text" id="name" name="name" required />

        <label htmlFor="roll">Roll Number:</label>
        <input type="text" id="roll" name="roll" required />

        <label htmlFor="age">Age:</label>
        <input type="number" id="age" name="age" required min="1" />

        <label htmlFor="department">Department:</label>
        <select id="department" name="department" required>
          <option value="">-- select --</option>
          <option>Computer Science</option>
          <option>Electronics</option>
          <option>Mechanical</option>
          <option>Civil</option>
          <option>Business Administration</option>
        </select>

        <button type="submit">Add Student</button>
      </form>

      <table className="students-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Roll</th>
            <th>Age</th>
            <th>Department</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.roll}</td>
              <td>{s.age}</td>
              <td>{s.department}</td>
              <td>
                <button onClick={() => {
                  const filtered = students.filter((x) => x.id !== s.id);
                  persistStudents(filtered);
                }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
