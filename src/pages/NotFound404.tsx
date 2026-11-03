import React from 'react';
import { Sparkles, Compass } from 'lucide-react';
import { invitationConfig } from '../config/invitationConfig';

export const NotFound404: React.FC = () => {
  return (
    <div className="notfound-screen">
      <div className="notfound-stars-bg" aria-hidden="true" />
      <div className="notfound-card">
        <div className="notfound-badge">
          <Sparkles size={14} />
          <span>Coordenada Estelar 404</span>
        </div>

        <div className="notfound-icon-circle">
          <Compass size={38} />
        </div>

        <h1 className="notfound-title">Estrella no encontrada</h1>
        <p className="notfound-subtitle">{invitationConfig.projectTitle}</p>

        <p className="notfound-description">
          Cada invitación para acompañar a{' '}
          <strong>{invitationConfig.protagonistName}</strong> es única y
          personal. Para iniciar el viaje por este pequeño universo, por favor
          ingresa desde el <strong>enlace personalizado</strong> que recibiste
          en tu mensaje de WhatsApp.
        </p>

        <blockquote className="notfound-quote">
          “Lo esencial es invisible a los ojos...”
        </blockquote>
      </div>
    </div>
  );
};
