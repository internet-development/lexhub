import cardStyles from '@/components/Card.module.css'
import styles from './StatsCard.module.css'

import { Card, CardBody, CardHeader, CardProps } from '@/components/Card'
import type { Stats } from '@/db/queries'

interface StatsCardProps extends CardProps {
  stats: Stats
}

export default function StatsCard({ stats, ...props }: StatsCardProps) {
  return (
    <Card {...props}>
      <CardHeader>
        <h3 className={cardStyles.title}>Platform Stats</h3>
      </CardHeader>
      <CardBody>
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statBoxValue}>
              {stats.totalLexicons.toLocaleString()}
            </span>
            <span className={styles.statBoxLabel}>Total Lexicons</span>
            <span className={styles.statBoxSub}>
              {stats.validLexicons.toLocaleString()} valid /{' '}
              {stats.invalidLexicons.toLocaleString()} invalid
            </span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statBoxValue}>
              {stats.uniqueNsids.toLocaleString()}
            </span>
            <span className={styles.statBoxLabel}>Unique NSIDs</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statBoxValue}>
              {stats.uniqueRepositories.toLocaleString()}
            </span>
            <span className={styles.statBoxLabel}>Repositories</span>
          </div>
        </div>
        <div className={styles.recentActivity}>
          <h4 className={styles.recentActivityTitle}>Recent Activity</h4>
          <div className={styles.activityGrid}>
            <div className={styles.activityBox}>
              <span className={styles.activityPeriod}>Last 24h</span>
              <span className={styles.activityValue}>
                +{stats.recentActivity.last24h.total.toLocaleString()}
              </span>
            </div>
            <div className={styles.activityBox}>
              <span className={styles.activityPeriod}>Last 7d</span>
              <span className={styles.activityValue}>
                +{stats.recentActivity.last7d.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
