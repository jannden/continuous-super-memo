export type AlgorithmStats = {
  interval: number;
  repetition: number;
  efactor: number;
};

export type Flashcard = {
  id: number;
  question: string;
  answer: string;
} & AlgorithmStats;

export function continuousLearning(
  item: Flashcard,
  grade: number,
  position: number
): AlgorithmStats {
  let nextInterval: number;
  let nextRepetition: number;
  let nextEfactor: number;

  if (grade <= 1) {
    if (item.repetition === 0) {
      nextInterval = position + 2;
      nextRepetition = 1;
    } else if (item.repetition === 1) {
      nextInterval = position + 6;
      nextRepetition = 2;
    } else {
      nextInterval = position + Math.round(item.interval * item.efactor);
      nextRepetition = item.repetition + 1;
    }
  } else {
    nextInterval = position + 2;
    nextRepetition = 0;
  }

  nextEfactor =
    item.efactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));

  if (nextEfactor < 1.3) nextEfactor = 1.3;

  return {
    interval: nextInterval,
    repetition: nextRepetition,
    efactor: nextEfactor
  };
}
