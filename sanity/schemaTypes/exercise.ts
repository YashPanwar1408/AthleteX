import { defineType, defineField } from 'sanity'

export const exercise = defineType({
  name: 'exercise',
  title: 'Exercise',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Exercise Name',
      description: 'The name of the exercise that will be displayed to users',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'A detailed description explaining how to perform the exercise',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty Level',
      description: 'The difficulty level of the exercise to help users choose the appropriate exercise',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Exercise Image',
      description: 'An image of the exercise to help users visualize how to perform it',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Description of the exercise image for accessibility and SEO purposes',
        },
      ],
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      description: 'A Url link to a video demonstrating how to perform the exercise',
      type: 'url',
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      description: 'Toggle to show/hide this exercise in the app',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'difficulty',
      media: 'image',
    },
    prepare(selection) {
      const { title, subtitle, media } = selection
      return {
        title,
        subtitle: subtitle ? `Difficulty: ${subtitle.charAt(0).toUpperCase() + subtitle.slice(1)}` : 'No difficulty set',
        media,
      }
    },
  },
})
