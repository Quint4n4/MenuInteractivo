import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { kioskApi } from '../../api/kiosk';
import { colors } from '../../styles/colors';
import logoHorizontal from '../../assets/logos/logo-horizontal.png';

export const KioskServiceDetail: React.FC = () => {
  const { deviceId, serviceId } = useParams<{ deviceId: string; serviceId: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = async () => {
    try {
      // TODO: Implementar API de servicios cuando esté disponible
      const services = [
        { id: 1, name: 'Llamada de Enfermera', description: 'Solicita asistencia de tu enfermera', icon: '🏥' },
        { id: 2, name: 'Servicio de Limpieza', description: 'Solicita limpieza de habitación', icon: '🧹' },
        { id: 3, name: 'Servicio de Comida', description: 'Solicita servicio de comida', icon: '🍽️' },
        { id: 4, name: 'Servicio Médico', description: 'Solicita atención médica', icon: '⚕️' },
      ];
      const found = services.find(s => s.id === parseInt(serviceId || '0'));
      setService(found || null);
    } catch (error) {
      console.error('Error loading service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    navigate(`/kiosk/${deviceId}/services/${serviceId}/booking`);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;
  }

  if (!service) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Servicio no encontrado</p>
        <button onClick={() => navigate(`/kiosk/${deviceId}/services`)}>
          Volver a Servicios
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.ivory }}>
      <header style={{
        backgroundColor: colors.primary,
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logoHorizontal} alt="CAMSA" style={{ height: '40px' }} />
          <h1 style={{ color: 'white', margin: 0 }}>{service.name}</h1>
        </div>
        <button
          onClick={() => navigate(`/kiosk/${deviceId}/services`)}
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
      </header>
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>
            {service.icon}
          </div>
          <h2>{service.name}</h2>
          <p>{service.description}</p>
          <button
            onClick={handleBooking}
            style={{
              marginTop: '2rem',
              padding: '1rem 2rem',
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            Solicitar Servicio
          </button>
        </div>
      </main>
    </div>
  );
};
