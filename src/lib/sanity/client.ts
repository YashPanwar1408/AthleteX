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

export const client = createClient(config);


const adminConfig = {
    ...config,
    token:SANITY_API_TOKEN,
};
export const adminClient = createClient(adminConfig);


const builder = imageUrlBuilder(config);
export const urlFor = (source:string) => builder.image(source);

