export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const response = await fetch('https://api.buttondown.com/v1/subscribers', {
    method: 'POST',
    headers: {
      'Authorization': 'Token ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: email, type: 'regular' })
  });

  if (response.ok) {
    return res.status(200).json({ ok: true });
  }

  const data = await response.json().catch(() => ({}));
  return res.status(response.status).json({ error: data.detail || 'Subscription failed' });
}
