import { createApp } from './app';

const PORT = process.env.PORT || 3002;

const app = createApp();

app.listen(PORT, () => {
  console.log(`BFF server running on port ${PORT}`);
});
