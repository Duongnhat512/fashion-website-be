import app from './app/app';
import { config } from './app/config/env';

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
