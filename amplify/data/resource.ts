import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  Response: a
    .model({
      level: a.integer().required(),
      respondentId: a.string().required(),
    })
    .authorization((allow) => [
      // QR-code visitors can ONLY submit a response.
      allow.guest().to(["create"]),

      // Only members of the Admin group can see or delete responses.
      allow.group("Admin").to(["read", "delete"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
});
