const { readDB, writeDB, getUserFromReq, setCors } = require('./_db');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const user = getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ detail: 'Authentication credentials were not provided or are invalid.' });
  }

  const db = readDB();

  // GET /api/events/ (List user events)
  if (req.method === 'GET') {
    const userEvents = db.events
      .filter((e) => e.ownerId === user.id || e.username === user.username)
      .sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
    return res.status(200).json(userEvents);
  }

  // POST /api/events/ (Create new event)
  if (req.method === 'POST') {
    const { title, target_date } = req.body || {};
    if (!title || !target_date) {
      return res.status(400).json({ detail: 'Title and target_date are required.' });
    }

    const newEvent = {
      id: db.events.length > 0 ? Math.max(...db.events.map((e) => e.id)) + 1 : 1,
      title: title.trim(),
      target_date: new Date(target_date).toISOString(),
      ownerId: user.id,
      username: user.username,
      created_at: new Date().toISOString(),
    };

    db.events.push(newEvent);
    writeDB(db);

    return res.status(201).json(newEvent);
  }

  // DELETE /api/events/:id/ (Delete event)
  if (req.method === 'DELETE') {
    const urlParts = (req.url || '').split('?')[0].split('/').filter(Boolean);
    const eventIdStr = urlParts[urlParts.length - 1];
    const eventId = parseInt(eventIdStr, 10);

    const initialLength = db.events.length;
    db.events = db.events.filter(
      (e) => !(e.id === eventId && (e.ownerId === user.id || e.username === user.username))
    );

    if (db.events.length === initialLength) {
      return res.status(404).json({ detail: 'Event not found or unauthorized.' });
    }

    writeDB(db);
    return res.status(204).end();
  }

  return res.status(405).json({ detail: 'Method not allowed' });
};
