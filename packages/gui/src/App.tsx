import React from 'react';
import WatcherPage from './components/WatcherPage';
import { css, cx } from '@emotion/css';
import { open } from '@tauri-apps/api/dialog';
import { colors } from './constants';
import { useMainStore } from './store';
import { PiFolder } from 'react-icons/pi';
import { Tooltip } from 'react-tooltip';
import PublishPage from './components/PublishPage';

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

    li {
      margin: 0;
      padding: 10px;
      text-align: right;
      cursor: default;
    }
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
};

export default function App() {
  const { projectDirectory, projectName, openProject } = useMainStore();
  const [currentTabIndex, setCurrentTabIndex] = React.useState(0);
  const TabContent = TABS[currentTabIndex].component;

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
            className={cx({ [styles.selectedTab]: index === currentTabIndex })}
          >
            {name}
          </li>
        ))}
      </ol>
      <div className={styles.tabContent}>
        <TabContent />
      </div>
      <Tooltip id="main-tooltip" />
    </div>
  );
}
