import type {
  ConfigurationIssue,
  WebConfiguration,
} from "@vega/config/web";

import styles from "./App.module.css";

export type WebConfigurationState =
  | {
      readonly status: "ready";
      readonly configuration: WebConfiguration;
    }
  | {
      readonly status: "error";
      readonly issues: readonly ConfigurationIssue[];
    };

interface AppProperties {
  readonly state: WebConfigurationState;
}

const SignalMark = () => (
  <svg
    aria-hidden="true"
    className={styles.signalMark}
    viewBox="0 0 48 48"
  >
    <circle cx="24" cy="24" r="21" />
    <path d="M13 30 21 15l5 11 4-7 5 11" />
  </svg>
);

const ReadyPanel = ({
  configuration,
}: {
  readonly configuration: WebConfiguration;
}) => (
  <section className={styles.panel} aria-labelledby="runtime-heading">
    <div className={styles.panelHeader}>
      <div>
        <p className={styles.eyebrow}>Runtime manifest</p>
        <h2 id="runtime-heading">Public configuration is valid</h2>
      </div>
      <span className={styles.readyBadge}>
        <span aria-hidden="true" />
        Configured
      </span>
    </div>

    <dl className={styles.manifest}>
      <div>
        <dt>Profile</dt>
        <dd>{configuration.profile}</dd>
      </div>
      <div>
        <dt>Release</dt>
        <dd>{configuration.releaseId}</dd>
      </div>
      <div>
        <dt>API channel</dt>
        <dd>{configuration.apiBaseUrl}</dd>
      </div>
      <div>
        <dt>Sync channel</dt>
        <dd>{configuration.collaborationUrl}</dd>
      </div>
    </dl>

    <p className={styles.boundaryNote}>
      Canvas, identity, persistence, and room access remain intentionally
      offline until their server-authoritative foundations are connected.
    </p>
  </section>
);

const ConfigurationFailure = ({
  issues,
}: {
  readonly issues: readonly ConfigurationIssue[];
}) => (
  <section
    className={`${styles.panel} ${styles.failurePanel}`}
    aria-labelledby="configuration-error-heading"
    role="alert"
  >
    <div className={styles.panelHeader}>
      <div>
        <p className={styles.eyebrow}>Configuration hold</p>
        <h2 id="configuration-error-heading">This shell cannot start safely</h2>
      </div>
      <span className={styles.failureBadge}>Action required</span>
    </div>

    <p className={styles.failureCopy}>
      Public runtime settings failed validation. Correct the listed fields and
      rebuild the web application.
    </p>
    <ul className={styles.issueList}>
      {issues.map((issue) => (
        <li key={`${issue.path}:${issue.code}`}>
          <code>{issue.path}</code>
          <span>{issue.code.replaceAll("_", " ").toLowerCase()}</span>
        </li>
      ))}
    </ul>
    <p className={styles.redactionNote}>
      Rejected values are withheld from this diagnostic.
    </p>
  </section>
);

export const App = ({ state }: AppProperties) => (
  <main className={styles.shell}>
    <div className={styles.orbit} aria-hidden="true" />
    <header className={styles.masthead}>
      <a className={styles.identity} href="#status">
        <SignalMark />
        <span>Vega Canvas</span>
      </a>
      <p className={styles.stage}>Foundation · Stage 0A</p>
    </header>

    <section className={styles.intro} id="status" aria-labelledby="page-title">
      <p className={styles.kicker}>System commissioning / 001</p>
      <h1 id="page-title">The foundation is online.</h1>
      <p className={styles.lede}>
        A deliberately narrow status surface for the collaborative canvas
        runtime. No room or scene is created from this page.
      </p>
    </section>

    {state.status === "ready" ? (
      <ReadyPanel configuration={state.configuration} />
    ) : (
      <ConfigurationFailure issues={state.issues} />
    )}

    <footer className={styles.footer}>
      <span>Excalidraw remains the sole canvas engine.</span>
      <span>Server authority required before access.</span>
    </footer>
  </main>
);
