import React from 'react';
import { invitationConfig } from '../config/invitationConfig';

/**
 * Functional visual fallback if the device/browser does not support WebGL
 */
export const WebGLFallback: React.FC = () => {
  return (
    <div className="webgl-fallback">
      <div className="fallback-card">
        <p className="fallback-subtitle">{invitationConfig.projectTitle}</p>
        <h1>{invitationConfig.protagonistName}</h1>
        <h2>{invitationConfig.eventTitle}</h2>
        <p className="fallback-quote">“{invitationConfig.openingQuote}”</p>
        <hr />
        <p>
          <strong>Fecha:</strong> {invitationConfig.eventDetails.date}
        </p>
        <p>
          <strong>Bautizo:</strong> {invitationConfig.eventDetails.baptismTime} —{' '}
          {invitationConfig.eventDetails.baptismPlace}
        </p>
        <p>
          <strong>Celebración:</strong>{' '}
          {invitationConfig.eventDetails.receptionTime} —{' '}
          {invitationConfig.eventDetails.receptionPlace}
        </p>
      </div>
    </div>
  );
};
