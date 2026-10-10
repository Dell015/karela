/**
 * KARELA WAITLIST: confirmation email (Google Apps Script)
 * ------------------------------------------------------------
 * Runs in the owner's Google account and sends from that Gmail.
 * The website's Supabase database calls it when someone joins the
 * waitlist with "Email me a confirmation" ticked
 * (backend/02_confirmation_email.sql).
 *
 * Setup is in backend/README.md. In short:
 *   1. script.google.com > New project, paste this file.
 *   2. Project Settings > Script properties > add SECRET (the same
 *      long random text you put in private.mail_config).
 *   3. Deploy > New deployment > Web app,
 *      Execute as: Me, Who has access: Anyone. Copy the /exec URL.
 *
 * The SECRET lives only in Script properties and in the database,
 * never in this file or on the website.
 *
 * Gmail sends about 100 of these a day on a free account.
 */

var SITE = "https://karela-phi.vercel.app";
var LOGO = SITE + "/assets/img/karela_word-logo.png";
var SUBJECT = "You’re on the Karela waitlist";

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply("bad request");
  }

  var secret = PropertiesService.getScriptProperties().getProperty("SECRET");
  if (!secret || data.secret !== secret) return reply("forbidden");

  var email = String(data.email || "").trim();
  var token = String(data.token || "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return reply("bad email");
  if (!/^[0-9a-f-]{36}$/i.test(token)) return reply("bad token");

  if (MailApp.getRemainingDailyQuota() < 1) {
    console.warn("Daily Gmail quota used up; no confirmation for " + email);
    return reply("quota");
  }

  var removeUrl = SITE + "/unsubscribe?t=" + encodeURIComponent(token);
  MailApp.sendEmail({
    to: email,
    subject: SUBJECT,
    name: "Karela",
    body: plainText(removeUrl),
    htmlBody: html(removeUrl)
  });
  return reply("sent");
}

function reply(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.TEXT);
}

/** The owner's wording, as plain text for mail apps that don't show HTML. */
function plainText(removeUrl) {
  return [
    "Thanks for joining the Karela waitlist.",
    "",
    "Karela turns your walks, jogs and errands into something that counts: a habit that lasts, and a live map of problems your barangay can act on.",
    "",
    "Here’s what happens next. We’re building and testing in Tuguegarao City first. When the beta opens, you’ll get an email from us with how to join. We won’t send you anything else in between.",
    "",
    "See you on the road.",
    "",
    "Karela",
    "",
    "--",
    "You got this email because you joined the Karela waitlist. Remove me from the list: " + removeUrl
  ].join("\n");
}

/**
 * The same wording as HTML. Email apps need tables and inline styles;
 * colours are Karela's (green-black, lime). The logo loads from the site.
 */
function html(removeUrl) {
  var ink = "#F3F5EE", ink2 = "#B9C2B3", ink3 = "#939E8F", bg = "#0B0F0C", card = "#111813", lime = "#7CF205";
  var p = function (text, extra) {
    return '<p style="margin:0 0 16px;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:' + ink2 + ';' + (extra || "") + '">' + text + "</p>";
  };
  return [
    '<!doctype html><html><body style="margin:0;padding:0;background:' + bg + ';">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + bg + ';">',
    '<tr><td align="center" style="padding:32px 16px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:' + card + ';border-radius:22px;border:1px solid #1E2B22;">',
    '<tr><td style="height:4px;background:' + lime + ';background:linear-gradient(90deg,#7CF205,#00F5D4,#209F77);border-radius:22px 22px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>',
    '<tr><td style="padding:32px 32px 8px;">',
    '<img src="' + LOGO + '" width="160" height="28" alt="Karela" style="display:block;border:0;">',
    "</td></tr>",
    '<tr><td style="padding:24px 32px 8px;">',
    '<h1 style="margin:0 0 20px;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:24px;line-height:1.3;color:' + ink + ';">Thanks for joining the Karela waitlist.</h1>',
    p("Karela turns your walks, jogs and errands into something that counts: a habit that lasts, and a live map of problems your barangay can act on."),
    p("Here’s what happens next. We’re building and testing in Tuguegarao City first. When the beta opens, you’ll get an email from us with how to join. We won’t send you anything else in between."),
    p("See you on the road.", "color:" + ink + ";"),
    p("Karela", "margin:0 0 8px;font-weight:700;color:" + lime + ";"),
    "</td></tr>",
    '<tr><td style="padding:16px 32px 28px;border-top:1px solid #1E2B22;">',
    '<p style="margin:0;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:' + ink3 + ';">',
    'You got this email because you joined the Karela waitlist. <a href="' + removeUrl + '" style="color:' + ink2 + ';text-decoration:underline;">Remove me from the list</a>',
    "</p></td></tr>",
    "</table></td></tr></table></body></html>"
  ].join("");
}

/** Run this once from the editor to send a test to yourself. */
function sendTestToMe() {
  var me = Session.getActiveUser().getEmail();
  MailApp.sendEmail({
    to: me,
    subject: "[Test] " + SUBJECT,
    name: "Karela",
    body: plainText(SITE + "/unsubscribe?t=00000000-0000-4000-8000-000000000000"),
    htmlBody: html(SITE + "/unsubscribe?t=00000000-0000-4000-8000-000000000000")
  });
}
