// Foto de fundo do cartão "Palavra do dia".
// Fotos do Unsplash (licença Unsplash: uso livre, sem necessidade de atribuição),
// servidas pelo CDN do Unsplash no tamanho certo para o telemóvel.
// A escolha segue o tema do versículo (cruz, mar, montes, luz, caminho…);
// sem tema reconhecido, roda pelas paisagens conforme o dia.

interface Photo {
  id: string;
  /** Inícios de palavras (ou expressões) do versículo que pedem esta foto; "x=" = palavra exata. */
  tags?: string[];
}

const PHOTOS: Photo[] = [
  // Cruz
  { id: '1528825539566-2bcb5882445c', tags: ['cruz', 'crucificad', 'sangue', 'cordeiro', 'calvário', 'morreu', 'morte de cristo', 'resgat'] },
  { id: '1617610882105-71c5d7447837', tags: ['cruz', 'crucificad', 'sangue', 'cordeiro', 'salva', 'salvação', 'redenção', 'redime', 'remi'] },
  { id: '1533000759938-aa0ba70beceb', tags: ['cruz', 'cristo morreu', 'graça', 'perdo'] },
  { id: '1592818868295-f527dbac420d', tags: ['cruz', 'rocha', 'pedra', 'fundamento'] },
  // Montes e rocha
  { id: '1490682143684-14369e18dce8', tags: ['monte', 'montes', 'montanha', 'rocha', 'fortaleza', 'refúgio', 'força'] },
  { id: '1500534623283-312aade485b7', tags: ['monte', 'montes', 'montanha', 'socorro', 'levanto os olhos'] },
  { id: '1519414442781-fbd745c5b497', tags: ['manhã', 'amanhecer', 'madrugada', 'aurora', 'novo dia', 'misericórdias'] },
  { id: '1604223190546-a43e4c7f29d7', tags: ['monte', 'montes', 'eterno', 'eternidade', 'gerações'] },
  { id: '1573126617899-41f1dffb196c', tags: ['nuvem', 'neblina', 'vapor', 'espera', 'aguard'] },
  // Mar e águas
  { id: '1507525428034-b723cf961d3e', tags: ['mar=', 'mares', 'praia', 'areia', 'ondas'] },
  { id: '1503803548695-c2a7b4a5b875', tags: ['mar=', 'mares', 'tempestade', 'ventos', 'ondas', 'barco'] },
  { id: '1439405326854-014607f694d7', tags: ['águas', 'mar=', 'profund'] },
  { id: '1671610466725-8d903268ea46', tags: ['águas tranquilas', 'descanso', 'descansar', 'repouso', 'paz', 'sossego', 'quiet'] },
  { id: '1631551437792-ae5a0fb41c49', tags: ['paz', 'aquiet', 'silêncio', 'calma'] },
  { id: '1778872782874-22257be2fc9a', tags: ['rio', 'rios', 'ribeiro', 'fonte', 'água viva'] },
  // Céu, luz e glória
  { id: '1514519273132-6a1abd48302c', tags: ['luz', 'ilumin', 'brilh', 'resplandec', 'glória'] },
  { id: '1495756111155-45cb19b8aeee', tags: ['céu', 'céus', 'glória', 'espírito', 'alto=', 'trono'] },
  { id: '1471922694854-ff1b63b20054', tags: ['aves', 'águia', 'asas', 'voar', 'livre', 'liberdade'] },
  { id: '1765823278429-6d5634fa88e0', tags: ['nuvens', 'céu', 'esperança'] },
  { id: '1528353518104-dbd48bee7bc4', tags: ['estrelas', 'noite', 'trevas', 'escuridão'] },
  { id: '1465101162946-4377e57745c3', tags: ['estrelas', 'criou', 'criação', 'obra das tuas mãos', 'firmamento'] },
  // Palavra
  { id: '1509021436665-8f07dbf5bf1d', tags: ['palavra', 'escritura', 'lei=', 'mandamento', 'preceito'] },
  { id: '1504052434569-70ad5836ab65', tags: ['palavra', 'escrito está', 'meditar', 'medita'] },
  { id: '1533000971552-6a962ff0b9f9', tags: ['palavra', 'lâmpada', 'verdade'] },
  // Caminho, campo, árvores, ovelhas
  { id: '1775681150326-89059defca16', tags: ['caminho', 'caminhos', 'veredas', 'passos', 'andar', 'anda'] },
  { id: '1691618384736-c3afc78b112f', tags: ['caminho', 'seguir', 'segue', 'guia', 'dirig'] },
  { id: '1772744874693-c86b6dd87af7', tags: ['árvore', 'raiz', 'raízes', 'fruto', 'ramos', 'videira', 'plantad'] },
  { id: '1743604471020-c01757c39db8', tags: ['ovelhas', 'pastor', 'rebanho', 'pastos'] },
  { id: '1730016731802-8fa14f43eeb3', tags: ['campo', 'semente', 'colheita', 'lavoura', 'trigo'] },
  { id: '1425913397330-cf8af2ff40a1' },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function url(id: string, width: number): string {
  return `https://images.unsplash.com/photo-${id}?w=${width}&q=70&auto=format&fit=crop`;
}

/** URL da foto para o versículo do dia. */
export function versePhotoUrl(text: string | null | undefined, dateKey: string, width = 900): string {
  const t = (text ?? '').toLowerCase();
  const words = t.split(/[^a-zà-öø-ÿ]+/);
  const hit = (tag: string) =>
    tag.includes(' ')
      ? t.includes(tag)
      : tag.endsWith('=')
        ? words.includes(tag.slice(0, -1))
        : words.some((w) => w.startsWith(tag));
  const matches = PHOTOS.filter((p) => p.tags?.some(hit));
  const pool = matches.length ? matches : PHOTOS;
  return url(pool[hash(dateKey + t.slice(0, 40)) % pool.length].id, width);
}
