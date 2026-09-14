/* ===================================================================
   Where the server is. The only file a deploy edits.

   Everything in here is public by design and safe to read in a browser,
   because none of it is what protects the data. The anon key names the
   project and nothing more; row level security is what decides which
   rows a request may see, and it pins every row in user_data and
   profiles to auth.uid(). A stolen anon key gets somebody an empty
   result set.

   WHAT MUST NEVER APPEAR IN THIS FILE, or in any file the browser
   loads: the service role key, which ignores row level security, and
   the model keys. Those live on the Worker as secrets and are the
   reason the Worker exists at all. If you find yourself pasting one
   here to make something work, the thing that needs changing is on the
   server.

   Set LK_CLOUD to null to run the app with no server at all. Every
   screen already handles that and says so plainly, which is how the
   build is tested.
   =================================================================== */
window.LK_CLOUD = {
  /* Supabase: accounts, and the key/value table every device syncs. */
  supabaseUrl: 'https://fwimdnukebbrwpwdyjbv.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3aW1kbnVrZWJicndwd2R5amJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMDI5MjEsImV4cCI6MjA5Mzc3ODkyMX0.WCSGk0I1yDkqcH8e0cfzEExQDmD7pd7JUhFn7soQ8E4',

  /* The Worker: the coach, food search, photo analysis, push, and the
     one route that can delete an account. It holds the model keys so
     this file does not have to. */
  apiUrl: 'https://lockedapi.cescocugliari.workers.dev'
};
