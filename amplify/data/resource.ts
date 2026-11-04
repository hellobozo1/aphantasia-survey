
import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  // Existing Aphantasia Survey database
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

  // Shared FB1 Lectures Calendar storage
  LectureProgress: a
    .model({
      itemId: a.string().required(),
      value: a.string().required(),
    })
    .authorization((allow) => [
      // All visitors can read and modify shared progress and notes.
      allow.guest().to(["create", "read", "update", "delete"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
});
