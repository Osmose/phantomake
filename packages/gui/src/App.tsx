import React from 'react';
import WatcherPage from './components/WatcherPage';
import { css, cx } from '@emotion/css';
import { open } from '@tauri-apps/api/dialog';
import { colors } from './constants';
import { useMainStore } from './store';
import { PiFolder, PiPulse } from 'react-icons/pi';
import { Tooltip } from 'react-tooltip';
import PublishPage from './components/PublishPage';
import { basename } from '@tauri-apps/api/path';
import phantoUrl from './phantomake.png';

const TABS = [
  { name: 'Watcher', component: WatcherPage },
  { name: 'Publish', component: PublishPage },
];

const styles = {
  container: css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    display: grid;
    grid-template-columns: 250px 1fr;
    grid-template-rows: 56px 1fr;
    grid-column-gap: 0px;
    grid-row-gap: 0px;

    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
      Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';

    user-select: none;
    cursor: default;
    overflow: hidden;
  `,
  openProjectContainer: css`
    flex: 1;
    text-align: center;
    height: 100vh;
  `,
  currentProjectButton: css`
    grid-area: 1 / 1 / 2 / 2;
    border: none;
    margin: 0;
    font-size: 1em;
    text-align: left;
    background: ${colors.darkGrey};
    color: ${colors.white};
    cursor: pointer;

    display: grid;
    grid-template-columns: 32px 1fr;
    grid-template-rows: repeat(2, 1fr);
    grid-column-gap: 12px;
    grid-row-gap: 0px;
    padding: 12px;

    &:hover {
      background: ${colors.grey};
    }

    &:active {
      background: ${colors.deepGrey};
    }
  `,
  currentProjectIcon: css`
    grid-area: 1 / 1 / 3 / 2;
    align-self: center;
    justify-self: center;
  `,
  currentProjectLabel: css`
    grid-area: 1 / 2 / 2 / 3;
    align-self: center;
    color: ${colors.lightGrey};
  `,
  currentProjectName: css`
    grid-area: 2 / 2 / 3 / 3;
    align-self: center;
  `,
  tabs: css`
    grid-area: 2 / 1 / 3 / 2;
    list-style-type: none;
    background: ${colors.darkGrey};
    color: ${colors.white};
    text-transform: uppercase;
    font-weight: 600;
    font-size: 1.5em;
    margin: 0;
    padding: 10px 0;
  `,
  tab: css`
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 5px;
    margin: 0;
    padding: 10px;
    cursor: default;
  `,
  selectedTab: css`
    background: ${colors.grey};
    color: ${colors.green};
  `,
  tabContent: css`
    grid-area: 1 / 2 / 3 / 3;
    position: relative;
    overflow: hidden;
  `,
  phanto: css`
    position: absolute;
    bottom: -80px;
    left: -5px;
  `,
};

export default function App() {
  const { projectDirectory, openProject, watchProcess } = useMainStore();
  const [currentTabIndex, setCurrentTabIndex] = React.useState(0);
  const TabContent = TABS[currentTabIndex].component;

  const [projectName, setProjectName] = React.useState('');
  React.useEffect(() => {
    if (projectDirectory) {
      basename(projectDirectory).then(setProjectName);
    } else {
      setProjectName('');
    }
  }, [projectDirectory]);

  const handleClickOpen = async () => {
    const directoryPath = await open({
      multiple: false,
      directory: true,
      recursive: true,
      title: 'Open project directory',
    });
    if (directoryPath) {
      openProject(directoryPath as string);
    }
  };

  if (!projectDirectory) {
    return (
      <div className={styles.container}>
        <div className={styles.openProjectContainer}>
          <button onClick={handleClickOpen}>Open Project</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        className={styles.currentProjectButton}
        data-tooltip-id="main-tooltip"
        data-tooltip-content={projectDirectory}
        data-tooltip-position="bottom"
        onClick={handleClickOpen}
      >
        <PiFolder className={styles.currentProjectIcon} size={32} />
        <div className={styles.currentProjectLabel}>Current project</div>
        <div className={styles.currentProjectName}>{projectName}</div>
      </button>
      <ol className={styles.tabs}>
        {TABS.map(({ name }, index) => (
          <li
            key={index}
            onClick={() => setCurrentTabIndex(index)}
            className={cx(styles.tab, { [styles.selectedTab]: index === currentTabIndex })}
          >
            {name === 'Watcher' && watchProcess && <PiPulse />} {name}
          </li>
        ))}

        <img
          src={phantoUrl}
          className={styles.phanto}
          data-tooltip-id="main-tooltip"
          data-tooltip-content="Thanks for using Phantomake!"
          data-tooltip-position="top"
        />
      </ol>
      <div className={styles.tabContent}>
        <TabContent />
      </div>
      <Tooltip id="main-tooltip" />
    </div>
  );
}
