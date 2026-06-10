// Bundled fixtures used when no FOOTBALL_API_KEY is set, and by the seed script.
// kickoff_at values are generated relative to "now" at read time so the app
// always has a believable mix of upcoming / live / finished matches.

export function buildMockMatches() {
  const now = Date.now();
  const h = 60 * 60 * 1000;
  const iso = (ms) => new Date(ms).toISOString();

  return [
    {
      external_id: 'mock-1',
      competition: 'WC',
      stage: 'GROUP_STAGE',
      home_team: 'Argentina', away_team: 'Brazil',
      home_code: 'ar', away_code: 'br',
      kickoff_at: iso(now - 3 * h),
      status: 'FINISHED', home_score: 2, away_score: 1,
    },
    {
      external_id: 'mock-2',
      competition: 'WC',
      stage: 'GROUP_STAGE',
      home_team: 'France', away_team: 'Germany',
      home_code: 'fr', away_code: 'de',
      kickoff_at: iso(now - 30 * 60 * 1000),
      status: 'IN_PLAY', home_score: 1, away_score: 1,
    },
    {
      external_id: 'mock-3',
      competition: 'WC',
      stage: 'GROUP_STAGE',
      home_team: 'Spain', away_team: 'Portugal',
      home_code: 'es', away_code: 'pt',
      kickoff_at: iso(now + 2 * h),
      status: 'TIMED', home_score: null, away_score: null,
    },
    {
      external_id: 'mock-4',
      competition: 'WC',
      stage: 'GROUP_STAGE',
      home_team: 'England', away_team: 'Netherlands',
      home_code: 'gb', away_code: 'nl',
      kickoff_at: iso(now + 5 * h),
      status: 'TIMED', home_score: null, away_score: null,
    },
    {
      external_id: 'mock-5',
      competition: 'WC',
      stage: 'GROUP_STAGE',
      home_team: 'Croatia', away_team: 'Morocco',
      home_code: 'hr', away_code: 'ma',
      kickoff_at: iso(now + 26 * h),
      status: 'SCHEDULED', home_score: null, away_score: null,
    },
    {
      external_id: 'mock-6',
      competition: 'WC',
      stage: 'GROUP_STAGE',
      home_team: 'Japan', away_team: 'Mexico',
      home_code: 'jp', away_code: 'mx',
      kickoff_at: iso(now + 28 * h),
      status: 'SCHEDULED', home_score: null, away_score: null,
    },
  ];
}
