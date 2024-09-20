import { css, cx } from '@emotion/css';
import DirectoryForm from './DirectoryForm';
import React from 'react';
import { colors } from '../constants';

const styles = {
  container: css`
    padding: 15px;
    display: flex;
    flex-direction: row;
    gap: 15px;
    align-items: flex-start;
  `,
  formListContainer: css`
    border: 1px solid ${colors.lightGrey};
    background: ${colors.whiteGrey};
    padding: 10px;
    flex: 0 0 auto;
    min-width: 100px;
  `,
  formListTitle: css`
    font-weight: bold;
    margin-bottom: 10px;
  `,
  formList: css`
    list-style-type: none;
    padding: 0;
    margin: 0;
  `,
  formListItem: css`
    margin: 0 -10px;
    padding: 5px 10px;
    cursor: default;
  `,
  selectedForm: css`
    background: ${colors.grey};
    color: ${colors.white};
  `,
  formContent: css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
  `,
};

const PUBLISH_FORMS = [{ name: 'Directory', component: DirectoryForm }];

export default function PublishPage() {
  const [currentFormIndex, setCurrentFormIndex] = React.useState(0);
  const FormComponent = PUBLISH_FORMS[currentFormIndex].component;

  return (
    <div className={styles.container}>
      <div className={styles.formListContainer}>
        <div className={styles.formListTitle}>Publish to:</div>
        <ul className={styles.formList}>
          {PUBLISH_FORMS.map(({ name }, index) => (
            <li
              key={index}
              onClick={() => setCurrentFormIndex(index)}
              className={cx(styles.formListItem, { [styles.selectedForm]: index === currentFormIndex })}
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.formContent}>
        <FormComponent />
      </div>
    </div>
  );
}
