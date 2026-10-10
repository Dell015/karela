# Website backend (waitlist, survey, confirmation email)

This is the **website's** Supabase project
(`https://jyvvuwlxjfqxrfgshqxh.supabase.co`), not the app's. The site's
settings for it are in `js/config.js`, section 0.

| File | What it does |
|---|---|
| `supabase-site.sql` | The `waitlist` and `survey_responses` tables. Visitors can only add rows. (Already run.) |
| `02_confirmation_email.sql` | The "Email me a confirmation" box, the remove-me code per signup, the trigger that asks the Google script to send the email, and `remove_from_waitlist()` for `/unsubscribe`. |
| `confirmation-email.gs` | The Google Apps Script that sends the email from the owner's Gmail (about 100 a day on a free account). |

Tests: `cd supabase/tests && node site_email.mjs` (14 checks; it uses a stand-in
for pg_net, so no email is sent).

## Setting up the confirmation email (once)

Four parts. Signups keep working the whole time.

1. **Supabase** (website project) > SQL Editor > New query: paste all of
   `02_confirmation_email.sql`, click Run. The result at the bottom shows
   "copy this secret": copy that text.
2. **Google Apps Script**, signed in as the Gmail the emails should come from:
   1. script.google.com > New project. Name it "Karela waitlist email".
   2. Delete what's there, paste all of `confirmation-email.gs`, Save.
   3. Pick `sendTestToMe` at the top, click Run, and allow Gmail access
      (Review permissions > your account > Advanced > Go to Karela waitlist
      email > Allow; it warns because it's your own script). A "[Test]" email
      arrives in your inbox.
   4. Project Settings (gear) > Script properties > Add: name `SECRET`, value
      the secret from part 1. Save.
   5. Deploy > New deployment > gear > Web app. Execute as: **Me**. Who has
      access: **Anyone**. Deploy, and copy the Web app URL (ends in `/exec`).
3. **Supabase** > SQL Editor, with your URL:
   `update private.mail_config set script_url = 'PASTE_THE_EXEC_URL';`
4. **Push the site** so the checkbox and `/unsubscribe` are live. Then join the
   waitlist on the live site with your own email, box ticked: the email
   arrives within a minute. Its "Remove me from the list" link should remove
   you.

## Later

- **Changing the email's wording or look:** edit the script, then Deploy >
  Manage deployments > edit (pencil) > Version: New version > Deploy. The URL
  stays the same.
- **Did it send?** Apps Script > Executions shows each run. In Supabase,
  `waitlist.email_requested_at` is set when the database asked for an email.
- **Moving to a real domain** (for example with Resend): replace the script URL
  in `private.mail_config` with a new sender. Nothing on the site changes.
- **Stop sending:** `delete from private.mail_config;` Signups still save.
