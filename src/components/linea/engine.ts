/**
 * La línea, simulada.
 *
 * Una línea de cuatro estaciones (la cuarta inspecciona) que empuja piezas
 * de una a otra. Lo que se ve es lo que el VSM del proyecto encontró:
 *
 * - Espera: cada cierto número de piezas la línea para entera para el cambio
 *   de formato. Con procedimiento estándar y la estación en orden (5S) el
 *   cambio dura un 15 % menos, que es el resultado medido en el proyecto.
 * - Movimiento: sin 5S, a veces el operador para a buscar una herramienta.
 * - Defectos: la inspección manda a reproceso una parte de las piezas, que
 *   vuelven a la estación 2 y le cargan trabajo. Con acciones correctivas
 *   sobre la causa, un 20 % menos de reprocesos, también medido.
 *
 * Todo lo demás (tiempos de ciclo, tamaño del lote, llegadas) es de la
 * simulación, no del proyecto, y la página lo dice. Los indicadores se dan
 * como índice con el antes en 100, igual que en el caso.
 *
 * El tiempo va en minutos de simulación. Las posiciones, en fracciones del
 * ancho de la línea (0 … 1), para que el dibujo escale con el lienzo.
 */

export type Levers = {
  /** Mapear el flujo (VSM): solo enseña, no cambia el flujo. */
  vsm: boolean;
  /** Preparación estándar y 5S: −15 % por cambio y sin búsquedas. */
  setup: boolean;
  /** Acciones correctivas: −20 % de piezas a reproceso. */
  rework: boolean;
  /** KPI por turno y capacitación: lo que sostiene lo anterior. */
  control: boolean;
};

export const NONE: Levers = { vsm: false, setup: false, rework: false, control: false };
export const ALL: Levers = { vsm: true, setup: true, rework: true, control: true };

export const P = {
  /** Minutos entre piezas que entran a la línea. */
  arrival: 1.2,
  /** Ciclo de cada estación; la 2 es la más lenta. */
  cycle: [0.95, 1.0, 0.9, 0.8],
  /** Piezas por formato antes de un cambio. */
  batch: 36,
  setupMin: 9,
  /** Resultado del proyecto: −15 % de tiempo de preparación. */
  setupCut: 0.15,
  defect: 0.15,
  /** Resultado del proyecto: −20 % de reprocesos. */
  defectCut: 0.2,
  searchChance: 0.25,
  searchMin: 0.45,
  queueCap: 7,
  /** Velocidad de la banda, en anchos de línea por minuto. */
  belt: 0.32,
  reworkTravel: 1.8,
};

/** Dónde está cada estación, la entrada y el palé. */
export const X = {
  source: 0.02,
  stations: [0.2, 0.4, 0.6, 0.8],
  pallet: 0.955,
  slot: 0.026,
  gap: 0.05,
};

export type Part = {
  id: number;
  x: number;
  /** En el arco de reproceso: 0 … 1. Fuera de él, −1. */
  arc: number;
  born: number;
  inQueue: number;
  bad: boolean;
  reworked: boolean;
};

export type Station = {
  part: Part | null;
  left: number;
  search: number;
  blocked: boolean;
};

export type Stats = {
  good: number;
  reworked: number;
  inspected: number;
  setups: number;
  setupMinutes: number;
};

export class Line {
  levers: Levers;
  t = 0;
  setupLeft = 0;
  setupTotal = 0;
  sinceSetup = 0;
  arrivalIn = 0;
  queues: Part[][] = [[], [], [], []];
  stations: Station[] = P.cycle.map(() => ({ part: null, left: 0, search: 0, blocked: false }));
  travel: Part[] = [];
  arcs: Part[] = [];
  out: Part[] = [];
  stats: Stats = { good: 0, reworked: 0, inspected: 0, setups: 0, setupMinutes: 0 };
  /** Lo que tarda cada pieza buena en la línea y cuánto de eso es espera. */
  lead: { total: number; wait: number }[] = [];
  /** Minuto de salida de cada pieza buena, para medir el ritmo. */
  exits: number[] = [];
  /** Avance de la banda, para dibujarla en marcha. */
  belt = 0;
  private id = 0;
  private seed: number;

  constructor(levers: Levers, seed = 7) {
    this.levers = { ...levers };
    this.seed = seed;
  }

  private rand() {
    // mulberry32: la misma corrida cada vez
    let t = (this.seed = (this.seed + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  get setupTime() {
    return P.setupMin * (this.levers.setup ? 1 - P.setupCut : 1);
  }

  get defectRate() {
    return P.defect * (this.levers.rework ? 1 - P.defectCut : 1);
  }

  /** Posición de la plaza `k` de la cola de la estación `i`. */
  slot(i: number, k: number) {
    return X.stations[i] - X.gap - k * X.slot;
  }

  wip() {
    return (
      this.queues.reduce((s, q) => s + q.length, 0) +
      this.stations.filter((s) => s.part).length +
      this.travel.length +
      this.arcs.length
    );
  }

  step(dt: number) {
    this.t += dt;

    // Cambio de formato: la línea entera está parada
    if (this.setupLeft > 0) {
      this.setupLeft -= dt;
      this.stats.setupMinutes += dt;
      for (const q of this.queues) for (const p of q) p.inQueue += dt;
      return;
    }
    this.belt += dt * P.belt;

    // Entrada: una pieza cada `arrival`, si hay sitio en la primera cola
    this.arrivalIn -= dt;
    if (this.arrivalIn <= 0 && this.queues[0].length < P.queueCap) {
      this.queues[0].push({
        id: this.id++,
        x: X.source,
        arc: -1,
        born: this.t,
        inQueue: 0,
        bad: false,
        reworked: false,
      });
      this.arrivalIn = P.arrival * (0.85 + this.rand() * 0.3);
    }

    // Las piezas avanzan por la banda hasta su plaza. Dentro de la cola
    // corren más: si el paso de una plaza a la siguiente fuera a la velocidad
    // de la banda, cada ciclo de la estación pagaría ese hueco y la línea
    // entera sería más lenta de lo que dicen sus tiempos
    const v = P.belt * dt;
    this.queues.forEach((q, i) =>
      q.forEach((p, k) => {
        const target = this.slot(i, k);
        const near = target - p.x < X.slot * 1.5;
        p.x = p.x < target ? Math.min(target, p.x + (near ? v * 4 : v)) : Math.max(target, p.x - v);
        p.inQueue += dt;
      }),
    );

    // Reproceso: de inspección, por arriba, de vuelta a la estación 2
    for (const p of this.arcs) p.arc += dt / P.reworkTravel;
    for (const p of this.arcs.filter((a) => a.arc >= 1)) {
      p.arc = -1;
      p.x = this.slot(1, this.queues[1].length);
      this.queues[1].push(p);
    }
    this.arcs = this.arcs.filter((a) => a.arc >= 0);

    // Salida hacia el palé
    for (const p of this.travel) p.x = Math.min(X.pallet, p.x + v);
    for (const p of this.travel.filter((a) => a.x >= X.pallet)) {
      this.stats.good++;
      this.exits.push(this.t);
      this.lead.push({ total: this.t - p.born, wait: p.inQueue });
      if (this.lead.length > 60) this.lead.shift();
      this.out.push(p);
      if (this.out.length > 48) this.out.shift();
    }
    this.travel = this.travel.filter((a) => a.x < X.pallet);
    while (this.exits.length && this.exits[0] < this.t - 90) this.exits.shift();

    // Estaciones. Una que termina toma la siguiente en el mismo paso
    this.stations.forEach((s, i) => this.station(s, i, dt));
    for (const [i, s] of this.stations.entries()) if (!s.part) this.station(s, i, 0);
  }

  private station(s: Station, i: number, dt: number) {
    if (s.part) {
      if (s.search > 0) s.search -= dt;
      else s.left -= dt;
      if (s.left > 0 || s.search > 0) return;
      // Termina: a la cola siguiente, al reproceso o al palé
      const p = s.part;
      if (i === 3) {
        this.stats.inspected++;
        if (!p.reworked && this.rand() < this.defectRate) {
          p.bad = true;
          p.reworked = true;
          p.arc = 0;
          this.stats.reworked++;
          this.arcs.push(p);
          s.part = null;
          return;
        }
        p.bad = false;
        this.travel.push(p);
        s.part = null;
        return;
      }
      if (this.queues[i + 1].length >= P.queueCap) {
        s.blocked = true;
        return;
      }
      s.blocked = false;
      this.queues[i + 1].push(p);
      s.part = null;
      if (i === 0 && this.sinceSetup >= P.batch) {
        this.sinceSetup = 0;
        this.setupLeft = this.setupTime;
        this.setupTotal = this.setupTime;
        this.stats.setups++;
      }
      return;
    }
    // Libre: toma la primera de su cola si ya llegó
    const q = this.queues[i];
    const first = q[0];
    if (!first || first.x < this.slot(i, 0) - 0.002) return;
    q.shift();
    first.x = X.stations[i];
    s.part = first;
    s.left = P.cycle[i] * (0.9 + this.rand() * 0.2);
    s.search = !this.levers.setup && this.rand() < P.searchChance ? P.searchMin : 0;
    if (i === 0) this.sinceSetup++;
  }

  /** Piezas buenas por minuto en la última hora y media. */
  rate() {
    const span = Math.min(90, this.t);
    return span > 0 ? this.exits.length / span : 0;
  }

  avgLead() {
    if (!this.lead.length) return { total: 0, wait: 0 };
    const total = this.lead.reduce((s, l) => s + l.total, 0) / this.lead.length;
    const wait = this.lead.reduce((s, l) => s + l.wait, 0) / this.lead.length;
    return { total, wait };
  }
}

export type Steady = { rate: number; wip: number; lead: number; wait: number; setupShare: number };

/**
 * El régimen de cada combinación de mejoras, corrido sin dibujar. Así los
 * índices no bailan con el azar del momento: son los de una corrida larga.
 */
export function steady(levers: Levers): Steady {
  const line = new Line(levers, 11);
  const dt = 0.05;
  for (let t = 0; t < 240; t += dt) line.step(dt);
  const start = line.stats.good;
  const startT = line.t;
  const startSetup = line.stats.setupMinutes;
  let wipSum = 0;
  let n = 0;
  const leads: number[] = [];
  const waits: number[] = [];
  for (let t = 0; t < 2400; t += dt) {
    line.step(dt);
    wipSum += line.wip();
    n++;
    if (line.lead.length) {
      const l = line.lead[line.lead.length - 1];
      leads.push(l.total);
      waits.push(l.wait);
    }
  }
  const span = line.t - startT;
  return {
    rate: (line.stats.good - start) / span,
    wip: wipSum / n,
    lead: leads.reduce((s, x) => s + x, 0) / Math.max(leads.length, 1),
    wait: waits.reduce((s, x) => s + x, 0) / Math.max(waits.length, 1),
    setupShare: (line.stats.setupMinutes - startSetup) / span,
  };
}
