import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import "./App.css";
import appleImage from "./assets/apple.svg";
const guestClient = generateClient({
  authMode: "identityPool",
});

const adminClient = generateClient({
  authMode: "userPool",
});

const levels = [
  { value: 1, label: "No image" },
  { value: 2, label: "Very vague" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "Clear" },
  { value: 5, label: "Very vivid" },
];

function getRespondentId() {
  let id = localStorage.getItem("aphantasiaRespondentId");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("aphantasiaRespondentId", id);
  }

  return id;
}

function SurveyPage() {
  const previousLevel = Number(
  localStorage.getItem("aphantasiaSubmittedLevel")
) || null;

const [selectedLevel, setSelectedLevel] = useState(previousLevel);
const [submitted, setSubmitted] = useState(previousLevel !== null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (selectedLevel === null || submitting) return;

    setSubmitting(true);
    setError("");

    try {
    const respondentId = getRespondentId();

const { errors } = await guestClient.models.Response.create({
  id: respondentId,
  level: selectedLevel,
  respondentId: respondentId,
});

      if (errors?.length) {
        throw new Error(errors.map((error) => error.message).join(", "));
      }
localStorage.setItem(
  "aphantasiaSubmittedLevel",
  String(selectedLevel)
);
      setSubmitted(true);
    } catch (err) {
      console.error("Submission failed:", err);

      setError(
        "Your response could not be submitted. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="survey">
        <div className="success-card">
          <div className="success-icon">✓</div>

          <h1>Response submitted</h1>

          <p>Thank you for participating.</p>

          <p className="selected-result">
            You selected Level {selectedLevel}.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="survey">
      <div className="survey-container">
        <p className="eyebrow">Visual imagery survey</p>

        <h1>Imagine a red apple.</h1>

        <p className="subtitle">
          Which image best represents what you can see in your mind?
        </p>

        <div className="levels">
          {levels.map((level) => (
            <button
              key={level.value}
              className={`level-card ${
                selectedLevel === level.value ? "selected" : ""
              }`}
              onClick={() => setSelectedLevel(level.value)}
            >
              <div className={`apple apple-${level.value}`}>
  <img
    src={appleImage}
    alt={`Visualization level ${level.value}`}
  />
</div>

              <span className="level-number">
                {level.value}
              </span>

              <span className="level-label">
                {level.label}
              </span>
            </button>
          ))}
        </div>

        <button
          className="submit-button"
          disabled={selectedLevel === null || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Submitting..." : "Submit response"}
        </button>

        {error && <p className="error-message">{error}</p>}

        <p className="hint">
          Select the closest match.
        </p>
      </div>
    </main>
  );
}

function AdminDashboard({ user, signOut }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const subscription =
      adminClient.models.Response.observeQuery().subscribe({
        next: ({ items, isSynced }) => {
          setResponses([...items]);

          if (isSynced) {
            setLoading(false);
          }
        },

        error: (error) => {
          console.error("Dashboard subscription error:", error);
          setLoading(false);
        },
      });

    return () => subscription.unsubscribe();
  }, []);

  const total = responses.length;

  const counts = {
    1: responses.filter((response) => response.level === 1).length,
    2: responses.filter((response) => response.level === 2).length,
    3: responses.filter((response) => response.level === 3).length,
    4: responses.filter((response) => response.level === 4).length,
    5: responses.filter((response) => response.level === 5).length,
  };

  const noVisualization = counts[1];
  const canVisualize =
    counts[2] + counts[3] + counts[4] + counts[5];

  function percentage(value) {
    if (total === 0) return 0;

    return ((value / total) * 100).toFixed(1);
  }

  return (
    <main className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Admin dashboard</p>
            <h1>Aphantasia survey</h1>

            <p className="admin-email">
              {user?.signInDetails?.loginId}
            </p>
          </div>

          <button className="sign-out-button" onClick={signOut}>
            Sign out
          </button>
        </header>

        {loading ? (
          <p>Loading responses...</p>
        ) : (
          <>
            <section className="stat-card">
              <span>Total responses</span>
              <strong>{total}</strong>
            </section>

            <section className="dashboard-card">
              <div className="dashboard-title">
                <div>
                  <p className="eyebrow">Overview</p>
                  <h2>Mental visualization</h2>
                </div>

                <span className="live-indicator">
                  ● Live
                </span>
              </div>

              <div className="result-row">
                <div className="result-heading">
                  <span>Level 1 — No visualization</span>

                  <strong>
                    {percentage(noVisualization)}%
                  </strong>
                </div>

                <div className="bar-background">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${percentage(noVisualization)}%`,
                    }}
                  />
                </div>

                <small>
                  {noVisualization}{" "}
                  {noVisualization === 1 ? "person" : "people"}
                </small>
              </div>

              <div className="result-row">
                <div className="result-heading">
                  <span>Levels 2–5 — Can visualize</span>

                  <strong>
                    {percentage(canVisualize)}%
                  </strong>
                </div>

                <div className="bar-background">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${percentage(canVisualize)}%`,
                    }}
                  />
                </div>

                <small>
                  {canVisualize}{" "}
                  {canVisualize === 1 ? "person" : "people"}
                </small>
              </div>

              <button
                className="details-button"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails
                  ? "Hide detailed breakdown"
                  : "View detailed breakdown"}
              </button>

              {showDetails && (
                <div className="details-section">
                  {[2, 3, 4, 5].map((level) => (
                    <div className="detail-row" key={level}>
                      <div className="detail-heading">
                        <span>
                          Level {level} —{" "}
                          {levels.find(
                            (item) => item.value === level
                          )?.label}
                        </span>

                        <strong>
                          {percentage(counts[level])}%
                        </strong>
                      </div>

                      <div className="bar-background">
                        <div
                          className="bar-fill detail-fill"
                          style={{
                            width: `${percentage(counts[level])}%`,
                          }}
                        />
                      </div>

                      <small>
                        {counts[level]}{" "}
                        {counts[level] === 1
                          ? "person"
                          : "people"}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function AdminPage() {
  return (
    <Authenticator hideSignUp>
      {({ signOut, user }) => (
        <AdminDashboard
          user={user}
          signOut={signOut}
        />
      )}
    </Authenticator>
  );
}

function App() {
  if (window.location.pathname === "/admin") {
    return <AdminPage />;
  }

  return <SurveyPage />;
}

export default App;
