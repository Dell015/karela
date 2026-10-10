/* ============================================================
   KARELA WEB: "Remove me from the list" (unsubscribe.html)
   ------------------------------------------------------------
   The link in the confirmation email is /unsubscribe?t=TOKEN.
   Nothing is removed just by opening the page (mail scanners
   open links on their own); the person taps "Remove me", and
   the site's database deletes that one signup
   (backend/02_confirmation_email.sql, remove_from_waitlist).
   ============================================================ */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var btn = document.querySelector("[data-unsub-button]");
  var msg = document.querySelector("[data-unsub-msg]");
  var db = window.KARELA_CONFIG && window.KARELA_CONFIG.SITE_DB;
  if (!btn || !msg) return;

  function say(text, kind) {
    msg.textContent = text;
    msg.className = "simple__msg" + (kind ? " simple__msg--" + kind : "");
  }

  var token = new URLSearchParams(window.location.search).get("t") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    say("This link is missing its code. Open the link from your confirmation email again, or reply to that email and we'll remove you by hand.", "error");
    return;
  }
  if (!db || !db.url) {
    say("Removing isn't working right now. Reply to the confirmation email and we'll remove you by hand.", "error");
    return;
  }

  btn.hidden = false;
  btn.addEventListener("click", function () {
    btn.disabled = true;
    btn.textContent = "Removing…";
    say("");
    fetch(db.url + "/rest/v1/rpc/remove_from_waitlist", {
      method: "POST",
      headers: { apikey: db.headers.apikey, "Content-Type": "application/json" },
      body: JSON.stringify({ p_token: token })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (removed) {
        btn.hidden = true;
        say(
          removed
            ? "Done. Your email is off the Karela waitlist, and we won't email you again."
            : "This email isn't on the list any more, so there's nothing left to remove.",
          "success"
        );
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = "Remove me";
        say("That didn't go through. Check your connection and try again.", "error");
      });
  });
})();
