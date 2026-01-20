import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { colors } from '../../styles/colors';
import { useAuth } from '../../auth/AuthContext';

const UsersManagementPage: React.FC = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    username: '',
    password: '',
    is_staff: true,
    is_active: true,
    roles: ['STAFF'],
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    title: string;
    message: string;
  }>({
    show: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers();
      const usersArray = response.results || (Array.isArray(response) ? response : []);
      setUsers(usersArray);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que las contraseñas coincidan (solo al crear nuevo usuario o si se cambió la contraseña)
    if ((!editingUser || formData.password) && formData.password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    // Validar longitud mínima de contraseña
    if ((!editingUser || formData.password) && formData.password.length > 0 && formData.password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    setPasswordError('');
    
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, formData);
        setSuccessModal({
          show: true,
          title: 'Usuario Actualizado',
          message: `El usuario "${formData.full_name}" ha sido actualizado exitosamente.`,
        });
      } else {
        await adminApi.createUser(formData);
        setSuccessModal({
          show: true,
          title: 'Usuario Creado',
          message: `El usuario "${formData.full_name}" ha sido creado exitosamente.`,
        });
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (err: any) {
      console.error('Failed to save user:', err);
      setConfirmModal({
        show: true,
        title: 'Error',
        message: err.response?.data?.error || 'Error al guardar el usuario',
        onConfirm: () => setConfirmModal({ ...confirmModal, show: false }),
        confirmText: 'OK',
        cancelText: undefined,
      });
    }
  };

  const handleDelete = async (userId: number) => {
    const user = users.find(u => u.id === userId);

    setConfirmModal({
      show: true,
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de que deseas eliminar a "${user?.full_name || 'este usuario'}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, show: false });

        try {
          await adminApi.deleteUser(userId);
          setSuccessModal({
            show: true,
            title: 'Usuario Eliminado',
            message: `El usuario "${user?.full_name}" ha sido eliminado exitosamente.`,
          });
          loadUsers();
        } catch (err: any) {
          setConfirmModal({
            show: true,
            title: 'Error',
            message: err.response?.data?.error || 'Error al eliminar el usuario',
            onConfirm: () => setConfirmModal({ ...confirmModal, show: false }),
            confirmText: 'OK',
            cancelText: undefined,
          });
          console.error('Failed to delete user:', err);
        }
      },
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
    });
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      username: user.username,
      password: '',
      is_staff: user.is_staff,
      is_active: user.is_active,
      roles: user.roles || ['STAFF'],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      username: '',
      password: '',
      is_staff: true,
      is_active: true,
      roles: ['STAFF'],
    });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <Link to="/admin/dashboard" style={styles.backLink}>← Volver al Panel</Link>
          <h1>Gestión de Usuarios</h1>
        </div>
        <button onClick={() => logout()} style={styles.logoutButton}>
          Cerrar Sesión
        </button>
      </header>

      <div style={styles.content}>
        <div style={styles.toolbar}>
          <h2>Personal y Enfermeras</h2>
          <button
            onClick={() => {
              resetForm();
              setEditingUser(null);
              setShowModal(true);
            }}
            style={styles.addButton}
          >
            + Agregar Nuevo Usuario
          </button>
        </div>

        {loading ? (
          <div style={styles.loading}>Cargando usuarios...</div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Correo</th>
                  <th style={styles.th}>Nombre Completo</th>
                  <th style={styles.th}>Roles</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={styles.tr}>
                    <td style={styles.td}>{user.id}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>{user.full_name}</td>
                    <td style={styles.td}>
                      {user.roles?.map((role: string) => (
                        <span key={role} style={styles.roleBadge}>{role}</span>
                      ))}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: user.is_active ? '#27ae60' : '#95a5a6'
                      }}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleEdit(user)}
                        style={styles.editButton}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        style={styles.deleteButton}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre Completo</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
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
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Usuario</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
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
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Contraseña {editingUser && '(dejar en blanco para mantener actual)'}
                </label>
                <div style={styles.passwordInputContainer}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({...formData, password: e.target.value});
                      if (passwordError) setPasswordError('');
                    }}
                    style={{...styles.input, ...styles.passwordInput}}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primaryMuted}`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.primaryMuted;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    required={!editingUser}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              {!editingUser && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Confirmar Contraseña</label>
                  <div style={styles.passwordInputContainer}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      style={{...styles.input, ...styles.passwordInput}}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.primary;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primaryMuted}`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.primaryMuted;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      required
                      placeholder="Repite la contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.passwordToggle}
                      title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {passwordError && (
                    <div style={styles.passwordError}>{passwordError}</div>
                  )}
                </div>
              )}
              {editingUser && formData.password && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Confirmar Nueva Contraseña</label>
                  <div style={styles.passwordInputContainer}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      style={{...styles.input, ...styles.passwordInput}}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = colors.primary;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primaryMuted}`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = colors.primaryMuted;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      placeholder="Repite la nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.passwordToggle}
                      title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {passwordError && (
                    <div style={styles.passwordError}>{passwordError}</div>
                  )}
                </div>
              )}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    style={{marginRight: '8px'}}
                  />
                  Activo
                </label>
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelButton}>
                  Cancelar
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div style={styles.confirmModalOverlay} onClick={() => !confirmModal.cancelText && setConfirmModal({ ...confirmModal, show: false })}>
          <div style={styles.confirmModalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.confirmModalTitle}>{confirmModal.title}</h2>
            <p style={styles.confirmModalMessage}>{confirmModal.message}</p>
            <div style={styles.confirmModalButtons}>
              {confirmModal.cancelText && (
                <button
                  style={styles.modalCancelButton}
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                >
                  {confirmModal.cancelText}
                </button>
              )}
              <button
                style={styles.modalConfirmButton}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.show && (
        <div style={styles.confirmModalOverlay} onClick={() => setSuccessModal({ ...successModal, show: false })}>
          <div style={styles.successModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successModalTitle}>{successModal.title}</h2>
            <p style={styles.successModalMessage}>{successModal.message}</p>
            <button
              style={styles.successButton}
              onClick={() => setSuccessModal({ ...successModal, show: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backLink: {
    color: '#3498db',
    textDecoration: 'none',
    fontSize: '14px',
    display: 'block',
    marginBottom: '10px',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  content: {
    padding: '20px',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    borderBottom: '2px solid #ddd',
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
  },
  tr: {
    borderBottom: '1px solid #eee',
  },
  td: {
    padding: '16px',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    marginRight: '5px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '8px',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: colors.white,
    padding: '36px',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: colors.shadowGold,
    border: `2px solid ${colors.primaryMuted}`,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
    padding: '12px 16px',
    border: `2px solid ${colors.primaryMuted}`,
    borderRadius: '8px',
    fontSize: '16px',
    backgroundColor: colors.white,
    color: colors.textPrimary,
    transition: 'all 0.3s',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  passwordInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  passwordInput: {
    paddingRight: '50px',
  },
  passwordToggle: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background 0.2s',
    zIndex: 1,
  },
  passwordError: {
    marginTop: '4px',
    padding: '8px 12px',
    backgroundColor: colors.cream,
    color: colors.error,
    borderRadius: '6px',
    fontSize: '13px',
    border: `1px solid ${colors.error}`,
    fontWeight: '500',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  confirmModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  confirmModalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    maxWidth: '450px',
    width: '90%',
    textAlign: 'center',
  },
  confirmModalTitle: {
    fontSize: '24px',
    color: '#2c3e50',
    marginBottom: '15px',
  },
  confirmModalMessage: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '25px',
    lineHeight: '1.5',
  },
  confirmModalButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  modalCancelButton: {
    padding: '12px 30px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    padding: '12px 30px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  successModalContent: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    maxWidth: '450px',
    width: '90%',
    textAlign: 'center',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#27ae60',
    color: 'white',
    fontSize: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successModalTitle: {
    fontSize: '24px',
    color: '#27ae60',
    marginBottom: '15px',
  },
  successModalMessage: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '25px',
    lineHeight: '1.5',
  },
  successButton: {
    padding: '12px 40px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default UsersManagementPage;
