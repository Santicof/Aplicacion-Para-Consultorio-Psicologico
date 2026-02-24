import { Link } from 'react-router-dom';
import { useState } from 'react';
import './Home.css';

function Home() {
  const [activeTab, setActiveTab] = useState('profesionales');

  const profesionales = [
    {
      id: 1,
      nombre: "Jimena A. Cofman",
      titulo: "Lic.",
      especialidad: "Psicóloga Clínica Infanto-Juvenil",
      descripcion: "Atención especializada en niños y adolescentes.",
      color: "#9BA8C9"
    },
    {
      id: 2,
      nombre: "Carolina Orcellet",
      titulo: "Lic.",
      especialidad: "Psicóloga Clínica Infanto-Juvenil",
      descripcion: "Especialista en desarrollo emocional y social.",
      color: "#B5C1D9"
    },
    {
      id: 3,
      nombre: "Julieta Porto",
      titulo: "Lic.",
      especialidad: "Psicopedagoga Niños y Adolescentes",
      descripcion: "Evaluación y tratamiento de dificultades de aprendizaje.",
      color: "#E8B4A8"
    },
    {
      id: 4,
      nombre: "Erica Baade",
      titulo: "Lic.",
      especialidad: "Psicóloga Clínica Adultos",
      descripcion: "Atención psicológica para adultos.",
      color: "#F4A261"
    }
  ];

  const espacioImages = [
    '/src/assets/consultorio/consul.jpeg',
    '/src/assets/consultorio/consul1.jpeg',
    '/src/assets/consultorio/consul2.jpeg'
  ];

  return (
    <div className="home-page">
      {/* Hero Section Simplificado */}
      <section className="hero-simple">
        <div className="container">
          <h1>Consultorio Integral Psique</h1>
          <p className="subtitle">Atención psicológica profesional en Monte Grande</p>
          <Link to="/agendar" className="btn-agendar-principal">
            Agendar Turno
          </Link>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="tabs-section">
        <div className="container">
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'profesionales' ? 'active' : ''}`}
              onClick={() => setActiveTab('profesionales')}
            >
              Profesionales
            </button>
            <button 
              className={`tab-btn ${activeTab === 'espacio' ? 'active' : ''}`}
              onClick={() => setActiveTab('espacio')}
            >
              Nuestro Espacio
            </button>
            <button 
              className={`tab-btn ${activeTab === 'ubicacion' ? 'active' : ''}`}
              onClick={() => setActiveTab('ubicacion')}
            >
              Cómo Llegar
            </button>
          </div>

          <div className="tabs-content">
            {/* Tab Profesionales */}
            {activeTab === 'profesionales' && (
              <div className="tab-panel">
                <div className="profesionales-grid">
                  {profesionales.map((prof) => (
                    <div key={prof.id} className="profesional-card">
                      <div 
                        className="profesional-avatar"
                        style={{background: prof.color}}
                      >
                        {prof.nombre.split(' ')[0].charAt(0)}{prof.nombre.split(' ')[1]?.charAt(0)}
                      </div>
                      <h3>{prof.nombre}</h3>
                      <p className="titulo">{prof.titulo}</p>
                      <p className="especialidad">{prof.especialidad}</p>
                      <p className="descripcion">{prof.descripcion}</p>
                      <Link 
                        to="/agendar" 
                        state={{ profesionalId: prof.id }}
                        className="btn-agendar-small"
                      >
                        Agendar
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Nuestro Espacio */}
            {activeTab === 'espacio' && (
              <div className="tab-panel">
                <h2>Nuestro Consultorio</h2>
                <p className="espacio-descripcion">
                  Un espacio cálido y profesional diseñado para tu bienestar. 
                  Contamos con salas de espera confortables y consultorios equipados 
                  para brindarte la mejor atención.
                </p>
                <div className="espacio-gallery">
                  <div className="gallery-item">
                    <img src="/src/assets/consultorio/consul.jpeg" alt="Consultorio Psique" />
                    <p>Espacio de atención</p>
                  </div>
                  <div className="gallery-item">
                    <img src="/src/assets/consultorio/consul1.jpeg" alt="Consultorio Psique" />
                    <p>Sala de consulta</p>
                  </div>
                  <div className="gallery-item">
                    <img src="/src/assets/consultorio/consul2.jpeg" alt="Consultorio Psique" />
                    <p>Nuestro consultorio</p>
                  </div>
                </div>
                <div style={{textAlign: 'center', marginTop: '40px'}}>
                  <a 
                    href="https://www.instagram.com/consultoriointegral_psique/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-instagram"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Seguinos en Instagram
                  </a>
                </div>
              </div>
            )}

            {/* Tab Cómo Llegar */}
            {activeTab === 'ubicacion' && (
              <div className="tab-panel">
                <h2>Cómo Llegar</h2>
                <div className="ubicacion-info">
                  <div className="direccion">
                    <h3>📍 Dirección</h3>
                    <p><strong>Rotta 219</strong></p>
                    <p>Monte Grande, Buenos Aires</p>
                    <p>Argentina</p>
                    <a 
                      href="https://www.google.com/maps/search/?api=1&query=Rotta+219,+Monte+Grande,+Buenos+Aires" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-maps"
                    >
                      Abrir en Google Maps
                    </a>
                  </div>
                  <div className="mapa">
                    <iframe 
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3275.123456789!2d-58.4678!3d-34.8123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDQ4JzQ0LjMiUyA1OMKwMjgnMDQuMSJX!5e0!3m2!1ses!2sar!4v1234567890"
                      width="100%"
                      height="400"
                      style={{border: 0, borderRadius: '12px'}}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ubicación Consultorio Psique"
                    ></iframe>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
