import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiMessageSquare, FiArrowRight } from "react-icons/fi";
import { BACKEND_URL } from "../config";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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
        `${BACKEND_URL}/api/auth/login`,
        formData
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.user.username);

      navigate("/chat");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Login Failed. Please check your credentials.");
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
          <h2>Welcome Back</h2>
          <p>Sign in to continue to Realtime Chat</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
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
            {loading ? "Signing in..." : "Sign In"} <FiArrowRight style={{ marginLeft: "6px" }} />
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create Account</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;