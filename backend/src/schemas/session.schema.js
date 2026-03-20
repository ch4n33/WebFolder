import { z } from 'zod';

export const sessionSigSchema = z.object({
  sig: z.string().uuid('Invalid session signature'),
});
