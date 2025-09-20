import { defineType, defineField } from "sanity";

export const saiOfficials= defineType({
  name: "SAIOfficial",
  title: "SAI Officials",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Full Name",
      type: "string",
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
    }),
    defineField({
      name: "organization",
      title: "Organization",
      type: "string",
    }),
     defineField({
      name: "officialId",
      title: "SAI Official ID",
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
