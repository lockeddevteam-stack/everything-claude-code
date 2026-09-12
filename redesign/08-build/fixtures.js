/* GENERATED — do not edit.
   Written by tests/fixtures/gen-fixtures.mjs from tests/fixtures/seed-data.json.
   Regenerate with:  node redesign/tests/fixtures/gen-fixtures.mjs

   One copy of the training history, the records and the weight log, read by
   every screen that shows them. Screens used to hand-type their own, and two
   of them disagreed about what the same month contained.

   Volume and set counts here are recomputed from each session's own set rows
   rather than copied from its stored summary. */
(function (g) {
  'use strict';
  g.LKFixtures = {
    today: '2026-09-09',
    history: [
          {
                "id": "w_1788804300000",
                "kind": "lift",
                "name": "PPL - Legs",
                "date": "2026-09-07",
                "min": 52,
                "sets": 16,
                "kg": 14363,
                "exercises": [
                      {
                            "id": 701,
                            "name": "Barbell Squat",
                            "muscle": "Quads",
                            "sets": [
                                  {
                                        "kg": 45,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 87.5,
                                        "reps": 8,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 87.5,
                                        "reps": 7,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 87.5,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 82.5,
                                        "reps": 5,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 801,
                            "name": "Romanian Deadlift",
                            "muscle": "Hamstrings",
                            "sets": [
                                  {
                                        "kg": 77.5,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 77.5,
                                        "reps": 8,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 77.5,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 703,
                            "name": "Leg Press",
                            "muscle": "Quads",
                            "sets": [
                                  {
                                        "kg": 165,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 165,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 165,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 802,
                            "name": "Lying Leg Curl",
                            "muscle": "Hamstrings",
                            "sets": [
                                  {
                                        "kg": 52.5,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 52.5,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 52.5,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 1101,
                            "name": "Standing Calf Raise",
                            "muscle": "Calves",
                            "sets": [
                                  {
                                        "kg": 72.5,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 72.5,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 72.5,
                                        "reps": 13,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "Squats felt fast. Left knee fine.",
                "reflection": {
                      "energy": 4,
                      "focus": 4,
                      "pump": 3,
                      "difficulty": 3,
                      "enjoyment": 4
                }
          },
          {
                "id": "w_1788678900000",
                "kind": "cardio",
                "name": "Treadmill run",
                "date": "2026-09-06",
                "min": 30,
                "km": 5.2,
                "cal": 340
          },
          {
                "id": "w_1788631500000",
                "kind": "lift",
                "name": "PPL - Pull",
                "date": "2026-09-05",
                "min": 51,
                "sets": 16,
                "kg": 7158,
                "exercises": [
                      {
                            "id": 221,
                            "name": "Barbell Deadlift",
                            "muscle": "Lower Back",
                            "sets": [
                                  {
                                        "kg": 57.5,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 115,
                                        "reps": 5,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 115,
                                        "reps": 5,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 115,
                                        "reps": 4,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 105,
                                        "reps": 4,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 202,
                            "name": "Lat Pulldown",
                            "muscle": "Lats",
                            "sets": [
                                  {
                                        "kg": 62.5,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 62.5,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 62.5,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 213,
                            "name": "Seated Cable Row",
                            "muscle": "Mid Back",
                            "sets": [
                                  {
                                        "kg": 57.5,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 57.5,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 57.5,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 321,
                            "name": "Face Pull",
                            "muscle": "Rear Delt",
                            "sets": [
                                  {
                                        "kg": 20,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 20,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 20,
                                        "reps": 13,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 503,
                            "name": "Barbell Curl",
                            "muscle": "Long Head",
                            "sets": [
                                  {
                                        "kg": 30,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 30,
                                        "reps": 8,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 30,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": null
          },
          {
                "id": "w_1788458700000",
                "kind": "lift",
                "name": "PPL - Push",
                "date": "2026-09-03",
                "min": 55,
                "sets": 16,
                "kg": 4266,
                "exercises": [
                      {
                            "id": 111,
                            "name": "Barbell Bench Press",
                            "muscle": "Mid Chest",
                            "sets": [
                                  {
                                        "kg": 37.5,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 72.5,
                                        "reps": 8,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 72.5,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 72.5,
                                        "reps": 5,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 67.5,
                                        "reps": 5,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 302,
                            "name": "DB Shoulder Press",
                            "muscle": "Front Delt",
                            "sets": [
                                  {
                                        "kg": 25,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 25,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 25,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 103,
                            "name": "Incline Cable Fly",
                            "muscle": "Upper Chest",
                            "sets": [
                                  {
                                        "kg": 15,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 15,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 15,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 311,
                            "name": "Lateral Raise",
                            "muscle": "Side Delt",
                            "sets": [
                                  {
                                        "kg": 10.5,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 10.5,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 10.5,
                                        "reps": 12,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 411,
                            "name": "Tricep Pushdown",
                            "muscle": "Lateral Head",
                            "sets": [
                                  {
                                        "kg": 30,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 30,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 30,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": null
          },
          {
                "id": "w_1788199500000",
                "kind": "lift",
                "name": "PPL - Legs",
                "date": "2026-08-31",
                "min": 55,
                "sets": 16,
                "kg": 13700,
                "exercises": [
                      {
                            "id": 701,
                            "name": "Barbell Squat",
                            "muscle": "Quads",
                            "sets": [
                                  {
                                        "kg": 42.5,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 85,
                                        "reps": 7,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 85,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 85,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 80,
                                        "reps": 5,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 801,
                            "name": "Romanian Deadlift",
                            "muscle": "Hamstrings",
                            "sets": [
                                  {
                                        "kg": 75,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 75,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 75,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 703,
                            "name": "Leg Press",
                            "muscle": "Quads",
                            "sets": [
                                  {
                                        "kg": 160,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 160,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 160,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 802,
                            "name": "Lying Leg Curl",
                            "muscle": "Hamstrings",
                            "sets": [
                                  {
                                        "kg": 50,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 50,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 50,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 1101,
                            "name": "Standing Calf Raise",
                            "muscle": "Calves",
                            "sets": [
                                  {
                                        "kg": 70,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 70,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 70,
                                        "reps": 13,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": null
          },
          {
                "id": "w_1788074100000",
                "kind": "cardio",
                "name": "Rowing erg",
                "date": "2026-08-30",
                "min": 20,
                "km": 4.6,
                "cal": 230
          },
          {
                "id": "w_1788026700000",
                "kind": "lift",
                "name": "PPL - Pull",
                "date": "2026-08-29",
                "min": 57,
                "sets": 16,
                "kg": 6913,
                "exercises": [
                      {
                            "id": 221,
                            "name": "Barbell Deadlift",
                            "muscle": "Lower Back",
                            "sets": [
                                  {
                                        "kg": 55,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 110,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 110,
                                        "reps": 5,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 110,
                                        "reps": 4,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 100,
                                        "reps": 4,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 202,
                            "name": "Lat Pulldown",
                            "muscle": "Lats",
                            "sets": [
                                  {
                                        "kg": 60,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 60,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 60,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 213,
                            "name": "Seated Cable Row",
                            "muscle": "Mid Back",
                            "sets": [
                                  {
                                        "kg": 55,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 55,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 55,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 321,
                            "name": "Face Pull",
                            "muscle": "Rear Delt",
                            "sets": [
                                  {
                                        "kg": 19,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 19,
                                        "reps": 13,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 19,
                                        "reps": 12,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 503,
                            "name": "Barbell Curl",
                            "muscle": "Long Head",
                            "sets": [
                                  {
                                        "kg": 29,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 29,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 29,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": {
                      "energy": 4,
                      "focus": 4,
                      "pump": 3,
                      "difficulty": 3,
                      "enjoyment": 4
                }
          },
          {
                "id": "w_1787853900000",
                "kind": "lift",
                "name": "PPL - Push",
                "date": "2026-08-27",
                "min": 57,
                "sets": 16,
                "kg": 4076,
                "exercises": [
                      {
                            "id": 111,
                            "name": "Barbell Bench Press",
                            "muscle": "Mid Chest",
                            "sets": [
                                  {
                                        "kg": 35,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 70,
                                        "reps": 7,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 70,
                                        "reps": 7,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 70,
                                        "reps": 5,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 65,
                                        "reps": 5,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 302,
                            "name": "DB Shoulder Press",
                            "muscle": "Front Delt",
                            "sets": [
                                  {
                                        "kg": 24,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 24,
                                        "reps": 8,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 24,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 103,
                            "name": "Incline Cable Fly",
                            "muscle": "Upper Chest",
                            "sets": [
                                  {
                                        "kg": 14.5,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 14.5,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 14.5,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 311,
                            "name": "Lateral Raise",
                            "muscle": "Side Delt",
                            "sets": [
                                  {
                                        "kg": 10,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 10,
                                        "reps": 13,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 10,
                                        "reps": 12,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 411,
                            "name": "Tricep Pushdown",
                            "muscle": "Lateral Head",
                            "sets": [
                                  {
                                        "kg": 29,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 29,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 29,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "Deload on pulldown, shoulder tight.",
                "reflection": null
          },
          {
                "id": "w_1787594700000",
                "kind": "lift",
                "name": "PPL - Legs",
                "date": "2026-08-24",
                "min": 54,
                "sets": 16,
                "kg": 13363,
                "exercises": [
                      {
                            "id": 701,
                            "name": "Barbell Squat",
                            "muscle": "Quads",
                            "sets": [
                                  {
                                        "kg": 42.5,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 82.5,
                                        "reps": 7,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 82.5,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 82.5,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 77.5,
                                        "reps": 5,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 801,
                            "name": "Romanian Deadlift",
                            "muscle": "Hamstrings",
                            "sets": [
                                  {
                                        "kg": 72.5,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 72.5,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 72.5,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 703,
                            "name": "Leg Press",
                            "muscle": "Quads",
                            "sets": [
                                  {
                                        "kg": 155,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 155,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 155,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 802,
                            "name": "Lying Leg Curl",
                            "muscle": "Hamstrings",
                            "sets": [
                                  {
                                        "kg": 47.5,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 47.5,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 47.5,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 1101,
                            "name": "Standing Calf Raise",
                            "muscle": "Calves",
                            "sets": [
                                  {
                                        "kg": 67.5,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 67.5,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 67.5,
                                        "reps": 12,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": null
          },
          {
                "id": "w_1787469300000",
                "kind": "cardio",
                "name": "Walking",
                "date": "2026-08-23",
                "min": 45,
                "km": 4,
                "cal": 210
          },
          {
                "id": "w_1787421900000",
                "kind": "lift",
                "name": "PPL - Pull",
                "date": "2026-08-22",
                "min": 49,
                "sets": 16,
                "kg": 6519,
                "exercises": [
                      {
                            "id": 221,
                            "name": "Barbell Deadlift",
                            "muscle": "Lower Back",
                            "sets": [
                                  {
                                        "kg": 52.5,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 105,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 105,
                                        "reps": 4,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 105,
                                        "reps": 4,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 95,
                                        "reps": 4,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 202,
                            "name": "Lat Pulldown",
                            "muscle": "Lats",
                            "sets": [
                                  {
                                        "kg": 57.5,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 57.5,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 57.5,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 213,
                            "name": "Seated Cable Row",
                            "muscle": "Mid Back",
                            "sets": [
                                  {
                                        "kg": 52.5,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 52.5,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 52.5,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 321,
                            "name": "Face Pull",
                            "muscle": "Rear Delt",
                            "sets": [
                                  {
                                        "kg": 18,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 18,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 18,
                                        "reps": 12,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 503,
                            "name": "Barbell Curl",
                            "muscle": "Long Head",
                            "sets": [
                                  {
                                        "kg": 28,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 28,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 28,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": null
          },
          {
                "id": "w_1787249100000",
                "kind": "lift",
                "name": "PPL - Push",
                "date": "2026-08-20",
                "min": 51,
                "sets": 16,
                "kg": 3985,
                "exercises": [
                      {
                            "id": 111,
                            "name": "Barbell Bench Press",
                            "muscle": "Mid Chest",
                            "sets": [
                                  {
                                        "kg": 35,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 67.5,
                                        "reps": 8,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 67.5,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 67.5,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 62.5,
                                        "reps": 5,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 302,
                            "name": "DB Shoulder Press",
                            "muscle": "Front Delt",
                            "sets": [
                                  {
                                        "kg": 23,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 23,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 23,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 103,
                            "name": "Incline Cable Fly",
                            "muscle": "Upper Chest",
                            "sets": [
                                  {
                                        "kg": 14,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 14,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 14,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 311,
                            "name": "Lateral Raise",
                            "muscle": "Side Delt",
                            "sets": [
                                  {
                                        "kg": 9.5,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 9.5,
                                        "reps": 13,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 9.5,
                                        "reps": 12,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 411,
                            "name": "Tricep Pushdown",
                            "muscle": "Lateral Head",
                            "sets": [
                                  {
                                        "kg": 28,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 28,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 28,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": {
                      "energy": 4,
                      "focus": 4,
                      "pump": 3,
                      "difficulty": 3,
                      "enjoyment": 4
                }
          },
          {
                "id": "w_1786989900000",
                "kind": "lift",
                "name": "PPL - Legs",
                "date": "2026-08-17",
                "min": 49,
                "sets": 16,
                "kg": 12800,
                "exercises": [
                      {
                            "id": 701,
                            "name": "Barbell Squat",
                            "muscle": "Quads",
                            "sets": [
                                  {
                                        "kg": 40,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 80,
                                        "reps": 8,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 80,
                                        "reps": 7,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 80,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 75,
                                        "reps": 5,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 801,
                            "name": "Romanian Deadlift",
                            "muscle": "Hamstrings",
                            "sets": [
                                  {
                                        "kg": 70,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 70,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 70,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 703,
                            "name": "Leg Press",
                            "muscle": "Quads",
                            "sets": [
                                  {
                                        "kg": 150,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 150,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 150,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 802,
                            "name": "Lying Leg Curl",
                            "muscle": "Hamstrings",
                            "sets": [
                                  {
                                        "kg": 45,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 45,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 45,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 1101,
                            "name": "Standing Calf Raise",
                            "muscle": "Calves",
                            "sets": [
                                  {
                                        "kg": 65,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 65,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 65,
                                        "reps": 13,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": null
          },
          {
                "id": "w_1786864500000",
                "kind": "cardio",
                "name": "Upright bike",
                "date": "2026-08-16",
                "min": 25,
                "km": 9,
                "cal": 240
          },
          {
                "id": "w_1786817100000",
                "kind": "lift",
                "name": "PPL - Pull",
                "date": "2026-08-15",
                "min": 59,
                "sets": 16,
                "kg": 6306,
                "exercises": [
                      {
                            "id": 221,
                            "name": "Barbell Deadlift",
                            "muscle": "Lower Back",
                            "sets": [
                                  {
                                        "kg": 50,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 100,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 100,
                                        "reps": 5,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 100,
                                        "reps": 4,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 90,
                                        "reps": 4,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 202,
                            "name": "Lat Pulldown",
                            "muscle": "Lats",
                            "sets": [
                                  {
                                        "kg": 55,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 55,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 55,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 213,
                            "name": "Seated Cable Row",
                            "muscle": "Mid Back",
                            "sets": [
                                  {
                                        "kg": 50,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 50,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 50,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 321,
                            "name": "Face Pull",
                            "muscle": "Rear Delt",
                            "sets": [
                                  {
                                        "kg": 17,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 17,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 17,
                                        "reps": 13,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 503,
                            "name": "Barbell Curl",
                            "muscle": "Long Head",
                            "sets": [
                                  {
                                        "kg": 27,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 27,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 27,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": null
          },
          {
                "id": "w_1786644300000",
                "kind": "lift",
                "name": "PPL - Push",
                "date": "2026-08-13",
                "min": 58,
                "sets": 16,
                "kg": 3748,
                "exercises": [
                      {
                            "id": 111,
                            "name": "Barbell Bench Press",
                            "muscle": "Mid Chest",
                            "sets": [
                                  {
                                        "kg": 32.5,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 65,
                                        "reps": 7,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 65,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 65,
                                        "reps": 5,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 60,
                                        "reps": 5,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 302,
                            "name": "DB Shoulder Press",
                            "muscle": "Front Delt",
                            "sets": [
                                  {
                                        "kg": 22,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 22,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 22,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 103,
                            "name": "Incline Cable Fly",
                            "muscle": "Upper Chest",
                            "sets": [
                                  {
                                        "kg": 13.5,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 13.5,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 13.5,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 311,
                            "name": "Lateral Raise",
                            "muscle": "Side Delt",
                            "sets": [
                                  {
                                        "kg": 9,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 9,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 9,
                                        "reps": 13,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 411,
                            "name": "Tricep Pushdown",
                            "muscle": "Lateral Head",
                            "sets": [
                                  {
                                        "kg": 27,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 27,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 27,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": null
          },
          {
                "id": "w_1786385100000",
                "kind": "lift",
                "name": "PPL - Legs",
                "date": "2026-08-10",
                "min": 59,
                "sets": 16,
                "kg": 12255,
                "exercises": [
                      {
                            "id": 701,
                            "name": "Barbell Squat",
                            "muscle": "Quads",
                            "sets": [
                                  {
                                        "kg": 40,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 77.5,
                                        "reps": 7,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 77.5,
                                        "reps": 7,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 77.5,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 72.5,
                                        "reps": 5,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 801,
                            "name": "Romanian Deadlift",
                            "muscle": "Hamstrings",
                            "sets": [
                                  {
                                        "kg": 67.5,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 67.5,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 67.5,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 703,
                            "name": "Leg Press",
                            "muscle": "Quads",
                            "sets": [
                                  {
                                        "kg": 145,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 145,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 145,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 802,
                            "name": "Lying Leg Curl",
                            "muscle": "Hamstrings",
                            "sets": [
                                  {
                                        "kg": 42.5,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 42.5,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 42.5,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 1101,
                            "name": "Standing Calf Raise",
                            "muscle": "Calves",
                            "sets": [
                                  {
                                        "kg": 62.5,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 62.5,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 62.5,
                                        "reps": 12,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": {
                      "energy": 4,
                      "focus": 4,
                      "pump": 3,
                      "difficulty": 3,
                      "enjoyment": 4
                }
          },
          {
                "id": "w_1786212300000",
                "kind": "lift",
                "name": "PPL - Pull",
                "date": "2026-08-08",
                "min": 57,
                "sets": 16,
                "kg": 5851,
                "exercises": [
                      {
                            "id": 221,
                            "name": "Barbell Deadlift",
                            "muscle": "Lower Back",
                            "sets": [
                                  {
                                        "kg": 47.5,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 95,
                                        "reps": 5,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 95,
                                        "reps": 5,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 95,
                                        "reps": 4,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 85,
                                        "reps": 4,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 202,
                            "name": "Lat Pulldown",
                            "muscle": "Lats",
                            "sets": [
                                  {
                                        "kg": 52.5,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 52.5,
                                        "reps": 8,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 52.5,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 213,
                            "name": "Seated Cable Row",
                            "muscle": "Mid Back",
                            "sets": [
                                  {
                                        "kg": 47.5,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 47.5,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 47.5,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 321,
                            "name": "Face Pull",
                            "muscle": "Rear Delt",
                            "sets": [
                                  {
                                        "kg": 16,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 16,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 16,
                                        "reps": 13,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 503,
                            "name": "Barbell Curl",
                            "muscle": "Long Head",
                            "sets": [
                                  {
                                        "kg": 26,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 26,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 26,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": null
          },
          {
                "id": "w_1786039500000",
                "kind": "lift",
                "name": "PPL - Push",
                "date": "2026-08-06",
                "min": 56,
                "sets": 16,
                "kg": 3688,
                "exercises": [
                      {
                            "id": 111,
                            "name": "Barbell Bench Press",
                            "muscle": "Mid Chest",
                            "sets": [
                                  {
                                        "kg": 32.5,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 62.5,
                                        "reps": 8,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 62.5,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 62.5,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 57.5,
                                        "reps": 5,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 302,
                            "name": "DB Shoulder Press",
                            "muscle": "Front Delt",
                            "sets": [
                                  {
                                        "kg": 21,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 21,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 21,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 103,
                            "name": "Incline Cable Fly",
                            "muscle": "Upper Chest",
                            "sets": [
                                  {
                                        "kg": 13,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 13,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 13,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 311,
                            "name": "Lateral Raise",
                            "muscle": "Side Delt",
                            "sets": [
                                  {
                                        "kg": 8.5,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 8.5,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 8.5,
                                        "reps": 13,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 411,
                            "name": "Tricep Pushdown",
                            "muscle": "Lateral Head",
                            "sets": [
                                  {
                                        "kg": 26,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 26,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 26,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": null
          },
          {
                "id": "w_1785780300000",
                "kind": "lift",
                "name": "PPL - Legs",
                "date": "2026-08-03",
                "min": 59,
                "sets": 16,
                "kg": 12060,
                "exercises": [
                      {
                            "id": 701,
                            "name": "Barbell Squat",
                            "muscle": "Quads",
                            "sets": [
                                  {
                                        "kg": 37.5,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 75,
                                        "reps": 8,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 75,
                                        "reps": 7,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 75,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 70,
                                        "reps": 5,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 801,
                            "name": "Romanian Deadlift",
                            "muscle": "Hamstrings",
                            "sets": [
                                  {
                                        "kg": 65,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 65,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 65,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 703,
                            "name": "Leg Press",
                            "muscle": "Quads",
                            "sets": [
                                  {
                                        "kg": 140,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 140,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 140,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 802,
                            "name": "Lying Leg Curl",
                            "muscle": "Hamstrings",
                            "sets": [
                                  {
                                        "kg": 40,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 40,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 40,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 1101,
                            "name": "Standing Calf Raise",
                            "muscle": "Calves",
                            "sets": [
                                  {
                                        "kg": 60,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 60,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 60,
                                        "reps": 13,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": null
          },
          {
                "id": "w_1785607500000",
                "kind": "lift",
                "name": "PPL - Pull",
                "date": "2026-08-01",
                "min": 55,
                "sets": 16,
                "kg": 5585,
                "exercises": [
                      {
                            "id": 221,
                            "name": "Barbell Deadlift",
                            "muscle": "Lower Back",
                            "sets": [
                                  {
                                        "kg": 45,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 90,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 90,
                                        "reps": 4,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 90,
                                        "reps": 4,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 80,
                                        "reps": 4,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 202,
                            "name": "Lat Pulldown",
                            "muscle": "Lats",
                            "sets": [
                                  {
                                        "kg": 50,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 50,
                                        "reps": 8,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 50,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 213,
                            "name": "Seated Cable Row",
                            "muscle": "Mid Back",
                            "sets": [
                                  {
                                        "kg": 45,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 45,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 45,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 321,
                            "name": "Face Pull",
                            "muscle": "Rear Delt",
                            "sets": [
                                  {
                                        "kg": 15,
                                        "reps": 15,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 15,
                                        "reps": 13,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 15,
                                        "reps": 13,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 503,
                            "name": "Barbell Curl",
                            "muscle": "Long Head",
                            "sets": [
                                  {
                                        "kg": 25,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 25,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 25,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": {
                      "energy": 4,
                      "focus": 4,
                      "pump": 3,
                      "difficulty": 3,
                      "enjoyment": 4
                }
          },
          {
                "id": "w_1785434700000",
                "kind": "lift",
                "name": "PPL - Push",
                "date": "2026-07-30",
                "min": 54,
                "sets": 16,
                "kg": 3568,
                "exercises": [
                      {
                            "id": 111,
                            "name": "Barbell Bench Press",
                            "muscle": "Mid Chest",
                            "sets": [
                                  {
                                        "kg": 30,
                                        "reps": 8,
                                        "rir": 5,
                                        "warm": true,
                                        "done": true
                                  },
                                  {
                                        "kg": 60,
                                        "reps": 7,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 60,
                                        "reps": 7,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 60,
                                        "reps": 6,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 55,
                                        "reps": 5,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 302,
                            "name": "DB Shoulder Press",
                            "muscle": "Front Delt",
                            "sets": [
                                  {
                                        "kg": 20,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 20,
                                        "reps": 9,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 20,
                                        "reps": 8,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 103,
                            "name": "Incline Cable Fly",
                            "muscle": "Upper Chest",
                            "sets": [
                                  {
                                        "kg": 12.5,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 12.5,
                                        "reps": 10,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 12.5,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 311,
                            "name": "Lateral Raise",
                            "muscle": "Side Delt",
                            "sets": [
                                  {
                                        "kg": 8,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 8,
                                        "reps": 14,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 8,
                                        "reps": 13,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      },
                      {
                            "id": 411,
                            "name": "Tricep Pushdown",
                            "muscle": "Lateral Head",
                            "sets": [
                                  {
                                        "kg": 25,
                                        "reps": 12,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 25,
                                        "reps": 11,
                                        "rir": 2,
                                        "warm": false,
                                        "done": true
                                  },
                                  {
                                        "kg": 25,
                                        "reps": 10,
                                        "rir": 1,
                                        "warm": false,
                                        "done": true
                                  }
                            ]
                      }
                ],
                "note": "",
                "reflection": null
          }
    ],
    prs: [
          {
                "exId": 801,
                "name": "Romanian Deadlift",
                "kg": 77.5,
                "reps": 8,
                "date": "2026-09-07"
          },
          {
                "exId": 703,
                "name": "Leg Press",
                "kg": 165,
                "reps": 10,
                "date": "2026-09-07"
          },
          {
                "exId": 701,
                "name": "Barbell Squat",
                "kg": 87.5,
                "reps": 8,
                "date": "2026-09-07"
          },
          {
                "exId": 503,
                "name": "Barbell Curl",
                "kg": 30,
                "reps": 8,
                "date": "2026-09-05"
          },
          {
                "exId": 221,
                "name": "Barbell Deadlift",
                "kg": 115,
                "reps": 4,
                "date": "2026-09-05"
          },
          {
                "exId": 213,
                "name": "Seated Cable Row",
                "kg": 57.5,
                "reps": 10,
                "date": "2026-09-05"
          },
          {
                "exId": 202,
                "name": "Lat Pulldown",
                "kg": 62.5,
                "reps": 8,
                "date": "2026-09-05"
          },
          {
                "exId": 302,
                "name": "DB Shoulder Press",
                "kg": 25,
                "reps": 8,
                "date": "2026-09-03"
          },
          {
                "exId": 111,
                "name": "Barbell Bench Press",
                "kg": 72.5,
                "reps": 8,
                "date": "2026-09-03"
          }
    ],
    weightLog: [
          {
                "date": "2026-07-27",
                "kg": 65.3
          },
          {
                "date": "2026-08-03",
                "kg": 65.3
          },
          {
                "date": "2026-08-10",
                "kg": 64.9
          },
          {
                "date": "2026-08-17",
                "kg": 64.7
          },
          {
                "date": "2026-08-24",
                "kg": 64.6
          },
          {
                "date": "2026-08-31",
                "kg": 64.5
          },
          {
                "date": "2026-09-07",
                "kg": 64.2
          }
    ],
    bfLog: [
          {
                "pct": 24.1,
                "method": "manual",
                "date": "2026-08-03"
          },
          {
                "pct": 23.2,
                "method": "manual",
                "date": "2026-08-31"
          }
    ],
    profile: {
          "name": "Cesco",
          "username": "cesco",
          "useKg": true,
          "age": 29,
          "sex": "female",
          "heightCm": 168,
          "weightKg": 64.2,
          "goal": "build",
          "coachName": "Coach",
          "createdAt": "7/25/2026"
    },
    totals: {
          "sessions": 22,
          "liftSessions": 18,
          "cardioSessions": 4,
          "sets": 288,
          "volumeKg": 140204,
          "records": 12,
          "recordLifts": 9,
          "cardioMin": 120
    },
    library: {
          "total": 867,
          "catalogue": 866,
          "custom": 1,
          "logged": 15
    },
    splits: [
          {
                "id": "s1784970000000",
                "name": "PPL",
                "created": "7/25/2026",
                "days": [
                      {
                            "name": "Push",
                            "blocks": [],
                            "exercises": [
                                  {
                                        "id": 111,
                                        "name": "Barbell Bench Press"
                                  },
                                  {
                                        "id": 302,
                                        "name": "DB Shoulder Press"
                                  },
                                  {
                                        "id": 103,
                                        "name": "Incline Cable Fly"
                                  },
                                  {
                                        "id": 311,
                                        "name": "Lateral Raise"
                                  },
                                  {
                                        "id": 411,
                                        "name": "Tricep Pushdown"
                                  }
                            ]
                      },
                      {
                            "name": "Pull",
                            "blocks": [],
                            "exercises": [
                                  {
                                        "id": 221,
                                        "name": "Barbell Deadlift"
                                  },
                                  {
                                        "id": 202,
                                        "name": "Lat Pulldown"
                                  },
                                  {
                                        "id": 213,
                                        "name": "Seated Cable Row"
                                  },
                                  {
                                        "id": 321,
                                        "name": "Face Pull"
                                  },
                                  {
                                        "id": 503,
                                        "name": "Barbell Curl"
                                  }
                            ]
                      },
                      {
                            "name": "Legs",
                            "blocks": [],
                            "exercises": [
                                  {
                                        "id": 701,
                                        "name": "Barbell Squat"
                                  },
                                  {
                                        "id": 801,
                                        "name": "Romanian Deadlift"
                                  },
                                  {
                                        "id": 703,
                                        "name": "Leg Press"
                                  },
                                  {
                                        "id": 802,
                                        "name": "Lying Leg Curl"
                                  },
                                  {
                                        "id": 1101,
                                        "name": "Standing Calf Raise"
                                  }
                            ]
                      }
                ]
          },
          {
                "id": "s1784973600000",
                "name": "Upper / Lower",
                "created": "8/9/2026",
                "days": [
                      {
                            "name": "Upper",
                            "blocks": [],
                            "exercises": [
                                  {
                                        "id": 111,
                                        "name": "Barbell Bench Press"
                                  },
                                  {
                                        "id": 211,
                                        "name": "Barbell Row"
                                  },
                                  {
                                        "id": 302,
                                        "name": "DB Shoulder Press"
                                  },
                                  {
                                        "id": 202,
                                        "name": "Lat Pulldown"
                                  },
                                  {
                                        "id": 503,
                                        "name": "Barbell Curl"
                                  }
                            ]
                      },
                      {
                            "name": "Lower",
                            "blocks": [],
                            "exercises": [
                                  {
                                        "id": 701,
                                        "name": "Barbell Squat"
                                  },
                                  {
                                        "id": 801,
                                        "name": "Romanian Deadlift"
                                  },
                                  {
                                        "id": 703,
                                        "name": "Leg Press"
                                  },
                                  {
                                        "id": 803,
                                        "name": "Seated Leg Curl"
                                  },
                                  {
                                        "id": 1102,
                                        "name": "Seated Calf Raise"
                                  }
                            ]
                      }
                ]
          },
          {
                "id": "s1784977200000",
                "name": "Full Body 3x",
                "created": "8/27/2026",
                "days": [
                      {
                            "name": "Day A",
                            "blocks": [
                                  {
                                        "title": "Warm-up",
                                        "notes": "5 min bike, hip openers",
                                        "duration": "5 min"
                                  }
                            ],
                            "exercises": [
                                  {
                                        "id": 701,
                                        "name": "Barbell Squat"
                                  },
                                  {
                                        "id": 111,
                                        "name": "Barbell Bench Press"
                                  },
                                  {
                                        "id": 213,
                                        "name": "Seated Cable Row"
                                  },
                                  {
                                        "id": 311,
                                        "name": "Lateral Raise"
                                  },
                                  {
                                        "id": 1101,
                                        "name": "Standing Calf Raise"
                                  }
                            ]
                      },
                      {
                            "name": "Day B",
                            "blocks": [],
                            "exercises": [
                                  {
                                        "id": 221,
                                        "name": "Barbell Deadlift"
                                  },
                                  {
                                        "id": 302,
                                        "name": "DB Shoulder Press"
                                  },
                                  {
                                        "id": 202,
                                        "name": "Lat Pulldown"
                                  },
                                  {
                                        "id": 802,
                                        "name": "Lying Leg Curl"
                                  },
                                  {
                                        "id": 503,
                                        "name": "Barbell Curl"
                                  }
                            ]
                      },
                      {
                            "name": "Day C",
                            "blocks": [],
                            "exercises": [
                                  {
                                        "id": 703,
                                        "name": "Leg Press"
                                  },
                                  {
                                        "id": 113,
                                        "name": "Machine Chest Press"
                                  },
                                  {
                                        "id": 216,
                                        "name": "Chest Supported Row"
                                  },
                                  {
                                        "id": 321,
                                        "name": "Face Pull"
                                  },
                                  {
                                        "id": 411,
                                        "name": "Tricep Pushdown"
                                  }
                            ]
                      }
                ]
          }
    ],
    featured: [
          {
                "id": 111,
                "name": "Barbell Bench Press"
          },
          {
                "id": 701,
                "name": "Barbell Squat"
          },
          {
                "id": 221,
                "name": "Barbell Deadlift"
          }
    ],
    goals: [
          {
                "type": "lift",
                "name": "Bench 75 kg x5",
                "target": 75,
                "targetDate": "2026-12-01",
                "exId": 111,
                "unit": "kg",
                "notes": "Add 2.5 kg every second week.",
                "start": 60,
                "status": "active",
                "created": "2026-07-30T09:00:00.000Z"
          },
          {
                "type": "lift",
                "name": "Squat 100 kg",
                "target": 100,
                "targetDate": "2027-01-06",
                "exId": 701,
                "unit": "kg",
                "notes": "",
                "start": 75,
                "status": "active",
                "created": "2026-07-30T09:05:00.000Z"
          },
          {
                "type": "weight",
                "name": "Body weight 63 kg",
                "target": 63,
                "targetDate": "2026-11-07",
                "exId": null,
                "unit": "kg",
                "notes": "",
                "start": 65.4,
                "status": "active",
                "created": "2026-08-04T08:00:00.000Z"
          }
    ],
    photos: [
          {
                "date": "2026-07-29T08:00:00.000Z",
                "note": "Week 1, relaxed"
          },
          {
                "date": "2026-08-26T08:00:00.000Z",
                "note": "Week 5"
          }
    ],
    supplements: [
          {
                "name": "Creatine",
                "dose": "5 g",
                "freq": "Daily",
                "timeOf": "Morning",
                "reminder": true,
                "created": "2026-07-30T08:00:00.000Z"
          },
          {
                "name": "Vitamin D",
                "dose": "2000 IU",
                "freq": "Daily",
                "timeOf": "Morning",
                "reminder": true,
                "created": "2026-07-30T08:01:00.000Z"
          }
    ],
    shoppingList: [
          {
                "id": "sh_1788775200000_2sh0q",
                "itemName": "Chicken thighs",
                "quantity": 1,
                "unit": "kg",
                "category": "meat",
                "dateAdded": "2026-09-07T10:00:00.000Z",
                "checked": false
          },
          {
                "id": "sh_1788775201000_0rasx",
                "itemName": "Greek yogurt",
                "quantity": 2,
                "unit": "tubs",
                "category": "dairy",
                "dateAdded": "2026-09-07T10:01:00.000Z",
                "checked": false
          },
          {
                "id": "sh_1788775202000_28bcm",
                "itemName": "Eggs",
                "quantity": 12,
                "unit": "pcs",
                "category": "dairy",
                "dateAdded": "2026-09-07T10:02:00.000Z",
                "checked": false
          },
          {
                "id": "sh_1788775203000_0ku3i",
                "itemName": "Oats",
                "quantity": 1,
                "unit": "kg",
                "category": "pantry",
                "dateAdded": "2026-09-07T10:03:00.000Z",
                "checked": true
          },
          {
                "id": "sh_1788775204000_28c66",
                "itemName": "Bananas",
                "quantity": 6,
                "unit": "pcs",
                "category": "produce",
                "dateAdded": "2026-09-07T10:04:00.000Z",
                "checked": false
          },
          {
                "id": "sh_1788775205000_5nll2",
                "itemName": "Spinach",
                "quantity": 1,
                "unit": "bag",
                "category": "produce",
                "dateAdded": "2026-09-07T10:05:00.000Z",
                "checked": false
          },
          {
                "id": "sh_1788775206000_55fcy",
                "itemName": "Rice",
                "quantity": 2,
                "unit": "kg",
                "category": "pantry",
                "dateAdded": "2026-09-07T10:06:00.000Z",
                "checked": false
          },
          {
                "id": "sh_1788775207000_3z8gk",
                "itemName": "Salmon",
                "quantity": 500,
                "unit": "g",
                "category": "meat",
                "dateAdded": "2026-09-07T10:07:00.000Z",
                "checked": false
          },
          {
                "id": "sh_1788775208000_5aljy",
                "itemName": "Almonds",
                "quantity": 1,
                "unit": "bag",
                "category": "snacks",
                "dateAdded": "2026-09-07T10:08:00.000Z",
                "checked": true
          },
          {
                "id": "sh_1788775209000_0ee39",
                "itemName": "Olive oil",
                "quantity": 1,
                "unit": "bottle",
                "category": "other",
                "dateAdded": "2026-09-07T10:09:00.000Z",
                "checked": false
          }
    ],
    pantry: [
          {
                "id": "p_1787133600000",
                "name": "Whey protein",
                "quantity": 1,
                "unit": "",
                "store": "",
                "category": "pantry",
                "dateAdded": "2026-08-19T10:00:00.000Z",
                "empty": false,
                "staple": true,
                "intervalDays": 30
          },
          {
                "id": "p_1787133660000",
                "name": "Peanut butter",
                "quantity": 1,
                "unit": "",
                "store": "",
                "category": "pantry",
                "dateAdded": "2026-08-19T10:01:00.000Z",
                "empty": false
          },
          {
                "id": "p_1788343200000",
                "name": "Frozen berries",
                "quantity": 2,
                "unit": "",
                "store": "",
                "category": "other",
                "dateAdded": "2026-09-02T10:00:00.000Z",
                "empty": false
          },
          {
                "id": "p_1788343260000",
                "name": "Canned tuna",
                "quantity": 0,
                "unit": "",
                "store": "",
                "category": "pantry",
                "dateAdded": "2026-09-02T10:01:00.000Z",
                "empty": true
          }
    ],
    budget: {
          "weeklyTarget": 120,
          "history": [
                {
                      "id": "p_1788796800000",
                      "items": [
                            {
                                  "name": "Chicken thighs",
                                  "price": 9.5,
                                  "qty": 1
                            },
                            {
                                  "name": "Greek yogurt",
                                  "price": 4.2,
                                  "qty": 2
                            },
                            {
                                  "name": "Bananas",
                                  "price": 1.8,
                                  "qty": 1
                            }
                      ],
                      "store": "Trader Joe's",
                      "date": "2026-09-07T16:00:00.000Z",
                      "total": 19.7,
                      "source": "manual"
                },
                {
                      "id": "r_1788458400000",
                      "items": [
                            {
                                  "name": "Salmon",
                                  "price": 12.9,
                                  "qty": 1
                            },
                            {
                                  "name": "Rice",
                                  "price": 3.5,
                                  "qty": 2
                            },
                            {
                                  "name": "Olive oil",
                                  "price": 8.9,
                                  "qty": 1
                            }
                      ],
                      "store": "Safeway",
                      "date": "2026-09-03T18:00:00.000Z",
                      "total": 28.8,
                      "source": "receipt"
                },
                {
                      "id": "p_1788109200000",
                      "items": [
                            {
                                  "name": "Eggs",
                                  "price": 4.5,
                                  "qty": 2
                            },
                            {
                                  "name": "Oats",
                                  "price": 3.2,
                                  "qty": 1
                            }
                      ],
                      "store": "Trader Joe's",
                      "date": "2026-08-30T17:00:00.000Z",
                      "total": 12.2,
                      "source": "manual"
                }
          ],
          "pendingItems": []
    },
    stores: [
          {
                "id": "store_1786276800000",
                "name": "Trader Joe's",
                "url": "https://www.traderjoes.com",
                "description": "specialty grocery",
                "enabled": true
          }
    ],
    customEx: [
          {
                "id": 900001,
                "name": "Cable Fly (low pulley)",
                "eq": "Cable",
                "gid": "chest",
                "sid": "lower",
                "custom": true,
                "startResist": 0,
                "smithNoCB": false
          }
    ],
    nutrition: {
          "targets": {
                "kcal": 2980,
                "pro": 160,
                "carb": 380,
                "fat": 80,
                "waterMl": 3000
          },
          "foods": {
                "eggs": {
                      "icon": "🍳",
                      "name": "Eggs, toast, butter",
                      "kcal": 540,
                      "pro": 38,
                      "carb": 46,
                      "fat": 24
                },
                "bowl": {
                      "icon": "🥗",
                      "name": "Chicken rice bowl",
                      "kcal": 720,
                      "pro": 52,
                      "carb": 84,
                      "fat": 16
                },
                "shake": {
                      "icon": "🥤",
                      "name": "Whey shake, banana",
                      "kcal": 310,
                      "pro": 31,
                      "carb": 38,
                      "fat": 4
                },
                "pasta": {
                      "icon": "🍝",
                      "name": "Beef mince and pasta",
                      "kcal": 810,
                      "pro": 48,
                      "carb": 92,
                      "fat": 26
                },
                "chilli": {
                      "icon": "🍲",
                      "name": "Chilli",
                      "kcal": 530,
                      "pro": 41,
                      "carb": 38,
                      "fat": 18
                },
                "cnr": {
                      "icon": "🍚",
                      "name": "Chicken and rice",
                      "kcal": 690,
                      "pro": 61,
                      "carb": 74,
                      "fat": 13
                },
                "pancakes": {
                      "icon": "🥞",
                      "name": "Protein pancakes",
                      "kcal": 360,
                      "pro": 31,
                      "carb": 37,
                      "fat": 8
                },
                "skyr": {
                      "icon": "🥫",
                      "name": "Skyr, plain",
                      "kcal": 96,
                      "pro": 17,
                      "carb": 6,
                      "fat": 0.3
                }
          },
          "days": {
                "2026-09-09": {
                      "date": "2026-09-09",
                      "meals": [
                            {
                                  "key": "eggs",
                                  "icon": "🍳",
                                  "name": "Eggs, toast, butter",
                                  "at": "8:05",
                                  "src": "verified",
                                  "kcal": 540,
                                  "pro": 38,
                                  "carb": 46,
                                  "fat": 24
                            },
                            {
                                  "key": "bowl",
                                  "icon": "🥗",
                                  "name": "Chicken rice bowl",
                                  "at": "12:40",
                                  "src": "estimate",
                                  "kcal": 720,
                                  "pro": 52,
                                  "carb": 84,
                                  "fat": 16
                            },
                            {
                                  "key": "shake",
                                  "icon": "🥤",
                                  "name": "Whey shake, banana",
                                  "at": "3:15",
                                  "src": "verified",
                                  "kcal": 310,
                                  "pro": 31,
                                  "carb": 38,
                                  "fat": 4
                            }
                      ],
                      "eaten": 1570,
                      "pro": 121,
                      "carb": 168,
                      "fat": 44,
                      "waterMl": 1750,
                      "supps": [
                            {
                                  "name": "Creatine",
                                  "dose": "5 g",
                                  "when": "Morning",
                                  "taken": true
                            },
                            {
                                  "name": "Vitamin D",
                                  "dose": "2000 IU",
                                  "when": "Morning",
                                  "taken": true
                            }
                      ]
                },
                "2026-09-08": {
                      "date": "2026-09-08",
                      "meals": [
                            {
                                  "key": "eggs",
                                  "icon": "🍳",
                                  "name": "Eggs, toast, butter",
                                  "at": "8:10",
                                  "src": "verified",
                                  "kcal": 540,
                                  "pro": 38,
                                  "carb": 46,
                                  "fat": 24
                            },
                            {
                                  "key": "cnr",
                                  "icon": "🍚",
                                  "name": "Chicken and rice",
                                  "at": "12:30",
                                  "src": "recipe",
                                  "kcal": 690,
                                  "pro": 61,
                                  "carb": 74,
                                  "fat": 13
                            },
                            {
                                  "key": "pasta",
                                  "icon": "🍝",
                                  "name": "Beef mince and pasta",
                                  "at": "7:20",
                                  "src": "estimate",
                                  "kcal": 810,
                                  "pro": 48,
                                  "carb": 92,
                                  "fat": 26
                            },
                            {
                                  "key": "shake",
                                  "icon": "🥤",
                                  "name": "Whey shake, banana",
                                  "at": "4:05",
                                  "src": "verified",
                                  "kcal": 310,
                                  "pro": 31,
                                  "carb": 38,
                                  "fat": 4
                            },
                            {
                                  "key": "pancakes",
                                  "icon": "🥞",
                                  "name": "Protein pancakes",
                                  "at": "9:30",
                                  "src": "recipe",
                                  "kcal": 360,
                                  "pro": 31,
                                  "carb": 37,
                                  "fat": 8
                            }
                      ],
                      "eaten": 2710,
                      "pro": 209,
                      "carb": 287,
                      "fat": 75,
                      "waterMl": 3100,
                      "supps": [
                            {
                                  "name": "Creatine",
                                  "dose": "5 g",
                                  "when": "Morning",
                                  "taken": true
                            },
                            {
                                  "name": "Vitamin D",
                                  "dose": "2000 IU",
                                  "when": "Morning",
                                  "taken": true
                            }
                      ]
                },
                "2026-09-07": {
                      "date": "2026-09-07",
                      "meals": [
                            {
                                  "key": "eggs",
                                  "icon": "🍳",
                                  "name": "Eggs, toast, butter",
                                  "at": "8:00",
                                  "src": "verified",
                                  "kcal": 540,
                                  "pro": 38,
                                  "carb": 46,
                                  "fat": 24
                            },
                            {
                                  "key": "bowl",
                                  "icon": "🥗",
                                  "name": "Chicken rice bowl",
                                  "at": "12:45",
                                  "src": "estimate",
                                  "kcal": 720,
                                  "pro": 52,
                                  "carb": 84,
                                  "fat": 16
                            },
                            {
                                  "key": "chilli",
                                  "icon": "🍲",
                                  "name": "Chilli",
                                  "at": "7:15",
                                  "src": "recipe",
                                  "kcal": 530,
                                  "pro": 41,
                                  "carb": 38,
                                  "fat": 18
                            },
                            {
                                  "key": "shake",
                                  "icon": "🥤",
                                  "name": "Whey shake, banana",
                                  "at": "3:40",
                                  "src": "verified",
                                  "kcal": 310,
                                  "pro": 31,
                                  "carb": 38,
                                  "fat": 4
                            },
                            {
                                  "key": "pancakes",
                                  "icon": "🥞",
                                  "name": "Protein pancakes",
                                  "at": "9:45",
                                  "src": "recipe",
                                  "kcal": 360,
                                  "pro": 31,
                                  "carb": 37,
                                  "fat": 8
                            },
                            {
                                  "key": "skyr",
                                  "icon": "🥫",
                                  "name": "Skyr, plain",
                                  "at": "10:30",
                                  "src": "verified",
                                  "kcal": 96,
                                  "pro": 17,
                                  "carb": 6,
                                  "fat": 0.3
                            }
                      ],
                      "eaten": 2556,
                      "pro": 210,
                      "carb": 249,
                      "fat": 70.3,
                      "waterMl": 2900,
                      "supps": [
                            {
                                  "name": "Creatine",
                                  "dose": "5 g",
                                  "when": "Morning",
                                  "taken": true
                            },
                            {
                                  "name": "Vitamin D",
                                  "dose": "2000 IU",
                                  "when": "Morning",
                                  "taken": false
                            }
                      ]
                },
                "2026-09-06": {
                      "date": "2026-09-06",
                      "meals": [
                            {
                                  "key": "eggs",
                                  "icon": "🍳",
                                  "name": "Eggs, toast, butter",
                                  "at": "9:20",
                                  "src": "verified",
                                  "kcal": 540,
                                  "pro": 38,
                                  "carb": 46,
                                  "fat": 24
                            },
                            {
                                  "key": "cnr",
                                  "icon": "🍚",
                                  "name": "Chicken and rice",
                                  "at": "1:10",
                                  "src": "recipe",
                                  "kcal": 690,
                                  "pro": 61,
                                  "carb": 74,
                                  "fat": 13
                            },
                            {
                                  "key": "chilli",
                                  "icon": "🍲",
                                  "name": "Chilli",
                                  "at": "7:00",
                                  "src": "recipe",
                                  "kcal": 530,
                                  "pro": 41,
                                  "carb": 38,
                                  "fat": 18
                            },
                            {
                                  "key": "shake",
                                  "icon": "🥤",
                                  "name": "Whey shake, banana",
                                  "at": "4:30",
                                  "src": "verified",
                                  "kcal": 310,
                                  "pro": 31,
                                  "carb": 38,
                                  "fat": 4
                            }
                      ],
                      "eaten": 2070,
                      "pro": 171,
                      "carb": 196,
                      "fat": 59,
                      "waterMl": 2600,
                      "supps": [
                            {
                                  "name": "Creatine",
                                  "dose": "5 g",
                                  "when": "Morning",
                                  "taken": false
                            },
                            {
                                  "name": "Vitamin D",
                                  "dose": "2000 IU",
                                  "when": "Morning",
                                  "taken": false
                            }
                      ]
                }
          },
          "trend": [
                2870,
                3040,
                2790,
                3180,
                2900,
                2680,
                2985,
                2740,
                3120,
                2610,
                2070,
                2556,
                2710,
                1570
          ]
    },

    /* Every session on a date, newest first. */
    on: function (iso) {
      return g.LKFixtures.history.filter(function (h) { return h.date === iso; });
    },
    /* Inclusive both ends. */
    between: function (a, b) {
      return g.LKFixtures.history.filter(function (h) { return h.date >= a && h.date <= b; });
    },
    /* One session by id, which is what a history row hands on. */
    session: function (id) {
      var h = g.LKFixtures.history;
      for (var i = 0; i < h.length; i++) { if (h[i].id === id) return h[i]; }
      return null;
    },
    /* The most recent session, older than the date given, that contains this lift, and
       that lift's rows inside it. This is what "last time" means, and it is
       the only honest source for it. */
    lastTime: function (exId, before) {
      var h = g.LKFixtures.history;
      for (var i = 0; i < h.length; i++) {
        var w = h[i];
        if (w.kind !== 'lift') continue;
        if (before && w.date >= before) continue;
        for (var j = 0; j < w.exercises.length; j++) {
          if (w.exercises[j].id === exId) return { date: w.date, exercise: w.exercises[j] };
        }
      }
      return null;
    },
    /* Working volume and top set of one lift inside one session. */
    liftStats: function (ex) {
      var vol = 0, top = null;
      ex.sets.forEach(function (st) {
        if (!st.done || st.warm || st.kg == null || st.reps == null) return;
        vol += st.kg * st.reps;
        if (!top || st.kg > top[0] || (st.kg === top[0] && st.reps > top[1])) top = [st.kg, st.reps];
      });
      return { vol: Math.round(vol), top: top };
    }
  };
})(typeof window !== 'undefined' ? window : this);
