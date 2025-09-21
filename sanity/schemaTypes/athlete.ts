import { defineType, defineField } from "sanity";

export default defineType({
  name: "athlete",
  title: "Athlete",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Full Name",
      type: "string",
    }),
    defineField({
      name: "age",
      title: "Age",
      type: "number",
    }),
    defineField({
      name: "gender",
      title: "Gender",
      type: "string",
    }),
    defineField({
      name: "sport",
      title: "Sport",
      type: "string",
    }),
    defineField({
      name: "height",
      title: "Height (cm)",
      type: "number",
    }),
    defineField({
      name: "weight",
      title: "Weight (kg)",
      type: "number",
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
    }),
    defineField({
      name: "contact",
      title: "Contact Number",
      type: "string",
    }),
    defineField({
      name: "clerkId",
      title: "Clerk User ID",
      type: "string",
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
    }),
  ],
});
