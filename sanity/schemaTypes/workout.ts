import { defineType, defineField, defineArrayMember } from 'sanity'

export const workout = defineType({
  name: 'workout',
  title: 'Workout',
  type: 'document',
  fields: [
    defineField({
      name: 'userId',
      title: 'User ID',
      description: 'The Clerk user ID who performed this workout',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Workout Date',
      description: 'The date when this workout was performed',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      description: 'Total duration of the workout in seconds',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(86400), // Max 24 hours
    }),
    defineField({
      name: 'exercises',
      title: 'Workout Exercises',
      description: 'List of exercises performed in this workout with sets, reps, and weights',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'workoutExercise',
          title: 'Workout Exercise',
          fields: [
            defineField({
              name: 'exercise',
              title: 'Exercise',
              description: 'The exercise performed in this workout',
              type: 'reference',
              to: [{ type: 'exercise' }],
              validation: (Rule) => Rule.required(),
            }),
             defineField({
               name: 'sets',
               title: 'Sets',
               description: 'Individual sets performed for this exercise',
               type: 'array',
               of: [
                 defineArrayMember({
                   type: 'object',
                   name: 'set',
                   title: 'Set',
                   fields: [
                     defineField({
                       name: 'reps',
                       title: 'Repetitions',
                       description: 'Number of repetitions in this set',
                       type: 'number',
                       validation: (Rule) => Rule.required().min(1).max(1000),
                     }),
                     defineField({
                       name: 'weight',
                       title: 'Weight',
                       type: 'number',
                       description: 'Weight used for this set',
                       validation: (Rule) => Rule.min(0).max(1000),
                     }),
                     defineField({
                       name: 'weightUnit',
                       title: 'Weight Unit',
                       type: 'string',
                       description: 'Unit of measurement for the weight',
                       options: {
                         list: [
                           { title: 'Pounds (lbs)', value: 'lbs' },
                           { title: 'Kilograms (kg)', value: 'kg' },
                         ],
                         layout: 'radio',
                       },
                       initialValue: 'lbs',
                     }),
                   ],
                   preview: {
                     select: {
                       reps: 'reps',
                       weight: 'weight',
                       weightUnit: 'weightUnit',
                     },
                     prepare(selection) {
                       const { reps, weight, weightUnit } = selection
                       const weightText = weight ? `${weight}${weightUnit}` : 'Bodyweight'
                       return {
                         title: `${reps} reps`,
                         subtitle: weightText,
                       }
                     },
                   },
                 }),
               ],
               validation: (Rule) => Rule.required().min(1).max(50),
             }),

          ],
          preview: {
            select: {
              exerciseName: 'exercise.name',
              sets: 'sets',
            },
            prepare(selection) {
              const { exerciseName, sets } = selection
              const setsCount = sets ? sets.length : 0
              const setsText = setsCount === 1 ? '1 set' : `${setsCount} sets`
              return {
                title: exerciseName || 'Unnamed Exercise',
                subtitle: setsText,
              }
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      userId: 'userId',
      date: 'date',
      duration: 'duration',
      exerciseCount: 'exercises.length',
    },
    prepare(selection) {
      const { userId, date, duration, exerciseCount } = selection
      const workoutDate = date ? new Date(date).toLocaleDateString() : 'No date'
      const durationMinutes = duration ? Math.round(duration / 60) : 0
      const exerciseText = exerciseCount === 1 ? 'exercise' : 'exercises'
      
      return {
        title: `Workout by ${userId}`,
        subtitle: `${workoutDate} • ${durationMinutes}min • ${exerciseCount} ${exerciseText}`,
      }
    },
  },
  orderings: [
    {
      title: 'Date (Newest)',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
    {
      title: 'Date (Oldest)',
      name: 'dateAsc',
      by: [{ field: 'date', direction: 'asc' }],
    },
    {
      title: 'Duration (Longest)',
      name: 'durationDesc',
      by: [{ field: 'duration', direction: 'desc' }],
    },
  ],
})
