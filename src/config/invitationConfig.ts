export interface PlanetConfig {
  id: string;
  order: number;
  name: string;
  subtitle: string;
  narrativeText: string;
  position: [number, number, number];
  scale: number;
  /** Local offset (in planet space before planet scale, or world offset) where the Little Prince & Fox stand on the planet */
  characterLocalOffset: [number, number, number];
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    paperRim: string;
    glow: string;
  };
  cameraView: {
    /** Desktop / Landscape camera position when visiting this planet */
    position: [number, number, number];
    /** Desktop / Landscape lookAt target */
    target: [number, number, number];
    /** Mobile Portrait camera position (places planet comfortably in upper-center above bottom card) */
    mobilePosition: [number, number, number];
    /** Mobile Portrait lookAt target */
    mobileTarget: [number, number, number];
  };
}

export interface InvitationConfig {
  projectTitle: string;
  protagonistName: string;
  eventTitle: string;
  openingQuote: string;
  closingQuote: string;
  eventDetails: {
    date: string;
    baptismTime: string;
    baptismPlace: string;
    baptismAddress: string;
    baptismMapsUrl: string;
    receptionTime: string;
    receptionPlace: string;
    receptionAddress: string;
    receptionMapsUrl: string;
    rsvpPhone: string;
    rsvpMessage: string;
  };
  universeCamera: {
    initialPosition: [number, number, number];
    initialTarget: [number, number, number];
    mobilePosition: [number, number, number];
    mobileTarget: [number, number, number];
    fov: number;
    mobileFov: number;
  };
  planets: PlanetConfig[];
}

export const invitationConfig: InvitationConfig = {
  projectTitle: 'Un pequeño viaje entre estrellas',
  protagonistName: 'CHRISTOPHER GABRIEL',
  eventTitle: 'Bautizo y primer cumpleaños',
  openingQuote:
    'Hay viajes que comienzan con un pequeño paso... y otros que comienzan con una estrella.',
  closingQuote:
    'Las cosas más importantes se celebran con quienes hacen especial nuestro pequeño universo.',
  eventDetails: {
    date: 'Sábado, 28 de Noviembre de 2026',
    baptismTime: '11:30 AM',
    baptismPlace: 'Parroquia Nuestra Señora de las Estrellas',
    baptismAddress: 'Av. de la Luz 142, Col. Jardines del Cielo',
    baptismMapsUrl: 'https://maps.google.com/?q=Parroquia',
    receptionTime: '1:30 PM',
    receptionPlace: 'Jardín El Pequeño Principito',
    receptionAddress: 'Camino Real a las Estrellas 88, Salón Astral',
    receptionMapsUrl: 'https://maps.google.com/?q=Jardin+Eventos',
    rsvpPhone: '5215512345678',
    rsvpMessage:
      '¡Hola! Con mucha alegría confirmo mi asistencia al Bautizo y Primer Cumpleaños de Christopher Gabriel 🌟',
  },
  universeCamera: {
    initialPosition: [0, 1.6, 21],
    initialTarget: [0, 0.2, 0],
    mobilePosition: [0, 1.2, 26.5],
    mobileTarget: [0, -0.3, 0],
    fov: 42,
    mobileFov: 52,
  },
  planets: [
    {
      id: 'pequeno-planeta',
      order: 1,
      name: 'El Pequeño Planeta',
      subtitle: 'El comienzo de la historia',
      narrativeText:
        'En un pequeño planeta comenzó una historia llena de amor, sueños y descubrimientos.',
      position: [-4.2, -1.5, 5.8],
      scale: 1.38,
      characterLocalOffset: [0.08, 0.96, 0.14],
      palette: {
        primary: '#88b398',
        secondary: '#6b967c',
        accent: '#e86f7c',
        paperRim: '#f6eedc',
        glow: '#ffe6a3',
      },
      cameraView: {
        position: [-4.2, -0.1, 9.9],
        target: [-4.2, -0.55, 5.8],
        mobilePosition: [-4.2, 0.0, 11.1],
        mobileTarget: [-4.2, -0.85, 5.8],
      },
    },
    {
      id: 'planeta-amor',
      order: 2,
      name: 'Planeta del Amor',
      subtitle: 'La familia y los abrazos',
      narrativeText:
        'Cada abrazo y cada sonrisa tejieron un refugio cálido alrededor de sus primeros pasos.',
      position: [-2.2, 2.4, 1.2],
      scale: 1.18,
      characterLocalOffset: [0.06, 0.95, 0.24],
      palette: {
        primary: '#e5989b',
        secondary: '#d17b88',
        accent: '#ffb4a2',
        paperRim: '#fff1e6',
        glow: '#ffd6cc',
      },
      cameraView: {
        position: [-2.2, 3.65, 5.3],
        target: [-2.2, 3.1, 1.2],
        mobilePosition: [-2.2, 3.7, 6.4],
        mobileTarget: [-2.2, 2.8, 1.2],
      },
    },
    {
      id: 'planeta-suenos',
      order: 3,
      name: 'Planeta de los Sueños',
      subtitle: 'El primer año de descubrimientos',
      narrativeText:
        'Doce lunas de curiosidad, risas espontáneas y miradas que descubren la magia en lo pequeño.',
      position: [2.8, -2.1, -1.2],
      scale: 1.22,
      characterLocalOffset: [0.06, 0.95, 0.22],
      palette: {
        primary: '#8fb8de',
        secondary: '#6d98c4',
        accent: '#f7d070',
        paperRim: '#f4f7fc',
        glow: '#cfe2ff',
      },
      cameraView: {
        position: [2.8, -0.8, 3.1],
        target: [2.8, -1.4, -1.2],
        mobilePosition: [2.8, -0.75, 4.2],
        mobileTarget: [2.8, -1.7, -1.2],
      },
    },
    {
      id: 'planeta-fe',
      order: 4,
      name: 'Planeta de la Fe',
      subtitle: 'Una luz que guía su camino',
      narrativeText:
        'Bajo estrellas doradas y una bendición de luz, su corazón recibe la promesa de un camino acompañado.',
      position: [4.3, 1.8, 2.6],
      scale: 1.18,
      characterLocalOffset: [0.08, 0.92, 0.34],
      palette: {
        primary: '#ebd494',
        secondary: '#d4b86a',
        accent: '#fff6d6',
        paperRim: '#fffdf5',
        glow: '#ffea9f',
      },
      cameraView: {
        position: [4.3, 3.0, 6.8],
        target: [4.3, 2.4, 2.6],
        mobilePosition: [4.3, 3.05, 8.0],
        mobileTarget: [4.3, 2.1, 2.6],
      },
    },
    {
      id: 'planeta-destino',
      order: 5,
      name: 'El Mundo de la Celebración',
      subtitle: 'Christopher Gabriel • Bautizo y 1er Cumpleaños',
      narrativeText:
        'Las cosas más importantes se celebran con quienes hacen especial nuestro pequeño universo.',
      position: [0.0, 0.9, -6.2],
      scale: 1.9,
      characterLocalOffset: [0.06, 0.96, 0.32],
      palette: {
        primary: '#f3c677',
        secondary: '#dfa44d',
        accent: '#fff3d1',
        paperRim: '#fff9eb',
        glow: '#ffe28a',
      },
      cameraView: {
        position: [0.0, 2.5, -0.2],
        target: [0.0, 1.7, -6.2],
        mobilePosition: [0.0, 2.6, 1.2],
        mobileTarget: [0.0, 1.3, -6.2],
      },
    },
  ],
};

/**
 * Computes the exact 3D world resting position and scale of the Little Prince & Fox on a given planet
 */
export function getCharacterPlanetTransform(planet: PlanetConfig): {
  position: [number, number, number];
  scale: number;
} {
  return {
    position: [
      planet.position[0] + planet.characterLocalOffset[0] * planet.scale,
      planet.position[1] + planet.characterLocalOffset[1] * planet.scale,
      planet.position[2] + planet.characterLocalOffset[2] * planet.scale,
    ],
    scale: 0.78 * (planet.scale / 1.38),
  };
}
