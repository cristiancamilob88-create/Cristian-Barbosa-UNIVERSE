/**
 * Blog posts — /blog and /blog/<slug>. Written from Cristian's own
 * account (2026-10-03); every fact traces back to what he told us.
 * Stored as typed data, not a CMS: a new post is a new object here
 * (same "plain array until it hurts" rule as src/config/pastShows.ts).
 */

export interface BlogSection {
  heading?: string;
  paragraphs: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  /** Meta description and card summary (~150 chars). */
  description: string;
  /** ISO date the post was published on the site. */
  publishedAt: string;
  category: "Historia" | "Shows" | "Música";
  cover: { src: string; alt: string; width: number; height: number };
  sections: BlogSection[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "de-flaco-a-campeon-nacional",
    title: "De flaco y con burlas a cuatro veces campeón nacional de calistenia",
    description:
      "Cristian Barbosa empezó a entrenar a los 11 años en Fusagasugá porque lo molestaban por ser flaco. Así nació el camino que lo llevó a cuatro títulos nacionales.",
    publishedAt: "2026-10-03",
    category: "Historia",
    cover: {
      src: "/brand/cristian-mountain-flex.jpg",
      alt: "Cristian Barbosa mostrando sus brazos en la montaña",
      width: 3024,
      height: 4032,
    },
    sections: [
      {
        paragraphs: [
          "Cristian Barbosa creció entre Bogotá y Fusagasugá, en Cundinamarca. Jugaba fútbol y era muy delgado, tanto que en el colegio lo molestaban por su físico. A los 11 años vio algo que le cambió la cabeza: el cambio físico de su primo Michael, que llevaba un tiempo entrenando calistenia en Fusagasugá.",
        ],
      },
      {
        heading: "El primer día",
        paragraphs: [
          "Un día se unió al entrenamiento. Era una rutina full body: un trote de 5 kilómetros y, en cada parada, un ejercicio para un músculo distinto. Mientras tanto veía a los compañeros de Michael hacer movimientos y habilidades que parecían imposibles.",
          "Terminó muerto, agotado. Pero salió con una certeza: le encantaba esa forma de entrenar, precisamente porque le exigía todo. Ahí empezó su camino.",
        ],
      },
      {
        heading: "Competir, viajar, conocer",
        paragraphs: [
          "Con los años vinieron las competencias, los viajes entre Bogotá y Fusagasugá para entrenar en las dos ciudades y una comunidad entera de atletas y espectadores. También empezó a tocar puertas: entidades deportivas del Gobierno y empresas que pudieran apoyarlo.",
          "No siempre había plata para viajar. Cristian todavía recuerda a José, dueño de una liga de gimnasia y porrismo en Fusagasugá, que le ayudó con el dinero para su primer viaje a Medellín. Y a Edgar Villamizar, organizador de una competencia en Bucaramanga, que lo invitó, le cubrió los viáticos y habló con sus papás para que lo dejaran ir. En esa competencia, organizada con el INDERBU, quedó subcampeón nacional por primera vez.",
        ],
      },
      {
        heading: "Cuatro veces campeón",
        paragraphs: [
          "Después llegaron otro subcampeonato nacional en Cartago, Valle del Cauca, y cuatro títulos de campeón nacional: dos en Rionegro (uno organizado por el club Exforzarce y otro por Team Dysfunction), uno en Envigado en 2022 y el cuarto en Expofitness 2025, en Plaza Mayor Medellín, donde además se convirtió en embajador de la feria fitness más grande de Latinoamérica.",
          "Hoy, con 22 años y más de una década de entrenamiento, Cristian sabe que todavía puede crecer como atleta. Pero su lugar lo encontró en el entretenimiento: en los escenarios, con música y con su cuerpo como forma de expresión.",
        ],
      },
    ],
  },
  {
    slug: "asi-es-un-show-de-cristian-barbosa",
    title: "Así es un show de Cristian Barbosa por dentro",
    description:
      "Luces apagadas, aceite, fuego, paradas de manos y una barra junto al globo de la muerte: 15 minutos de un show de calistenia en los coliseos de Antioquia.",
    publishedAt: "2026-10-03",
    category: "Shows",
    cover: {
      src: "/brand/cristian-jose-globo-muerte.jpg",
      alt: "Cristian Barbosa junto al globo de la muerte en Támesis",
      width: 1000,
      height: 1333,
    },
    sections: [
      {
        paragraphs: [
          "Desde junio de 2024 Cristian Barbosa hace parte del Circo Santiago de Chile, que lo conoció por sus redes sociales. Con el circo se ha presentado en más de 20 municipios del Suroeste, el Nordeste, el Norte y el Occidente de Antioquia, además de El Carmen de Atrato, en Chocó. Y por su cuenta ha llevado su show a colegios y alcaldías de Medellín, Envigado, San Rafael, Bogotá y Fusagasugá. No es una carpa: las funciones son en el coliseo cubierto de cada municipio, cuatro noches seguidas, de viernes a lunes, con dos formatos de espectáculo: La Casa del Terror y Espectáculo Extremo.",
        ],
      },
      {
        heading: "Antes de que se prendan las luces",
        paragraphs: [
          "Todo empieza a oscuras. El presentador toma el micrófono, apaga las luces y empieza a hablar de él: cuatro veces campeón nacional de calistenia, más de diez años de trayectoria, colaboraciones con creadores como Westcol y Yeferson Cossio. Cristian ya está en el escenario, pero el público todavía no lo ve.",
          "\"Él es Cristian Barbosa, y vamos a recibirlo con un fuerte aplauso.\" Se prenden las luces.",
        ],
      },
      {
        heading: "Los 15 minutos",
        paragraphs: [
          "Sale con pantaloneta (blanca, negra o azul, según la noche) y el cuerpo cubierto de aceite para que brille bajo las luces. Arranca con una coreografía de expresión corporal al ritmo de house melódico, que se convierte en un calentamiento cada vez más exigente.",
          "Después vienen las paradas de manos, de las más básicas a las más difíciles, y la plancha completa (full planche), también sobre los dedos y los nudillos. Algunas noches escupe fuego y se pasa la llama por el cuerpo. Luego, paradas de manos en altura y en paralelas.",
          "La segunda parte es en una barra instalada junto al globo de la muerte: dinámicos en los que literalmente vuela y estáticos que dejan al público en silencio. Cierra con un mortal y pide el aplauso.",
          "Para el final invita al escenario a una persona del público, que se acuesta mientras él hace paradas de manos y flexiones invertidas sobre ella, cara a cara. El público suele pedir más.",
        ],
      },
      {
        heading: "El mensaje",
        paragraphs: [
          "Muchas noches el presentador lo vuelve a llamar al centro para que cuente un poco de su historia y deje un mensaje: que todo esto es fruto del esfuerzo, y que vive de crear contenido, así que la mejor forma de apoyarlo es seguirlo en redes. Después de la función se toma fotos con la gente y comparte un código QR que lleva a este sitio.",
          "Para Cristian, el circo es su universidad: un escenario real cada fin de semana, en pueblos donde muchas veces es la primera vez que la gente ve calistenia en vivo.",
        ],
      },
    ],
  },
  {
    slug: "el-diamante-cancion",
    title: "\"El Diamante\": la canción que empezó a escribirse hace diez años",
    description:
      "El 15 de octubre de 2026 Cristian Barbosa lanza \"El Diamante\", un rap grabado en Caldas, Antioquia. La música lo acompaña desde los 13 años.",
    publishedAt: "2026-10-03",
    category: "Música",
    cover: {
      src: "/brand/cristian-brand-art-01.png",
      alt: "Arte de marca de Cristian Barbosa",
      width: 1024,
      height: 1024,
    },
    sections: [
      {
        paragraphs: [
          "La música llegó a la vida de Cristian Barbosa casi al mismo tiempo que la calistenia. A los 13 o 14 años, el patrocinador de su equipo, Team Dysfunction, empezó a llevarlo a estudios de grabación. Buscaban compositores, intentaban canciones. Varias veces se intentó construir algo, pero no hubo conexión con el productor.",
        ],
      },
      {
        heading: "Grabando en el celular",
        paragraphs: [
          "No se detuvo. En Fusagasugá y Bogotá siguió grabándose en el celular, haciendo rap, tomando clases de técnica vocal por internet. En la familia la música estaba en todas partes: con sus primos improvisaba en las mañanas y aprendió a usar FL Studio.",
        ],
      },
      {
        heading: "El Diamante",
        paragraphs: [
          "Diez años después llega \"El Diamante\", un rap que sale el 15 de octubre de 2026. La idea nació escrita a mano: Cristian le pasó esa historia a su compositora y juntos la convirtieron en canción. La grabaron en un estudio en la vereda La Miel, en Caldas, Antioquia, que funciona dentro de un refugio de perros, con el productor Cristian Alvia.",
          "Mientras tanto, algo de su música ya está en su TikTok y en los Shorts de su canal de YouTube.",
        ],
      },
      {
        heading: "Hacia dónde va",
        paragraphs: [
          "La meta es fusionar la música con su show de calistenia y expresión corporal: canciones que suenen en todo el mundo y un espectáculo que llegue a festivales como Estéreo Picnic o Cordillera. Y, algún día, firmar con una disquera grande que le ponga gasolina a ese motor.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export const blogIndexPath = "/blog";

export function blogPostPath(slug: string): string {
  return `${blogIndexPath}/${slug}`;
}
