import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiMessageSquare, FiArrowRight } from "react-icons/fi";
import { BACKEND_URL } from "../config";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/auth/register`,
        formData
      );

      alert(res.data.message || "Account created successfully! Please log in.");
      navigate("/");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Registration Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container dark-theme">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <FiMessageSquare />
            </div>
          </div>
          <h2>Create Account</h2>
          <p>Join Realtime Chat and start messaging</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Username</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                name="username"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Account"} <FiArrowRight style={{ marginLeft: "6px" }} />
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;