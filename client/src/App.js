import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Chart from 'chart.js/auto';
import './styles.css';
import Login from './components/Login';

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ name: '', amount: '', date: '', category: 'Food' });
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [charts, setCharts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeChart, setActiveChart] = useState(null);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchExpenses();
  }, [navigate]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      if (videoRef.current) {
        videoRef.current.src = process.env.PUBLIC_URL + "/videoplaybackdark.mp4";
        videoRef.current.load(); // Force reload the video
        videoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
        });
      }
    } else {
      document.body.classList.remove('dark-mode');
      if (videoRef.current) {
        videoRef.current.src = process.env.PUBLIC_URL + "/videoplayback.mp4";
        videoRef.current.load(); // Force reload the video
        videoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
        });
      }
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/expenses');
      setExpenses(res.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addExpense = async () => {
    if (!form.name || !form.amount || !form.date) {
      alert('Please fill all fields');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('/api/expenses', form);
      setForm({ name: '', amount: '', date: '', category: 'Food' });
      await fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExpense = async id => {
    setIsLoading(true);
    try {
      await axios.delete(`/api/expenses/${id}`);
      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (expenses.length > 0) {
      updateCharts();
    }
  }, [expenses, darkMode]);

  const updateCharts = () => {
    const categories = {};
    const dailyTotals = {};
    const monthlyTotals = {};

    expenses.forEach(exp => {
      categories[exp.category] = (categories[exp.category] || 0) + Number(exp.amount);
      dailyTotals[exp.date] = (dailyTotals[exp.date] || 0) + Number(exp.amount);
      const month = exp.date.slice(0, 7);
      monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(exp.amount);
    });

    const textColor = darkMode ? "#ffffff" : "#212529";

    Object.values(charts).forEach(chart => chart.destroy());

    const commonOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: { 
            color: textColor,
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: 25,
            boxWidth: 20,
            boxHeight: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: darkMode ? '#2d2d2d' : '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: darkMode ? '#444' : '#ddd',
          borderWidth: 2,
          padding: 15,
          displayColors: true,
          boxPadding: 8,
          titleFont: {
            size: 16,
            weight: 'bold'
          },
          bodyFont: {
            size: 14
          },
          cornerRadius: 8,
          caretSize: 8,
          caretPadding: 8
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      layout: {
        padding: {
          top: 30,
          right: 30,
          bottom: 30,
          left: 30
        }
      }
    };

    const newCharts = {
      expenseChart: new Chart(document.getElementById("expenseChart"), {
        type: "doughnut",
        data: {
          labels: Object.keys(categories),
          datasets: [{
            data: Object.values(categories),
            backgroundColor: [
              "#00bcd4", "#8e44ad", "#f39c12", "#27ae60",
              "#e74c3c", "#3498db", "#2ecc71", "#f1c40f"
            ],
            hoverOffset: 8,
            borderWidth: 3
          }]
        },
        options: {
          ...commonOptions,
          cutout: '70%',
          plugins: {
            ...commonOptions.plugins,
            legend: {
              ...commonOptions.plugins.legend,
              align: 'center',
              labels: {
                ...commonOptions.plugins.legend.labels,
                font: {
                  size: 16,
                  weight: 'bold'
                }
              }
            }
          }
        }
      }),

      dailyChart: new Chart(document.getElementById("dailyChart"), {
        type: "doughnut",
        data: {
          labels: Object.keys(dailyTotals),
          datasets: [{
            data: Object.values(dailyTotals),
            backgroundColor: [
              "#ff6b6b", "#6c5ce7", "#00cec9", "#fab1a0",
              "#e84393", "#81ecec", "#fdcb6e", "#0984e3"
            ],
            hoverOffset: 8,
            borderWidth: 3
          }]
        },
        options: {
          ...commonOptions,
          cutout: '70%',
          plugins: {
            ...commonOptions.plugins,
            legend: {
              ...commonOptions.plugins.legend,
              align: 'center',
              labels: {
                ...commonOptions.plugins.legend.labels,
                font: {
                  size: 16,
                  weight: 'bold'
                }
              }
            }
          }
        }
      }),

      monthlyChart: new Chart(document.getElementById("monthlyChart"), {
        type: "doughnut",
        data: {
          labels: Object.keys(monthlyTotals),
          datasets: [{
            data: Object.values(monthlyTotals),
            backgroundColor: [
              "#1abc9c", "#c0392b", "#2c3e50", "#d35400",
              "#7f8c8d", "#34495e", "#9b59b6", "#16a085"
            ],
            hoverOffset: 8,
            borderWidth: 3
          }]
        },
        options: {
          ...commonOptions,
          cutout: '70%',
          plugins: {
            ...commonOptions.plugins,
            legend: {
              ...commonOptions.plugins.legend,
              align: 'center',
              labels: {
                ...commonOptions.plugins.legend.labels,
                font: {
                  size: 16,
                  weight: 'bold'
                }
              }
            }
          }
        }
      }),

      barChart: new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
          labels: Object.keys(monthlyTotals).sort(),
          datasets: [{
            label: 'Monthly Spending (₹)',
            data: Object.keys(monthlyTotals).sort().map(label => monthlyTotals[label]),
            backgroundColor: '#4dabf7',
            borderRadius: 8,
            hoverBackgroundColor: '#339af0',
            borderWidth: 3,
            barThickness: 40
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            x: { 
              ticks: { 
                color: textColor,
                font: {
                  size: 14,
                  weight: 'bold'
                },
                maxRotation: 45,
                minRotation: 45,
                padding: 15
              },
              grid: {
                color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                drawBorder: false,
                lineWidth: 2
              }
            },
            y: { 
              ticks: { 
                color: textColor,
                font: {
                  size: 14,
                  weight: 'bold'
                },
                padding: 15
              },
              grid: {
                color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                drawBorder: false,
                lineWidth: 2
              }
            }
          },
          plugins: {
            ...commonOptions.plugins,
            legend: {
              ...commonOptions.plugins.legend,
              align: 'center',
              labels: {
                ...commonOptions.plugins.legend.labels,
                font: {
                  size: 16,
                  weight: 'bold'
                }
              }
            }
          }
        }
      })
    };

    setCharts(newCharts);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/');
    window.location.reload();
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  const handleVideoError = () => {
    setVideoError(true);
    console.error('Error loading video');
  };

  return (
    <div className={darkMode ? "dark-mode" : ""}>
      <video 
        ref={videoRef}
        className="video-background" 
        autoPlay 
        loop 
        muted 
        playsInline
        onError={handleVideoError}
        key={darkMode ? 'dark' : 'light'}
      >
        <source src={process.env.PUBLIC_URL + (darkMode ? "/videoplaybackdark.mp4" : "/videoplayback.mp4")} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="video-overlay"></div>
      
      {videoError && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '20px',
          borderRadius: '10px',
          zIndex: 1000
        }}>
          Error loading video. Please check if the video files are in the public folder.
        </div>
      )}
      
      <div className="toggle-dark" onClick={toggleDarkMode}>
        {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </div>
      <button
        onClick={handleLogout}
        className="logout-btn"
      >
        Logout
      </button>
      <div className="main-content">
        <h2 className="text-center" style={{ marginBottom: '30px' }}>Expense Tracker</h2>

        <div className="form-section">
          <div className="mb-3">
            <input
              name="name"
              className="form-control"
              placeholder="Expense Name"
              value={form.name}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="mb-3">
            <input
              name="amount"
              type="number"
              className="form-control"
              placeholder="Amount"
              value={form.amount}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="mb-3">
            <input
              name="date"
              type="date"
              className="form-control"
              value={form.date}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="mb-3">
            <select
              name="category"
              className="form-select"
              value={form.category}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Shopping">Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Health">Health</option>
              <option value="Education">Education</option>
              <option value="Bills">Bills</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button 
            className={`btn btn-success w-100 ${isLoading ? 'loading' : ''}`} 
            onClick={addExpense}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Expense'}
          </button>
        </div>

        <div className="list-section">
          <h3 className="mt-4">Expenses</h3>
          <ul className="list-group">
            {isLoading ? (
              <div className="text-center" style={{ padding: '20px' }}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              expenses.map(expense => (
                <li key={expense._id} className="list-group-item">
                  <div>
                    <strong>{expense.name}</strong> - ₹{expense.amount} ({expense.category})<br />
                    <small>{expense.date}</small>
                  </div>
                  <button 
                    className="delete-btn" 
                    onClick={() => deleteExpense(expense._id)}
                    disabled={isLoading}
                  >
                    X
                  </button>
                </li>
              ))
            )}
          </ul>

          <h3 className="mt-4">Total Spending: ₹{totalAmount.toFixed(2)}</h3>
        </div>

        <h3 className="mt-4" style={{ marginLeft: '20px' }}>Expense Overview</h3>
        <div className="chart-section">
          <div 
            className={`chart-container ${activeChart === 'barChart' ? 'active' : ''}`}
            onClick={() => setActiveChart('barChart')}
          >
            <h4>Spending Over Time</h4>
            <canvas id="barChart"></canvas>
          </div>
          <div 
            className={`chart-container ${activeChart === 'expenseChart' ? 'active' : ''}`}
            onClick={() => setActiveChart('expenseChart')}
          >
            <h4>By Category</h4>
            <canvas id="expenseChart"></canvas>
          </div>
          <div 
            className={`chart-container ${activeChart === 'dailyChart' ? 'active' : ''}`}
            onClick={() => setActiveChart('dailyChart')}
          >
            <h4>Daily Expense</h4>
            <canvas id="dailyChart"></canvas>
          </div>
          <div 
            className={`chart-container ${activeChart === 'monthlyChart' ? 'active' : ''}`}
            onClick={() => setActiveChart('monthlyChart')}
          >
            <h4>Monthly Expense</h4>
            <canvas id="monthlyChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Login setIsAuthenticated={setIsAuthenticated} />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? 
              <Dashboard /> : 
              <Navigate to="/" replace />
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;

