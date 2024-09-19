import { css, cx } from '@emotion/css';
import { useMainStore } from '../store';
import { colors } from '../constants';
import { PiPlayFill, PiPauseFill } from 'react-icons/pi';

const styles = {
  container: css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    display: grid;
    grid-template-columns: 56px 1fr;
    grid-template-rows: 56px 1fr;
    grid-column-gap: 0px;
    grid-row-gap: 0px;
  `,
  watcherButton: css`
    border: none;
    background: ${colors.lightGrey};
    color: ${colors.white};
    grid-area: 1 / 1 / 2 / 2;
    align-self: stretch;
    justify-self: stretch;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  watcherStatus: css`
    grid-area: 1 / 2 / 2 / 3;
    background: ${colors.grey};
    color: ${colors.lightGrey};

    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px;
    justify-content: center;

    & > * {
      flex: 1;
    }
  `,
  watcherStatusRunning: css`
    background: ${colors.green};
    color: ${colors.lime};
  `,
  watcherStatusUrl: css`
    color: ${colors.white};

    a {
      color: ${colors.blue};
    }
  `,
  watcherLogs: css`
    grid-area: 2 / 1 / 3 / 3;
    background: ${colors.deepGrey};
    color: ${colors.white};
    padding: 10px;
    overflow: auto;
    font-family: monospace;

    p {
      margin: 0;
      line-height: 1.5em;
    }
  `,
};

export default function WatcherPage() {
  const { watchProcess, watchLogs, startWatcher, stopWatcher } = useMainStore();

  return (
    <div className={styles.container}>
      {watchProcess ? (
        <>
          <button className={styles.watcherButton} onClick={stopWatcher}>
            <PiPauseFill size={32} />
          </button>
          <div className={cx(styles.watcherStatus, styles.watcherStatusRunning)}>
            <div>Watcher is running</div>
            <div className={styles.watcherStatusUrl}>
              Preview available at{' '}
              <a href="http://localhost:8000" target="_blank">
                http://localhost:8000
              </a>
            </div>
          </div>
        </>
      ) : (
        <>
          <button className={styles.watcherButton} onClick={startWatcher}>
            <PiPlayFill size={32} />
          </button>
          <div className={styles.watcherStatus}>Watcher is stopped</div>
        </>
      )}

      <div className={styles.watcherLogs}>
        {watchLogs.map((line) => (
          <p>{line}</p>
        ))}
      </div>
    </div>
  );
}
