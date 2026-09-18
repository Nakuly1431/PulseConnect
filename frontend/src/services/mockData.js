// Empty mock/dummy data collections
// All operations now draw strictly from live server data and real registered donors.

export const MOCK_DONORS = [];

export const MOCK_EMERGENCIES = [];

export const MOCK_STATS = {
  total_donors: 0,
  active_ready_donors: 0,
  active_emergencies: 0,
  total_lives_saved: 0,
  avg_response_time_minutes: 0,
  golden_hour_success_rate: "0%"
};

export const MOCK_TRACKER_DATA = {
  summary: {
    total: 0,
    accepted: 0,
    pending: 0,
    fulfilled: 0
  },
  requests: []
};
