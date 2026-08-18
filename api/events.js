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

  // Parse ID if present in URL
  const urlParts = (req.url || '').split('?')[0].split('/').filter(Boolean);
  const possibleId = urlParts[urlParts.length - 1];
  const eventId = parseInt(possibleId, 10);
  const isIdRoute = !isNaN(eventId) && possibleId !== 'events';

  // GET /api/events/ or /api/events/:id
  if (req.method === 'GET') {
    if (isIdRoute) {
      const evt = db.events.find(
        (e) => e.id === eventId && (e.ownerId === user.id || e.username === user.username)
      );
      if (!evt) return res.status(404).json({ detail: 'Event not found.' });
      return res.status(200).json(evt);
    }

    const userEvents = db.events
      .filter((e) => e.ownerId === user.id || e.username === user.username)
      .sort((a, b) => {
        // Pinned events first, then by date
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(a.target_date) - new Date(b.target_date);
      });
    return res.status(200).json(userEvents);
  }

  // POST /api/events/ (Create new event)
  if (req.method === 'POST') {
    const { title, target_date, category, notes, color, pinned } = req.body || {};
    if (!title || !target_date) {
      return res.status(400).json({ detail: 'Title and target_date are required.' });
    }

    const newEvent = {
      id: db.events.length > 0 ? Math.max(...db.events.map((e) => e.id)) + 1 : 1,
      title: title.trim(),
      target_date: new Date(target_date).toISOString(),
      category: category || 'milestone',
      notes: (notes || '').trim(),
      color: color || 'blue',
      pinned: !!pinned,
      ownerId: user.id,
      username: user.username,
      created_at: new Date().toISOString(),
    };

    db.events.push(newEvent);
    writeDB(db);

    return res.status(201).json(newEvent);
  }

  // PUT / PATCH /api/events/:id/ (Update event)
  if (req.method === 'PUT' || req.method === 'PATCH') {
    const evtIndex = db.events.findIndex(
      (e) => e.id === eventId && (e.ownerId === user.id || e.username === user.username)
    );

    if (evtIndex === -1) {
      return res.status(404).json({ detail: 'Event not found or unauthorized.' });
    }

    const existing = db.events[evtIndex];
    const { title, target_date, category, notes, color, pinned } = req.body || {};

    const updatedEvent = {
      ...existing,
      ...(title !== undefined && { title: title.trim() }),
      ...(target_date !== undefined && { target_date: new Date(target_date).toISOString() }),
      ...(category !== undefined && { category }),
      ...(notes !== undefined && { notes: notes.trim() }),
      ...(color !== undefined && { color }),
      ...(pinned !== undefined && { pinned: !!pinned }),
      updated_at: new Date().toISOString(),
    };

    db.events[evtIndex] = updatedEvent;
    writeDB(db);

    return res.status(200).json(updatedEvent);
  }

  // DELETE /api/events/:id/ (Delete event)
  if (req.method === 'DELETE') {
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
