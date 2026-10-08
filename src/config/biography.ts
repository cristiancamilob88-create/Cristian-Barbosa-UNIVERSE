/**
 * Cristian's real story — the single source for /about, the blog and
 * the Person structured data. Everything here comes from Cristian's own
 * account (long message, 2026-10-03) or earlier confirmed facts; nothing
 * is embellished. Years are only given where he gave them.
 *
 * Deliberately left out until Cristian decides (he asked us to advise):
 * his father's addiction, family conflict, a cousin's legal history and
 * drug use around him, past relationships, and the details of family
 * money losses. Those involve other people's private lives; see the
 * conversation notes in docs/RUNNING_CHECKLIST.md.
 */

import { circusCountLabel } from "@/config/tourStops";

export const bioFacts = {
  age: 22,
  grewUpIn: "Bogotá y Fusagasugá (Cundinamarca)",
  basedIn: "Envigado, Antioquia",
  startedCalisthenicsAge: 11,
  arrivedMedellin: "julio de 2022",
  joinedCircus: "junio de 2024",
  circusName: "Circo Santiago de Chile",
  municipalitiesCount: circusCountLabel(),
} as const;

export const achievements = {
  titles: [
    { label: "Campeón nacional de calistenia — Rionegro (Club Exforzarce)" },
    { label: "Campeón nacional de calistenia — Rionegro (Team Dysfunction)" },
    { label: "Campeón nacional de calistenia — Envigado, 2022 (Team Dysfunction)" },
    { label: "Campeón nacional de calistenia — Expofitness 2025, Plaza Mayor Medellín" },
  ],
  runnerUp: [
    { label: "Subcampeón nacional — Bucaramanga (organizada por el INDERBU)" },
    { label: "Subcampeón nacional — Cartago, Valle del Cauca" },
  ],
  roles: [
    { label: "Embajador de Expofitness 2025, la feria fitness más grande de Latinoamérica" },
    { label: "Embajador de Club Nativos, club de negocios en Envigado" },
    { label: "Artista del Circo Santiago de Chile desde 2024" },
  ],
} as const;

export interface TimelineEntry {
  when: string;
  title: string;
  detail: string;
}

export const timeline: TimelineEntry[] = [
  {
    when: "Infancia",
    title: "Bogotá y Fusagasugá",
    detail:
      "Crece entre Bogotá y Fusagasugá, en una familia de clase media que siempre tuvo que luchar para salir adelante. Jugaba fútbol.",
  },
  {
    when: "11 años",
    title: "El primer entrenamiento",
    detail:
      "Ve el cambio físico de su primo Michael y decide intentarlo. Era muy delgado y lo molestaban por eso. Su primer día fue una rutina full body con un trote de 5 km y un ejercicio en cada parada: terminó agotado, pero enamorado de entrenar.",
  },
  {
    // Cristian's own account, 2026-10-08.
    when: "12 a 18 años",
    title: "Fusagasugá",
    detail:
      "Vive en Fusagasugá desde los 12 hasta los 18 años, en varias casas: con la familia de su amigo Sebastián Montaño, que también hace calistenia, y con su tía Miriam Pachón, en cuya casa pasa toda la pandemia, de 2020 a 2021. Es la etapa antes de Medellín y del circo.",
  },
  {
    when: "13–14 años",
    title: "Patrocinio y primeros estudios",
    detail:
      "El equipo Team Dysfunction lo patrocina y lo lleva a sus primeros estudios de grabación. La música entra en su vida al mismo tiempo que la calistenia.",
  },
  {
    when: "Competencias",
    title: "Del podio nacional",
    detail:
      "Viaja por el país compitiendo. Su primer gran resultado: subcampeón nacional en Bucaramanga. Luego llegarían otro subcampeonato en Cartago y cuatro títulos de campeón nacional.",
  },
  {
    when: "Primeros shows",
    title: "Colegios y alcaldías",
    detail:
      "En Fusagasugá y en colegios de Bosa El Porvenir, en Bogotá, empieza a hacer presentaciones deportivas en colegios y para alcaldías.",
  },
  {
    when: "Julio de 2022",
    title: "Medellín, frente a más de 80.000 personas",
    detail:
      "La Alcaldía de Medellín lo invita a presentarse en el evento Pride, frente a más de 80.000 personas. Fue la razón para mudarse a Antioquia, sin mucho dinero y sin contactos, y empezar desde cero.",
  },
  {
    when: "2022",
    title: "Campeón nacional en Envigado",
    detail: "Gana el campeonato nacional organizado por Team Dysfunction en Envigado.",
  },
  {
    when: "Junio de 2024",
    title: "El Circo Santiago de Chile",
    detail:
      `El circo lo conoce por sus redes sociales y lo suma a su elenco. Desde entonces se ha presentado en ${circusCountLabel()} municipios del Suroeste, el Nordeste, el Norte y el Occidente de Antioquia, y en El Carmen de Atrato (Chocó), en los coliseos cubiertos de cada pueblo.`,
  },
  {
    when: "2025",
    title: "Expofitness y Telemedellín",
    detail:
      "Gana su cuarto título nacional en Expofitness, en Plaza Mayor Medellín, y se convierte en embajador de la feria. Ese año lo entrevista Telemedellín.",
  },
  {
    when: "2026",
    title: "El Colombiano y El Diamante",
    detail:
      "El Colombiano cuenta su historia. El 15 de octubre lanza \"El Diamante\", su primera canción de rap con equipo profesional.",
  },
];

/**
 * Mission / vision / values — written with Cristian (2026-10-04, he
 * asked us to create them) from his own words: entertain, teach,
 * inspire with his story; music + calistenia + body expression on the
 * biggest stages; a community that grows wherever he performs.
 */
export const purpose = {
  mission:
    "Entretener, inspirar y enseñar a través del movimiento, la música y el espectáculo. Llevar la calistenia a coliseos, colegios, escenarios y pantallas para demostrar que la disciplina transforma —como transformó a un niño flaco de Fusagasugá— y acompañar a quien quiera empezar su propio camino.",
  vision:
    "Ser el artista latinoamericano que une calistenia, música y expresión corporal en un solo espectáculo: llegar a los grandes festivales y escenarios del mundo con canciones propias, firmar con una disquera internacional y construir una comunidad que crezca en cada lugar que visita.",
  values: ["Disciplina", "Superación", "Autenticidad", "Comunidad", "Respeto por el público", "Gratitud"],
} as const;
