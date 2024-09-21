import { css, cx } from '@emotion/css';
import { colors } from '../constants';
import React from 'react';
import { PiFolder } from 'react-icons/pi';
import { open } from '@tauri-apps/api/dialog';
import { Command } from '@tauri-apps/api/shell';
import { useMainStore } from '../store';
import { BeatLoader } from 'react-spinners';

const styles = {
  header: css`
    margin-top: 0;
    color: ${colors.green};
  `,
  divider: css`
    border: 0;
    border-top: 1px solid ${colors.whiteGrey};
    margin: 2em 0;
  `,
  directoryLabel: css`
    font-weight: bold;
    margin-bottom: 5px;
  `,
  directoryContainer: css`
    display: flex;
    flex-direction: row;
    height: 32px;
    gap: 10px;
    justify-content: stretch;
  `,
  directory: css`
    flex: 1;
    background: ${colors.whiteGrey};
    border: 1px solid ${colors.lightGrey};
    display: flex;
    align-items: center;
    padding: 0 5px;
    min-width: 0;
    overflow: hidden;
    gap: 5px;
  `,
  directoryIcon: css`
    flex: 0 0 auto;
    color: ${colors.grey};
  `,
  button: css`
    background: ${colors.grey};
    border: none;
    color: ${colors.white};
    font-size: 1em;
    padding: 5px 10px;

    &:hover {
      background: ${colors.lightGrey};
    }

    &:active {
      background: ${colors.darkGrey};
    }
  `,
  directoryButton: css`
    flex: 0 0 auto;
    height: 32px;
  `,
  unset: css`
    color: ${colors.lightGrey};
  `,
  publishButton: css`
    font-size: 32px;
    text-align: center;
    padding: 10px 20px;
    width: 100%;
    margin-top: 40px;

    background: ${colors.green};

    &:hover {
      background: ${colors.lime};
    }

    &:active {
      background: ${colors.green};
    }

    &:disabled {
      background: ${colors.lightGrey};
      color: ${colors.whiteGrey};
    }
  `,
  buildResult: css`
    border: 1px solid ${colors.lightGrey};
    background: ${colors.whiteGrey};
    padding: 10px;
    margin-top: 10px;
  `,
  buildResultSuccess: css`
    border-color: ${colors.green};
    background: ${colors.lime};
  `,
  buildResultError: css`
    border-color: ${colors.maroon};
    background: ${colors.red};
    color: ${colors.white};
  `,
  buildResultErrorText: css`
    overflow: auto;
  `,
  loaderContainer: css`
    margin-top: 30px;
    text-align: center;
  `,
};

interface BuildResult {
  status: 'success' | 'error';
  text: string;
}

export default function DirectoryForm() {
  const { projectDirectory, outputDirectory, setOutputDirectory } = useMainStore();
  const [buildResult, setBuildResult] = React.useState<null | BuildResult>(null);
  const [building, setBuilding] = React.useState(false);

  const handleClickChoose = async () => {
    const directoryPath = await open({
      multiple: false,
      directory: true,
      recursive: true,
      title: 'Open project directory',
    });
    if (directoryPath) {
      setOutputDirectory(directoryPath as string);
    }
  };

  const handleClickPublish = async () => {
    if (outputDirectory === null) {
      return;
    }

    const command = Command.sidecar('binaries/phantomake', ['build', projectDirectory!, outputDirectory]);
    setBuilding(true);
    setBuildResult(null);
    const output = await command.execute();
    setBuilding(false);
    setBuildResult({
      status: output.code === 0 ? 'success' : 'error',
      text: output.stderr,
    });
  };

  return (
    <>
      <div>
        <h2 className={styles.header}>Directory</h2>
        <p>Outputs your built project to a directory on your computer.</p>
        <hr className={styles.divider} />
      </div>
      <div className={styles.directoryLabel}>Output directory</div>
      <div className={styles.directoryContainer}>
        <div className={styles.directory}>
          {outputDirectory === null ? (
            <span className={styles.unset}>Unset</span>
          ) : (
            <>
              <PiFolder className={styles.directoryIcon} size={24} /> {outputDirectory}
            </>
          )}
        </div>
        <button className={cx(styles.button, styles.directoryButton)} onClick={handleClickChoose}>
          Choose
        </button>
      </div>
      <button
        className={cx(styles.button, styles.publishButton)}
        disabled={outputDirectory === null || building === true}
        onClick={handleClickPublish}
      >
        Publish
      </button>
      {building && (
        <div className={styles.loaderContainer}>
          <BeatLoader color={colors.grey} />
        </div>
      )}
      {buildResult?.status === 'success' && (
        <div className={cx(styles.buildResult, styles.buildResultSuccess)}>Project was published successfully!</div>
      )}
      {buildResult?.status === 'error' && (
        <div className={cx(styles.buildResult, styles.buildResultError)}>
          <div>Project failed to build:</div>
          <pre className={styles.buildResultErrorText}>{buildResult.text}</pre>
        </div>
      )}
    </>
  );
}
