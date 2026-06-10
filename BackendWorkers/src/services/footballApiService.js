import { buildMockMatches } from './mockMatches.js';

// Adapter around football-data.org. Falls back to bundled mock fixtures when no
// API key is configured, so the Worker always returns data.
const STATUS_MAP = {
  SCHEDULED: 'SCHEDULED', TIMED: 'TIMED', IN_PLAY: 'IN_PLAY', PAUSED: 'PAUSED',
  FINISHED: 'FINISHED', SUSPENDED: 'POSTPONED', POSTPONED: 'POSTPONED',
  CANCELLED: 'CANCELLED', AWARDED: 'FINISHED',
};

function codeFromTeam(team) {
  return (team?.tla || team?.name || '').slice(0, 2).toLowerCase();
}

function normalize(apiMatch, competition) {
  return {
    external_id: String(apiMatch.id),
    competition: apiMatch.competition?.code || competition,
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
  usingMock(config) {
    return !config.football.apiKey;
  },

  async fetchMatches(config) {
    if (this.usingMock(config)) return buildMockMatches();

    const { base, competition, apiKey } = config.football;
    const url = `${base}/competitions/${competition}/matches`;
    try {
      const res = await fetch(url, { headers: { 'X-Auth-Token': apiKey } });
      if (!res.ok) throw new Error(`Football API ${res.status}`);
      const data = await res.json();
      return (data.matches || []).map((m) => normalize(m, competition));
    } catch (err) {
      console.error('Football API failed, using mock:', err.message);
      return buildMockMatches();
    }
  },
};
