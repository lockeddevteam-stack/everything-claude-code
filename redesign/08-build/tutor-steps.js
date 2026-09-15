/* ===================================================================
   The 63 steps, as data.

   Every line here was authored against the app and every target names a
   control the app really has. tests/tutor-copy.mjs reads THIS FILE, not
   a copy of it, and fails the build when a step names a control no
   screen carries or a feature the redesign cut. That is the whole point
   of keeping the copy as data: the alternative is a walkthrough that
   drifts from the app one commit at a time, and the shipped version of
   this tutorial did exactly that -- it taught a voice mode that had
   been removed, to every new user, as the first thing they were told.

   WHERE THESE LINES CHANGED FROM THE PROTOTYPE, and why. The prototype
   was written against hand-built mock screens, so six of its lines
   named controls this build does not have:

     - "Five themes. They change the whole app, live." The redesign has
       three appearances: Dark, Light and Match device. Three lines about
       midnight and light themes are now two about the two that exist.
     - The prototype's food search logged from a detail card. This build
       logs from the search hit itself, one tap earlier.
     - The library's front/back figure is LKBodyMap here, and its groups
       are named by the real art rather than by the prototype's ids.

   Nothing else moved. A line that could not be made true of the build
   was cut rather than softened.
   =================================================================== */
(function (g) {
  'use strict';

  /* A step:
       screen   which mounted screen it belongs to
       testid   the control, as the screen labels it
       sel      a CSS selector, when a testid will not do
       say      the instruction
       note     the second line, optional
       hint     the pointer tag, default 'Tap'
       read     true when there is nothing to press
       hold     true for a long press
       pad      spotlight padding
       settle   ms before the next step arms
       before   run first, usually to open the state the step needs  */

  function ST() { return g.LKStore || null; }

  /* Type a query into the real search field so the hits a step points at
     are the app's own results, not a fixture. The tutorial does the
     typing; the reader does the tapping. */
  function typeSearch(screen, testid, text) {
    return function () {
      var h = document.getElementById('demo-screen-' + screen);
      if (!h || !h.shadowRoot) return;
      var el = h.shadowRoot.querySelector('[data-testid="' + testid + '"]');
      if (!el) return;
      el.value = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
  }

  /* A track opens on the screen it teaches. The steps themselves never
     navigate -- each one waits for the screen the previous tap was
     always going to reach -- but the first step has no previous tap, so
     the track says where it begins. */
  function go(hash) {
    return function () { if (location.hash !== hash) location.hash = hash; };
  }

  /* SOME MODULES NEED SOMETHING TO SHOW. Progress answers "am I getting
     stronger", and on a phone with no sessions on it there is no chart,
     no record and no answer -- the screen correctly shows its empty
     state instead, and a tour of that teaches nothing and points at
     controls that are not there. A track can say what it needs, and the
     hub offers it as a reason rather than as a broken row. */
  function hasTraining() {
    var S = g.LKStore;
    if (!S) return false;
    var h = S.get('lk_history', []);
    return !!(h && h.length);
  }

  var TRACKS = {

    /* ---------------------------------------------------------------
       QUICK START. Fourteen steps, about seventy-five seconds, and the
       first-run gate. Every one of them is something that breaks a day
       one user if they do not know it. Step ten earns its place on its
       own: a session is not in the history until Save runs.
       --------------------------------------------------------------- */
    quick: {
      name: 'Quick start',
      blurb: 'The loop, in about a minute',
      enter: go('#/home'),
      gate: true,
      steps: [
        { screen: 'home', testid: 'card-answer', read: true,
          say: 'Home answers one question. Train today, and what.',
          note: 'The session, and the button that starts it.' },

        { screen: 'home', testid: 'primary-action', hint: 'Tap',
          say: 'Start it.' },

        { screen: 'workout-log', testid: 'exercise-card-0', read: true,
          say: 'Every row already carries what you lifted last time.',
          note: 'Grey means it is a suggestion, not something you entered.' },

        { screen: 'workout-log', testid: 'cell-0-0-weight', hint: 'Tap',
          say: 'Tap the weight.' },

        { screen: 'workout-log', testid: 'pad-7', hint: 'Press 7',
          say: 'Press 7. The whole weight clears.',
          note: 'The first digit replaces what is there. Two taps instead of five.' },

        { screen: 'workout-log', testid: 'done-0-0', hint: 'Tap',
          say: 'Tick it.',
          note: 'Watch the volume in the header move.' },

        { screen: 'workout-log', testid: 'session-volume', read: true,
          say: 'That is the whole loop. Every figure in the app is summed from sets like that one.',
          note: 'Nothing is stored as a headline number.' },

        { screen: 'workout-log', testid: 'btn-finish', hint: 'Tap Finish',
          say: 'Now finish it.',
          note: 'The session is not in your history until you do.' },

        { screen: 'review', testid: 'section-compare', read: true,
          say: 'Review tells you what changed, not what you already watched.',
          note: 'A record, this session against the last one, and the lift that went down.' },

        { screen: 'review', testid: 'action-save', hint: 'Tap',
          say: 'Save it. This is the step that writes.' },

        /* Review has no tab bar -- it is a takeover -- so the way on is
           its own Done, and the Fuel tab is tapped from Home. */
        { screen: 'review', testid: 'action-done', hint: 'Tap Done',
          say: 'Saved. That session is in your history now.' },

        { screen: 'home', testid: 'tab-fuel', hint: 'Tap Fuel',
          say: 'The other half of the app is food.' },

        { screen: 'fuel', testid: 'log-search', hint: 'Tap',
          say: 'One number: what is left today. Search for something.' },

        { screen: 'fuel', testid: 'search-hit-0', hint: 'Tap',
          before: typeSearch('fuel', 'search-input', 'chicken'),
          say: 'Log it.',
          note: 'The number at the top moves by exactly what you logged.' },

        { screen: 'fuel', sel: '[data-testid^="tab-"]', read: true, pad: 10,
          say: 'That is enough to use the app.',
          note: 'Home decides, Train logs, Fuel feeds, Coach plans, Profile is yours. ' +
                'The full tour is in Settings when you want the rest.' }
      ]
    },

    /* ---------------------------------------------------------------
       TRAIN. Thirteen steps. Ends on the thing nothing on screen tells
       you: a long press on an exercise card.
       --------------------------------------------------------------- */
    train: {
      name: 'Train',
      blurb: 'The session, the picker, and the lift that hides an action',
      enter: go('#/home'),
      steps: [
        { screen: 'home', testid: 'card-answer', read: true,
          say: 'Home answers one question. Train today, and what.',
          note: 'The session, the reason to do it, and the button are all in the first fold.' },

        { screen: 'home', testid: 'tab-train', hint: 'Tap Train',
          say: 'Everything you train lives on one screen.' },

        { screen: 'train', testid: 'open-library', hint: 'Tap',
          say: 'The whole catalogue is behind one row.',
          note: 'You do not scroll through hundreds of anything.' },

        { screen: 'exercise-library', testid: 'bodymap', read: true, pad: 10,
          say: 'The library opens on a body.',
          note: 'Every muscle on it is a button.' },

        /* The tappable quad is the hit path in the reach layer, not the
           drawn muscle: the figure separates what you see from what
           answers a finger, and arming the art would arm nothing. */
        { screen: 'exercise-library', sel: '.hit[data-g="quads"]', hint: 'Tap the quads',
          say: 'Tap the quads. On the body.',
          note: 'Not a menu of body parts. The muscle itself.' },

        { screen: 'exercise-library', testid: 'library-scroll', read: true,
          say: 'Only the quad lifts are left.',
          note: 'Compound at the top, isolation under it.' },

        { screen: 'exercise-library', testid: 'back', hint: 'Tap',
          say: 'Back to the body.' },

        { screen: 'exercise-library', testid: 'library-exit', hint: 'Tap',
          say: 'And back out to Train. The same arrow, one level up.' },

        { screen: 'train', testid: 'start-today', hint: 'Tap',
          say: 'Now start the session.',
          note: 'One tap. The clock is already running.' },

        { screen: 'workout-log', testid: 'btn-add-exercise', hint: 'Tap',
          say: 'Add another lift.',
          note: 'The button is at the bottom of the list, under everything you are already doing.' },

        /* THE PICKER OPENS ON A BODY NOW, so the step that used to tap a
           row straight away had nothing to tap: the rows appear after a
           part is chosen. Teaching the flow that exists rather than the
           one that did -- and the figure is the part worth teaching,
           because it is the bit nobody discovers by accident. */
        { screen: 'workout-log', sel: '[data-testid^="addex-group-"]', hint: 'Tap',
          say: 'Point at what you are training. The body is the way in.',
          note: 'Tap the figure itself, or a part by name underneath it.' },

        { screen: 'workout-log', sel: '[data-testid^="addex-pick-"]', hint: 'Tap',
          say: 'Those are the lifts for that part. Add one.',
          note: 'Two taps from inside the session, without leaving it.' },

        /* The card is the row; the thing that answers a long press is the
           name block inside it, which is deliberate -- a hold that fired
           from anywhere on the row would fight every control on it. */
        { screen: 'workout-log', sel: '[data-testid="exercise-card-0"] .exc__main[data-act="exsheet"]',
          hold: true, hint: 'Press and hold',
          say: 'Now hold a lift.',
          note: 'A long press on any exercise card. Nothing on screen says so.' },

        { screen: 'workout-log', testid: 'exercise-sheet', read: true,
          say: 'Every per-exercise action is here.',
          note: 'Swap, per-exercise units, warm-ups, supersets and notes.' }
      ]
    },

    /* ---------------------------------------------------------------
       FUEL. Nine steps, ending in the shop and the budget, which are
       both behind one row rather than behind a tab of their own.
       --------------------------------------------------------------- */
    fuel: {
      name: 'Fuel',
      blurb: 'What is left today, and where the food comes from',
      enter: go('#/fuel'),
      steps: [
        { screen: 'fuel', testid: 'hero', read: true,
          say: 'One number leads the screen. What is left today.',
          note: 'Not what you ate. What you have left, which is the number you act on.' },

        { screen: 'fuel', testid: 'log-search', hint: 'Tap',
          say: 'Four ways in. Search is the one that works with no signal.',
          note: 'Scan reads a barcode, Say it takes a sentence, Snap it reads a plate.' },

        { screen: 'fuel', testid: 'search-hit-0', hint: 'Tap',
          before: typeSearch('fuel', 'search-input', 'chicken'),
          say: 'Log it.',
          note: 'Watch the number at the top, and the three bars.' },

        { screen: 'fuel', testid: 'macros', read: true,
          say: 'Every row says where its numbers came from.',
          note: 'TABLE is a looked-up food, ESTIMATE is a photo read. Drawing them the ' +
                'same would be lying about confidence.' },

        { screen: 'fuel', testid: 'water-card-250', hint: 'Tap',
          say: 'Water is on the same screen. Add a glass.',
          note: 'No separate tab, no separate app.' },

        { screen: 'fuel', testid: 'chip-more', hint: 'Tap',
          say: 'Supplements, micronutrients and the shop all sit behind one chip.',
          note: 'Open the shop.' },

        { screen: 'shopping', testid: 'list-summary', read: true,
          say: 'The list is grouped the way a shop is laid out.' },

        { screen: 'shopping', testid: 'to-budget', hint: 'Tap',
          say: 'And the budget is behind the same control.',
          note: 'A cap, what is spent, and what is left. Every figure is money, so every ' +
                'figure is tabular.' },

        { screen: 'shopping', testid: 'budget-card', read: true,
          say: 'Nothing here is a guess. Every line came off a receipt or a price you entered.' }
      ]
    },

    /* ---------------------------------------------------------------
       COACH. Eight steps. The strongest thing in the app is here: a
       reply can carry a real plan, and the plan can bind to a split.
       --------------------------------------------------------------- */
    coach: {
      name: 'Coach',
      blurb: 'It reads your sets, and it can write a plan',
      enter: go('#/coach'),
      steps: [
        { screen: 'coach', testid: 'chat-thread', read: true,
          say: 'The coach reads your actual sets, so it answers with your actual numbers.',
          note: 'Every figure it quotes came out of your log.' },

        { screen: 'coach', testid: 'composer-send', hint: 'Tap',
          before: typeSearch('coach', 'composer-input', 'Write me a four week plan'),
          say: 'Ask it for something bigger.',
          note: 'This is the strongest thing in the app: the coach can write real objects into it.' },

        /* The plan lives behind its own tab. The prototype reached it by
           saving a card out of a reply, which needs a model to have
           answered; this reaches the same plan by the route that is there
           whether or not a reply has come back. */
        { screen: 'coach', testid: 'seg-plan', hint: 'Tap Plan',
          say: 'A saved plan gets its own tab.' },

        { screen: 'coach', testid: 'plan-head', read: true,
          say: 'It is a real plan, with targets read from your logged bests.',
          note: 'Every percentage is measured against a lift you actually did.' },

        { screen: 'coach', testid: 'plan-bind-open', hint: 'Tap',
          say: 'Bind it to a split.',
          note: 'An unbound plan is a document. A bound one can start today\u2019s session itself.' },

        { screen: 'coach', testid: 'seg-checkin', hint: 'Tap Check-in',
          say: 'Once a week it asks four questions.' },

        { screen: 'coach', testid: 'seg-setup', hint: 'Tap Setup',
          say: 'And you decide what it is allowed to see.' },

        { screen: 'coach', testid: 'setup-data-block', read: true,
          say: 'Each switch names exactly what gets sent.',
          note: 'No blanket permission, and no switch you cannot find. Memory and ' +
                'instructions sit under the same tab.' }
      ]
    },

    /* ---------------------------------------------------------------
       PROGRESS. Ten steps, ending on the recap, which is the same
       training read at three distances rather than a third screen.
       --------------------------------------------------------------- */
    progress: {
      name: 'Progress',
      blurb: 'Am I getting stronger, answered once',
      needs: hasTraining,
      needsWhy: 'after your first session',
      enter: go('#/home/progress'),
      steps: [
        { screen: 'progress', testid: 'card-answer', read: true,
          say: 'This screen answers one question. Am I getting stronger.',
          note: 'Not five tabs of unrelated surfaces. One question, one answer, on the screen.' },

        { screen: 'progress', testid: 'range-control', hint: 'Tap',
          say: 'Two ranges, and both change the data.',
          note: 'The old third option returned the same points as the second, so it was cut. ' +
                'A control that does nothing is worse than one fewer control.' },

        { screen: 'progress', testid: 'records-list', read: true,
          say: 'Every record row sets the chart above it.',
          note: 'One tap to any lift. In the old build that chart was two levels deep behind ' +
                'a tab clipped to zero visible pixels.' },

        { screen: 'progress', testid: 'row-body-weight', hint: 'Tap',
          say: 'Body weight lives here too.' },

        { screen: 'progress', testid: 'weight-log', hint: 'Tap',
          say: 'Save it.',
          note: 'The trend uses a weighted average, so one heavy morning does not move the line.' },

        { screen: 'progress', testid: 'row-goals', hint: 'Tap',
          say: 'Add a goal, and it measures itself.' },

        { screen: 'progress', testid: 'goals-sheet', read: true,
          say: 'A goal is measured from your own logged best, never from a number the app made up.',
          note: 'Photos sit under the same screen, on the device, never uploaded.' },

        { screen: 'progress', testid: 'goals-close', hint: 'Tap',
          say: 'Close it.' },

        { screen: 'progress', testid: 'back', hint: 'Tap',
          say: 'Back to Home.' },

        { screen: 'home', testid: 'row-recap', hint: 'Tap',
          say: 'The third timescale is a zoom, not a menu.',
          note: 'Recap holds Day, Week and Month as one screen with three segments.' },

        { screen: 'recap', testid: 'scale-month', hint: 'Tap Month',
          say: 'Day, week, month. The same training read at three distances.',
          note: 'Every day with a session opens it. The old calendar\u2019s cells were ' +
                'divs with a hover tooltip, dead on touch.' }
      ]
    },

    /* ---------------------------------------------------------------
       PROFILE. Nine steps. It ends on the two features that stay
       invisible until somebody asks for them, which is the only reason
       anybody would ever find them.
       --------------------------------------------------------------- */
    profile: {
      name: 'Profile',
      blurb: 'A record, and every control in the app',
      enter: go('#/profile'),
      steps: [
        { screen: 'profile', testid: 'totals', read: true,
          say: 'Profile is a record, not a dashboard.',
          note: 'Everything here was earned by doing something, and nothing on it is a target.' },

        { screen: 'profile', testid: 'open-settings', hint: 'Tap',
          say: 'Every control in the app is behind one row.' },

        { screen: 'settings', testid: 'row-weight-unit', hint: 'Tap',
          say: 'Units first, because it is the thing people change most.' },

        { screen: 'settings', testid: 'opt-unit-lb', hint: 'Tap',
          say: 'One switch converts every weight on every screen at once.',
          note: 'The old app showed a kg column head, an lb total and a Switch to LBS ' +
                'button at the same time.' },

        { screen: 'settings', testid: 'row-weight-unit', hint: 'Tap',
          say: 'Back to kilos.' },

        { screen: 'settings', testid: 'opt-unit-kg', hint: 'Tap',
          say: 'Every figure converts back. Nothing was relabelled.' },

        { screen: 'settings', testid: 'row-appearance', hint: 'Tap',
          say: 'Then pick a look.',
          note: 'Dark for a gym floor, Light for outdoors, or match whatever your phone does.' },

        { screen: 'settings', testid: 'opt-theme-light', hint: 'Tap',
          say: 'They change the whole app, live.' },

        { screen: 'settings', testid: 'switch-cycle', hint: 'Tap',
          say: 'Two whole features stay invisible until you ask for them. Turn one on.',
          note: 'Cycle tracking, and stack tracking under it. Neither appears anywhere ' +
                'until you switch it on here.' }
      ]
    }
  };

  g.LKTutorSteps = TRACKS;
})(typeof window !== 'undefined' ? window : this);
