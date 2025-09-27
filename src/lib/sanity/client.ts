import {createClient} from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import {SANITY_API_TOKEN} from "../../../env.js";

export const config = {
    projectId: "mdfglno5",
    dataset: "production",
    apiVersion: "2024-01-01",
    useCdn: false,
    token: SANITY_API_TOKEN,
  };

// Using try/catch to gracefully handle import failures
let client: any;
try {
  client = createClient(config);
} catch (error) {
  console.warn('Sanity client initialization error:', error);
  client = null;
}

export const clientSafe = client;
export { client };


const adminConfig = {
    ...config,
    token:SANITY_API_TOKEN,
};
export const adminClient = createClient(adminConfig);


const builder = imageUrlBuilder(config);
export const urlFor = (source:string) => builder.image(source);

