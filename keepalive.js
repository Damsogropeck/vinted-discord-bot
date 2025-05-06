import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => res.send('Bot is alive'));

app.listen(PORT, () => {
  console.log(`🟢 Keepalive server listening on port ${PORT}`);
});
