import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { kioskApi } from '../../api/kiosk';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

export const KioskServicesPage: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [deviceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (deviceId) {
        const patientData = await kioskApi.getActivePatient(deviceId);
        setPatientInfo(patientData);
      }

      // TODO: Implementar API de servicios cuando esté disponible
      // Por ahora, servicios de ejemplo
      setServices([
        { id: 1, name: 'Llamada de Enfermera', description: 'Solicita asistencia de tu enfermera', icon: '🏥' },
        { id: 2, name: 'Servicio de Limpieza', description: 'Solicita limpieza de habitación', icon: '🧹' },
        { id: 3, name: 'Servicio de Comida', description: 'Solicita servicio de comida', icon: '🍽️' },
        { id: 4, name: 'Servicio Médico', description: 'Solicita atención médica', icon: '⚕️' },
      ]);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (serviceId: number) => {
    navigate(`/kiosk/${deviceId}/services/${serviceId}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Cargando servicios...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      {/* Header */}
      <header style={{
        backgroundColor: colors.primary,
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logoHorizontal} alt="CAMSA" style={{ height: '40px' }} />
          <h1 style={{ color: 'white', margin: 0 }}>Servicios</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {patientInfo && (
            <div style={{ color: 'white' }}>
              <div>Habitación: {patientInfo.room_code}</div>
            </div>
          )}
          <button
            onClick={() => navigate(`/kiosk/${deviceId}`)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: '1px solid white',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            ← Volver
          </button>
        </div>
      </header>

      {/* Services Grid */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {services.map(service => (
            <div
              key={service.id}
              onClick={() => handleServiceClick(service.id)}
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                {service.icon}
              </div>
              <h2 style={{ color: colors.textPrimary, marginBottom: '0.5rem' }}>
                {service.name}
              </h2>
              <p style={{ color: colors.textSecondary, margin: 0 }}>
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
