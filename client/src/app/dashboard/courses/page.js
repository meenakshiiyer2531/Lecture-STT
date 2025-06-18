"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Trash2, Plus } from "lucide-react";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BACKEND_URL = "https://lecture-stt.onrender.com";

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/courses`);
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to fetch courses. Try again later.");
    }
  };

  const deleteCourse = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this course?");
    if (!confirmed) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/courses/${id}`);
      setCourses((prev) => prev.filter((course) => course._id !== id));
      alert("Course deleted successfully ✅");
    } catch (err) {
      console.error("Error deleting course:", err.response?.data || err.message);
      alert("❌ Failed to delete course.");
    }
  };

  const addCourse = async () => {
    if (!newCourse.trim()) return alert("Course name cannot be empty!");

    try {
      setLoading(true);
      await axios.post(
        `${BACKEND_URL}/api/courses`,
        { name: newCourse },
        {
          headers: {
            "Content-Type": "application/json", // ✅ Important!
          },
        }
      );
      setNewCourse("");
      await fetchCourses();
      alert("✅ Course added successfully!");
    } catch (err) {
      console.error("Error adding course:", err.response?.data || err.message);
      alert("❌ Failed to add course. Backend might be asleep.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addCourse();
  };

  return (
    <div className="max-w-[90vw] mx-auto mt-10 text-black">
      <h2 className="text-3xl font-bold mb-6">📚 Your Courses</h2>

      <div className="flex items-center gap-2 mb-6">
        <input
          type="text"
          placeholder="New course name"
          value={newCourse}
          onChange={(e) => setNewCourse(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addCourse}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center gap-2"
          disabled={loading}
        >
          <Plus size={18} />
          {loading ? "Adding..." : "Add"}
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}

      {courses.length === 0 ? (
        <p className="text-gray-500 text-center">No courses found. Add one above!</p>
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => (
            <li
              key={course._id}
              className="bg-white p-4 rounded-md shadow-sm flex justify-between items-center hover:shadow-md transition"
            >
              <Link
                href={`/dashboard/courses/${course._id}`}
                className="text-blue-600 hover:underline text-lg font-medium truncate"
              >
                {course.name}
              </Link>
              <button
                onClick={() => deleteCourse(course._id)}
                className="text-red-600 hover:text-red-800"
                title="Delete Course"
              >
                <Trash2 size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
