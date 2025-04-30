import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ setIsAuthenticated }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    job: '',
    dob: '',
    salary: '',
    gender: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any existing authentication data when component mounts
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        if (!formData.name || !formData.job || !formData.dob || 
            !formData.salary || !formData.gender || 
            !formData.username || !formData.password) {
          setError('Please fill in all fields');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          return;
        }

        const response = await axios.post('/api/register', formData);
        if (response.data.message === 'Registration successful') {
          setIsRegistering(false);
          setFormData({
            name: '',
            job: '',
            dob: '',
            salary: '',
            gender: '',
            username: '',
            password: ''
          });
          setError('Registration successful! Please login.');
        }
      } else {
        if (!formData.username || !formData.password) {
          setError('Please enter both username and password');
          setShake(true);
          setTimeout(() => setShake(false), 500);
          return;
        }

        const response = await axios.post('/api/login', {
          username: formData.username,
          password: formData.password
        });
        
        if (response.data.message === 'Login successful') {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('token', response.data.token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          setIsAuthenticated(true);
          navigate('/dashboard');
        } else {
          setError(response.data.message);
          setShake(true);
          setTimeout(() => setShake(false), 500);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 
               (isRegistering ? 'Registration failed. Please try again.' : 'Login failed. Please try again.'));
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`login-container ${shake ? 'shake' : ''}`}
      style={{
        background: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${process.env.PUBLIC_URL}/pic1.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="login-card">
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="registration-fields">
            {isRegistering ? (
              <>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="job">Job</label>
                  <input
                    type="text"
                    id="job"
                    value={formData.job}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dob">Date of Birth</label>
                  <input
                    type="date"
                    id="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="salary">Salary</label>
                  <input
                    type="number"
                    id="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </>
            ) : null}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner"></span>
              ) : (
                isRegistering ? 'Register' : 'Login'
              )}
            </button>

            <div
              className="toggle-form"
              onClick={() => {
                if (!isLoading) {
                  setIsRegistering(!isRegistering);
                  setError('');
                }
              }}
            >
              {isRegistering
                ? 'Already have an account? Login'
                : "Don't have an account? Register"}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 