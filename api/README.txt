SMTP form setup (shared hosting with PHP)

1) Edit api/contact.php config values:
   - host
   - port
   - encryption
   - username
   - password
   - to_email
   - from_email

2) Keep from_email as the same mailbox or authorized sender for your SMTP account.

3) If your provider requires TLS/587, use:
   - port: 587
   - encryption: tls

4) Upload the site files including /api/contact.php.

5) Open the site over https:// and submit the contact form.

Notes:
- This endpoint returns JSON to the frontend.
- No daemon/service is needed in hosting, but PHP must be enabled.
- If you open index.html with file://, form submit will not work.
