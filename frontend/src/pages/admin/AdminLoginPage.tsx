import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      
      // Check if user is admin/superuser after login
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isSuperAdmin = user?.is_superuser === true;
      const hasAdminRole = user?.roles?.includes('ADMIN');
      
      if (isSuperAdmin || hasAdminRole) {
        navigate('/admin/dashboard');
      } else {
        setError('Acceso denegado. Se requieren privilegios de superadministrador.');
        await logout();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error de inicio de sesión. Por favor verifica tus credenciales.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <img 
              src={logoHorizontal} 
              alt="Clínica CAMSA" 
              style={styles.logo}
            />
          </div>
          <h1 style={styles.title}>Panel de Administración</h1>
          <p style={styles.subtitle}>Solo Acceso de Superadministrador</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primaryMuted}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.primaryMuted;
                e.currentTarget.style.boxShadow = 'none';
              }}
              style={styles.input}
              required
              autoComplete="email"
              placeholder="admin@test.com"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primaryMuted}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.primaryMuted;
                e.currentTarget.style.boxShadow = 'none';
              }}
              style={styles.input}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button 
            type="submit" 
            style={styles.button} 
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = colors.primaryDark;
                e.currentTarget.style.borderColor = colors.primaryDark;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${colors.shadowGold}`;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = colors.primary;
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${colors.shadowGold}`;
              }
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        <div style={styles.footer}>
          <a href="/staff/login" style={styles.link}>Inicio de Sesión del Personal</a>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.ivory,
    backgroundImage: `linear-gradient(135deg, ${colors.ivory} 0%, ${colors.cream} 100%)`,
    padding: '20px',
  },
  loginBox: {
    backgroundColor: colors.white,
    padding: '48px 40px',
    borderRadius: '16px',
    boxShadow: colors.shadowGold,
    border: `2px solid ${colors.primaryMuted}`,
    width: '100%',
    maxWidth: '480px',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  header: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  logoContainer: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    maxWidth: '280px',
    maxHeight: '80px',
    objectFit: 'contain',
    width: '100%',
    height: 'auto',
  },
  title: {
    margin: 0,
    marginBottom: '8px',
    color: colors.textPrimary,
    fontSize: '32px',
    fontWeight: 'bold',
  },
  subtitle: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: '15px',
    fontWeight: '500',
    marginTop: '4px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: '6px',
  },
  input: {
    padding: '14px 16px',
    border: `2px solid ${colors.primaryMuted}`,
    borderRadius: '10px',
    fontSize: '16px',
    transition: 'all 0.3s',
    backgroundColor: colors.white,
    color: colors.textPrimary,
    outline: 'none',
  },
  button: {
    padding: '16px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: `2px solid ${colors.primary}`,
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'all 0.3s',
    boxShadow: `0 4px 12px ${colors.shadowGold}`,
  },
  error: {
    padding: '14px 16px',
    backgroundColor: colors.cream,
    color: colors.error,
    borderRadius: '10px',
    fontSize: '14px',
    border: `2px solid ${colors.error}`,
    marginTop: '8px',
    fontWeight: '500',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: `1px solid ${colors.primaryMuted}`,
  },
  link: {
    color: colors.primary,
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'color 0.2s',
  },
};

export default AdminLoginPage;
