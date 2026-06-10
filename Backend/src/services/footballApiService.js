import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { buildMockMatches } from '../database/mockMatches.js';

// Adapter around the football-data.org API. If no API key is configured we
// transparently return bundled mock fixtures so the app always works.
//
// To swap providers (API-Football, SportMonks, ...) implement the same
// `fetchMatches()` shape and the rest of the app is unchanged.

const STATUS_MAP = {
  SCHEDULED: 'SCHEDULED',
  TIMED: 'TIMED',
  IN_PLAY: 'IN_PLAY',
  PAUSED: 'PAUSED',
  FINISHED: 'FINISHED',
  SUSPENDED: 'POSTPONED',
  POSTPONED: 'POSTPONED',
  CANCELLED: 'CANCELLED',
  AWARDED: 'FINISHED',
};

// Best-effort 2-letter code for flag rendering from a team name.
function codeFromTeam(team) {
  return (team?.tla || team?.name || '').slice(0, 2).toLowerCase();
}

function normalize(apiMatch) {
  return {
    external_id: String(apiMatch.id),
    competition: apiMatch.competition?.code || config.football.competition,
    stage: apiMatch.stage || null,
    home_team: apiMatch.homeTeam?.name || 'TBD',
    away_team: apiMatch.awayTeam?.name || 'TBD',
    home_code: codeFromTeam(apiMatch.homeTeam),
    away_code: codeFromTeam(apiMatch.awayTeam),
    home_crest: apiMatch.homeTeam?.crest || null,
    away_crest: apiMatch.awayTeam?.crest || null,
    kickoff_at: apiMatch.utcDate,
    status: STATUS_MAP[apiMatch.status] || 'SCHEDULED',
    home_score: apiMatch.score?.fullTime?.home ?? null,
    away_score: apiMatch.score?.fullTime?.away ?? null,
  };
}

export const footballApiService = {
  usingMock() {
    return !config.football.apiKey;
  },

  async fetchMatches() {
    if (this.usingMock()) {
      logger.debug('Football API key not set - using mock fixtures.');
      return buildMockMatches();
    }

    const url = `${config.football.base}/competitions/${config.football.competition}/matches`;
    try {
      const res = await fetch(url, {
        headers: { 'X-Auth-Token': config.football.apiKey },
      });
      if (!res.ok) {
        throw new Error(`Football API ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      return (data.matches || []).map(normalize);
    } catch (err) {
      logger.error('Football API fetch failed, falling back to mock:', err.message);
      return buildMockMatches();
    }
  },
};
