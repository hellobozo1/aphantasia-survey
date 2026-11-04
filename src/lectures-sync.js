
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";

// Connect to the existing AWS Amplify backend.
Amplify.configure(outputs);

// Guest access: visitors do not need accounts.
const client = generateClient({
  authMode: "identityPool",
});

const model = client.models.LectureProgress;

// Cache database records by their itemId.
const records = new Map();

// Prevent overlapping writes to the same item.
const pending = new Map();

function checkResult(result) {
  if (result.errors?.length) {
    throw new Error(
      result.errors.map(e => e.message).join("; ")
    );
  }
  return result;
}

// Load all shared records from AWS.
async function loadAll() {
  const result = {};
  let nextToken;

  records.clear();

  do {
    const response = checkResult(
      await model.list({
        limit: 1000,
        nextToken,
      })
    );

    for (const item of response.data) {
      records.set(item.itemId, item);
      result[item.itemId] = item.value;
    }

    nextToken = response.nextToken;
  } while (nextToken);

  return result;
}

// Save a shared checkbox or note.
async function saveOne(itemId, value) {
  const existing = records.get(itemId);

  let response;

  if (existing) {
    response = await model.update({
      id: existing.id,
      value: String(value),
    });
  } else {
    response = await model.create({
      itemId,
      value: String(value),
    });
  }

  checkResult(response);

  if (!response.data) {
    throw new Error("AWS did not return a saved record.");
  }

  records.set(itemId, response.data);

  return response.data;
}

// Queue changes made to the same item.
function save(itemId, value) {
  const previous = pending.get(itemId)
    || Promise.resolve();

  const operation = previous
    .catch(() => {})
    .then(() => saveOne(itemId, value));

  pending.set(itemId, operation);

  operation.finally(() => {
    if (pending.get(itemId) === operation) {
      pending.delete(itemId);
    }
  }).catch(() => {});

  return operation;
}

// Expose the cloud functions to the calendar.
window.lectureCloud = {
  loadAll,
  save,
};

async function initializeCloud() {
  try {
    const sharedData = await loadAll();

    window.dispatchEvent(
      new CustomEvent("lecture-cloud-ready", {
        detail: sharedData,
      })
    );

    console.log("Shared lecture data loaded.");
  } catch (error) {
    console.error("Failed to load shared lecture data:", error);
  }
}

initializeCloud();

console.log("FB1 cloud synchronization initialized.");
