import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css';
import logo from '../assets/images/logo/logo.jpeg';
import consul from '../assets/images/consultorio/consul.jpeg';
import consul1 from '../assets/images/consultorio/consul1.jpeg';
import consul2 from '../assets/images/consultorio/consul2.jpeg';

function Home() {
  const [activeTab, setActiveTab] = useState('profesionales');
  const [profesionales, setProfesionales] = useState([]);
  const [cargando, setCargando] = useState(true);

  const especialidades = [
    { titulo: "Psicología Infanto Juvenil", icono: "🧒" },
    { titulo: "Psicopedagogía", icono: "📚" },
    { titulo: "Taller Habilidades Sociales", icono: "👥" },
    { titulo: "Fonoaudiología", icono: "🗣️" },
    { titulo: "Orientación a Familias", icono: "👨‍👩‍👧‍👦" }
  ];

  // Mapeo de colores y datos adicionales para profesionales conocidos
  const profesionalesExtras = {
    "Lic. Jimena A. Cofman": { titulo: "Lic.", cargo: "Directora", color: "#9BA8C9" },
    "Lic. Carolina Orcellet": { titulo: "Lic.", cargo: "", color: "#B5C1D9" },
    "Lic. Julieta Porto": { titulo: "Lic.", cargo: "", color: "#E8B4A8" },
    "Lic. Erica Baade": { titulo: "Lic.", cargo: "", color: "#D4A5C9" }
  };

  const coloresDefecto = ["#9BA8C9", "#B5C1D9", "#E8B4A8", "#D4A5C9", "#A8C9BA", "#C9A8B5"];

  useEffect(() => {
    cargarProfesionales();
  }, []);

  const cargarProfesionales = async () => {
    try {
      const response = await axios.get('/api/profesionales');
      // Enriquecer los datos del profesional con info adicional
      const profesionalesEnriquecidos = response.data.map((prof, index) => {
        // Extraer nombre sin título si ya lo tiene
        const nombreSinTitulo = prof.nombre.replace(/^(Lic\.|Dr\.|Dra\.)\s+/, '');
        const nombreParaBusqueda = prof.nombre;
        
        return {
          ...prof,
          nombreSinTitulo: nombreSinTitulo,
          // Usar el titulo de la API si existe, sino buscar en extras, sino dejar vacío
          titulo: prof.titulo || profesionalesExtras[nombreParaBusqueda]?.titulo || "",
          cargo: profesionalesExtras[nombreParaBusqueda]?.cargo || "",
          color: profesionalesExtras[nombreParaBusqueda]?.color || coloresDefecto[index % coloresDefecto.length]
        };
      });
      setProfesionales(profesionalesEnriquecidos);
    } catch (error) {
      console.error('Error al cargar profesionales:', error);
    } finally {
      setCargando(false);
    }
  };

  const espacioImages = [
    consul,
    consul1,
    consul2
  ];

  return (
    <div className="home-page">
      {/* Hero Section Simplificado */}
      <section className="hero-simple">
        <div className="container">
          <div className="logo-container">
            <img src={logo} alt="Consultorio Integral Psique Logo" className="logo-principal" />
          </div>
          <h1>Consultorio Integral Psique</h1>
          <p className="subtitle">Espacio Terapéutico Integral - Monte Grande</p>
          <p className="hero-descripcion">Un espacio terapéutico con profesionales capacitados y especializados en distintas áreas, con el fin de acompañar cada proceso de forma personalizada.</p>
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
                <h2>Nuestras Especialidades</h2>
                <div className="especialidades-grid">
                  {especialidades.map((esp, index) => (
                    <div key={index} className="especialidad-card">
                      <span className="especialidad-icono">{esp.icono}</span>
                      <p>{esp.titulo}</p>
                    </div>
                  ))}
                </div>
                <h2 style={{marginTop: '50px'}}>Nuestros Profesionales</h2>
                {cargando ? (
                  <p style={{textAlign: 'center', padding: '40px', color: '#666'}}>Cargando profesionales...</p>
                ) : profesionales.length === 0 ? (
                  <p style={{textAlign: 'center', padding: '40px', color: '#666'}}>No hay profesionales disponibles</p>
                ) : (
                  <div className="profesionales-grid">
                    {profesionales.map((prof) => (
                      <div key={prof.id} className="profesional-card">
                        <div 
                          className="profesional-avatar"
                          style={{background: prof.color}}
                        >
                          {prof.nombreSinTitulo.split(' ')[0].charAt(0)}{prof.nombreSinTitulo.split(' ')[1]?.charAt(0)}
                        </div>
                        <h3>{prof.nombreSinTitulo}</h3>
                        <p className="titulo">{prof.titulo}</p>
                        {prof.cargo && <p className="cargo">{prof.cargo}</p>}
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
                )}
              </div>
            )}

            {/* Tab Nuestro Espacio */}
            {activeTab === 'espacio' && (
              <div className="tab-panel">
                <h2>Nuestro Consultorio</h2>
                <p className="espacio-descripcion">
                  Ofrecemos un espacio cálido, profesional y confidencial donde priorizamos tu salud de manera integral. 
                  Trabajamos desde una mirada humana y cercana, combinando profesionalismo y herramientas terapéuticas 
                  adaptadas a tus necesidades.
                </p>
                <div className="espacio-gallery">
                  <div className="gallery-item">
                    <img src={consul} alt="Consultorio Psique" />
                    <p>Espacio de atención</p>
                  </div>
                  <div className="gallery-item">
                    <img src={consul1} alt="Consultorio Psique" />
                    <p>Sala de consulta</p>
                  </div>
                  <div className="gallery-item">
                    <img src={consul2} alt="Consultorio Psique" />
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
