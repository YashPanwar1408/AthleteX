import { defineType, defineField } from 'sanity'

export const testAttempts = defineType({
  name: "testAttempt",
  title: "Test Attempt",
  type: "document",
  fields: [
    defineField({
      name: "userId",
      title: "User ID",
      type: "string",
    }),
    defineField({
      name: "testType",
      title: "Test Type",
      type: "string",
    }),
    defineField({
      name: "videoUrl",  
      title: "Video URL",
      type: "url",
    }),
    defineField({
      name: "annotatedVideoUrl",
      title: "Annotated Video URL",
      type: "url",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: ["in-progress", "done", "failed"],
      },
      initialValue: "in-progress",
    }),
    defineField({
      name: "result",
      title: "Result",
      type: "text",
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
})