import { EnvironmentValidationError, loadEnvironment } from '../config/environment.ts';

try {
  loadEnvironment();
  console.info('Environment configuration is valid.');
} catch (error: unknown) {
  if (error instanceof EnvironmentValidationError) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
