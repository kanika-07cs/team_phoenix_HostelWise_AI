import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, KeyRound, Mail, User, ShieldCheck } from 'lucide-react';
import { api, setAuthHeader } from '../services/api';

const Login = () => {
  const { login, setUser, setDemoMode } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration form states
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regUsername || !regEmail || !regFullName || !regPassword || !regConfirmPassword) {
      setError('Please fill in all registration fields.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/register', {
        username: regUsername,
        email: regEmail,
        full_name: regFullName,
        password: regPassword,
        confirm_password: regConfirmPassword
      });
      
      setSuccess(response.data.message || 'Registration successful! Waiting for admin approval.');
      setRegUsername('');
      setRegEmail('');
      setRegFullName('');
      setRegPassword('');
      setRegConfirmPassword('');
      
      setTimeout(() => {
        setSuccess('');
        setView('login');
      }, 4000);
    } catch (err) {
      console.error('Registration failed:', err);
      if (err.message === 'Network Error' || !err.response) {
        setSuccess('(Demo Mode) Registration simulated successfully! Please ask Admin to approve.');
        setTimeout(() => {
          setSuccess('');
          setView('login');
        }, 4000);
      } else {
        setError(err.response?.data?.detail || 'Registration failed. Try a different username/email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    setError('');
    setLoading(true);
    
    const result = await login(username, password);
    setLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }
    setError('');
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
      setSuccess('If an account exists, a password reset token has been sent.');
      // Automatically transition to reset view for demo validation flow
      setTimeout(() => {
        setSuccess('');
        setView('reset');
      }, 2000);
    }, 1000);
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      setError('Please provide code token and new password.');
      return;
    }
    setError('');
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setSuccess('Password updated successfully. Returning to login.');
      setTimeout(() => {
        setSuccess('');
        setView('login');
      }, 2000);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg dark:bg-dark-bg p-6 transition-colors duration-300 relative overflow-hidden">
      {/* Background radial gradient blobs for Stripe premium look */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-veryLightBlue/60 dark:bg-brand-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-brand-lightBlue/30 dark:bg-brand-secondary/5 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-[440px] bg-white dark:bg-slate-800 border border-brand-border dark:border-dark-border rounded-premium shadow-premium p-8 z-10 transition-colors duration-300">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-premium-sm bg-brand-primary text-white shadow-premium mb-4">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-2xl font-extrabold text-brand-textPrimary dark:text-dark-textPrimary tracking-tight">HostelWise AI</h2>
          <p className="text-xs text-brand-textSecondary dark:text-dark-textSecondary font-medium mt-1.5">
            {view === 'login' && 'Smart Hostel Energy Management System'}
            {view === 'register' && 'Register a new Supervisor account'}
            {view === 'forgot' && 'Reset your administrator or supervisor account password'}
            {view === 'reset' && 'Create a new secure credentials check'}
          </p>
        </div>

        {/* Global feedbacks */}
        {error && (
          <div className="mb-5 p-3 rounded-premium-sm bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-brand-danger border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 p-3 rounded-premium-sm bg-green-50 dark:bg-green-950/20 text-xs font-semibold text-brand-success border border-green-100 dark:border-green-900/30">
            {success}
          </div>
        )}

        {/* LOGIN FORM VIEW */}
        {view === 'login' && (
          <div className="space-y-4">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-2">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-brand-textSecondary dark:text-dark-textSecondary">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin or supervisor" 
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-premium-sm bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border focus:border-brand-primary focus:outline-none text-brand-textPrimary dark:text-dark-textPrimary transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider">Password</label>
                  <button 
                    type="button" 
                    onClick={() => setView('forgot')}
                    className="text-xs font-semibold text-brand-primary dark:text-brand-accent hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-brand-textSecondary dark:text-dark-textSecondary">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-premium-sm bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border focus:border-brand-primary focus:outline-none text-brand-textPrimary dark:text-dark-textPrimary transition-all duration-200"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-brand-textSecondary dark:text-dark-textSecondary hover:text-brand-primary dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-sm rounded-premium-sm shadow-premium hover:shadow-premium-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>


            
            <div className="text-center mt-4 pt-2 border-t border-brand-border dark:border-dark-border">
              <button 
                type="button"
                onClick={() => { setView('register'); setError(''); setSuccess(''); }}
                className="text-xs font-semibold text-brand-primary dark:text-brand-accent hover:underline"
              >
                Don't have an account? Register as Supervisor
              </button>
            </div>


          </div>
        )}

        {/* REGISTER FORM VIEW */}
        {view === 'register' && (
          <div className="space-y-4">
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-1.5">Username</label>
                <input 
                  type="text" 
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Choose username" 
                  className="w-full px-3.5 py-2 text-sm rounded-premium-sm bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border focus:border-brand-primary focus:outline-none text-brand-textPrimary dark:text-dark-textPrimary transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="supervisor@hostelwise.ai" 
                  className="w-full px-3.5 py-2 text-sm rounded-premium-sm bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border focus:border-brand-primary focus:outline-none text-brand-textPrimary dark:text-dark-textPrimary transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. John Doe" 
                  className="w-full px-3.5 py-2 text-sm rounded-premium-sm bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border focus:border-brand-primary focus:outline-none text-brand-textPrimary dark:text-dark-textPrimary transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full px-3.5 py-2 text-sm rounded-premium-sm bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border focus:border-brand-primary focus:outline-none text-brand-textPrimary dark:text-dark-textPrimary transition-all duration-200"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-brand-textSecondary dark:text-dark-textSecondary"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-1.5">Confirm Password</label>
                <input 
                  type="password" 
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-3.5 py-2 text-sm rounded-premium-sm bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border focus:border-brand-primary focus:outline-none text-brand-textPrimary dark:text-dark-textPrimary transition-all duration-200"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-sm rounded-premium-sm shadow-premium transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Account'}
              </button>
            </form>



            <div className="text-center mt-3 pt-2 border-t border-brand-border dark:border-dark-border">
              <button 
                type="button"
                onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                className="text-xs font-semibold text-brand-primary dark:text-brand-accent hover:underline"
              >
                Already have an account? Sign In
              </button>
            </div>
          </div>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-brand-textSecondary dark:text-dark-textSecondary">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hostelwise.ai" 
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-premium-sm bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border focus:border-brand-primary focus:outline-none text-brand-textPrimary dark:text-dark-textPrimary transition-all duration-200"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-sm rounded-premium-sm shadow-premium transition-all duration-200"
            >
              {loading ? 'Sending Code...' : 'Send Reset Link'}
            </button>

            <button 
              type="button" 
              onClick={() => { setView('login'); setError(''); setSuccess(''); }}
              className="w-full text-xs font-semibold text-brand-textSecondary dark:text-dark-textSecondary hover:text-brand-primary dark:hover:text-white mt-1 text-center"
            >
              Return to login
            </button>
          </form>
        )}

        {/* RESET PASSWORD VIEW */}
        {view === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-2">Reset Code Token</label>
              <input 
                type="text" 
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Enter reset token code" 
                className="w-full px-4 py-2.5 text-sm rounded-premium-sm bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border focus:border-brand-primary focus:outline-none text-brand-textPrimary dark:text-dark-textPrimary transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-textPrimary dark:text-dark-textPrimary uppercase tracking-wider mb-2">New Secure Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-2.5 text-sm rounded-premium-sm bg-brand-bg dark:bg-slate-900 border border-brand-border dark:border-dark-border focus:border-brand-primary focus:outline-none text-brand-textPrimary dark:text-dark-textPrimary transition-all duration-200"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-sm rounded-premium-sm shadow-premium transition-all duration-200"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>

            <button 
              type="button" 
              onClick={() => { setView('login'); setError(''); setSuccess(''); }}
              className="w-full text-xs font-semibold text-brand-textSecondary dark:text-dark-textSecondary hover:text-brand-primary dark:hover:text-white mt-1 text-center"
            >
              Cancel and return
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
