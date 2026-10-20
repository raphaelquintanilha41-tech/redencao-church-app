// Oração guiada diária: um momento de 4–6 minutos com música e imagem de fundo.
// Estrutura: Bem-vindo → Honre a Deus → Minhas preocupações → Agradeça a Deus →
// Encerramento. O conteúdo roda pelos dias (um roteiro diferente por dia).
// Versículos: Bíblia Livre (a mesma tradução da Bíblia da app).
import { localDateKey } from './dates';
import { supabase } from './supabaseClient';

export type PrayerSection = 'BEM-VINDO' | 'HONRE A DEUS' | 'MINHAS PREOCUPAÇÕES' | 'AGRADEÇA A DEUS' | 'ENCERRAMENTO';

export interface PrayerVerse {
  text: string;
  ref: string;
}

export interface PrayerStep {
  section: PrayerSection;
  /** Frases grandes (aparecem uma a uma). */
  lines?: string[];
  verse?: PrayerVerse;
  question?: string;
  guidance?: string;
  /** Mostra o círculo de respiração. */
  breath?: boolean;
  /** Mostra o botão "Adicionar oração". */
  addPrayer?: boolean;
  /** Duração em segundos antes de avançar sozinho. */
  seconds: number;
}

export type PrayerScene = 'mar' | 'montanhas' | 'estrelas' | 'aurora';

export interface GuidedPrayer {
  date: string;
  scene: PrayerScene;
  steps: PrayerStep[];
  totalSeconds: number;
}

interface DaySet {
  honor: string;
  care: PrayerVerse;
  careQuestion: string;
  thanks: PrayerVerse;
  thanksQuestion: string;
}

const WELCOMES: string[][] = [
  ['Respire fundo, devagar.', 'Solte o peso dos ombros.', 'Deus está aqui — e tem prazer em estar com você.'],
  ['Encontre um lugar tranquilo.', 'Inspire… e expire com calma.', 'Este momento é seu e de Deus.'],
  ['Pare por um instante.', 'Deixe o barulho do dia ficar para trás.', 'O Pai está perto e ouve você.'],
  ['Feche os olhos por alguns segundos.', 'Respire fundo algumas vezes.', 'Você está na presença de Deus.'],
];

const SETS: DaySet[] = [
  {
    honor:
      'Senhor, Tu és santo e digno de todo louvor. Antes de pedir qualquer coisa, quero simplesmente Te adorar. Tu sustentas o universo e, ainda assim, conheces o meu nome. Hoje eu reconheço a Tua grandeza e me coloco diante de Ti com o coração aberto. Em nome de Jesus, amém.',
    care: { text: 'Lançando sobre ele toda a vossa ansiedade; porque ele tem cuidado de vós.', ref: '1 Pedro 5:7' },
    careQuestion: 'O que tem pesado no seu coração?',
    thanks: { text: 'Bendize ao SENHOR, ó minha alma; e não te esqueças de nenhum de seus benefícios.', ref: 'Salmos 103:2' },
    thanksQuestion: 'Que benefícios de Deus você viu esta semana?',
  },
  {
    honor:
      'Pai, Tu és fiel em todas as Tuas promessas. Nunca falhaste comigo, mesmo quando eu falhei contigo. A Tua bondade é maior do que eu consigo entender. Eu Te honro porque és bom, justo e cheio de amor. Recebe a minha adoração neste momento. Em nome de Jesus, amém.',
    care: {
      text: 'Não estejais ansiosos por coisa alguma; mas em tudo, por meio de orações e súplicas com ações de gratidão, sejam os vossos pedidos conhecidos por Deus.',
      ref: 'Filipenses 4:6',
    },
    careQuestion: 'Que pedido você quer apresentar a Deus hoje?',
    thanks: { text: 'Agradecei em tudo, pois essa é a vontade de Deus em Cristo Jesus para vós mesmos.', ref: '1 Tessalonicenses 5:18' },
    thanksQuestion: 'Mesmo no que é difícil, pelo que você pode agradecer?',
  },
  {
    honor:
      'Deus Criador, os céus anunciam a Tua glória e toda a terra está cheia do Teu poder. Tu fizeste tudo com sabedoria e cuidas de cada detalhe. Eu me alegro em pertencer a Ti. Hoje quero viver consciente da Tua presença, do amanhecer ao anoitecer. Em nome de Jesus, amém.',
    care: {
      text: 'Não temas, porque eu estou contigo; não te assombres, porque eu sou teu Deus. Eu te fortaleço, te ajudo, e te sustento com a minha mão direita de justiça.',
      ref: 'Isaías 41:10',
    },
    careQuestion: 'De que você tem tido medo?',
    thanks: { text: 'Este é o dia que o SENHOR fez; jubilemos e nos alegremos nele.', ref: 'Salmos 118:24' },
    thanksQuestion: 'O que há de bom neste dia que Deus lhe deu?',
  },
  {
    honor:
      'Jesus, Tu és o Caminho, a Verdade e a Vida. Tu deste a Tua vida por mim e venceste a morte. Não há nome maior do que o Teu. Eu Te entrego o primeiro lugar no meu coração, nos meus planos e nas minhas decisões de hoje. Em Teu nome eu oro, amém.',
    care: {
      text: 'Vinde a mim todos vós que estais cansados e sobrecarregados, e eu vos farei descansar.',
      ref: 'Mateus 11:28',
    },
    careQuestion: 'Onde você se sente cansado ou sobrecarregado?',
    thanks: {
      text: 'É pelas leais bondades do SENHOR que não somos consumidos, porque suas misericórdias não têm fim. Elas se renovam a cada manhã; grande é tua fidelidade.',
      ref: 'Lamentações 3:22-23',
    },
    thanksQuestion: 'Que misericórdia nova Deus lhe mostrou hoje?',
  },
  {
    honor:
      'Espírito Santo, obrigado porque habitas em mim e me guias em toda a verdade. Tu és o Consolador e o meu ajudador. Eu reconheço que sem Ti nada posso fazer. Enche-me de novo da Tua presença e ensina-me a ouvir a Tua voz. Em nome de Jesus, amém.',
    care: {
      text: 'A paz eu vos deixo, minha paz eu vos dou; não dou como o mundo dá. Não se perturbe o vosso coração, nem tenha medo.',
      ref: 'João 14:27',
    },
    careQuestion: 'O que tem tirado a sua paz?',
    thanks: { text: 'Dai graças ao SENHOR, porque ele é bom; porque seu leal amor dura para sempre.', ref: 'Salmos 107:1' },
    thanksQuestion: 'Como você tem experimentado o amor de Deus?',
  },
  {
    honor:
      'Senhor, Tu és o meu refúgio e a minha fortaleza. Quando tudo à minha volta muda, Tu permaneces o mesmo. Eu Te louvo porque és firme como a rocha e o Teu amor não se abala. Hoje eu escolho confiar em Ti acima de tudo. Em nome de Jesus, amém.',
    care: { text: 'Deus é nosso refúgio e fortaleza, um socorro bem presente na angústia.', ref: 'Salmos 46:1' },
    careQuestion: 'Em que situação você precisa do socorro de Deus?',
    thanks: {
      text: 'Toda boa dádiva e todo dom perfeito vem do alto, e desce do Pai das luzes, em quem não há mudança nem sombra de variação.',
      ref: 'Tiago 1:17',
    },
    thanksQuestion: 'Que presentes de Deus você recebeu?',
  },
  {
    honor:
      'Pai querido, obrigado por me chamares de filho. Tu me amaste primeiro, antes de eu Te conhecer. A Tua graça me alcançou e me deu um novo começo. Eu Te adoro com tudo o que sou e com tudo o que tenho. Em nome de Jesus, amém.',
    care: {
      text: 'Confia no SENHOR com todo o teu coração, e não te apoies no teu próprio entendimento. Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.',
      ref: 'Provérbios 3:5-6',
    },
    careQuestion: 'Que decisão você precisa entregar a Deus?',
    thanks: {
      text: 'Entrai por suas portas com ações de graças, por seus pátios com cântico de louvor; dai graças a ele, e bendizei o seu nome.',
      ref: 'Salmos 100:4',
    },
    thanksQuestion: 'Por quais pessoas você quer agradecer a Deus?',
  },
  {
    honor:
      'Deus Todo-Poderoso, nada é impossível para Ti. Tu abres caminhos onde não há caminho e fazes novas todas as coisas. Eu Te exalto porque reinas sobre todas as circunstâncias da minha vida. Hoje eu descanso no Teu poder e no Teu cuidado. Em nome de Jesus, amém.',
    care: {
      text: 'Entrega tua carga sobre o SENHOR, e ele te sustentará; ele jamais permitirá que o justo venha a cair.',
      ref: 'Salmos 55:22',
    },
    careQuestion: 'Que carga você quer entregar ao Senhor?',
    thanks: { text: 'Louvarei ao SENHOR com todo o meu coração; contarei todas as tuas maravilhas.', ref: 'Salmos 9:1' },
    thanksQuestion: 'Que maravilha de Deus você pode contar hoje?',
  },
  {
    honor:
      'Senhor, a Tua Palavra é lâmpada para os meus pés e luz para o meu caminho. Obrigado porque falas comigo e não me deixas andar às escuras. Eu Te honro como meu Pastor e meu Guia. Conduz-me hoje por veredas de justiça. Em nome de Jesus, amém.',
    care: {
      text: 'Não andeis, pois, ansiosos pelo dia de amanhã, porque o amanhã se preocupará consigo mesmo. Basta a cada dia o seu mal.',
      ref: 'Mateus 6:34',
    },
    careQuestion: 'Que preocupação com o futuro você pode entregar hoje?',
    thanks: {
      text: 'E tudo quanto fizerdes, por palavras ou por obras, fazei tudo no nome do Senhor Jesus, dando por meio dele graças ao Deus e Pai.',
      ref: 'Colossenses 3:17',
    },
    thanksQuestion: 'Pelo que, no seu trabalho e na sua rotina, você agradece?',
  },
  {
    honor:
      'Rei da glória, Tu és digno de honra, poder e louvor para sempre. A Tua santidade me convida a viver de forma nova. Eu me prostro diante de Ti em reverência e gratidão. Que a minha vida hoje seja um culto agradável a Ti. Em nome de Jesus, amém.',
    care: {
      text: 'Tu guardarás em completa paz aquele que tem firme entendimento, pois ele confia em ti.',
      ref: 'Isaías 26:3',
    },
    careQuestion: 'Em que área você precisa voltar a confiar em Deus?',
    thanks: { text: 'Dai graças ao SENHOR, porque ele é bom, porque seu leal amor é para sempre.', ref: 'Salmos 136:1' },
    thanksQuestion: 'Que oração Deus já respondeu na sua vida?',
  },
];

const SCENES: PrayerScene[] = ['mar', 'montanhas', 'aurora', 'estrelas'];

function dayIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/** Tempo de leitura calmo: ~2,3 palavras por segundo + pausa para orar. */
function readSeconds(text: string, pause: number): number {
  const words = text.trim().split(/\s+/).length;
  return Math.round(words / 2.3 + pause);
}

export function guidedPrayerFor(date = localDateKey()): GuidedPrayer {
  const n = dayIndex(date);
  const set = SETS[((n % SETS.length) + SETS.length) % SETS.length];
  const welcome = WELCOMES[((n % WELCOMES.length) + WELCOMES.length) % WELCOMES.length];
  const scene = SCENES[((n % SCENES.length) + SCENES.length) % SCENES.length];

  const steps: PrayerStep[] = [
    { section: 'BEM-VINDO', lines: welcome, breath: true, seconds: 32 },
    { section: 'HONRE A DEUS', lines: [set.honor], seconds: readSeconds(set.honor, 18) },
    { section: 'MINHAS PREOCUPAÇÕES', verse: set.care, seconds: readSeconds(set.care.text, 14) },
    {
      section: 'MINHAS PREOCUPAÇÕES',
      question: set.careQuestion,
      guidance: 'Conte tudo ao Senhor, com as suas palavras. Ele ouve e cuida de você.',
      addPrayer: true,
      seconds: 60,
    },
    { section: 'AGRADEÇA A DEUS', verse: set.thanks, seconds: readSeconds(set.thanks.text, 14) },
    {
      section: 'AGRADEÇA A DEUS',
      question: set.thanksQuestion,
      guidance: 'Agradeça a Ele, lembrando cada bênção pelo nome.',
      seconds: 50,
    },
    {
      section: 'ENCERRAMENTO',
      lines: ['Que este tempo com Deus fortaleça o seu dia.', 'Fique mais um pouco em silêncio e termine quando se sentir pronto.'],
      seconds: 30,
    },
  ];
  return { date, scene, steps, totalSeconds: steps.reduce((s, x) => s + x.seconds, 0) };
}

// ── Roteiros diários escritos para cada data (tabela guided_prayer_scripts) ──

interface ScriptRow {
  prayer_date: string;
  welcome: string[];
  honor: string;
  care_ref: string;
  care_text: string;
  care_question: string;
  care_guidance: string;
  thanks_ref: string;
  thanks_text: string;
  thanks_question: string;
  thanks_guidance: string;
  closing: string | null;
}

/** Tira aspas soltas que ficam quando o versículo é um pedaço de uma fala. */
function cleanVerse(t: string): string {
  const open = (t.match(/“/g) ?? []).length;
  const close = (t.match(/”/g) ?? []).length;
  const s = open !== close ? t.replace(/[“”]/g, '') : t;
  return s.replace(/\s+/g, ' ').trim();
}

function fromRow(r: ScriptRow): GuidedPrayer {
  const scene = guidedPrayerFor(r.prayer_date).scene;
  const steps: PrayerStep[] = [
    { section: 'BEM-VINDO', lines: r.welcome.slice(0, 3), breath: true, seconds: 32 },
    { section: 'HONRE A DEUS', lines: [r.honor], seconds: readSeconds(r.honor, 18) },
    { section: 'MINHAS PREOCUPAÇÕES', verse: { text: cleanVerse(r.care_text), ref: r.care_ref }, seconds: readSeconds(r.care_text, 14) },
    { section: 'MINHAS PREOCUPAÇÕES', question: r.care_question, guidance: r.care_guidance, addPrayer: true, seconds: 60 },
    { section: 'AGRADEÇA A DEUS', verse: { text: cleanVerse(r.thanks_text), ref: r.thanks_ref }, seconds: readSeconds(r.thanks_text, 14) },
    { section: 'AGRADEÇA A DEUS', question: r.thanks_question, guidance: r.thanks_guidance, seconds: 50 },
    {
      section: 'ENCERRAMENTO',
      lines: [r.closing || 'Que este tempo com Deus fortaleça o seu dia.', 'Fique mais um pouco em silêncio e termine quando se sentir pronto.'],
      seconds: 30,
    },
  ];
  return { date: r.prayer_date, scene, steps, totalSeconds: steps.reduce((a, x) => a + x.seconds, 0) };
}

/** Roteiro escrito para a data; se não houver (ou sem rede), usa o roteiro de reserva. */
export async function fetchGuidedPrayer(date = localDateKey()): Promise<GuidedPrayer> {
  try {
    const { data, error } = await supabase.from('guided_prayer_scripts').select('*').eq('prayer_date', date).maybeSingle();
    if (error || !data) return guidedPrayerFor(date);
    return fromRow(data as ScriptRow);
  } catch {
    return guidedPrayerFor(date);
  }
}
