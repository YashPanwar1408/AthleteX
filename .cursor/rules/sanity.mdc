----------------------------------SANITY RULES----------------------------------
When creating sanity schema make sure to include an appropriate icon for the schema using lucide-react or sanity icons as a fallback. Make sure you're always using the Sanity typescript definitions if it's a ts file. Here's an example, make sure you use a defineField on every field and a defineType throughout the whole type. If you don't see any arrayMembers, don't import it:

import {defineField, defineType, defineArrayMember} from 'sanity' if it's a .ts file. 

 defineType({
   type: 'object',
   name: 'custom-object',
   fields: [
     defineField({
       type: 'array',
       name: 'arrayField',
       title: 'Things',
       of: [
         defineArrayMember({
           type: 'object',
           name: 'type-name-in-array',
           fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
         }),
       ],
     }),
   ],
 })

When writing any Sanity schema that matches with any part of the keywords below, use these as a template including the description. Make sure description is always above type. Whenever generating sanity schema ensure you're always including a description, as well as the name, title and type, have a best guess as to what the field does and describe that functionality in the simplest way possible to a non-technical user.

{
	name: 'eyebrow',
	title: 'Eyebrow',
	description: 'The smaller text that sits above the title to provide context',
	type: 'string',
},
{
	name: 'title',
	title: 'Title',
	description: 'The large text that is the primary focus of the block',
	type: 'string',
},
{
	name: 'isHeadingOne',
	title: 'Is it a <h1>?',
	type: 'boolean',
	description:
	'By default the title is a <h2> tag. If you use this as the top block on the page, you can toggle this on to make it a <h1> instead',
	initialValue: false,
},
{
  name: 'richText',
  title: 'Rich Text',
  description: 'Large body of text that has links, ordered/unordered lists and headings.',
	type: 'richText',
},
{
	name: 'buttons',
	title: 'Buttons',
	description: 'Add buttons here, the website will handle the styling',
	type: 'array',
	of: [{type: 'button'}],
},
{
    name: 'image',
    title: 'Image',
    type: 'image',
    fields: [
      {
        name: 'alt',
        type: 'string',
        description:
          "Remember to use alt text for people to be able to read what is happening in the image if they are using a screen reader, it's also important for SEO",
        title: 'Alt Text',
      },
    ],
  },

----------------------------------FRONTEND RULES----------------------------------
Always use tailwind to style if the codebase is using it. Always use functional react. 
Whenever we use a central container it will always have a default margin-y of 16 and appropriate padding, it generally is max-w-7xl unless it's specified otherwise and mx-auto to central it. Here's an example:
<section className="my-16 px-4">
	<div className="mx-auto max-w-7xl>
	…
	</div>
</section>
If something has a background we typically display it like this and break pattern when it's a page builder block. Take the example above and slightly tweak it to this
<section className="my-8 px-4">
	<div className=“py-8”> //Background layer
		<div className="mx-auto max-w-7xl>
		…
		</div>
	</div>
</section>

We always prefer to use grid instead of flex unless it’s two sibling tags, in which case only then would you use a flex Here's an example where we would use flex:
<div>
	<img/>
	<p>Some text</p>
<div>
We always use appropriate semantic html

----------------------------------REFACTORING RULES----------------------------------
Any time you refactor to tailwind, if there's any form of logic with styles, make sure you use the cn utility otherwise it won't work
Any time there's a charka ui heading without styles, it's the equivalent of a text-4xl by default
----------------------------------SCREENSHOT RULES----------------------------------
If you are asked to produce sanity schema, you follow this ruleset:
You help Sanity developers describe types and interfaces using pictures.
Here is an example in JSON format:
Example: I send a picture with a product card.
You reply using the Sanity rules below
 defineType({
   type: 'object',
   name: 'custom-object',
   fields: [
     defineField({
       type: 'array',
       name: 'arrayField',
       title: 'Things',
       of: [
         defineArrayMember({
           type: 'object',
           name: 'type-name-in-array',
           fields: [defineField({type: 'string', name: 'title', title: 'Title'})],
         }),
       ],
     }),
   ],
 })
Make sure you always include a description of what the schema does based on the image, for example if it's a title, it's 	description: 'The large text that is the primary focus of the block',.

If you see a tiny piece of text above a title, it's probably an eyebrow

If you see a large piece of text, that doesn't require any formatting such as italics, bold or links that looks like a header it should be considered a title or subtitle if there's two headers and one is smaller than the other.

If there is a large piece of text within the component that has bolds, italic, numbered list or bulleted points in a regular disc style there's a good chance it will need to be richText.

If there's an image, it's likely it will need to be an image which should include an alt text. If the image is behind the text and takes up a significant portion of the component, the chances are it's a backgroundImage, which would the exact same way, just with a different name.

If there's buttons remember to use the reusable buttons array so that we can repeat the pattern with our schema

If richTextField or buttonsField exists anywhere within the project, make sure to use this and import it.

----------------------------------INTERNATIONALISATION RULES----------------------------------
Whenever I mention internationalisation and frontend, please take any of the following and convert to the ltr/rtl agnostic version below
left ➜ start
right ➜ end
ml ➜ ms
mr ➜ me
pl ➜ ps
pr ➜ pe
border-l ➜ border-s
border-r ➜ border-e
text-left ➜ text-start
text-right ➜ text-end
float-left ➜ float-start
float-right ➜ float-end

Any time there's a button that has a prefix or a suffix with an arrow right or left, you'll need to throw a RTL prop to invert it horizontally.