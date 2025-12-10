import styles from '@/components/NamespaceIdentifier.module.css';

import BlueskyIcon from '@/components/BlueskyIcon';
import GlobeIcon from '@/components/GlobeIcon';
import AtIcon from '@/components/AtIcon';

export type IconType = 'bluesky' | 'globe' | 'at';

export interface NamespaceIdentifierProps {
  icon: IconType;
  name: string;
}

const iconComponents = {
  bluesky: BlueskyIcon,
  at: AtIcon,
  globe: GlobeIcon,
};

export default function NamespaceIdentifier(props: NamespaceIdentifierProps) {
  const { icon, name } = props;
  const IconComponent = iconComponents[icon];

  return (
    <div className={styles.root}>
      <div className={styles.iconWrapper}>
        <IconComponent size={16} />
      </div>
      <span className={styles.name}>{name}</span>
    </div>
  );
}
