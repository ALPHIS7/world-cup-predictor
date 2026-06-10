import { config } from '../config/index.js';

// Pure scoring logic - no DB, fully unit-testable.
// outcome of a score line: 'HOME' | 'AWAY' | 'DRAW'
export function outcomeOf(home, away) {
  if (home > away) return 'HOME';
  if (away > home) return 'AWAY';
  return 'DRAW';
}

// Compare a prediction against the actual result.
// Returns { result, coinsDelta, correct, exact }.
export function scorePrediction(prediction, actualHome, actualAway) {
  const { scoring } = config;
  const predictedOutcome = prediction.outcome;
  const actualOutcome = outcomeOf(actualHome, actualAway);

  const exact =
    prediction.predicted_home === actualHome &&
    prediction.predicted_away === actualAway;

  if (exact) {
    return { result: 'CORRECT_EXACT', coinsDelta: scoring.exactScore, correct: true, exact: true };
  }
  if (predictedOutcome === actualOutcome) {
    return { result: 'CORRECT_WINNER', coinsDelta: scoring.correctWinner, correct: true, exact: false };
  }
  return { result: 'WRONG', coinsDelta: scoring.wrong, correct: false, exact: false };
}
