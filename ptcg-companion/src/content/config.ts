import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    author: z.string(),
    tags: z.array(z.string()),
    category: z.string().optional(),
    term: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
